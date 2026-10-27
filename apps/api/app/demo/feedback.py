from __future__ import annotations

from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth.deps import require_student_profile
from ..db.demo_experiment import DEMO_LESSON_CODE, DEMO_STATUS, demo_enabled
from ..db.deps import get_db
from ..db.models import LearningEvent, Lesson, StudentProfile

router = APIRouter(prefix='/demo', tags=['experimental-demo-feedback'])

FeedbackCategory = Literal[
    'WRONG_INFORMATION',
    'WRONG_ANSWER',
    'UNCLEAR_EXPLANATION',
    'TOO_DIFFICULT',
    'LANGUAGE_ERROR',
    'TECHNICAL_ISSUE',
    'OTHER',
]


class FeedbackPayload(BaseModel):
    category: FeedbackCategory
    message: str = Field(min_length=3, max_length=1200)
    context: str | None = Field(default=None, max_length=200)


@router.post('/feedback')
def submit_demo_feedback(
    payload: FeedbackPayload,
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

    event = LearningEvent(
        event_uuid=str(uuid4()),
        student_id=profile.id,
        event_type='BETA_FEEDBACK',
        lesson_id=lesson.id,
        metadata_json={
            'category': payload.category,
            'message': payload.message.strip(),
            'context': (payload.context or '').strip() or None,
            'experimental_demo': True,
        },
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return {
        'submitted': True,
        'feedback_id': event.id,
        'category': payload.category,
        'message': 'شكرًا. تم إرسال ملاحظتك إلى لوحة إدارة النسخة التجريبية.',
    }
