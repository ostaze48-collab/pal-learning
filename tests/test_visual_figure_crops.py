from io import BytesIO

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.visual_models import VisualAsset
from app.services import visual_crop_service
from app.services.visual_asset_pipeline import generation_visual_assets


def _png_bytes(width=1000, height=1400):
    from PIL import Image, ImageDraw
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    draw.rectangle((200, 300, 800, 1000), outline='black', width=8)
    buffer = BytesIO()
    image.save(buffer, format='PNG')
    return buffer.getvalue()


def _db_with_parent():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    db = Session(engine)
    parent = VisualAsset(
        lesson_id=1,
        source_file_id=10,
        source_page=12,
        asset_kind='TEXTBOOK_PAGE_CROP',
        region_key='full-page',
        storage_key='s3://bucket/page12.png',
        public_url='https://cdn.example/page12.png',
        checksum='a' * 64,
        width=1000,
        height=1400,
        rights_status='CLEARED',
        status='APPROVED',
        alt_text='صفحة كاملة من الكتاب',
        hotspots_json=[],
    )
    db.add(parent)
    db.commit(); db.refresh(parent)
    return db, parent


def test_crop_service_creates_review_required_figure(monkeypatch):
    db, parent = _db_with_parent()
    image_bytes = _png_bytes()
    monkeypatch.setattr(visual_crop_service, 'read_storage_bytes', lambda _key: image_bytes)

    def fake_persist(**kwargs):
        variant = kwargs['variant']
        ext = kwargs['extension']
        return {
            'storage_key': f's3://bucket/{variant}.{ext}',
            'public_url': f'https://cdn.example/{variant}.{ext}',
            'durable': True,
        }
    monkeypatch.setattr(visual_crop_service, 'persist_visual_asset_bytes', fake_persist)

    result = visual_crop_service.create_or_refresh_figure_crop(
        db, parent.id, {'x': 20, 'y': 20, 'width': 60, 'height': 55}
    )
    assert result['created'] is True
    asset = result['asset']
    assert asset['asset_kind'] == 'TEXTBOOK_FIGURE'
    assert asset['parent_asset_id'] == parent.id
    assert asset['rights_status'] == 'REVIEW_REQUIRED'
    assert asset['crop_box'] == {'x': 20.0, 'y': 20.0, 'width': 60.0, 'height': 55.0}
    assert asset['width'] == 600
    assert asset['height'] == 770
    assert asset['src'].endswith('.png')
    assert asset['low_data_src'].endswith('.webp')


def test_same_crop_is_idempotent_and_second_crop_is_distinct(monkeypatch):
    db, parent = _db_with_parent()
    image_bytes = _png_bytes()
    monkeypatch.setattr(visual_crop_service, 'read_storage_bytes', lambda _key: image_bytes)
    monkeypatch.setattr(visual_crop_service, 'persist_visual_asset_bytes', lambda **kwargs: {
        'storage_key': f"s3://bucket/{kwargs['variant']}.{kwargs['extension']}",
        'public_url': f"https://cdn.example/{kwargs['variant']}.{kwargs['extension']}",
        'durable': True,
    })

    first = visual_crop_service.create_or_refresh_figure_crop(db, parent.id, {'x': 10, 'y': 10, 'width': 40, 'height': 40})
    again = visual_crop_service.create_or_refresh_figure_crop(db, parent.id, {'x': 10, 'y': 10, 'width': 40, 'height': 40})
    second = visual_crop_service.create_or_refresh_figure_crop(db, parent.id, {'x': 50, 'y': 50, 'width': 40, 'height': 40})

    assert first['created'] is True
    assert again['unchanged'] is True
    assert again['asset']['id'] == first['asset']['id']
    assert second['created'] is True
    assert second['asset']['region_key'] != first['asset']['region_key']
    assert db.query(VisualAsset).filter(VisualAsset.asset_kind == 'TEXTBOOK_FIGURE').count() == 2


def test_generation_prefers_cleared_figures_over_full_page():
    db, parent = _db_with_parent()
    figure = VisualAsset(
        lesson_id=1,
        source_file_id=10,
        source_page=12,
        parent_asset_id=parent.id,
        asset_kind='TEXTBOOK_FIGURE',
        region_key='crop-figure1',
        crop_box_json={'x': 20, 'y': 20, 'width': 60, 'height': 50},
        storage_key='s3://bucket/figure.png',
        public_url='https://cdn.example/figure.png',
        checksum='b' * 64,
        width=600,
        height=700,
        rights_status='CLEARED',
        status='APPROVED',
        alt_text='شكل علمي مقصوص',
        hotspots_json=[],
    )
    db.add(figure); db.commit()

    assets = generation_visual_assets(db, 1, {(10, 12)})
    assert len(assets) == 1
    assert assets[0]['asset_kind'] == 'TEXTBOOK_FIGURE'
    assert assets[0]['src'] == 'https://cdn.example/figure.png'


def test_crop_rejects_rectangle_outside_page():
    try:
        visual_crop_service._normalized_box({'x': 80, 'y': 10, 'width': 30, 'height': 20})
    except ValueError as exc:
        assert 'inside the source page' in str(exc)
    else:
        raise AssertionError('Expected crop outside source page to be rejected')
