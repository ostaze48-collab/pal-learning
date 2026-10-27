from __future__ import annotations

import hashlib
import json
from io import BytesIO

from sqlalchemy.orm import Session

from ..db.visual_models import VisualAsset
from .object_storage import persist_visual_asset_bytes, read_storage_bytes
from .visual_asset_pipeline import serialize_visual_asset


def _normalized_box(box: dict) -> dict:
    result = {
        'x': round(float(box['x']), 3),
        'y': round(float(box['y']), 3),
        'width': round(float(box['width']), 3),
        'height': round(float(box['height']), 3),
    }
    if result['x'] < 0 or result['y'] < 0:
        raise ValueError('Crop x/y must be >= 0')
    if result['width'] < 5 or result['height'] < 5:
        raise ValueError('Crop width/height must each be at least 5 percent')
    if result['x'] + result['width'] > 100 or result['y'] + result['height'] > 100:
        raise ValueError('Crop rectangle must remain inside the source page')
    return result


def _region_key(box: dict) -> str:
    raw = json.dumps(box, sort_keys=True, separators=(',', ':')).encode('utf-8')
    return f"crop-{hashlib.sha256(raw).hexdigest()[:16]}"


def _crop_variants(parent_bytes: bytes, box: dict) -> dict:
    try:
        from PIL import Image
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError('Pillow is required for textbook figure crops') from exc

    with Image.open(BytesIO(parent_bytes)) as image:
        image = image.convert('RGB')
        left = round(image.width * box['x'] / 100)
        top = round(image.height * box['y'] / 100)
        right = round(image.width * (box['x'] + box['width']) / 100)
        bottom = round(image.height * (box['y'] + box['height']) / 100)
        if right <= left or bottom <= top:
            raise ValueError('Crop rectangle produced an empty image')
        cropped = image.crop((left, top, right, bottom))

        main_buffer = BytesIO()
        cropped.save(main_buffer, format='PNG', optimize=True)

        low = cropped.copy()
        max_width = 720
        if low.width > max_width:
            ratio = max_width / low.width
            low = low.resize((max_width, max(1, round(low.height * ratio))))
        low_buffer = BytesIO()
        low.save(low_buffer, format='WEBP', quality=72, method=6)

        return {
            'main_bytes': main_buffer.getvalue(),
            'low_bytes': low_buffer.getvalue(),
            'width': cropped.width,
            'height': cropped.height,
        }


def create_or_refresh_figure_crop(db: Session, parent_asset_id: int, crop_box: dict) -> dict:
    parent = db.query(VisualAsset).filter(VisualAsset.id == parent_asset_id).first()
    if not parent:
        raise ValueError('Parent visual asset not found')
    if parent.asset_kind != 'TEXTBOOK_PAGE_CROP':
        raise ValueError('Figure crops must be created from a textbook page asset')
    if not parent.storage_key:
        raise ValueError('Parent page bytes are not available')

    box = _normalized_box(crop_box)
    region_key = _region_key(box)
    variants = _crop_variants(read_storage_bytes(parent.storage_key), box)
    checksum = hashlib.sha256(variants['main_bytes']).hexdigest()
    low_checksum = hashlib.sha256(variants['low_bytes']).hexdigest()

    existing = db.query(VisualAsset).filter(
        VisualAsset.lesson_id == parent.lesson_id,
        VisualAsset.source_file_id == parent.source_file_id,
        VisualAsset.source_page == parent.source_page,
        VisualAsset.asset_kind == 'TEXTBOOK_FIGURE',
        VisualAsset.region_key == region_key,
    ).first()

    if existing and existing.checksum == checksum:
        return {
            'created': False,
            'unchanged': True,
            'asset': serialize_visual_asset(db, existing, include_private=True),
        }

    main_saved = persist_visual_asset_bytes(
        data=variants['main_bytes'],
        lesson_id=parent.lesson_id,
        source_file_id=parent.source_file_id,
        source_page=parent.source_page,
        checksum=checksum,
        variant=f'figure-{region_key}',
        extension='png',
        content_type='image/png',
    )
    low_saved = persist_visual_asset_bytes(
        data=variants['low_bytes'],
        lesson_id=parent.lesson_id,
        source_file_id=parent.source_file_id,
        source_page=parent.source_page,
        checksum=low_checksum,
        variant=f'figure-{region_key}-low',
        extension='webp',
        content_type='image/webp',
    )

    created = existing is None
    asset = existing or VisualAsset(
        lesson_id=parent.lesson_id,
        source_file_id=parent.source_file_id,
        source_page=parent.source_page,
        parent_asset_id=parent.id,
        asset_kind='TEXTBOOK_FIGURE',
        region_key=region_key,
        crop_box_json=box,
        rights_status='REVIEW_REQUIRED',
        status='EXTRACTED',
        hotspots_json=[],
    )
    if created:
        db.add(asset)
    else:
        asset.parent_asset_id = parent.id
        asset.crop_box_json = box
        asset.rights_status = 'REVIEW_REQUIRED'
        asset.status = 'EXTRACTED'
        asset.alt_text = None
        asset.caption = None
        asset.hotspots_json = []

    asset.storage_key = main_saved['storage_key']
    asset.low_data_storage_key = low_saved['storage_key']
    asset.public_url = main_saved['public_url']
    asset.low_data_url = low_saved['public_url']
    asset.checksum = checksum
    asset.width = variants['width']
    asset.height = variants['height']
    db.commit()
    db.refresh(asset)
    return {
        'created': created,
        'unchanged': False,
        'asset': serialize_visual_asset(db, asset, include_private=True),
    }
