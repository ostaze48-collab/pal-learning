from __future__ import annotations

import os
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..db.deps import get_db
from ..auth.deps import require_admin
from ..db.models import Book, Unit, Lesson, LessonSourceLink, SourceChunk, SourceFile, SourcePackage, AIJob
from ..services.ai_gateway import AIGateway
from ..services.document_importer import (
    chunk_pages,
    detect_curriculum_structure,
    edition_match_score,
    extract_document,
    save_upload,
    title_match_score,
)

router = APIRouter(prefix='/importer', tags=['curriculum-importer'], dependencies=[Depends(require_admin)])
UPLOAD_DIR = Path(os.getenv('UPLOAD_DIR', Path(__file__).resolve().parents[2] / 'data' / 'uploads'))

SOURCE_WEIGHTS = {
    # 100 total. Current official learning packages are distinct from full textbooks.
    'STUDENT_BOOK': 30,
    'OFFICIAL_PACKAGE': 20,
    'SOLUTIONS': 15,
    'TEACHER_GUIDE': 10,
    'WORKSHEET': 8,
    'EXAM': 7,
    'REMEDIAL': 5,
    'INTERACTIVE': 3,
    'VIDEO_REFERENCE': 2,
}


def update_package_completeness(db: Session, package: SourcePackage) -> None:
    types = {x.source_type for x in db.query(SourceFile).filter(SourceFile.package_id == package.id).all()}
    package.completeness_score = float(sum(weight for key, weight in SOURCE_WEIGHTS.items() if key in types))
    if 'STUDENT_BOOK' in types:
        package.status = 'INGESTING' if package.completeness_score < 100 else 'READY_FOR_PROCESSING'


