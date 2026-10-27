from __future__ import annotations

import ipaddress
import os
import socket
from pathlib import Path
from datetime import datetime
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..db.deps import get_db
from ..auth.deps import require_admin
from ..db.models import Book, Unit, Lesson, LessonSourceLink, SourceChunk, SourceFile, SourcePackage, AIJob
from ..services.ai_gateway import AIGateway
from ..services.document_importer import (
    assess_extraction_quality,
    chunk_pages,
    detect_curriculum_structure,
    edition_match_score,
    extract_document,
    save_upload,
    sha256_bytes,
    title_match_score,
)
from ..services.object_storage import persist_source_bytes, storage_configuration

router = APIRouter(prefix='/importer', tags=['curriculum-importer'], dependencies=[Depends(require_admin)])
UPLOAD_DIR = Path(os.getenv('UPLOAD_DIR', Path(__file__).resolve().parents[2] / 'data' / 'uploads'))
MAX_SOURCE_BYTES = int(os.getenv('MAX_SOURCE_BYTES', str(70 * 1024 * 1024)))
SOURCE_FETCH_TIMEOUT_SECONDS = int(os.getenv('SOURCE_FETCH_TIMEOUT_SECONDS', '45'))
DEFAULT_SOURCE_HOSTS = 'moe.edu.ps,www.sh-pal.com,sh-pal.com,download.sh-pal.com,elearn.edu.ps,elearnps.blob.core.windows.net'

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

PRIMARY_TEACHING_SOURCE_ORDER = ('OFFICIAL_PACKAGE', 'STUDENT_BOOK')


def _bounded_score(value) -> float:
    try:
        return max(0.0, min(100.0, float(value or 0)))
    except (TypeError, ValueError):
        return 0.0


def _allowed_source_hosts() -> set[str]:
    raw = os.getenv('CURRICULUM_SOURCE_HOSTS', DEFAULT_SOURCE_HOSTS)
    return {x.strip().lower() for x in raw.split(',') if x.strip()}


def _validate_source_url(url: str) -> str:
    parsed = urlparse(url or '')
    if parsed.scheme != 'https' or not parsed.hostname:
        raise ValueError('Only HTTPS curriculum source URLs are allowed')
    host = parsed.hostname.lower().rstrip('.')
    if host not in _allowed_source_hosts():
        raise ValueError(f'Curriculum source host is not allowlisted: {host}')
    try:
        addresses = {item[4][0] for item in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)}
    except socket.gaierror as exc:
        raise ValueError(f'Could not resolve curriculum source host: {host}') from exc
    if not addresses:
        raise ValueError(f'Could not resolve curriculum source host: {host}')
    for raw_ip in addresses:
        ip = ipaddress.ip_address(raw_ip)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_unspecified:
            raise ValueError('Curriculum source resolved to a non-public address')
    return host


class _SafeRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        _validate_source_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def _normalize_remote_content_type(reported_content_type: str | None, data: bytes) -> str:
    # File signatures are stronger evidence than a generic HTTP MIME header.
    if data.startswith(b'%PDF-'):
        return 'application/pdf'
    reported = (reported_content_type or '').lower()
    if reported in {'text/plain', 'text/markdown'}:
        return reported
    raise ValueError(f'Unsupported remote curriculum content type: {reported or "unknown"}')


def _download_registered_source(url: str) -> tuple[bytes, str | None, str]:
    _validate_source_url(url)
    opener = build_opener(_SafeRedirectHandler())
    request = Request(url, headers={'User-Agent': 'PalLearningCurriculumImporter/1.0'})
    try:
        with opener.open(request, timeout=SOURCE_FETCH_TIMEOUT_SECONDS) as response:
            final_url = response.geturl()
            _validate_source_url(final_url)
            reported_content_type = (response.headers.get_content_type() or '').lower() or None
            length_header = response.headers.get('Content-Length')
            if length_header:
                try:
                    if int(length_header) > MAX_SOURCE_BYTES:
                        raise ValueError(
                            f'Remote source exceeds the {MAX_SOURCE_BYTES // (1024 * 1024)} MiB limit'
                        )
                except ValueError as exc:
                    if 'exceeds' in str(exc):
                        raise
            data = response.read(MAX_SOURCE_BYTES + 1)
            content_type = _normalize_remote_content_type(reported_content_type, data)
    except (HTTPError, URLError, TimeoutError) as exc:
        raise ValueError(f'Could not download registered curriculum source: {exc}') from exc

    if not data:
        raise ValueError('Registered curriculum source returned an empty body')
    if len(data) > MAX_SOURCE_BYTES:
        raise ValueError(f'Remote source exceeds the {MAX_SOURCE_BYTES // (1024 * 1024)} MiB limit')
    return data, content_type, final_url


