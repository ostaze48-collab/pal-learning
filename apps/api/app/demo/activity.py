from __future__ import annotations

import random
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth.deps import require_student_profile
from ..db.demo_experiment import DEMO_LESSON_CODE, DEMO_STATUS, demo_enabled
from ..db.deps import get_db
from ..db.models import ContentBlock, LearningEvent, Lesson, LessonSection, StudentProfile

router = APIRouter(prefix='/demo', tags=['experimental-demo-activity'])


class MatchingAttempt(BaseModel):
    answers: dict[str, str] = Field(default_factory=dict)


def _matching_block(db: Session):
    if not demo_enabled():
        raise HTTPException(404, 'Experimental demo is disabled')
    lesson = db.query(Lesson).filter(
        Lesson.lesson_code == DEMO_LESSON_CODE,
        Lesson.status == DEMO_STATUS,
    ).first()
    if not lesson:
        raise HTTPException(503, 'Experimental lesson is not ready')
    block = (
        db.query(ContentBlock)
        .join(LessonSection, LessonSection.id == ContentBlock.lesson_section_id)
        .filter(
            LessonSection.lesson_id == lesson.id,
            ContentBlock.status == DEMO_STATUS,
            ContentBlock.block_type == 'MATCHING',
        )
        .order_by(ContentBlock.id)
        .first()
    )
    if not block:
        raise HTTPException(503, 'Experimental matching activity is not ready')
    pairs = (block.content_json or {}).get('pairs') or []
    pairs = [pair for pair in pairs if isinstance(pair, list) and len(pair) >= 2]
    if not pairs:
        raise HTTPException(503, 'Experimental matching activity has no pairs')
    return lesson, block, pairs


@router.get('/activity')
def get_matching_activity(
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    lesson, block, pairs = _matching_block(db)
    choices = [str(pair[1]) for pair in pairs]
    random.Random(block.id).shuffle(choices)
    content = block.content_json or {}
    return {
        'experimental': True,
        'activity_id': block.id,
        'lesson_code': lesson.lesson_code,
        'title': content.get('title') or 'نشاط المطابقة',
        'prompt': content.get('prompt') or 'طابق كل عنصر بما يناسبه.',
        'items': [{'id': str(index), 'label': str(pair[0])} for index, pair in enumerate(pairs)],
        'choices': choices,
        'total': len(pairs),
    }


@router.post('/activity/{activity_id}/check')
def check_matching_activity(
    activity_id: int,
    payload: MatchingAttempt,
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    lesson, block, pairs = _matching_block(db)
    if block.id != activity_id:
        raise HTTPException(404, 'Activity not found in the experimental lesson')

    results = []
    correct_count = 0
    for index, pair in enumerate(pairs):
        key = str(index)
        expected = str(pair[1])
        selected = payload.answers.get(key)
        correct = selected == expected
        if correct:
            correct_count += 1
        results.append({
            'item_id': key,
            'label': str(pair[0]),
            'selected': selected,
            'correct': correct,
            'correct_answer': expected if not correct else None,
        })

    total = len(pairs)
    percent = round((correct_count / total) * 100) if total else 0
    db.add(LearningEvent(
        event_uuid=str(uuid4()),
        student_id=profile.id,
        event_type='ACTIVITY_COMPLETED',
        lesson_id=lesson.id,
        content_block_id=block.id,
        metadata_json={
            'experimental_demo': True,
            'activity_type': 'MATCHING',
            'score': correct_count,
            'total': total,
            'percent': percent,
        },
    ))
    db.commit()

    return {
        'experimental': True,
        'activity_id': block.id,
        'score': correct_count,
        'total': total,
        'percent': percent,
        'passed': correct_count == total,
        'results': results,
    }
