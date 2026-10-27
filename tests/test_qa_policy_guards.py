import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    Book,
    ContentBlock,
    Lesson,
    LessonSection,
    LessonSourceLink,
    SourceChunk,
    SourceFile,
    SourcePackage,
    Unit,
)
from app.qa.router import calculate_lesson_qa, publish_lesson
from app.services.solution_alignment import align_questions


def _db_with_lesson():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    db = Session(engine)
    book = Book(
        curriculum_version_id=1,
        grade_id=5,
        subject_id=4,
        semester=2,
        title='العلوم والحياة — الصف الخامس — الفصل الثاني',
        book_code='PS.G05.SCI.S2.QA.GUARD',
        edition='2026/latest-to-verify',
        status='DRAFT',
    )
    db.add(book); db.flush()
    unit = Unit(book_id=book.id, unit_number=4, title='أجهزة جسم الإنسان والجلد', order_no=1)
    db.add(unit); db.flush()
    lesson = Lesson(
        unit_id=unit.id,
        lesson_number=1,
        lesson_code='PS.G05.SCI.S2.QA.GUARD.L01',
        title='الجهاز الهيكلي',
        status='DRAFT',
    )
    db.add(lesson); db.flush()
    package = SourcePackage(book_id=book.id, package_code='PS-G05-SCI-S2-QA-GUARD', status='INGESTING')
    db.add(package); db.flush()
    return db, lesson, package


def test_legacy_publish_route_is_fail_closed():
    db, lesson, _ = _db_with_lesson()
    try:
        with pytest.raises(HTTPException) as exc:
            publish_lesson(lesson.id, db)
        assert exc.value.status_code == 409
        assert exc.value.detail['publication_authorized'] is False
        assert 'AUDITED_RELEASE_TRANSACTION_NOT_IMPLEMENTED' in exc.value.detail['required_flow']
        db.refresh(lesson)
        assert lesson.status == 'DRAFT'
    finally:
        db.close()


def test_curriculum_plan_does_not_count_as_factual_lesson_provenance():
    db, lesson, package = _db_with_lesson()
    try:
        section = LessonSection(lesson_id=lesson.id, section_number=1, title='تمهيد', order_no=1)
        db.add(section); db.flush()
        db.add(ContentBlock(
            lesson_section_id=section.id,
            block_type='TEXT',
            content_json={'body': 'نص تجريبي'},
            order_no=1,
            version=1,
            status='DRAFT',
        ))
        plan = SourceFile(
            package_id=package.id,
            source_type='CURRICULUM_PLAN',
            edition='2025/2026 emergency plan',
            reliability_score=100,
            edition_match_score=100,
            status='EXTRACTED',
            extracted_text='أجهزة جسم الإنسان والجلد — الجهاز الهيكلي',
        )
        db.add(plan); db.flush()
        chunk = SourceChunk(source_file_id=plan.id, chunk_index=0, page_number=1, text=plan.extracted_text)
        db.add(chunk); db.flush()
        db.add(LessonSourceLink(
            lesson_id=lesson.id,
            source_chunk_id=chunk.id,
            relation='CURRENT_SCOPE_EVIDENCE',
            confidence=1.0,
            source_method='TEST',
            status='VERIFIED',
        ))
        db.commit()

        qa = calculate_lesson_qa(db, lesson.id)
        assert qa['source_alignment_score'] == 25.0
        assert qa['details']['lesson_source_links'] == 1
        assert qa['details']['authorized_factual_lesson_source_links'] == 0
    finally:
        db.close()


def test_solution_alignment_preserves_exact_source_file_id():
    prompts = ['ما وظيفة الجمجمة؟', 'ما وظيفة القفص الصدري؟']
    items = [
        {'question': 'ما وظيفة الجمجمة؟', 'answer': 'تحمي الدماغ', 'source_file_id': 11, 'line': 2, 'answer_line': 3},
        {'question': 'ما وظيفة القفص الصدري؟', 'answer': 'يحمي القلب والرئتين', 'source_file_id': 22, 'line': 8, 'answer_line': 9},
    ]
    result = align_questions(prompts, items, threshold=0.5)
    assert result[0]['matched'] is True
    assert result[0]['source_file_id'] == 11
    assert result[1]['matched'] is True
    assert result[1]['source_file_id'] == 22