def calculate_package_scores(files: list[SourceFile]) -> tuple[float, float]:
    """Return (coverage, verified_quality) on a 0–100 scale.

    Coverage only answers whether a useful source type is present. Verified quality
    additionally requires reliability, edition evidence, and a source that is not
    quarantined for vision review. For duplicate source types, only the strongest
    verified candidate contributes.
    """
    by_type: dict[str, list[SourceFile]] = {}
    for item in files:
        by_type.setdefault(item.source_type, []).append(item)

    coverage = 0.0
    verified_quality = 0.0
    for source_type, weight in SOURCE_WEIGHTS.items():
        candidates = by_type.get(source_type, [])
        if not candidates:
            continue
        coverage += weight
        best_factor = max(
            (
                0.0
                if getattr(item, 'status', None) == 'NEEDS_VISION'
                else (
                    (_bounded_score(item.reliability_score) / 100.0)
                    * (_bounded_score(item.edition_match_score) / 100.0)
                )
            )
            for item in candidates
        )
        verified_quality += weight * best_factor

    return round(min(100.0, coverage), 1), round(min(100.0, verified_quality), 1)


def select_primary_teaching_source(files: list[SourceFile]) -> SourceFile | None:
    """Prefer current official material and never silently mix editions.

    A usable OFFICIAL_PACKAGE is the first teaching source. If none is available,
    a usable STUDENT_BOOK is used. NEEDS_VISION/NEEDS_REVIEW sources are never
    allowed to become the factual teaching backbone.
    """
    usable_statuses = {'EXTRACTED', 'ANALYZED'}
    for source_type in PRIMARY_TEACHING_SOURCE_ORDER:
        candidates = [
            x for x in files
            if x.source_type == source_type
            and x.extracted_text
            and getattr(x, 'status', 'EXTRACTED') in usable_statuses
        ]
        if candidates:
            return max(
                candidates,
                key=lambda x: (
                    float(x.reliability_score or 0),
                    float(x.edition_match_score or 0),
                    int(x.id or 0),
                ),
            )
    return None


def update_package_completeness(db: Session, package: SourcePackage) -> None:
    files = db.query(SourceFile).filter(SourceFile.package_id == package.id).all()
    coverage, verified_quality = calculate_package_scores(files)
    package.completeness_score = coverage
    package.quality_score = verified_quality
    types = {x.source_type for x in files}
    if 'STUDENT_BOOK' in types or 'OFFICIAL_PACKAGE' in types:
        package.status = 'INGESTING' if coverage < 100 else 'READY_FOR_PROCESSING'


