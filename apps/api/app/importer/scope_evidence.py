from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.deps import get_db
from ..db.models import (
    Book,
    Lesson,
    LessonSourceLink,
    SourceChunk,
    SourceFile,
    SourcePackage,
    Unit,
)
from .router import MAX_SOURCE_BYTES, _apply_extracted_source

router = APIRouter(
    prefix='/importer/scope-evidence',
    tags=['curriculum-scope-evidence'],
    dependencies=[Depends(require_admin)],
)


def _normalize(text: str | None) -> str:
    return ' '.join((text or '').split())


def _contains(text: str | None, term: str) -> bool:
    return _normalize(term) in _normalize(text)


@router.post('/source-packages/{package_id}/upload-plan')
async def upload_curriculum_plan(
    package_id: int,
    edition: str = Form(...),
    reliability_score: float = Form(default=90),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload current curriculum scope evidence without adding teaching coverage.

    CURRICULUM_PLAN is intentionally absent from SOURCE_WEIGHTS. It can prove that
    an older textbook topic is still in the current teaching sequence, but it can
    never become the factual source used to generate lesson explanations.
    """
    package = db.query(SourcePackage).filter(SourcePackage.id == package_id).first()
    if not package:
        raise HTTPException(404, 'Package not found')

    data = await file.read()
    if not data:
        raise HTTPException(400, 'Empty file')
    if len(data) > MAX_SOURCE_BYTES:
        raise HTTPException(413, f'Curriculum plan exceeds the {MAX_SOURCE_BYTES // (1024 * 1024)} MiB limit')

    row = SourceFile(
        package_id=package.id,
        source_type='CURRICULUM_PLAN',
        original_filename=file.filename,
        edition=edition,
        reliability_score=max(0, min(100, reliability_score)),
        status='DISCOVERED',
    )
    db.add(row)
    db.flush()
    try:
        _apply_extracted_source(
            db=db,
            package=package,
            row=row,
            data=data,
            content_type=file.content_type,
            filename=file.filename or 'curriculum-plan',
            target_edition=edition,
            expected_title=None,
        )
        db.commit(); db.refresh(row); db.refresh(package)
    except Exception:
        db.rollback()
        raise

    return {
        'source_file_id': row.id,
        'source_type': row.source_type,
        'edition': row.edition,
        'status': row.status,
        'page_count': row.page_count,
        'edition_match_score': row.edition_match_score,
        'package_completeness': package.completeness_score,
        'package_quality': package.quality_score,
        'coverage_weight': 0,
        'teaching_source': False,
        'note': 'Curriculum plans verify current scope/sequence only and never become lesson factual context.',
    }


@router.post('/lessons/{lesson_id}/verify-current-plan')
def verify_lesson_in_current_plan(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')
    unit = db.query(Unit).filter(Unit.id == lesson.unit_id).first()
    if not unit:
        raise HTTPException(404, 'Unit not found')
    book = db.query(Book).filter(Book.id == unit.book_id).first()
    if not book:
        raise HTTPException(404, 'Book not found')
    package = db.query(SourcePackage).filter(SourcePackage.book_id == book.id).first()
    if not package:
        raise HTTPException(409, 'Book has no source package')

    plans = db.query(SourceFile).filter(
        SourceFile.package_id == package.id,
        SourceFile.source_type == 'CURRICULUM_PLAN',
        SourceFile.status.in_(['EXTRACTED', 'ANALYZED']),
    ).order_by(SourceFile.reliability_score.desc(), SourceFile.id.desc()).all()
    if not plans:
        raise HTTPException(409, 'No extracted CURRICULUM_PLAN is available for current-scope verification')

    evidence = []
    for plan in plans:
        text = plan.extracted_text or ''
        unit_match = _contains(text, unit.title)
        lesson_match = _contains(text, lesson.title)
        chunks = db.query(SourceChunk).filter(SourceChunk.source_file_id == plan.id).order_by(SourceChunk.chunk_index).all()
        matching_chunks = [
            chunk for chunk in chunks
            if _contains(chunk.text, lesson.title) or _contains(chunk.text, unit.title)
        ]
        verified = unit_match and lesson_match
        evidence.append({
            'source_file_id': plan.id,
            'edition': plan.edition,
            'reliability_score': float(plan.reliability_score or 0),
            'unit_match': unit_match,
            'lesson_match': lesson_match,
            'matching_chunk_ids': [chunk.id for chunk in matching_chunks],
            'verified': verified,
        })
        if not verified:
            continue

        for chunk in matching_chunks[:4]:
            existing = db.query(LessonSourceLink).filter_by(
                lesson_id=lesson.id,
                source_chunk_id=chunk.id,
                relation='CURRENT_SCOPE_EVIDENCE',
            ).first()
            if not existing:
                db.add(LessonSourceLink(
                    lesson_id=lesson.id,
                    source_chunk_id=chunk.id,
                    relation='CURRENT_SCOPE_EVIDENCE',
                    confidence=1.0 if _contains(chunk.text, lesson.title) else 0.9,
                    source_method='CURRICULUM_PLAN_EXACT_TITLE_V1',
                    status='VERIFIED',
                ))
        db.commit()
        return {
            'lesson_id': lesson.id,
            'lesson_code': lesson.lesson_code,
            'lesson_title': lesson.title,
            'unit_title': unit.title,
            'current_scope_verified': True,
            'plan_source_file_id': plan.id,
            'plan_edition': plan.edition,
            'scope_chunk_ids': [chunk.id for chunk in matching_chunks[:4]],
            'evidence': evidence,
            'teaching_source': False,
        }

    return {
        'lesson_id': lesson.id,
        'lesson_code': lesson.lesson_code,
        'lesson_title': lesson.title,
        'unit_title': unit.title,
        'current_scope_verified': False,
        'evidence': evidence,
        'blocking_reason': 'Current curriculum plan does not contain both the target unit and lesson titles.',
        'teaching_source': False,
    }
