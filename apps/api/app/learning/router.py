from __future__ import annotations

from datetime import datetime, timedelta, UTC
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_student_profile
from ..db.deps import get_db
from ..db.models import (
    DiagnosticSession,
    LearningEvent,
    Lesson,
    Question,
    QuestionAttempt,
    QuestionSkill,
    RemediationUnit,
    Skill,
    SkillEdge,
    StudentProfile,
    StudentSkillMastery,
)
from ..schemas.learning import AttemptCreate, DiagnosticStart, LearningEventCreate, SyncBatch
from ..services.diagnostic import find_root_gap
from ..services.mastery import MasteryState, update_mastery

router = APIRouter(prefix='/learning', tags=['learning'])


VISIBLE_QUESTION_STATUSES = {'PUBLISHED', 'APPROVED'}


def is_answer_correct(question: Question, answer) -> bool:
    expected = question.correct_answer_json
    if isinstance(expected, dict) and 'value' in expected:
        expected = expected['value']
    return answer == expected


def _published_lesson_or_404(db: Session, lesson_id: int | None) -> Lesson:
    if not lesson_id:
        raise HTTPException(404, 'Lesson not found')
    lesson = db.query(Lesson).filter(
        Lesson.id == lesson_id,
        Lesson.status == 'PUBLISHED',
    ).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')
    return lesson


def _published_question_or_404(db: Session, question_id: int) -> Question:
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question or question.status not in VISIBLE_QUESTION_STATUSES:
        raise HTTPException(404, 'Question not found')
    _published_lesson_or_404(db, question.lesson_id)
    return question


def _validate_learning_event_references(
    db: Session,
    *,
    lesson_id: int | None,
    question_id: int | None,
) -> None:
    question = None
    if question_id is not None:
        question = _published_question_or_404(db, question_id)
    if lesson_id is not None:
        lesson = _published_lesson_or_404(db, lesson_id)
        if question is not None and question.lesson_id != lesson.id:
            raise HTTPException(422, 'Question does not belong to the referenced lesson')


@router.get('/skills')
def list_skills(db: Session = Depends(get_db)):
    rows = db.query(Skill).order_by(Skill.skill_code).all()
    return [
        {
            'id': x.id,
            'skill_code': x.skill_code,
            'name_ar': x.name_ar,
            'domain': x.domain,
            'mastery_threshold': x.mastery_threshold,
        }
        for x in rows
    ]


