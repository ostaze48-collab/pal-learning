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
    Question,
    ReferenceAnswer,
    SourceChunk,
    SourceFile,
    SourcePackage,
    Unit,
)
from app.qa.router import align_solution_source, calculate_lesson_qa, publish_lesson


def _db():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    return Session(engine)


def _lesson_graph(db: Session):
    book = Book(
        curriculum_version_id=1,
        grade_id=5,
        subject_id=4,
        semester=2,
        title='العلوم والحياة — الصف الخامس — الفصل الثاني',
        book_code='PS.G05.SCI.S2.TEST.QA',
        edition='2026/latest-to-verify',
        status='DRAFT',
    )
    db.add(book); db.flush()
    package = SourcePackage(
        book_id=book.id,
        package_code='PS-G05-SCI-S2-TEST-QA',
        status='INGESTING',
    )
    db.add(package); db.flush()
    unit = Unit(book_id=book.id, unit_number=4, title='أجهزة جسم الإنسان والجلد', order_no=1)
    db.add(unit); db.flush()
    lesson = Lesson(
        unit_id=unit.id,
        lesson_number=1,
        lesson_code='PS.G05.SCI.S2.U04.L01.TEST.QA',
        title='الجهاز الهيكلي',
        status='DRAFT',
    )
    db.add(lesson); db.flush()
    return book, package, lesson


def test_curriculum_plan_does_not_count_as_factual_source_alignment():
    db = _db()
    try:
        _, package, lesson = _lesson_graph(db)
        section = LessonSection(lesson_id=lesson.id, section_number=1, title='مقدمة', order_no=1)
        db.add(section); db.flush()
        db.add(ContentBlock(
            lesson_section_id=section.id,
            block_type='TEXT',
            content_json={'text': 'محتوى تجريبي'},
            order_no=1,
            status='DRAFT',
            source_refs=None,
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
        chunk = SourceChunk(
            source_file_id=plan.id,
            chunk_index=0,
            page_number=1,
            text='أجهزة جسم الإنسان والجلد — الجهاز الهيكلي',
        )
        db.add(chunk); db.flush()
        db.add(LessonSourceLink(
            lesson_id=lesson.id,
            source_chunk_id=chunk.id,
            relation='TEACHING_SOURCE',  # deliberately wrong relation to test fail-closed policy
            confidence=1.0,
            source_method='TEST',
            status='VERIFIED',
        ))
        db.commit()

        result = calculate_lesson_qa(db, lesson.id)
        assert result['source_alignment_score'] == 25
        assert result['details']['lesson_source_links'] == 1
        assert result['details']['authorized_factual_lesson_source_links'] == 0
    finally:
        db.close()


def test_solution_alignment_persists_the_actual_matching_solution_file():
    db = _db()
    try:
        _, package, lesson = _lesson_graph(db)
        first = SourceFile(
            package_id=package.id,
            source_type='SOLUTIONS',
            edition='2020',
            reliability_score=80,
            edition_match_score=0,
            status='EXTRACTED',
            extracted_text='سؤال: سؤال مختلف تماما\nجواب: إجابة مختلفة',
        )
        second = SourceFile(
            package_id=package.id,
            source_type='SOLUTIONS',
            edition='2020',
            reliability_score=80,
            edition_match_score=0,
            status='EXTRACTED',
            extracted_text='سؤال: ما وظيفة الجمجمة؟\nجواب: حماية الدماغ',
        )
        db.add_all([first, second]); db.flush()
        question = Question(
            lesson_id=lesson.id,
            question_code='PS.G05.SCI.S2.U04.L01.Q.TEST.SOLUTION.FILE',
            question_type='SHORT',
            prompt='ما وظيفة الجمجمة؟',
            correct_answer_json='حماية الدماغ',
            difficulty=0.4,
            purpose='PRACTICE',
            status='DRAFT',
        )
        db.add(question); db.commit()

        result = align_solution_source(package.id, db)
        assert result['answer_validation_source_policy_enforced'] is True
        ref = db.query(ReferenceAnswer).filter(ReferenceAnswer.question_id == question.id).one()
        assert ref.source_file_id == second.id
        assert ref.source_file_id != first.id
        assert ref.validation_status == 'VERIFIED_MATCH'
    finally:
        db.close()


def test_legacy_direct_publish_route_is_fail_closed():
    db = _db()
    try:
        _, _, lesson = _lesson_graph(db)
        db.commit()
        with pytest.raises(HTTPException) as exc:
            publish_lesson(lesson.id, db)
        assert exc.value.status_code == 409
        assert exc.value.detail['publication_authorized'] is False
        assert exc.value.detail['message'] == 'Direct lesson publication is disabled'
        db.refresh(lesson)
        assert lesson.status == 'DRAFT'
    finally:
        db.close()
