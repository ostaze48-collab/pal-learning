import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    Book,
    CurriculumVersion,
    Grade,
    Lesson,
    LessonSourceLink,
    SourceChunk,
    SourceFile,
    SourcePackage,
    Subject,
    Unit,
)
from app.factory.skill_mapping import queue_skill_mapping
from app.importer.source_link_review import verify_lesson_source_link


def _db():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    return Session(engine)


def _lesson_graph(db: Session, source_type='OFFICIAL_PACKAGE', link_status='VERIFIED_CANDIDATE'):
    cv = CurriculumVersion(country='Palestine', academic_year='2026', edition='current', status='ACTIVE')
    grade = Grade(code='G05', name_ar='الصف الخامس', order_no=5)
    subject = Subject(code='SCI', name_ar='العلوم والحياة', name_en='Science')
    db.add_all([cv, grade, subject]); db.flush()
    book = Book(
        curriculum_version_id=cv.id, grade_id=grade.id, subject_id=subject.id,
        semester=1, title='علوم خامس ف1', book_code=f'TEST.SOURCE.GATE.{source_type}.{link_status}',
        edition='2026 current', status='DRAFT'
    )
    db.add(book); db.flush()
    unit = Unit(book_id=book.id, unit_number=1, title='الخلية', order_no=1)
    db.add(unit); db.flush()
    lesson = Lesson(
        unit_id=unit.id, lesson_number=1,
        lesson_code=f'TEST.SOURCE.GATE.L1.{source_type}.{link_status}',
        title='المجهر واكتشاف الخلية', status='DRAFT'
    )
    db.add(lesson); db.flush()
    package = SourcePackage(book_id=book.id, package_code=f'TEST-SOURCE-GATE-{source_type}-{link_status}', status='INGESTING')
    db.add(package); db.flush()
    source = SourceFile(
        package_id=package.id, source_type=source_type, edition='2026 current',
        reliability_score=100, edition_match_score=90, status='EXTRACTED',
        extracted_text='المجهر واكتشاف الخلية', file_key='s3://test/source.pdf',
        extraction_meta={'durable_storage': True}
    )
    db.add(source); db.flush()
    chunk = SourceChunk(source_file_id=source.id, chunk_index=0, page_number=1, text='المجهر واكتشاف الخلية')
    db.add(chunk); db.flush()
    link = LessonSourceLink(
        lesson_id=lesson.id, source_chunk_id=chunk.id, relation='TEACHING_SOURCE',
        confidence=0.95, source_method='TEST', status=link_status
    )
    db.add(link); db.commit()
    return lesson, link


def test_verified_candidate_must_be_admin_verified_before_skill_mapping():
    db = _db()
    try:
        lesson, link = _lesson_graph(db, 'OFFICIAL_PACKAGE', 'VERIFIED_CANDIDATE')
        with pytest.raises(HTTPException) as exc:
            queue_skill_mapping(lesson.id, db)
        assert exc.value.status_code == 409
        assert exc.value.detail['message'] == 'Skill mapping requires admin-verified factual teaching-source links'

        result = verify_lesson_source_link(link.id, db)
        assert result['verified'] is True
        assert result['status'] == 'VERIFIED'

        queued = queue_skill_mapping(lesson.id, db)
        assert queued['status'] == 'QUEUED'
        assert queued['verified_teaching_source_required'] is True
        assert queued['source_chunks'] == 1
    finally:
        db.close()


def test_non_factual_source_cannot_be_admin_verified_as_teaching_source():
    db = _db()
    try:
        _, link = _lesson_graph(db, 'CURRICULUM_PLAN', 'VERIFIED_CANDIDATE')
        with pytest.raises(HTTPException) as exc:
            verify_lesson_source_link(link.id, db)
        assert exc.value.status_code == 409
        assert exc.value.detail['message'] == 'Source type is not authorized for factual grounding'
        db.refresh(link)
        assert link.status == 'VERIFIED_CANDIDATE'
    finally:
        db.close()
