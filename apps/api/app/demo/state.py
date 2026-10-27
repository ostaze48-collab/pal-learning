from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_student_profile
from ..db.demo_experiment import DEMO_LESSON_CODE, DEMO_STATUS, demo_enabled
from ..db.deps import get_db
from ..db.models import Lesson, Question, QuestionAttempt, StudentProfile

router = APIRouter(prefix='/demo', tags=['experimental-demo-state'])


@router.get('/session-state')
def demo_session_state(
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    if not demo_enabled():
        raise HTTPException(404, 'Experimental demo is disabled')

    lesson = db.query(Lesson).filter(
        Lesson.lesson_code == DEMO_LESSON_CODE,
        Lesson.status == DEMO_STATUS,
    ).first()
    if not lesson:
        raise HTTPException(503, 'Experimental lesson is not ready')

    questions = db.query(Question).filter(
        Question.lesson_id == lesson.id,
        Question.status == DEMO_STATUS,
    ).order_by(Question.id).all()

    rows = []
    for question in questions:
        attempt = db.query(QuestionAttempt).filter(
            QuestionAttempt.student_id == profile.id,
            QuestionAttempt.question_id == question.id,
        ).order_by(QuestionAttempt.attempt_number.desc(), QuestionAttempt.id.desc()).first()
        rows.append({
            'question_id': question.id,
            'answered': attempt is not None,
            'latest_attempt': ({
                'attempt_number': attempt.attempt_number,
                'answer': attempt.answer_json,
                'correct': bool(attempt.is_correct),
                'response_time_ms': attempt.response_time_ms,
                'used_hint': bool(attempt.used_hint),
                'used_ai_help': bool(attempt.used_ai_help),
                'created_at': attempt.created_at.isoformat() if attempt.created_at else None,
            } if attempt else None),
        })

    answered = sum(1 for row in rows if row['answered'])
    total = len(rows)
    return {
        'experimental': True,
        'lesson_id': lesson.id,
        'lesson_code': lesson.lesson_code,
        'answered_questions': answered,
        'total_questions': total,
        'remaining_questions': max(0, total - answered),
        'completed_questions': bool(total and answered >= total),
        'completion_percent': round((answered / total) * 100) if total else 0,
        'questions': rows,
    }