def _apply_extracted_source(
    db: Session,
    package: SourcePackage,
    row: SourceFile,
    data: bytes,
    content_type: str | None,
    filename: str,
    target_edition: str | None,
    expected_title: str | None,
    source_url: str | None = None,
) -> None:
    checksum = sha256_bytes(data)
    duplicate = db.query(SourceFile).filter(
        SourceFile.package_id == package.id,
        SourceFile.checksum == checksum,
        SourceFile.id != row.id,
    ).first()
    if duplicate:
        raise HTTPException(
            409,
            detail={
                'message': 'This exact source file is already registered in the package',
                'existing_source_file_id': duplicate.id,
                'checksum': checksum,
            },
        )

    path = save_upload(data, filename, UPLOAD_DIR)
    extracted = extract_document(path, content_type)
    extraction_quality = assess_extraction_quality(extracted)
    storage_config = storage_configuration()
    storage_key = persist_source_bytes(
        data=data,
        filename=filename,
        checksum=checksum,
        content_type=content_type,
        local_path=path,
    )
    row.file_key = storage_key
    row.original_filename = row.original_filename or filename
    row.mime_type = content_type
    row.page_count = extracted.page_count
    row.edition_match_score = edition_match_score(extracted.text, target_edition, expected_title)
    row.checksum = extracted.checksum
    if extraction_quality.needs_vision:
        row.status = 'NEEDS_VISION'
    elif extracted.text:
        row.status = 'EXTRACTED'
    else:
        row.status = 'NEEDS_REVIEW'
    row.extracted_text = extracted.text
    registered_url = row.source_url
    if not registered_url and source_url:
        row.source_url = source_url
    row.extraction_meta = {
        **dict(row.extraction_meta or {}),
        'method': extracted.extraction_method,
        'warnings': extracted.warnings,
        'characters': len(extracted.text),
        'bytes': len(data),
        'registered_source_url': registered_url or row.source_url,
        'final_source_url': source_url,
        'text_page_count': extraction_quality.text_page_count,
        'empty_page_count': extraction_quality.empty_page_count,
        'text_coverage_percent': extraction_quality.text_coverage_percent,
        'average_characters_per_page': extraction_quality.average_characters_per_page,
        'needs_vision': extraction_quality.needs_vision,
        'storage_backend': storage_config.backend,
        'durable_storage': storage_config.durable and storage_config.configured,
        'storage_key': storage_key,
    }
    db.query(SourceChunk).filter(SourceChunk.source_file_id == row.id).delete(synchronize_session=False)
    if not extraction_quality.needs_vision:
        for chunk in chunk_pages(extracted.pages):
            db.add(SourceChunk(source_file_id=row.id, **chunk, metadata_json={'source_type': row.source_type}))
    update_package_completeness(db, package)


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
    if source_type not in SOURCE_WEIGHTS:
        raise HTTPException(422, f'Unsupported source_type: {source_type}')

    book = db.query(Book).filter(Book.id == package.book_id).first()
    data = await file.read()
    if not data:
        raise HTTPException(400, 'Empty file')
    if len(data) > MAX_SOURCE_BYTES:
        raise HTTPException(413, f'Source file exceeds the {MAX_SOURCE_BYTES // (1024 * 1024)} MiB limit')

    checksum = sha256_bytes(data)
    duplicate = db.query(SourceFile).filter(
        SourceFile.package_id == package_id,
        SourceFile.checksum == checksum,
    ).first()
    if duplicate:
        raise HTTPException(
            409,
            detail={
                'message': 'This exact source file is already registered in the package',
                'existing_source_file_id': duplicate.id,
                'checksum': checksum,
            },
        )

    row = SourceFile(
        package_id=package_id,
        source_type=source_type,
        original_filename=file.filename,
        edition=edition,
        reliability_score=max(0, min(100, reliability_score)),
        status='DISCOVERED',
    )
    db.add(row)
    db.flush()
    try:
        _apply_extracted_source(
            db,
            package,
            row,
            data,
            file.content_type,
            file.filename or 'source',
            edition or (book.edition if book else None),
            book.title if book else None,
        )
    except ValueError as exc:
        db.rollback()
        raise HTTPException(415, str(exc)) from exc
    except RuntimeError as exc:
        db.rollback()
        raise HTTPException(503, str(exc)) from exc
    db.commit()
    db.refresh(row)
    return {
        'source_file_id': row.id,
        'status': row.status,
        'page_count': row.page_count,
        'checksum': row.checksum,
        'file_key': row.file_key,
        'storage_backend': (row.extraction_meta or {}).get('storage_backend'),
        'durable_storage': (row.extraction_meta or {}).get('durable_storage', False),
        'edition_match_score': row.edition_match_score,
        'warnings': (row.extraction_meta or {}).get('warnings', []),
        'extraction_quality': {
            'text_coverage_percent': (row.extraction_meta or {}).get('text_coverage_percent'),
            'average_characters_per_page': (row.extraction_meta or {}).get('average_characters_per_page'),
            'needs_vision': (row.extraction_meta or {}).get('needs_vision', False),
        },
        'package_completeness': package.completeness_score,
        'package_quality': package.quality_score,
    }