@router.get('/me/mastery')
def student_mastery(
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    rows = db.query(StudentSkillMastery, Skill).join(Skill, Skill.id == StudentSkillMastery.skill_id).filter(
        StudentSkillMastery.student_id == profile.id
    ).order_by(Skill.skill_code).all()
    return [
        {
            'skill_id': skill.id,
            'skill_code': skill.skill_code,
            'name_ar': skill.name_ar,
            'mastery_score': mastery.mastery_score,
            'confidence': mastery.confidence,
            'status': mastery.status,
            'evidence_count': mastery.evidence_count,
        }
        for mastery, skill in rows
    ]


@router.post('/questions/{question_id}/attempt')
def submit_attempt(
    question_id: int,
    payload: AttemptCreate,
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    question = _published_question_or_404(db, question_id)
    correct = is_answer_correct(question, payload.answer)
    attempts_count = db.query(QuestionAttempt).filter(
        QuestionAttempt.student_id == profile.id,
        QuestionAttempt.question_id == question_id,
    ).count()
    attempt = QuestionAttempt(
        student_id=profile.id,
        question_id=question_id,
        answer_json=payload.answer,
        is_correct=correct,
        attempt_number=attempts_count + 1,
        response_time_ms=payload.response_time_ms,
        used_hint=payload.used_hint,
        used_ai_help=payload.used_ai_help,
    )
    db.add(attempt)

    mastery_updates = []
    links = db.query(QuestionSkill).filter(QuestionSkill.question_id == question_id).all()
    for link in links:
        row = db.query(StudentSkillMastery).filter(
            StudentSkillMastery.student_id == profile.id,
            StudentSkillMastery.skill_id == link.skill_id,
        ).first()
        if not row:
            row = StudentSkillMastery(student_id=profile.id, skill_id=link.skill_id)
            db.add(row)
            db.flush()
        state = MasteryState(row.mastery_score, row.confidence, row.evidence_count, row.status)
        updated = update_mastery(
            state,
            correct=correct,
            difficulty=question.difficulty,
            used_hint=payload.used_hint,
            used_ai_help=payload.used_ai_help,
        )
        row.mastery_score = updated.score
        row.confidence = updated.confidence
        row.status = updated.status
        row.evidence_count = updated.evidence_count
        now = datetime.now(UTC).replace(tzinfo=None)
        row.last_assessed_at = now
        if updated.status == 'MASTERED':
            row.next_retention_at = now + timedelta(days=3)
        elif updated.status == 'STABLE':
            row.next_retention_at = now + timedelta(days=7)
        else:
            row.next_retention_at = None
        mastery_updates.append({
            'skill_id': link.skill_id,
            'mastery_score': updated.score,
            'confidence': updated.confidence,
            'status': updated.status,
        })

    db.add(LearningEvent(
        event_uuid=str(uuid4()),
        student_id=profile.id,
        event_type='ANSWER_CORRECT' if correct else 'ANSWER_INCORRECT',
        lesson_id=question.lesson_id,
        question_id=question.id,
        metadata_json={
            'attempt_number': attempts_count + 1,
            'used_hint': payload.used_hint,
            'used_ai_help': payload.used_ai_help,
        },
    ))
    db.commit()
    return {
        'correct': correct,
        'explanation': question.explanation,
        'attempt_number': attempts_count + 1,
        'mastery_updates': mastery_updates,
    }


@router.post('/diagnostics/start')
def start_diagnostic(
    payload: DiagnosticStart,
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    target = db.query(Skill).filter(Skill.id == payload.target_skill_id).first()
    if not target:
        raise HTTPException(404, 'Target skill not found')
    edges = db.query(SkillEdge).filter(SkillEdge.relationship == 'PREREQUISITE', SkillEdge.status == 'ACTIVE').all()
    mastery_rows = db.query(StudentSkillMastery).filter(StudentSkillMastery.student_id == profile.id).all()
    mastery = {x.skill_id: x.mastery_score for x in mastery_rows}
    result = find_root_gap(
        target_skill_id=target.id,
        prerequisite_edges=[(x.from_skill_id, x.to_skill_id) for x in edges],
        mastery=mastery,
        threshold=target.mastery_threshold,
    )
    session = DiagnosticSession(
        student_id=profile.id,
        target_skill_id=target.id,
        current_skill_id=result['root_gap_skill_id'] or target.id,
        root_gap_skill_id=result['root_gap_skill_id'],
        status='ROOT_GAP_FOUND' if result['root_gap_skill_id'] else 'READY_FOR_TARGET',
        trace_json=result['trace'],
        completed_at=datetime.now(UTC).replace(tzinfo=None),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    remediation = None
    if session.root_gap_skill_id:
        r = db.query(RemediationUnit).filter(
            RemediationUnit.skill_id == session.root_gap_skill_id,
            RemediationUnit.status == 'PUBLISHED',
        ).first()
        if r:
            remediation = {
                'id': r.id,
                'title': r.title,
                'estimated_minutes': r.estimated_minutes,
                'content': r.content_json,
            }
    return {
        'diagnostic_session_id': session.id,
        'status': session.status,
        'target_skill_id': target.id,
        'root_gap_skill_id': session.root_gap_skill_id,
        'trace': result['trace'],
        'remediation': remediation,
    }


@router.post('/events')
def record_event(
    payload: LearningEventCreate,
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    existing = db.query(LearningEvent).filter(LearningEvent.event_uuid == payload.event_uuid).first()
    if existing:
        if existing.student_id != profile.id:
            raise HTTPException(409, 'Event UUID already belongs to another student')
        return {'id': existing.id, 'duplicate': True}
    _validate_learning_event_references(
        db,
        lesson_id=payload.lesson_id,
        question_id=payload.question_id,
    )
    row = LearningEvent(
        event_uuid=payload.event_uuid,
        student_id=profile.id,
        event_type=payload.event_type,
        lesson_id=payload.lesson_id,
        skill_id=payload.skill_id,
        question_id=payload.question_id,
        metadata_json=payload.metadata,
        device_id=payload.device_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {'id': row.id, 'duplicate': False}


@router.post('/sync')
def sync_events(
    payload: SyncBatch,
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    accepted = 0
    duplicates = 0
    errors = []
    for item in payload.events:
        existing = db.query(LearningEvent).filter(LearningEvent.event_uuid == item.event_uuid).first()
        if existing:
            if existing.student_id == profile.id:
                duplicates += 1
            else:
                errors.append({'event_uuid': item.event_uuid, 'error': 'UUID belongs to another student'})
            continue
        try:
            _validate_learning_event_references(
                db,
                lesson_id=item.lesson_id,
                question_id=item.question_id,
            )
        except HTTPException as exc:
            errors.append({
                'event_uuid': item.event_uuid,
                'error': exc.detail if isinstance(exc.detail, str) else 'Invalid curriculum reference',
            })
            continue
        db.add(LearningEvent(
            event_uuid=item.event_uuid,
            student_id=profile.id,
            event_type=item.event_type,
            lesson_id=item.lesson_id,
            skill_id=item.skill_id,
            question_id=item.question_id,
            metadata_json=item.metadata,
            device_id=item.device_id,
        ))
        accepted += 1
    db.commit()
    return {'accepted': accepted, 'duplicates': duplicates, 'errors': errors}


@router.get('/me/reviews-due')
def reviews_due(
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    now = datetime.now(UTC).replace(tzinfo=None)
    rows = db.query(StudentSkillMastery, Skill).join(Skill, Skill.id == StudentSkillMastery.skill_id).filter(
        StudentSkillMastery.student_id == profile.id,
        StudentSkillMastery.next_retention_at.is_not(None),
        StudentSkillMastery.next_retention_at <= now,
    ).order_by(StudentSkillMastery.next_retention_at).all()
    return [
        {
            'skill_id': skill.id,
            'skill_code': skill.skill_code,
            'name_ar': skill.name_ar,
            'mastery_score': mastery.mastery_score,
            'status': mastery.status,
            'due_at': mastery.next_retention_at,
            'suggested_minutes': 4,
        }
        for mastery, skill in rows
    ]


@router.get('/me/daily-plan')
def daily_plan(
    minutes: int = 20,
    profile: StudentProfile = Depends(require_student_profile),
    db: Session = Depends(get_db),
):
    minutes = max(10, min(60, minutes))
    now = datetime.now(UTC).replace(tzinfo=None)
    rows = db.query(StudentSkillMastery, Skill).join(Skill, Skill.id == StudentSkillMastery.skill_id).filter(
        StudentSkillMastery.student_id == profile.id
    ).all()
    mastery = {skill.id: row.mastery_score for row, skill in rows}
    edges = db.query(SkillEdge).filter(SkillEdge.relationship == 'PREREQUISITE', SkillEdge.status == 'ACTIVE').all()
    edge_pairs = [(x.from_skill_id, x.to_skill_id) for x in edges]

    due = [(row, skill) for row, skill in rows if row.next_retention_at and row.next_retention_at <= now]
    weak = [(row, skill) for row, skill in rows if row.mastery_score < skill.mastery_threshold]
    downstream = {skill.id: 0 for _, skill in rows}
    for edge in edges:
        downstream[edge.from_skill_id] = downstream.get(edge.from_skill_id, 0) + 1

    target = max(weak, key=lambda pair: (downstream.get(pair[1].id, 0), pair[1].id), default=None)
    if target and all(edge.to_skill_id != target[1].id for edge in edges):
        sink_candidates = [pair for pair in weak if any(e.to_skill_id == pair[1].id for e in edges)]
        if sink_candidates:
            target = max(sink_candidates, key=lambda pair: pair[1].id)

    plan = []
    remaining = minutes
    if due and remaining >= 4:
        _, review_skill = due[0]
        plan.append({
            'type': 'RETENTION',
            'skill_id': review_skill.id,
            'title': f'مراجعة سريعة: {review_skill.name_ar}',
            'minutes': 4,
        })
        remaining -= 4

    if target and remaining >= 6:
        target_skill = target[1]
        result = find_root_gap(target_skill.id, edge_pairs, mastery, threshold=target_skill.mastery_threshold)
        root_id = result['root_gap_skill_id']
        if root_id and root_id != target_skill.id:
            root_skill = db.query(Skill).filter(Skill.id == root_id).first()
            remediation = db.query(RemediationUnit).filter(
                RemediationUnit.skill_id == root_id,
                RemediationUnit.status == 'PUBLISHED',
            ).first()
            recovery_minutes = min(remaining, remediation.estimated_minutes if remediation else 7)
            plan.append({
                'type': 'RECOVERY',
                'skill_id': root_id,
                'title': remediation.title if remediation else f'مراجعة سريعة: {root_skill.name_ar if root_skill else root_id}',
                'minutes': recovery_minutes,
                'target_skill_id': target_skill.id,
            })
            remaining -= recovery_minutes
        if remaining >= 4:
            plan.append({
                'type': 'GRADE_LEVEL_PRACTICE',
                'skill_id': target_skill.id,
                'title': f'تدريب: {target_skill.name_ar}',
                'minutes': remaining,
            })
            remaining = 0

    if not plan:
        plan.append({'type': 'EXPLORE', 'title': 'اختر درسًا جديدًا من موادك', 'minutes': minutes})

    return {
        'student_id': profile.id,
        'requested_minutes': minutes,
        'allocated_minutes': sum(x['minutes'] for x in plan),
        'plan': plan,
    }
