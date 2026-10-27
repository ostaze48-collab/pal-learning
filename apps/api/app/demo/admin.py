from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import distinct, func
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.demo_experiment import DEMO_LESSON_CODE, DEMO_STATUS, demo_enabled
from ..db.deps import get_db
from ..db.models import (
    LearningEvent,
    Lesson,
    LessonSkill,
    Question,
    QuestionAttempt,
    StudentProfile,
    StudentSkillMastery,
)

router = APIRouter(
    prefix='/demo/admin',
    tags=['experimental-demo-admin'],
    dependencies=[Depends(require_admin)],
)


@router.get('/dashboard')
def demo_admin_dashboard(db: Session = Depends(get_db)):
    if not demo_enabled():
        raise HTTPException(404, 'Experimental demo is disabled')

    lesson = db.query(Lesson).filter(Lesson.lesson_code == DEMO_LESSON_CODE).first()
    if not lesson:
        raise HTTPException(503, 'Experimental lesson is not ready')

    questions = db.query(Question).filter(
        Question.lesson_id == lesson.id,
        Question.status == DEMO_STATUS,
    ).all()
    question_ids = [row.id for row in questions]

    attempts_query = db.query(QuestionAttempt).filter(QuestionAttempt.question_id.in_(question_ids)) if question_ids else None
    attempts = attempts_query.count() if attempts_query is not None else 0
    correct = attempts_query.filter(QuestionAttempt.is_correct.is_(True)).count() if attempts_query is not None else 0

    attempted_students = (
        db.query(func.count(distinct(QuestionAttempt.student_id)))
        .filter(QuestionAttempt.question_id.in_(question_ids))
        .scalar()
        if question_ids else 0
    ) or 0

    lesson_starts = db.query(LearningEvent).filter(
        LearningEvent.lesson_id == lesson.id,
        LearningEvent.event_type == 'LESSON_STARTED',
    ).count()
    tutor_requests = db.query(LearningEvent).filter(
        LearningEvent.lesson_id == lesson.id,
        LearningEvent.event_type == 'AI_HELP_REQUESTED',
    ).count()

    skill_ids = [row.skill_id for row in db.query(LessonSkill).filter(LessonSkill.lesson_id == lesson.id).all()]
    mastery_rows = (
        db.query(StudentSkillMastery)
        .filter(StudentSkillMastery.skill_id.in_(skill_ids))
        .all()
        if skill_ids else []
    )
    assessed_rows = [row for row in mastery_rows if (row.evidence_count or 0) > 0]
    avg_mastery = (
        round(sum(float(row.mastery_score or 0) for row in assessed_rows) / len(assessed_rows) * 100, 1)
        if assessed_rows else 0.0
    )
    mastered_rows = sum(1 for row in assessed_rows if row.status in {'MASTERED', 'STABLE'})
    needs_support_rows = sum(1 for row in assessed_rows if row.status in {'NEEDS_SUPPORT', 'EMERGING'})

    completed_students = 0
    if question_ids:
        rows = (
            db.query(QuestionAttempt.student_id, func.count(distinct(QuestionAttempt.question_id)))
            .filter(QuestionAttempt.question_id.in_(question_ids))
            .group_by(QuestionAttempt.student_id)
            .all()
        )
        completed_students = sum(1 for _, answered_count in rows if answered_count >= len(question_ids))

    registered_students = db.query(StudentProfile).count()
    completion_rate = round((completed_students / attempted_students) * 100, 1) if attempted_students else 0.0
    correct_rate = round((correct / attempts) * 100, 1) if attempts else 0.0

    return {
        'experimental': True,
        'scope': 'single-lesson-beta',
        'lesson': {
            'id': lesson.id,
            'lesson_code': lesson.lesson_code,
            'title': lesson.title,
            'status': lesson.status,
            'questions': len(question_ids),
            'skills': len(skill_ids),
        },
        'students': {
            'registered': registered_students,
            'attempted_lesson': attempted_students,
            'completed_all_questions': completed_students,
            'completion_rate_percent': completion_rate,
        },
        'learning': {
            'lesson_starts': lesson_starts,
            'question_attempts': attempts,
            'correct_answers': correct,
            'correct_rate_percent': correct_rate,
            'average_mastery_percent': avg_mastery,
            'mastered_skill_rows': mastered_rows,
            'needs_support_rows': needs_support_rows,
        },
        'ai_tutor': {
            'requests': tutor_requests,
            'mode': 'GROUNDED_DEMO_TUTOR',
        },
        'release_policy': {
            'student_content_status': DEMO_STATUS,
            'uses_production_publish_state': False,
            'scope_locked_to_one_lesson': True,
        },
    }
