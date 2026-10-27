from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db.demo_experiment import DEMO_LESSON_CODE, DEMO_STATUS, demo_enabled
from ..db.deps import get_db
from ..db.models import ContentBlock, Lesson, LessonSection, LessonSkill, Question

router = APIRouter(prefix='/demo', tags=['experimental-demo'])


@router.get('/health')
def demo_health(db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.lesson_code == DEMO_LESSON_CODE).first()
    lesson_id = lesson.id if lesson else None
    sections = db.query(LessonSection).filter(LessonSection.lesson_id == lesson_id).all() if lesson_id else []
    section_ids = [row.id for row in sections]
    blocks = db.query(ContentBlock).filter(
        ContentBlock.lesson_section_id.in_(section_ids),
        ContentBlock.status == DEMO_STATUS,
    ).all() if section_ids else []
    questions = db.query(Question).filter(
        Question.lesson_id == lesson_id,
        Question.status == DEMO_STATUS,
    ).all() if lesson_id else []
    skills = db.query(LessonSkill).filter(LessonSkill.lesson_id == lesson_id).all() if lesson_id else []

    checks = {
        'experimental_demo_enabled': demo_enabled(),
        'single_target_lesson_exists': lesson is not None,
        'target_lesson_is_beta': bool(lesson and lesson.status == DEMO_STATUS),
        'seven_learning_sections': len(sections) == 7,
        'interactive_blocks_present': len(blocks) >= 7,
        'five_demo_questions': len(questions) == 5,
        'four_demo_skills': len(skills) >= 4,
    }
    return {
        'ready': all(checks.values()),
        'scope': 'single-lesson-beta',
        'lesson_code': DEMO_LESSON_CODE,
        'checks': checks,
        'counts': {
            'sections': len(sections),
            'blocks': len(blocks),
            'questions': len(questions),
            'skills': len(skills),
        },
        'status': lesson.status if lesson else None,
    }
