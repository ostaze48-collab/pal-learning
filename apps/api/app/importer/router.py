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
DEFAULT_SOURCE_HOSTS = (
    'moe.edu.ps,www.sh-pal.com,sh-pal.com,download.sh-pal.com,'
    'elearn.edu.ps,elearnps.blob.core.windows.net'
)

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
    quality = 0.0
    for source_type, weight in SOURCE_WEIGHTS.items():
        rows = by_type.get(source_type, [])
        if not rows:
            continue
        coverage += weight
        best = 0.0
        for row in rows:
            if row.status in {'NEEDS_VISION', 'SCOPE_UNVERIFIED', 'SCOPE_REJECTED'}:
                continue
            reliability = _bounded_score(row.reliability_score) / 100.0
            edition = _bounded_score(row.edition_match_score) / 100.0
            best = max(best, reliability * edition)
        quality += weight * best
    return round(coverage, 2), round(quality, 2)


def update_package_completeness(db: Session, package: SourcePackage) -> None:
    files = db.query(SourceFile).filter(SourceFile.package_id == package.id).all()
    coverage, quality = calculate_package_scores(files)
    package.completeness_score = coverage
    package.quality_score = quality


def _persist_extracted_source(
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
    # Preserve the registered/catalog URL as the stable source identity. Redirect
    # destinations are stored separately for auditability because signed/CDN URLs
    # may change without changing the curriculum source record.
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
        raise HTTPException(404, 'Source package not found')
    if source_type not in set(SOURCE_WEIGHTS) | {'CURRICULUM_PLAN', 'CATALOG_CANDIDATE'}:
        raise HTTPException(422, f'Unknown source type: {source_type}')
    data = await file.read(MAX_SOURCE_BYTES + 1)
    if len(data) > MAX_SOURCE_BYTES:
        raise HTTPException(413, f'Source file exceeds the {MAX_SOURCE_BYTES // (1024 * 1024)} MiB limit')
    existing = db.query(SourceFile).filter(
        SourceFile.package_id == package.id,
        SourceFile.checksum == sha256_bytes(data),
    ).first()
    if existing:
        raise HTTPException(
            409,
            detail={
                'message': 'This exact source file is already registered in the package',
                'existing_source_file_id': existing.id,
            },
        )

    book = db.query(Book).filter(Book.id == package.book_id).first()
    row = SourceFile(
        package_id=package.id,
        source_type=source_type,
        original_filename=file.filename,
        edition=edition,
        reliability_score=reliability_score,
        edition_match_score=0,
        status='UPLOADED',
    )
    db.add(row)
    db.flush()
    try:
        _persist_extracted_source(
            db, package, row, data, file.content_type, file.filename or f'source-{row.id}.bin',
            book.edition if book else None, book.title if book else None,
        )
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(422, str(exc)) from exc

    return {
        'source_file_id': row.id,
        'status': row.status,
        'source_type': row.source_type,
        'page_count': row.page_count,
        'edition_match_score': row.edition_match_score,
        'checksum': row.checksum,
        'file_key': row.file_key,
        'extraction_meta': row.extraction_meta,
        'package_completeness': package.completeness_score,
        'package_quality': package.quality_score,
    }


@router.post('/source-files/{source_file_id}/fetch-registered')
def fetch_registered_source(source_file_id: int, db: Session = Depends(get_db)):
    row = db.query(SourceFile).filter(SourceFile.id == source_file_id).first()
    if not row:
        raise HTTPException(404, 'Source file not found')
    if not row.source_url:
        raise HTTPException(409, 'Source file has no registered source URL')
    package = db.query(SourcePackage).filter(SourcePackage.id == row.package_id).first()
    if not package:
        raise HTTPException(404, 'Source package not found')
    book = db.query(Book).filter(Book.id == package.book_id).first()
    try:
        data, content_type, final_url = _download_registered_source(row.source_url)
        parsed = urlparse(final_url)
        filename = Path(parsed.path).name or row.original_filename or f'source-{row.id}.pdf'
        _persist_extracted_source(
            db, package, row, data, content_type, filename,
            book.edition if book else None, book.title if book else None, source_url=final_url,
        )
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(422, str(exc)) from exc

    return {
        'source_file_id': row.id,
        'status': row.status,
        'source_type': row.source_type,
        'page_count': row.page_count,
        'edition_match_score': row.edition_match_score,
        'checksum': row.checksum,
        'file_key': row.file_key,
        'extraction_meta': row.extraction_meta,
        'package_completeness': package.completeness_score,
        'package_quality': package.quality_score,
    }


@router.get('/source-packages/{package_id}')
def get_source_package(package_id: int, db: Session = Depends(get_db)):
    package = db.query(SourcePackage).filter(SourcePackage.id == package_id).first()
    if not package:
        raise HTTPException(404, 'Source package not found')
    files = db.query(SourceFile).filter(SourceFile.package_id == package.id).order_by(SourceFile.id).all()
    coverage, quality = calculate_package_scores(files)
    package.completeness_score = coverage
    package.quality_score = quality
    db.commit()
    return {
        'id': package.id,
        'package_code': package.package_code,
        'status': package.status,
        'completeness_score': coverage,
        'quality_score': quality,
        'coverage_score': coverage,
        'verified_quality_score': quality,
        'source_count': len(files),
        'files': [
            {
                'id': f.id,
                'source_type': f.source_type,
                'filename': f.original_filename,
                'edition': f.edition,
                'source_url': f.source_url,
                'status': f.status,
                'pages': f.page_count,
                'reliability': f.reliability_score,
                'edition_match': f.edition_match_score,
                'checksum': f.checksum,
                'file_key': f.file_key,
                'durable_storage': bool((f.extraction_meta or {}).get('durable_storage')),
                'extraction_meta': f.extraction_meta,
            } for f in files
        ],
    }


@router.post('/source-packages/{package_id}/link-lessons')
def link_source_pack_to_lessons(package_id: int, db: Session = Depends(get_db)):
    package = db.query(SourcePackage).filter(SourcePackage.id == package_id).first()
    if not package:
        raise HTTPException(404, 'Source package not found')
    book = db.query(Book).filter(Book.id == package.book_id).first()
    lessons = db.query(Lesson).join(Unit, Lesson.unit_id == Unit.id).filter(Unit.book_id == book.id).all()
    files = db.query(SourceFile).filter(SourceFile.package_id == package.id).all()

    # Prefer official/current factual sources with usable extracted text. A catalog
    # registration does not count until its text has been extracted and its scope has
    # been promoted to OFFICIAL_PACKAGE. Historical STUDENT_BOOK is a fallback.
    usable_by_type: dict[str, list[SourceFile]] = {}
    for source in files:
        if source.source_type not in PRIMARY_TEACHING_SOURCE_ORDER:
            continue
        if source.status in {'NEEDS_VISION', 'NEEDS_REVIEW', 'SCOPE_UNVERIFIED', 'SCOPE_REJECTED'}:
            continue
        if not (source.extracted_text or '').strip():
            continue
        usable_by_type.setdefault(source.source_type, []).append(source)

    primary = None
    for source_type in PRIMARY_TEACHING_SOURCE_ORDER:
        candidates = usable_by_type.get(source_type, [])
        if candidates:
            primary = max(
                candidates,
                key=lambda item: (_bounded_score(item.edition_match_score), _bounded_score(item.reliability_score)),
            )
            break
    if not primary:
        return {'created': 0, 'updated': 0, 'links': [], 'note': 'No extracted teaching source is available yet'}

    chunks = db.query(SourceChunk).filter(SourceChunk.source_file_id == primary.id).all()
    created = 0
    updated = 0
    links = []
    for lesson in lessons:
        ranked = []
        for chunk in chunks:
            score = title_match_score(lesson.title, chunk.text)
            if score >= 0.45:
                ranked.append((score, chunk))
        ranked.sort(key=lambda x: x[0], reverse=True)
        for score, chunk in ranked[:4]:
            existing = db.query(LessonSourceLink).filter(
                LessonSourceLink.lesson_id == lesson.id,
                LessonSourceLink.source_chunk_id == chunk.id,
                LessonSourceLink.relation == 'TEACHING_SOURCE',
            ).first()
            next_status = 'VERIFIED_CANDIDATE' if score >= 0.85 else 'CANDIDATE'
            if existing:
                existing.confidence = max(existing.confidence, score)
                existing.source_method = 'AUTO_TITLE_MATCH'
                if existing.status not in {'VERIFIED', 'REJECTED'}:
                    existing.status = next_status
                updated += 1
                row = existing
            else:
                row = LessonSourceLink(
                    lesson_id=lesson.id,
                    source_chunk_id=chunk.id,
                    relation='TEACHING_SOURCE',
                    confidence=score,
                    source_method='AUTO_TITLE_MATCH',
                    status=next_status,
                )
                db.add(row); db.flush(); created += 1
            links.append({
                'lesson_id': lesson.id,
                'lesson_code': lesson.lesson_code,
                'lesson_title': lesson.title,
                'source_file_id': primary.id,
                'source_type': primary.source_type,
                'source_chunk_id': chunk.id,
                'page_number': chunk.page_number,
                'confidence': round(score, 3),
                'status': row.status,
            })
    db.commit()
    return {
        'created': created,
        'updated': updated,
        'primary_source_file_id': primary.id,
        'primary_source_type': primary.source_type,
        'links': links,
    }


@router.post('/source-packages/{package_id}/process')
def process_source_package(package_id: int, db: Session = Depends(get_db)):
    package = db.query(SourcePackage).filter(SourcePackage.id == package_id).first()
    if not package:
        raise HTTPException(404, 'Source package not found')
    job = AIJob(
        job_type='IMPORT_PACKAGE',
        source_id=package.id,
        status='QUEUED',
        priority=10,
        model_route='FAST',
        prompt_version='curriculum-parser-v1',
    )
    db.add(job)
    db.commit()
    return {'job_id': job.id, 'status': job.status, 'pipeline': [
        'CLASSIFY_SOURCES', 'MATCH_EDITION', 'PARSE_DOCUMENTS', 'ALIGN_SOURCES',
        'EXTRACT_CONCEPTS', 'EXTRACT_SKILLS', 'MAP_PREREQUISITES',
        'GENERATE_LESSONS', 'GENERATE_QUESTIONS', 'VALIDATE_ANSWERS',
        'GENERATE_REMEDIATION', 'AI_QA'
    ]}
