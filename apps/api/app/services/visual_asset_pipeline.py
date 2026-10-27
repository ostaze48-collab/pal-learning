from __future__ import annotations

import hashlib

from sqlalchemy.orm import Session

from ..db.models import Book, Lesson, LessonSourceLink, SourceChunk, SourceFile, SourcePackage
from ..db.visual_models import VisualAsset
from ..importer.source_policy import can_ground_facts
from .object_storage import persist_visual_asset_bytes, read_storage_bytes


def _source_label(db: Session, source_file_id: int) -> str:
    row = db.query(SourceFile, SourcePackage, Book).join(
        SourcePackage, SourcePackage.id == SourceFile.package_id
    ).join(Book, Book.id == SourcePackage.book_id).filter(SourceFile.id == source_file_id).first()
    if not row:
        return f'Source file {source_file_id}'
    source, _package, book = row
    return source.original_filename or book.title or f'Source file {source_file_id}'


def lesson_visual_source_pages(db: Session, lesson_id: int) -> list[dict]:
    """Return only pages backed by Admin-verified factual teaching links."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise ValueError('Lesson not found')

    rows = db.query(LessonSourceLink, SourceChunk, SourceFile).join(
        SourceChunk, SourceChunk.id == LessonSourceLink.source_chunk_id
    ).join(SourceFile, SourceFile.id == SourceChunk.source_file_id).filter(
        LessonSourceLink.lesson_id == lesson_id,
        LessonSourceLink.relation == 'TEACHING_SOURCE',
        LessonSourceLink.status == 'VERIFIED',
        SourceChunk.page_number.is_not(None),
    ).all()

    unique = {}
    for link, chunk, source in rows:
        if not can_ground_facts(source.source_type):
            continue
        if not source.file_key:
            continue
        key = (source.id, int(chunk.page_number))
        unique[key] = {
            'source_file_id': source.id,
            'source_page': int(chunk.page_number),
            'source_file_key': source.file_key,
            'source_type': source.source_type,
            'source_label': _source_label(db, source.id),
            'link_confidence': link.confidence,
        }
    return sorted(unique.values(), key=lambda x: (x['source_file_id'], x['source_page']))


def _render_page_variants(pdf_bytes: bytes, page_number: int) -> dict:
    try:
        import fitz
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError('PyMuPDF is required for textbook visual extraction') from exc

    document = fitz.open(stream=pdf_bytes, filetype='pdf')
    try:
        if page_number < 1 or page_number > document.page_count:
            raise ValueError(f'Page {page_number} is outside PDF range 1..{document.page_count}')
        page = document.load_page(page_number - 1)
        main = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        low = page.get_pixmap(matrix=fitz.Matrix(0.75, 0.75), alpha=False)
        return {
            'main_bytes': main.tobytes('png'),
            'low_bytes': low.tobytes('png'),
            'width': int(main.width),
            'height': int(main.height),
        }
    finally:
        document.close()


def extract_lesson_visual_assets(db: Session, lesson_id: int) -> dict:
    candidates = lesson_visual_source_pages(db, lesson_id)
    if not candidates:
        return {
            'lesson_id': lesson_id,
            'eligible_page_count': 0,
            'created': 0,
            'unchanged': 0,
            'replaced': 0,
            'assets': [],
        }

    source_bytes: dict[int, bytes] = {}
    created = unchanged = replaced = 0
    result_assets = []

    for candidate in candidates:
        source_file_id = candidate['source_file_id']
        page_number = candidate['source_page']
        if source_file_id not in source_bytes:
            source_bytes[source_file_id] = read_storage_bytes(candidate['source_file_key'])

        rendered = _render_page_variants(source_bytes[source_file_id], page_number)
        checksum = hashlib.sha256(rendered['main_bytes']).hexdigest()
        existing = db.query(VisualAsset).filter(
            VisualAsset.lesson_id == lesson_id,
            VisualAsset.source_file_id == source_file_id,
            VisualAsset.source_page == page_number,
            VisualAsset.asset_kind == 'TEXTBOOK_PAGE_CROP',
            VisualAsset.region_key == 'full-page',
        ).first()

        if existing and existing.checksum == checksum:
            unchanged += 1
            result_assets.append(existing)
            continue

        main_saved = persist_visual_asset_bytes(
            data=rendered['main_bytes'], lesson_id=lesson_id,
            source_file_id=source_file_id, source_page=page_number,
            checksum=checksum, variant='main',
        )
        low_checksum = hashlib.sha256(rendered['low_bytes']).hexdigest()
        low_saved = persist_visual_asset_bytes(
            data=rendered['low_bytes'], lesson_id=lesson_id,
            source_file_id=source_file_id, source_page=page_number,
            checksum=low_checksum, variant='low',
        )

        if existing:
            asset = existing
            replaced += 1
            asset.rights_status = 'REVIEW_REQUIRED'
            asset.status = 'EXTRACTED'
            asset.alt_text = None
            asset.caption = None
            asset.hotspots_json = []
        else:
            created += 1
            asset = VisualAsset(
                lesson_id=lesson_id,
                source_file_id=source_file_id,
                source_page=page_number,
                asset_kind='TEXTBOOK_PAGE_CROP',
                region_key='full-page',
                rights_status='REVIEW_REQUIRED',
                status='EXTRACTED',
                hotspots_json=[],
            )
            db.add(asset)

        asset.storage_key = main_saved['storage_key']
        asset.low_data_storage_key = low_saved['storage_key']
        asset.public_url = main_saved['public_url']
        asset.low_data_url = low_saved['public_url']
        asset.checksum = checksum
        asset.width = rendered['width']
        asset.height = rendered['height']
        result_assets.append(asset)

    db.commit()
    for asset in result_assets:
        db.refresh(asset)
    return {
        'lesson_id': lesson_id,
        'eligible_page_count': len(candidates),
        'created': created,
        'unchanged': unchanged,
        'replaced': replaced,
        'assets': [serialize_visual_asset(db, asset, include_private=True) for asset in result_assets],
    }


def serialize_visual_asset(db: Session, asset: VisualAsset, include_private: bool = False) -> dict:
    data = {
        'id': asset.id,
        'lesson_id': asset.lesson_id,
        'source_file_id': asset.source_file_id,
        'source_page': asset.source_page,
        'source_label': _source_label(db, asset.source_file_id),
        'parent_asset_id': asset.parent_asset_id,
        'asset_kind': asset.asset_kind,
        'region_key': asset.region_key,
        'crop_box': asset.crop_box_json,
        'src': asset.public_url,
        'low_data_src': asset.low_data_url,
        'width': asset.width,
        'height': asset.height,
        'rights_status': asset.rights_status,
        'status': asset.status,
        'alt_text': asset.alt_text,
        'caption': asset.caption,
        'hotspots': asset.hotspots_json or [],
    }
    if include_private:
        data['storage_key'] = asset.storage_key
        data['low_data_storage_key'] = asset.low_data_storage_key
    return data


def generation_visual_assets(db: Session, lesson_id: int, allowed_source_pages: set[tuple[int, int]]) -> list[dict]:
    """Return cleared visuals, preferring focused figures over full textbook pages."""
    rows = db.query(VisualAsset).filter(
        VisualAsset.lesson_id == lesson_id,
        VisualAsset.rights_status == 'CLEARED',
        VisualAsset.status == 'APPROVED',
    ).order_by(VisualAsset.source_page, VisualAsset.id).all()

    eligible = [
        asset for asset in rows
        if (asset.source_file_id, asset.source_page) in allowed_source_pages and asset.public_url
    ]
    focused_pages = {
        (asset.source_file_id, asset.source_page)
        for asset in eligible
        if asset.asset_kind == 'TEXTBOOK_FIGURE'
    }

    result = []
    for asset in eligible:
        if asset.asset_kind == 'TEXTBOOK_PAGE_CROP' and (asset.source_file_id, asset.source_page) in focused_pages:
            continue
        result.append(serialize_visual_asset(db, asset, include_private=False))
    return result
