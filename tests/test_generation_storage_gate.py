from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    Book, Lesson, LessonSkill, LessonSourceLink, Skill,
    SourceChunk, SourceFile, SourcePackage, Unit,
)
import app.factory.generation_readiness as readiness


def _fixture(*, durable: bool):
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    db = Session(engine)
    book = Book(
        curriculum_version_id=1, grade_id=5, subject_id=4, semester=2,
        title='العلوم والحياة — الصف الخامس — الفصل الثاني',
        book_code=f'TEST.STORAGE.{"DURABLE" if durable else "LOCAL"}',
        edition='2026', status='DRAFT',
    )
    db.add(book); db.flush()
    unit = Unit(book_id=book.id, unit_number=4, title='أجهزة جسم الإنسان والجلد', order_no=1)
    db.add(unit); db.flush()
    lesson = Lesson(
        unit_id=unit.id, lesson_number=1,
        lesson_code=f'TEST.STORAGE.L01.{"D" if durable else "L"}',
        title='الجهاز الهيكلي', status='DRAFT',
    )
    db.add(lesson); db.flush()
    package = SourcePackage(book_id=book.id, package_code=f'TEST-STORAGE-{"D" if durable else "L"}')
    db.add(package); db.flush()
    skill = Skill(
        subject_id=4, skill_code=f'SK.TEST.STORAGE.{"D" if durable else "L"}',
        domain='HUMAN_BODY', name_ar='يفسر دور الجهاز الهيكلي', status='ACTIVE',
    )
    db.add(skill); db.flush()
    db.add(LessonSkill(lesson_id=lesson.id, skill_id=skill.id, relationship='TEACHES'))
    source = SourceFile(
        package_id=package.id,
        source_type='STUDENT_BOOK',
        edition='2026',
        reliability_score=100,
        edition_match_score=100,
        status='EXTRACTED',
        extracted_text='أجهزة جسم الإنسان والجلد — الجهاز الهيكلي',
        file_key='s3://pal-learning/test.pdf' if durable else '/tmp/test.pdf',
        extraction_meta={'durable_storage': durable},
    )
    db.add(source); db.flush()
    chunk = SourceChunk(
        source_file_id=source.id, chunk_index=0, page_number=1,
        text='أجهزة جسم الإنسان والجلد — الجهاز الهيكلي',
    )
    db.add(chunk); db.flush()
    db.add(LessonSourceLink(
        lesson_id=lesson.id, source_chunk_id=chunk.id,
        relation='TEACHING_SOURCE', confidence=1.0,
        source_method='TEST', status='VERIFIED',
    ))
    db.commit()
    return db, lesson


def test_local_source_is_allowed_for_local_sqlite_development(monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'LOCAL_MOCK')
    db, lesson = _fixture(durable=False)
    try:
        result = readiness.calculate_generation_readiness(db, lesson.id)
        assert result['queue_ready'] is True
        assert result['storage_gate']['production_database'] is False
        assert result['storage_gate']['all_factual_sources_durable'] is False
        assert 'NON_DURABLE_FACTUAL_SOURCE_STORAGE' not in result['blockers']
    finally:
        db.close()


def test_local_source_is_blocked_under_postgresql_semantics(monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'LOCAL_MOCK')
    monkeypatch.setattr(readiness, '_database_backend', lambda db: 'postgresql')
    db, lesson = _fixture(durable=False)
    try:
        result = readiness.calculate_generation_readiness(db, lesson.id)
        assert result['queue_ready'] is False
        assert result['storage_gate']['production_database'] is True
        assert 'NON_DURABLE_FACTUAL_SOURCE_STORAGE' in result['blockers']
        assert 'REIMPORT_FACTUAL_SOURCE_TO_DURABLE_OBJECT_STORAGE' in result['next_actions']
    finally:
        db.close()


def test_durable_source_passes_postgresql_storage_gate(monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'LOCAL_MOCK')
    monkeypatch.setattr(readiness, '_database_backend', lambda db: 'postgresql')
    db, lesson = _fixture(durable=True)
    try:
        result = readiness.calculate_generation_readiness(db, lesson.id)
        assert result['queue_ready'] is True
        assert result['storage_gate']['production_database'] is True
        assert result['storage_gate']['all_factual_sources_durable'] is True
        assert 'NON_DURABLE_FACTUAL_SOURCE_STORAGE' not in result['blockers']
    finally:
        db.close()
