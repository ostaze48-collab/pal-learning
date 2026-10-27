import sys
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.db.base import Base
from app.db.models import Lesson, LessonSourceLink, SourceChunk, SourceFile
from app.db.visual_models import VisualAsset
from app.services.generation_packet import build_lesson_generation_packet
from app.services.visual_asset_pipeline import lesson_visual_source_pages


def _session():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    return Session()


def _seed_verified_page(db, *, link_status='VERIFIED', page=12):
    lesson = Lesson(
        unit_id=1,
        lesson_number=2,
        lesson_code=f'LESSON-{link_status}-{page}',
        title='الخلية وأنواعها',
        status='DRAFT',
    )
    db.add(lesson)
    db.flush()
    source = SourceFile(
        package_id=1,
        source_type='OFFICIAL_PACKAGE',
        file_key='/tmp/book.pdf',
        original_filename='كتاب العلوم والحياة.pdf',
        edition='2026',
        status='VERIFIED',
        extraction_meta={'durable_storage': True},
    )
    db.add(source)
    db.flush()
    chunk = SourceChunk(
        source_file_id=source.id,
        page_number=page,
        chunk_index=0,
        text='نص علمي موثق من صفحة الدرس',
    )
    db.add(chunk)
    db.flush()
    db.add(LessonSourceLink(
        lesson_id=lesson.id,
        source_chunk_id=chunk.id,
        relation='TEACHING_SOURCE',
        confidence=1.0,
        source_method='ADMIN',
        status=link_status,
    ))
    db.commit()
    return lesson, source, chunk


def test_visual_page_candidates_require_admin_verified_teaching_link():
    db = _session()
    lesson, source, _chunk = _seed_verified_page(db, link_status='VERIFIED', page=12)
    rows = lesson_visual_source_pages(db, lesson.id)
    assert [(row['source_file_id'], row['source_page']) for row in rows] == [(source.id, 12)]

    db2 = _session()
    lesson2, _source2, _chunk2 = _seed_verified_page(db2, link_status='CANDIDATE', page=12)
    assert lesson_visual_source_pages(db2, lesson2.id) == []


def test_generation_packet_includes_only_cleared_approved_visual_on_effective_source_page():
    db = _session()
    lesson, source, _chunk = _seed_verified_page(db, page=12)

    approved = VisualAsset(
        lesson_id=lesson.id,
        source_file_id=source.id,
        source_page=12,
        asset_kind='TEXTBOOK_PAGE_CROP',
        storage_key='s3://bucket/page12.png',
        public_url='https://cdn.example/page12.png',
        checksum='a' * 64,
        width=1200,
        height=1700,
        rights_status='CLEARED',
        status='APPROVED',
        alt_text='صفحة من الكتاب تعرض الشكل العلمي',
        caption='صفحة الدرس',
        hotspots_json=[],
    )
    unreviewed = VisualAsset(
        lesson_id=lesson.id,
        source_file_id=source.id,
        source_page=13,
        asset_kind='TEXTBOOK_PAGE_CROP',
        storage_key='s3://bucket/page13.png',
        public_url='https://cdn.example/page13.png',
        checksum='b' * 64,
        width=1200,
        height=1700,
        rights_status='REVIEW_REQUIRED',
        status='EXTRACTED',
        hotspots_json=[],
    )
    db.add_all([approved, unreviewed])
    db.commit()

    packet = build_lesson_generation_packet(db, lesson.id)
    assert packet['contract_version'] == 'lesson-generation-packet/v7'
    assert len(packet['visual_assets']) == 1
    assert packet['visual_assets'][0]['src'] == 'https://cdn.example/page12.png'
    assert packet['visual_assets'][0]['source_page'] == 12
    assert packet['visual_assets'][0]['rights_status'] == 'CLEARED'


def test_cleared_asset_on_page_not_in_effective_source_context_is_excluded():
    db = _session()
    lesson, source, _chunk = _seed_verified_page(db, page=12)
    db.add(VisualAsset(
        lesson_id=lesson.id,
        source_file_id=source.id,
        source_page=99,
        asset_kind='TEXTBOOK_PAGE_CROP',
        storage_key='s3://bucket/page99.png',
        public_url='https://cdn.example/page99.png',
        checksum='c' * 64,
        width=1200,
        height=1700,
        rights_status='CLEARED',
        status='APPROVED',
        alt_text='صفحة أخرى',
        hotspots_json=[],
    ))
    db.commit()

    packet = build_lesson_generation_packet(db, lesson.id)
    assert packet['visual_assets'] == []
