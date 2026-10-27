from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    Book, ContentBlock, Lesson, LessonSection, LessonSourceLink,
    SourceChunk, SourceFile, SourcePackage, Unit,
)
from app.qa.router import calculate_lesson_qa, publish_lesson
from app.services.solution_alignment import align_questions


def _lesson_db():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    db = Session(engine)
    book = Book(
        curriculum_version_id=1,
        grade_id=5,
        subject_id=4,
        semester=2,
        title='علوم خامس فصل ثان',
        book_code='TEST.QA.BOOK',
        edition='2026/latest-to-verify',
        status='DRAFT',
    )
    db.add(book); db.flush()
    unit = Unit(book_id=book.id, unit_number=4, title='أجهزة جسم الإنسان والجلد', order_no=1)
    db.add(unit); db.flush()
    lesson = Lesson(
        unit_id=unit.id,
        lesson_number=1,
        lesson_code='TEST.QA.L01',
        title='الجهاز الهيكلي',
        status='DRAFT',
    )
    db.add(lesson); db.flush()
    section = LessonSection(lesson_id=lesson.id, section_number=1, title='مقدمة', order_no=1)
    db.add(section); db.flush()
    db.add(ContentBlock(
        lesson_section_id=section.id,
        block_type='TEXT',
        content_json={'body': 'نص تجريبي'},
        order_no=1,
        status='DRAFT',
        source_refs=None,
    ))
    package = SourcePackage(book_id=book.id, package_code='TEST-QA-PACKAGE', status='INGESTING')
    db.add(package); db.commit()
    return db, lesson, package


def test_curriculum_plan_cannot_raise_factual_source_alignment():
    db, lesson, package = _lesson_db()
    try:
        plan = SourceFile(
            package_id=package.id,
            source_type='CURRICULUM_PLAN',
            edition='2025/2026 emergency plan',
            reliability_score=100,
            edition_match_score=100,
            status='EXTRACTED',
            extracted_text='الوحدة الرابعة أجهزة جسم الإنسان والجلد — الجهاز الهيكلي',
        )
        db.add(plan); db.flush()
        chunk = SourceChunk(
            source_file_id=plan.id,
            page_number=1,
            chunk_index=0,
            text='الوحدة الرابعة أجهزة جسم الإنسان والجلد — الجهاز الهيكلي',
        )
        db.add(chunk); db.flush()
        # Deliberately malformed relation: policy must still refuse it as factual grounding.
        db.add(LessonSourceLink(
            lesson_id=lesson.id,
            source_chunk_id=chunk.id,
            relation='TEACHING_SOURCE',
            confidence=1.0,
            source_method='TEST_MALFORMED_LINK',
            status='VERIFIED',
        ))
        db.commit()

        qa = calculate_lesson_qa(db, lesson.id)
        assert qa['details']['lesson_source_links'] == 1
        assert qa['details']['authorized_factual_lesson_source_links'] == 0
        assert qa['source_alignment_score'] == 25.0
    finally:
        db.close()


def test_legacy_direct_publish_route_is_fail_closed():
    db, lesson, _ = _lesson_db()
    try:
        try:
            publish_lesson(lesson.id, db)
            assert False, 'Direct publication must never succeed'
        except HTTPException as exc:
            assert exc.status_code == 409
            assert exc.detail['publication_authorized'] is False
            assert 'AUDITED_RELEASE_TRANSACTION_NOT_IMPLEMENTED' in exc.detail['required_flow']
        db.refresh(lesson)
        assert lesson.status == 'DRAFT'
    finally:
        db.close()


def test_solution_alignment_preserves_the_actual_source_file_id():
    question = 'ما العضو الذي تساعد الجمجمة على حمايته؟'
    items = [
        {
            'question': 'ما وظيفة القلب؟',
            'answer': 'ضخ الدم',
            'source_file_id': 11,
        },
        {
            'question': question,
            'answer': 'الدماغ',
            'source_file_id': 22,
        },
    ]
    result = align_questions([question], items, threshold=0.36)[0]
    assert result['matched'] is True
    assert result['reference_answer'] == 'الدماغ'
    assert result['source_file_id'] == 22