@router.post('/source-files/{source_file_id}/fetch-registered')
def fetch_registered_source(source_file_id: int, db: Session = Depends(get_db)):
    row = db.query(SourceFile).filter(SourceFile.id == source_file_id).first()
    if not row:
        raise HTTPException(404, 'Source file not found')
    if not row.source_url:
        raise HTTPException(409, 'Source file has no registered source_url')
    package = db.query(SourcePackage).filter(SourcePackage.id == row.package_id).first()
    if not package:
        raise HTTPException(404, 'Source package not found')
    book = db.query(Book).filter(Book.id == package.book_id).first()

    try:
        data, content_type, final_url = _download_registered_source(row.source_url)
        parsed = urlparse(final_url)
        filename = Path(parsed.path).name or f'source-{row.id}'
        _apply_extracted_source(
            db,
            package,
            row,
            data,
            content_type,
            filename,
            book.edition if book else None,
            book.title if book else None,
            source_url=final_url,
        )
    except HTTPException:
        db.rollback()
        raise
    except ValueError as exc:
        db.rollback()
        raise HTTPException(422, str(exc)) from exc
    except RuntimeError as exc:
        db.rollback()
        raise HTTPException(503, str(exc)) from exc

    db.commit()
    db.refresh(row)
    return {
        'source_file_id': row.id,
        'status': row.status,
        'page_count': row.page_count,
        'checksum': row.checksum,
        'file_key': row.file_key,
        'storage_backend': (row.extraction_meta or {}).get('storage_backend'),
        'durable_storage': (row.extraction_meta or {}).get('durable_storage', False),
        'edition_match_score': row.edition_match_score,
        'warnings': (row.extraction_meta or {}).get('warnings', []),
        'extraction_quality': {
            'text_coverage_percent': (row.extraction_meta or {}).get('text_coverage_percent'),
            'average_characters_per_page': (row.extraction_meta or {}).get('average_characters_per_page'),
            'needs_vision': (row.extraction_meta or {}).get('needs_vision', False),
        },
        'package_completeness': package.completeness_score,
        'package_quality': package.quality_score,
        'final_source_url': (row.extraction_meta or {}).get('final_source_url'),
    }


@router.post('/source-files/{source_file_id}/analyze')
def analyze_source(source_file_id: int, db: Session = Depends(get_db)):
    row = db.query(SourceFile).filter(SourceFile.id == source_file_id).first()
    if not row:
        raise HTTPException(404, 'Source file not found')
    if row.status == 'NEEDS_VISION':
        raise HTTPException(409, 'Source requires vision review before curriculum analysis')
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
    primary_source = select_primary_teaching_source(files)
    if not primary_source:
        raise HTTPException(409, 'A verified text-extractable OFFICIAL_PACKAGE or STUDENT_BOOK is required before processing')

    structure = detect_curriculum_structure(primary_source.extracted_text or '')
    gateway = AIGateway()
    ai_result = gateway.run('EXTRACT_STRUCTURE', {'text': primary_source.extracted_text or ''}, 'FAST')
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
            'primary_source_file_id': primary_source.id,
            'primary_source_type': primary_source.source_type,
            'primary_source_edition': primary_source.edition,
            'package_completeness': package.completeness_score,
            'package_quality': package.quality_score,
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
    files = db.query(SourceFile).filter(SourceFile.package_id == package_id).order_by(SourceFile.id).all()
    primary_source = select_primary_teaching_source(files)
    if not primary_source:
        raise HTTPException(409, 'No verified text-extractable official package or student book is available for lesson linking')
    chunks = db.query(SourceChunk).filter(SourceChunk.source_file_id == primary_source.id).all()
    created = 0
    candidates = []
    for lesson in lessons:
        scored = sorted(
            [(title_match_score(lesson.title, chunk.text), chunk) for chunk in chunks],
            key=lambda x: x[0], reverse=True
        )
        if not scored or scored[0][0] < 0.5:
            candidates.append({
                'lesson_id': lesson.id,
                'lesson_title': lesson.title,
                'linked': False,
                'primary_source_type': primary_source.source_type,
            })
            continue
        best_score = scored[0][0]
        selected = [pair for pair in scored if pair[0] >= max(0.5, best_score - 0.08)][:3]
        for score, chunk in selected:
            existing = db.query(LessonSourceLink).filter_by(
                lesson_id=lesson.id, source_chunk_id=chunk.id, relation='TEACHING_SOURCE'
            ).first()
            if not existing:
                db.add(LessonSourceLink(
                    lesson_id=lesson.id, source_chunk_id=chunk.id, relation='TEACHING_SOURCE',
                    confidence=score, source_method='PRIMARY_SOURCE_TITLE_MATCH_V1',
                    status='VERIFIED_CANDIDATE' if score >= 0.9 else 'CANDIDATE'
                ))
                created += 1
            candidates.append({
                'lesson_id': lesson.id,
                'lesson_title': lesson.title,
                'linked': True,
                'source_file_id': primary_source.id,
                'source_type': primary_source.source_type,
                'source_chunk_id': chunk.id,
                'page_number': chunk.page_number,
                'confidence': score,
            })
    db.commit()
    return {
        'package_id': package_id,
        'primary_source_file_id': primary_source.id,
        'primary_source_type': primary_source.source_type,
        'created_links': created,
        'candidates': candidates,
    }
