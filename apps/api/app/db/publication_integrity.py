from __future__ import annotations

from sqlalchemy.orm import Session

from .models import Book, ContentBlock, Lesson, LessonSection, Question, Unit


PROTECTED_DEMO_BOOK_CODES = ('PS.G05.SCI.S2',)


def quarantine_unreleased_demo_content(db: Session) -> dict:
    """Keep seeded/prototype curriculum out of the live publication state.

    The current system deliberately has no audited release transaction yet. Seeded
    content exists to exercise diagnostics, content generation, staging and QA, but
    must not be represented as production-published curriculum merely because a
    demo row used PUBLISHED historically.

    Once a real release transaction is implemented, that transaction becomes the
    only code path allowed to promote a reviewed snapshot into live lesson rows.
    """
    lessons_changed = 0
    blocks_changed = 0
    questions_changed = 0

    books = db.query(Book).filter(Book.book_code.in_(PROTECTED_DEMO_BOOK_CODES)).all()
    if not books:
        return {
            'books_checked': 0,
            'lessons_changed': 0,
            'blocks_changed': 0,
            'questions_changed': 0,
        }

    book_ids = [book.id for book in books]
    # Models intentionally do not expose relationship properties; query IDs in
    # small explicit steps so the integrity rule is transparent and testable.
    unit_ids = [row.id for row in db.query(Unit).filter(Unit.book_id.in_(book_ids)).all()]
    lesson_rows = db.query(Lesson).filter(Lesson.unit_id.in_(unit_ids)).all() if unit_ids else []
    lesson_ids = [row.id for row in lesson_rows]

    for lesson in lesson_rows:
        if lesson.status != 'DRAFT':
            lesson.status = 'DRAFT'
            lessons_changed += 1

    if lesson_ids:
        section_ids = [
            row.id
            for row in db.query(LessonSection).filter(LessonSection.lesson_id.in_(lesson_ids)).all()
        ]
        if section_ids:
            for block in db.query(ContentBlock).filter(ContentBlock.lesson_section_id.in_(section_ids)).all():
                if block.status != 'DRAFT':
                    block.status = 'DRAFT'
                    blocks_changed += 1
        for question in db.query(Question).filter(Question.lesson_id.in_(lesson_ids)).all():
            if question.status != 'DRAFT':
                question.status = 'DRAFT'
                questions_changed += 1

    if lessons_changed or blocks_changed or questions_changed:
        db.commit()

    return {
        'books_checked': len(books),
        'lessons_changed': lessons_changed,
        'blocks_changed': blocks_changed,
        'questions_changed': questions_changed,
    }
