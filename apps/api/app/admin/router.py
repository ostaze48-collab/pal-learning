from __future__ import annotations

from collections import defaultdict
from datetime import datetime, UTC
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db.deps import get_db
from ..auth.deps import require_admin
from ..db.models import (
    AIJob, Book, ContentImprovementTask, DiagnosticSession, Lesson, QuestionAttempt, RemediationUnit,
    Skill, SkillEdge, StudentProfile, StudentSkillMastery, SourcePackage
)

router = APIRouter(prefix='/admin', tags=['admin-analytics'], dependencies=[Depends(require_admin)])


@router.get('/learning-health')
def learning_health(db: Session = Depends(get_db)):
    students = db.query(StudentProfile).count()
    mastery_rows = db.query(StudentSkillMastery).all()
    weak = [x for x in mastery_rows if x.mastery_score < 0.65]
    mastered = [x for x in mastery_rows if x.mastery_score >= 0.75]
    attempts = db.query(QuestionAttempt).all()
    correct_rate = (sum(1 for x in attempts if x.is_correct) / len(attempts) * 100) if attempts else 0
    diagnostics = db.query(DiagnosticSession).all()
    root_gaps = [x for x in diagnostics if x.root_gap_skill_id is not None]

    aggregates = defaultdict(list)
    for row in mastery_rows:
        aggregates[row.skill_id].append(row.mastery_score)
    weakest = []
    for skill_id, values in aggregates.items():
        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if skill:
            weakest.append({
                'skill_id': skill.id, 'skill_code': skill.skill_code, 'name_ar': skill.name_ar,
                'average_mastery': round(sum(values)/len(values), 3), 'students': len(values),
            })
    weakest.sort(key=lambda x: x['average_mastery'])

    return {
        'students': students,
        'books': db.query(Book).count(),
        'lessons': db.query(Lesson).count(),
        'source_packages': db.query(SourcePackage).count(),
        'ai_jobs': db.query(AIJob).count(),
        'mastery_evidence_rows': len(mastery_rows),
        'skills_mastered_rows': len(mastered),
        'skills_needing_support_rows': len(weak),
        'question_attempts': len(attempts),
        'correct_rate_percent': round(correct_rate, 1),
        'diagnostic_sessions': len(diagnostics),
        'root_gaps_found': len(root_gaps),
        'weakest_skills': weakest[:10],
    }


@router.post('/improvement-queue/rebuild')
def rebuild_improvement_queue(db: Session = Depends(get_db)):
    mastery_rows = db.query(StudentSkillMastery).all()
    grouped = defaultdict(list)
    for row in mastery_rows:
        grouped[row.skill_id].append(row)
    edges = db.query(SkillEdge).filter(SkillEdge.relationship == 'PREREQUISITE', SkillEdge.status == 'ACTIVE').all()
    downstream = defaultdict(int)
    for edge in edges:
        downstream[edge.from_skill_id] += 1

    updated = 0
    for skill_id, rows in grouped.items():
        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        if not skill:
            continue
        avg = sum(x.mastery_score for x in rows) / len(rows)
        affected = sum(1 for x in rows if x.mastery_score < skill.mastery_threshold)
        if affected == 0:
            continue
        severity = max(0.0, 1.0 - avg)
        dependency_multiplier = 1.0 + min(2.0, downstream.get(skill_id, 0) * 0.35)
        priority = round(min(100.0, 100 * severity * dependency_multiplier * (1 + min(2.0, affected / 10))), 1)
        remediation = db.query(RemediationUnit).filter(RemediationUnit.skill_id == skill_id, RemediationUnit.status == 'PUBLISHED').first()
        reason = {
            'affected_students': affected,
            'evidence_students': len(rows),
            'average_mastery': round(avg, 3),
            'mastery_threshold': skill.mastery_threshold,
            'downstream_dependencies': downstream.get(skill_id, 0),
            'published_remediation_exists': bool(remediation),
        }
        suggested = 'Improve explanation/questions and review recovery effectiveness.'
        if not remediation:
            suggested = 'Create a short remediation unit, then measure recovery success.'
        task = db.query(ContentImprovementTask).filter(
            ContentImprovementTask.skill_id == skill_id, ContentImprovementTask.status == 'OPEN'
        ).first()
        if not task:
            task = ContentImprovementTask(skill_id=skill_id, priority_score=priority, reason_json=reason, suggested_action=suggested)
            db.add(task)
        else:
            task.priority_score = priority
            task.reason_json = reason
            task.suggested_action = suggested
            task.updated_at = datetime.now(UTC).replace(tzinfo=None)
        updated += 1
    db.commit()
    return {'updated_tasks': updated}


@router.get('/improvement-queue')
def improvement_queue(db: Session = Depends(get_db)):
    rows = db.query(ContentImprovementTask).filter(ContentImprovementTask.status == 'OPEN').order_by(
        ContentImprovementTask.priority_score.desc()
    ).all()
    result = []
    for task in rows:
        skill = db.query(Skill).filter(Skill.id == task.skill_id).first() if task.skill_id else None
        result.append({
            'id': task.id,
            'priority_score': task.priority_score,
            'skill_id': task.skill_id,
            'skill_code': skill.skill_code if skill else None,
            'skill_name_ar': skill.name_ar if skill else None,
            'reason': task.reason_json,
            'suggested_action': task.suggested_action,
            'status': task.status,
        })
    return result
