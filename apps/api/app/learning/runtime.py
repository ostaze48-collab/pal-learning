from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_student_profile
from ..db.deps import get_db
from ..db.models import (
    Book,
    ContentBlock,
    LearningEvent,
    Lesson,
    LessonSection,
    LessonSkill,
    Question,
    QuestionAttempt,
    QuestionSkill,
    Skill,
    StudentProfile,
    StudentSkillMastery,
    Unit,
)

router = APIRouter(prefix='/learning/lessons', tags=['learning-runtime'])
VISIBLE_QUESTION_STATUSES = {'PUBLISHED', 'APPROVED'}


def _lesson_or_404(db: Session, lesson_id: int) -> Lesson:
    lesson = db.query(Lesson).filter(
        Lesson.id == lesson_id,
        Lesson.status == 'PUBLISHED',
    ).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')
    return lesson


def _lesson_questions(db: Session, lesson_id: int) -> list[Question]:
    return db.query(Question).filter(
        Question.lesson_id == lesson_id,
        Question.status.in_(VISIBLE_QUESTION_STATUSES),
    ).order_by(Question.id).all()


def _lesson_mastery_rows(db: Session, profile: StudentProfile, lesson_id: int) -> list[dict]:
    links = db.query(LessonSkill, Skill).join(Skill, Skill.id == LessonSkill.skill_id).filter(
        LessonSkill.lesson_id == lesson_id,
        Skill.status.in_(['ACTIVE', 'PUBLISHED', 'APPROVED']),
    ).order_by(Skill.skill_code).all()

    if not links:
        question_ids = [q.id for q in _lesson_questions(db, lesson_id)]
        if question_ids:
            links = db.query(QuestionSkill, Skill).join(Skill, Skill.id == QuestionSkill.skill_id).filter(
                QuestionSkill.question_id.in_(question_ids)
            ).order_by(Skill.skill_code).all()

    result = []
    seen: set[int] = set()
    for _, skill in links:
        if skill.id in seen:
            continue
        seen.add(skill.id)
        mastery = db.query(StudentSkillMastery).filter(
            StudentSkillMastery.student_id == profile.id,
            StudentSkillMastery.skill_id == skill.id,
        ).first()
        result.append({
            'skill_id': skill.id,
            'skill_code': skill.skill_code,
            'name_ar': skill.name_ar,
            'domain': skill.domain,
            'mastery_threshold': skill.mastery_threshold,
            'mastery_score': mastery.mastery_score if mastery else 0.0,
            'confidence': mastery.confidence if mastery else 0.0,
            'status': mastery.status if mastery else 'NOT_ASSESSED',
            'evidence_count': mastery.evidence_count if mastery else 0,
        })
    return result


@router.get('/{lesson_id}/runtime')
def lesson_runtime(
    lesson_id: int,
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    lesson = _lesson_or_404(db, lesson_id)
    unit = db.query(Unit).filter(Unit.id == lesson.unit_id).first()
    book = db.query(Book).filter(Book.id == unit.book_id).first() if unit else None
    if not unit or not book:
        raise HTTPException(503, 'Lesson curriculum context is incomplete')

    sections = db.query(LessonSection).filter(
        LessonSection.lesson_id == lesson.id
    ).order_by(LessonSection.order_no).all()
    payload_sections = []
    for section in sections:
        blocks = db.query(ContentBlock).filter(
            ContentBlock.lesson_section_id == section.id,
            ContentBlock.status == 'PUBLISHED',
        ).order_by(ContentBlock.order_no).all()
        if not blocks:
            continue
        payload_sections.append({
            'id': section.id,
            'section_number': section.section_number,
            'title': section.title,
            'blocks': [
                {
                    'id': block.id,
                    'block_type': block.block_type,
                    'content': block.content_json,
                    'order_no': block.order_no,
                }
                for block in blocks
            ],
        })

    db.add(LearningEvent(
        event_uuid=str(uuid4()),
        student_id=profile.id,
        event_type='LESSON_STARTED',
        lesson_id=lesson.id,
        metadata_json={'runtime': 'published-lesson'},
    ))
    db.commit()

    return {
        'experimental': False,
        'tutor_supported': False,
        'book': {'id': book.id, 'title': book.title, 'book_code': book.book_code},
        'unit': {'id': unit.id, 'title': unit.title, 'unit_number': unit.unit_number},
        'lesson': {
            'id': lesson.id,
            'title': lesson.title,
            'lesson_code': lesson.lesson_code,
            'estimated_minutes': lesson.estimated_minutes,
        },
        'sections': payload_sections,
    }


@router.get('/{lesson_id}/questions')
def lesson_questions(
    lesson_id: int,
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    _lesson_or_404(db, lesson_id)
    questions = _lesson_questions(db, lesson_id)
    return [
        {
            'id': q.id,
            'question_code': q.question_code,
            'question_type': q.question_type,
            'prompt': q.prompt,
            'options': q.options_json or [],
            'difficulty': q.difficulty,
            'purpose': q.purpose,
        }
        for q in questions
    ]


@router.get('/{lesson_id}/progress')
def lesson_progress(
    lesson_id: int,
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    _lesson_or_404(db, lesson_id)
    rows = _lesson_mastery_rows(db, profile, lesson_id)
    avg = round(sum(row['mastery_score'] for row in rows) / len(rows) * 100) if rows else 0
    mastered = sum(1 for row in rows if row['status'] in {'MASTERED', 'STABLE'})
    return {
        'lesson_id': lesson_id,
        'progress_percent': avg,
        'mastered_skills': mastered,
        'skills': rows,
    }


@router.get('/{lesson_id}/session-state')
def lesson_session_state(
    lesson_id: int,
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    _lesson_or_404(db, lesson_id)
    questions = _lesson_questions(db, lesson_id)
    rows = []
    answered = 0
    for question in questions:
        latest = db.query(QuestionAttempt).filter(
            QuestionAttempt.student_id == profile.id,
            QuestionAttempt.question_id == question.id,
        ).order_by(QuestionAttempt.attempt_number.desc()).first()
        if latest:
            answered += 1
        rows.append({
            'question_id': question.id,
            'answered': latest is not None,
            'latest_attempt': None if not latest else {
                'attempt_number': latest.attempt_number,
                'answer': latest.answer_json,
                'correct': latest.is_correct,
            },
        })

    total = len(questions)
    remaining = max(0, total - answered)
    completion = round((answered / total) * 100) if total else 0
    return {
        'answered_questions': answered,
        'total_questions': total,
        'remaining_questions': remaining,
        'completed_questions': total > 0 and remaining == 0,
        'completion_percent': completion,
        'questions': rows,
    }
