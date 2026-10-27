import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.curriculum.router import get_lesson, lesson_questions, list_lessons
from app.db.base import Base
from app.db.models import Book, ContentBlock, Lesson, LessonSection, Question, Unit, User
from app.learning.router import _published_question_or_404


def _fixture():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    db = Session(engine)

    book = Book(
        curriculum_version_id=1,
        grade_id=5,
        subject_id=4,
        semester=2,
        title='العلوم والحياة — الصف الخامس — الفصل الثاني',
        book_code='PS.G05.SCI.S2.VISIBILITY',
        edition='test',
        status='DRAFT',
    )
    db.add(book); db.flush()
    unit = Unit(book_id=book.id, unit_number=4, title='أجهزة جسم الإنسان والجلد', order_no=1)
    db.add(unit); db.flush()
    lesson = Lesson(
        unit_id=unit.id,
        lesson_number=1,
        lesson_code='PS.G05.SCI.S2.VISIBILITY.L01',
        title='الجهاز الهيكلي',
        status='DRAFT',
        estimated_minutes=20,
    )
    db.add(lesson); db.flush()
    section = LessonSection(lesson_id=lesson.id, section_number=1, title='تمهيد', order_no=1)
    db.add(section); db.flush()
    block = ContentBlock(
        lesson_section_id=section.id,
        block_type='TEXT',
        content_json={'body':'محتوى مسودة'},
        order_no=1,
        version=1,
        status='DRAFT',
    )
    db.add(block)
    question = Question(
        lesson_id=lesson.id,
        question_code='PS.G05.SCI.S2.VISIBILITY.L01.Q01',
        question_type='MCQ',
        prompt='سؤال مسودة',
        options_json=['أ','ب'],
        correct_answer_json={'value':0},
        difficulty=0.4,
        purpose='PRACTICE',
        status='DRAFT',
    )
    db.add(question); db.commit()

    admin = User(email='admin@visibility.test', password_hash='x', role='ADMIN', status='ACTIVE')
    student = User(email='student@visibility.test', password_hash='x', role='STUDENT', status='ACTIVE')
    return db, unit, lesson, block, question, admin, student


def test_admin_can_preview_draft_but_student_cannot_discover_or_open_it():
    db, unit, lesson, _, _, admin, student = _fixture()
    try:
        admin_rows = list_lessons(unit.id, db, admin)
        assert [row['id'] for row in admin_rows] == [lesson.id]
        assert admin_rows[0]['status'] == 'DRAFT'

        assert list_lessons(unit.id, db, student) == []

        admin_preview = get_lesson(lesson.id, db, admin)
        assert admin_preview['status'] == 'DRAFT'
        assert admin_preview['sections'][0]['blocks'][0]['status'] == 'DRAFT'

        with pytest.raises(HTTPException) as exc:
            get_lesson(lesson.id, db, student)
        assert exc.value.status_code == 404

        with pytest.raises(HTTPException) as exc:
            lesson_questions(lesson.id, db, student)
        assert exc.value.status_code == 404
    finally:
        db.close()


def test_student_question_requires_both_published_question_and_published_lesson():
    db, _, lesson, _, question, _, _ = _fixture()
    try:
        with pytest.raises(HTTPException) as exc:
            _published_question_or_404(db, question.id)
        assert exc.value.status_code == 404

        question.status = 'PUBLISHED'
        db.commit()
        with pytest.raises(HTTPException) as exc:
            _published_question_or_404(db, question.id)
        assert exc.value.status_code == 404

        lesson.status = 'PUBLISHED'
        db.commit()
        visible = _published_question_or_404(db, question.id)
        assert visible.id == question.id
    finally:
        db.close()


def test_student_receives_only_published_blocks_after_release_state():
    db, _, lesson, block, _, _, student = _fixture()
    try:
        lesson.status = 'PUBLISHED'
        db.commit()

        result = get_lesson(lesson.id, db, student)
        assert result['sections'] == []

        block.status = 'PUBLISHED'
        db.commit()
        result = get_lesson(lesson.id, db, student)
        assert len(result['sections']) == 1
        assert len(result['sections'][0]['blocks']) == 1
        assert result['sections'][0]['blocks'][0]['status'] == 'PUBLISHED'
    finally:
        db.close()
