from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.deps import get_db
from ..db.models import Book, SourceChunk, SourceFile, SourcePackage
from ..services.document_importer import chunk_pages, edition_match_score, extract_document, save_upload
from .router import MAX_UPLOAD_BYTES, UPLOAD_DIR, update_package_completeness

router = APIRouter(prefix='/importer', tags=['curriculum-importer'], dependencies=[Depends(require_admin)])

DEFAULT_FETCH_HOSTS = {
    'moe.edu.ps', 'www.moe.edu.ps',
    'sh-pal.com', 'www.sh-pal.com', 'download.sh-pal.com',
}


def allowed_fetch_hosts() -> set[str]:
    configured = os.getenv('SOURCE_FETCH_HOSTS')
    if not configured:
        return DEFAULT_FETCH_HOSTS
    return {x.strip().lower() for x in configured.split(',') if x.strip()}


def _validate_source_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {'http', 'https'}:
        raise HTTPException(400, 'Only http/https source URLs are supported')
    host = (parsed.hostname or '').lower()
    if host not in allowed_fetch_hosts():
        raise HTTPException(403, f'Source host is not allowed: {host or "unknown"}')


class _SafeRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        _validate_source_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def _download_registered_source(url: str) -> tuple[bytes, str | None, str]:
    _validate_source_url(url)
    request = Request(url, headers={'User-Agent': 'PalLearningCurriculumImporter/1.0'})
    opener = build_opener(_SafeRedirectHandler())
    timeout = int(os.getenv('SOURCE_FETCH_TIMEOUT_SECONDS', '45'))
    try:
        with opener.open(request, timeout=timeout) as response:
            final_url = response.geturl()
            _validate_source_url(final_url)
            content_type = (response.headers.get_content_type() or '').lower() or None
            if content_type == 'text/html':
                raise HTTPException(
                    415,
                    'Registered URL returned an HTML landing page, not a curriculum document. Use a direct PDF/text file URL or upload the file.',
                )
            length = response.headers.get('Content-Length')
            if length and int(length) > MAX_UPLOAD_BYTES:
                raise HTTPException(413, f'Remote source exceeds {MAX_UPLOAD_BYTES // (1024*1024)} MiB limit')
            chunks: list[bytes] = []
            total = 0
            while True:
                part = response.read(1024 * 1024)
                if not part:
                    break
                total += len(part)
                if total > MAX_UPLOAD_BYTES:
                    raise HTTPException(413, f'Remote source exceeds {MAX_UPLOAD_BYTES // (1024*1024)} MiB limit')
                chunks.append(part)
            return b''.join(chunks), content_type, final_url
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(502, f'Unable to fetch registered source: {type(exc).__name__}') from exc


@router.post('/source-files/{source_file_id}/fetch-url')
def fetch_registered_source(source_file_id: int, db: Session = Depends(get_db)):
    source = db.query(SourceFile).filter(SourceFile.id == source_file_id).first()
    if not source:
        raise HTTPException(404, 'Source file not found')
    if not source.source_url:
        raise HTTPException(409, 'Source has no registered URL')

    package = db.query(SourcePackage).filter(SourcePackage.id == source.package_id).first()
    if not package:
        raise HTTPException(409, 'Source package not found')
    book = db.query(Book).filter(Book.id == package.book_id).first()

    data, content_type, final_url = _download_registered_source(source.source_url)
    filename = source.original_filename or Path(urlparse(final_url).path).name or f'source-{source.id}'
    path = save_upload(data, filename, UPLOAD_DIR)
    try:
        extracted = extract_document(path, content_type)
    except ValueError as exc:
        path.unlink(missing_ok=True)
        raise HTTPException(415, str(exc)) from exc

    duplicate = db.query(SourceFile).filter(
        SourceFile.package_id == source.package_id,
        SourceFile.checksum == extracted.checksum,
        SourceFile.id != source.id,
    ).first()
    if duplicate:
        path.unlink(missing_ok=True)
        raise HTTPException(409, {
            'message': 'This document already exists in the source package',
            'existing_source_file_id': duplicate.id,
        })

    db.query(SourceChunk).filter(SourceChunk.source_file_id == source.id).delete(synchronize_session=False)
    target_year = book.edition if book else None
    source.file_key = str(path)
    source.mime_type = content_type
    source.page_count = extracted.page_count
    source.checksum = extracted.checksum
    source.extracted_text = extracted.text
    source.edition_match_score = edition_match_score(extracted.text, target_year, book.title if book else None)
    source.status = 'EXTRACTED' if extracted.text else 'NEEDS_REVIEW'
    source.extraction_meta = {
        'method': extracted.extraction_method,
        'warnings': extracted.warnings,
        'characters': len(extracted.text),
        'fetched_from': source.source_url,
        'final_url': final_url,
    }
    for chunk in chunk_pages(extracted.pages):
        db.add(SourceChunk(source_file_id=source.id, **chunk, metadata_json={'source_type': source.source_type}))
    update_package_completeness(db, package)
    db.commit()
    db.refresh(source)
    return {
        'source_file_id': source.id,
        'status': source.status,
        'page_count': source.page_count,
        'checksum': source.checksum,
        'edition_match_score': source.edition_match_score,
        'warnings': (source.extraction_meta or {}).get('warnings', []),
        'package_completeness': package.completeness_score,
        'package_quality': package.quality_score,
    }
