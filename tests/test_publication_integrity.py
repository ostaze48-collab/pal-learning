from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import Book, ContentBlock, Lesson, LessonSection, Question, Unit
from app.db.publication_integrity import quarantine_unreleased_demo_content


def test_unreleased_demo_book_is_forced_back_to_draft():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)

    with Session(engine) as db:
        book = Book(
            curriculum_version_id=1,
            grade_id=5,
            subject_id=4,
            semester=2,
            title='العلوم والحياة — الصف الخامس — الفصل الثاني',
            book_code='PS.G05.SCI.S2',
            edition='demo',
            status='DRAFT',
        )
        db.add(book); db.flush()
        unit = Unit(book_id=book.id, unit_number=4, title='أجهزة جسم الإنسان والجلد', order_no=1)
        db.add(unit); db.flush()
        lesson = Lesson(
            unit_id=unit.id,
            lesson_number=1,
            lesson_code='PS.G05.SCI.S2.U04.L01',
            title='الجهاز الهيكلي',
            status='PUBLISHED',
        )
        db.add(lesson); db.flush()
        section = LessonSection(lesson_id=lesson.id, section_number=1, title='فكرة أساسية', order_no=1)
        db.add(section); db.flush()
        block = ContentBlock(
            lesson_section_id=section.id,
            block_type='TEXT',
            content_json={'body': 'demo'},
            order_no=1,
            version=1,
            status='PUBLISHED',
        )
        question = Question(
            lesson_id=lesson.id,
            question_code='DEMO.Q1',
            question_type='MCQ',
            prompt='demo?',
            options_json=['a', 'b'],
            correct_answer_json={'value': 0},
            status='PUBLISHED',
        )
        db.add_all([block, question]); db.commit()

        result = quarantine_unreleased_demo_content(db)
        db.refresh(lesson); db.refresh(block); db.refresh(question)

        assert result['books_checked'] == 1
        assert result['lessons_changed'] == 1
        assert result['blocks_changed'] == 1
        assert result['questions_changed'] == 1
        assert lesson.status == 'DRAFT'
        assert block.status == 'DRAFT'
        assert question.status == 'DRAFT'
