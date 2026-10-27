import pytest
from pydantic import ValidationError

from app.schemas.factory import GeneratedBlock


def _image_content(**overrides):
    content = {
        'src': '/assets/science/g5/cell.png',
        'alt_text': 'رسم يوضح خلية مع أجزائها الأساسية',
        'caption': 'رسم تعليمي مرتبط بالكتاب',
        'source_label': 'كتاب العلوم والحياة - الصف الخامس',
        'source_page': 12,
        'asset_kind': 'TEXTBOOK_FIGURE',
        'rights_status': 'CLEARED',
        'hotspots': [
            {'id': 'part-1', 'x': 50, 'y': 40, 'label': 'جزء 1', 'description': 'شرح مختصر'},
        ],
    }
    content.update(overrides)
    return content


def test_image_block_accepts_provenance_and_hotspots():
    block = GeneratedBlock(
        block_type='IMAGE',
        title='لاحظ الشكل',
        content=_image_content(),
        source_chunk_ids=[10],
    )
    assert block.content['source_page'] == 12
    assert block.content['asset_kind'] == 'TEXTBOOK_FIGURE'


def test_image_block_rejects_missing_source_page():
    with pytest.raises(ValidationError, match='source_page'):
        GeneratedBlock(
            block_type='IMAGE',
            content=_image_content(source_page=None),
            source_chunk_ids=[10],
        )


def test_image_block_rejects_out_of_bounds_hotspot():
    with pytest.raises(ValidationError, match='hotspot.x'):
        GeneratedBlock(
            block_type='IMAGE',
            content=_image_content(hotspots=[{'id': 'bad', 'x': 140, 'y': 20, 'label': 'خارج الصورة'}]),
            source_chunk_ids=[10],
        )


def test_redraw_required_can_omit_original_src():
    block = GeneratedBlock(
        block_type='IMAGE',
        content=_image_content(src=None, rights_status='REDRAW_REQUIRED', asset_kind='REDRAWN_DIAGRAM'),
        source_chunk_ids=[10],
    )
    assert block.content['rights_status'] == 'REDRAW_REQUIRED'


def test_uncleared_original_cannot_omit_src_unless_redraw_required():
    with pytest.raises(ValidationError, match='content.src'):
        GeneratedBlock(
            block_type='IMAGE',
            content=_image_content(src=None, rights_status='REVIEW_REQUIRED'),
            source_chunk_ids=[10],
        )