@router.post('/source-packages/{package_id}/upload')
async def upload_source(
    package_id: int,
    source_type: str = Form(...),
    edition: str | None = Form(default=None),
    reliability_score: float = Form(default=80),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    package = db.query(SourcePackage).filter(SourcePackage.id == package_id).first()
    if not package:
        raise HTTPException(404, 'Package not found')
    book = db.query(Book).filter(Book.id == package.book_id).first()
    data = await file.read()
    if not data:
        raise HTTPException(400, 'Empty file')
    try:
        path = save_upload(data, file.filename or 'source', UPLOAD_DIR)
        extracted = extract_document(path, file.content_type)
    except ValueError as exc:
        raise HTTPException(415, str(exc)) from exc

    score = edition_match_score(extracted.text, edition or (book.edition if book else None), book.title if book else None)
    row = SourceFile(
        package_id=package_id,
        source_type=source_type,
        file_key=str(path),
        original_filename=file.filename,
        edition=edition,
        mime_type=file.content_type,
        page_count=extracted.page_count,
        reliability_score=max(0, min(100, reliability_score)),
        edition_match_score=score,
        checksum=extracted.checksum,
        status='EXTRACTED' if extracted.text else 'NEEDS_REVIEW',
        extracted_text=extracted.text,
        extraction_meta={
            'method': extracted.extraction_method,
            'warnings': extracted.warnings,
            'characters': len(extracted.text),
        },
    )
    db.add(row)
    db.flush()
    for chunk in chunk_pages(extracted.pages):
        db.add(SourceChunk(source_file_id=row.id, **chunk, metadata_json={'source_type': source_type}))
    update_package_completeness(db, package)
    db.commit()
    db.refresh(row)
    return {
        'source_file_id': row.id,
        'status': row.status,
        'page_count': row.page_count,
        'checksum': row.checksum,
        'edition_match_score': row.edition_match_score,
        'warnings': row.extraction_meta.get('warnings', []),
        'package_completeness': package.completeness_score,
    }


@router.post('/source-files/{source_file_id}/analyze')
def analyze_source(source_file_id: int, db: Session = Depends(get_db)):
    row = db.query(SourceFile).filter(SourceFile.id == source_file_id).first()
    if not row:
        raise HTTPException(404, 'Source file not found')
    structure = detect_curriculum_structure(row.extracted_text or '')
    meta = dict(row.extraction_meta or {})
    meta['structure'] = structure
    row.extraction_meta = meta
    row.status = 'ANALYZED' if structure['unit_count'] or structure['lesson_count'] else row.status
    db.commit()
    return structure


@router.post('/source-packages/{package_id}/process')
def process_package(package_id: int, db: Session = Depends(get_db)):
    package = db.query(SourcePackage).filter(SourcePackage.id == package_id).first()
    if not package:
        raise HTTPException(404, 'Package not found')
    files = db.query(SourceFile).filter(SourceFile.package_id == package_id).order_by(SourceFile.id).all()
    if not any(x.source_type == 'STUDENT_BOOK' and x.extracted_text for x in files):
        raise HTTPException(409, 'A text-extractable STUDENT_BOOK is required before processing')

    student_book = next(x for x in files if x.source_type == 'STUDENT_BOOK' and x.extracted_text)
    structure = detect_curriculum_structure(student_book.extracted_text or '')
    gateway = AIGateway()
    ai_result = gateway.run('EXTRACT_STRUCTURE', {'text': student_book.extracted_text or ''}, 'FAST')
    job = AIJob(
        job_type='PROCESS_PACKAGE',
        source_type='SOURCE_PACKAGE',
        source_id=package.id,
        status='COMPLETED',
        priority=100,
        model_route='FAST',
        prompt_version='curriculum_parser/v1',
        progress=100,
        result_json={
            'structure': structure,
            'ai_gateway': ai_result.output,
            'files_processed': len(files),
        },
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
    )
    db.add(job)
    package.status = 'STRUCTURED'
    db.commit()
    db.refresh(job)
    return {'job_id': job.id, 'status': job.status, 'package_status': package.status, 'result': job.result_json}


@router.get('/source-files/{source_file_id}/chunks')
def list_source_chunks(source_file_id: int, db: Session = Depends(get_db)):
    row = db.query(SourceFile).filter(SourceFile.id == source_file_id).first()
    if not row:
        raise HTTPException(404, 'Source file not found')
    chunks = db.query(SourceChunk).filter(SourceChunk.source_file_id == source_file_id).order_by(SourceChunk.chunk_index).all()
    return [
        {
            'id': x.id, 'chunk_index': x.chunk_index, 'page_number': x.page_number,
            'text_preview': x.text[:500], 'metadata': x.metadata_json,
        } for x in chunks
    ]


@router.post('/source-packages/{package_id}/link-lessons')
def link_lessons_to_sources(package_id: int, db: Session = Depends(get_db)):
    package = db.query(SourcePackage).filter(SourcePackage.id == package_id).first()
    if not package:
        raise HTTPException(404, 'Package not found')
    unit_ids = [x.id for x in db.query(Unit).filter(Unit.book_id == package.book_id).all()]
    lessons = db.query(Lesson).filter(Lesson.unit_id.in_(unit_ids)).all() if unit_ids else []
    source_ids = [x.id for x in db.query(SourceFile).filter(
        SourceFile.package_id == package_id, SourceFile.source_type == 'STUDENT_BOOK'
    ).all()]
    chunks = db.query(SourceChunk).filter(SourceChunk.source_file_id.in_(source_ids)).all() if source_ids else []
    created = 0
    candidates = []
    for lesson in lessons:
        scored = sorted(
            [(title_match_score(lesson.title, chunk.text), chunk) for chunk in chunks],
            key=lambda x: x[0], reverse=True
        )
        if not scored or scored[0][0] < 0.5:
            candidates.append({'lesson_id': lesson.id, 'lesson_title': lesson.title, 'linked': False})
            continue
        best_score = scored[0][0]
        # Keep all chunks tied with the strongest high-confidence match, capped for safety.
        selected = [pair for pair in scored if pair[0] >= max(0.5, best_score - 0.08)][:3]
        for score, chunk in selected:
            existing = db.query(LessonSourceLink).filter_by(
                lesson_id=lesson.id, source_chunk_id=chunk.id, relation='TEACHING_SOURCE'
            ).first()
            if not existing:
                db.add(LessonSourceLink(
                    lesson_id=lesson.id, source_chunk_id=chunk.id, relation='TEACHING_SOURCE',
                    confidence=score, source_method='TITLE_MATCH_V1',
                    status='VERIFIED_CANDIDATE' if score >= 0.9 else 'CANDIDATE'
                ))
                created += 1
            candidates.append({
                'lesson_id': lesson.id, 'lesson_title': lesson.title, 'linked': True,
                'source_chunk_id': chunk.id, 'page_number': chunk.page_number,
                'confidence': score,
            })
    db.commit()
    return {'package_id': package_id, 'created_links': created, 'candidates': candidates}
