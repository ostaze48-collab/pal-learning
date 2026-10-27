from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.current_semester import CURRENT_BOOK_CODE, CURRENT_PACKAGE_CODE
from ..db.deps import get_db
from ..db.models import (
    AIJob,
    Book,
    ContentCandidate,
    Lesson,
    LessonSkill,
    LessonSourceLink,
    SourcePackage,
    Unit,
)
from ..db.staging_models import ReleaseTransaction, StagedLessonVersion
from ..factory.generation_readiness import calculate_generation_readiness
from ..factory.release_gate import calculate_final_release_gate

router = APIRouter(
    prefix='/admin/current-semester',
    tags=['admin-current-semester-matrix'],
    dependencies=[Depends(require_admin)],
)


def _latest_job(db: Session, lesson_id: int, job_type: str) -> AIJob | None:
    return db.query(AIJob).filter(
        AIJob.source_type == 'LESSON',
        AIJob.source_id == lesson_id,
        AIJob.job_type == job_type,
    ).order_by(AIJob.id.desc()).first()


def _academic_snapshot(staged: StagedLessonVersion | None) -> dict:
    if not staged:
        return {}
    snapshot = staged.qa_snapshot_json or {}
    academic = snapshot.get('academic_qa') or {}
    return academic if isinstance(academic, dict) else {}


def _classify_lesson(
    *,
    candidate_links: int,
    verified_links: int,
    skills_count: int,
    generation_job: AIJob | None,
    candidate: ContentCandidate | None,
    staged: StagedLessonVersion | None,
    release_tx: ReleaseTransaction | None,
    readiness: dict,
    database_backend: str,
) -> dict:
    if release_tx and release_tx.status == 'COMMITTED':
        return {
            'stage': 'RELEASED',
            'progress': 100,
            'next_action': None,
            'blockers': [],
        }

    if staged:
        final_gate = calculate_final_release_gate(staged, database_backend)
        academic = _academic_snapshot(staged)
        effective = academic.get('effective_recommendation')
        if final_gate.get('decision') == 'READY_FOR_RELEASE_TRANSACTION':
            return {
                'stage': 'RELEASE_READY',
                'progress': 95,
                'next_action': 'OPEN_RELEASE_CONSOLE',
                'blockers': [],
            }
        if effective == 'BLOCK':
            return {
                'stage': 'ACADEMIC_QA_BLOCKED',
                'progress': 85,
                'next_action': 'REVIEW_ACADEMIC_QA',
                'blockers': list(final_gate.get('blockers') or ['ACADEMIC_QA_BLOCKED']),
            }
        if effective == 'PASS':
            return {
                'stage': 'FINAL_GATE_BLOCKED',
                'progress': 90,
                'next_action': 'REVIEW_FINAL_GATE',
                'blockers': list(final_gate.get('blockers') or []),
            }
        return {
            'stage': 'STAGED_AWAITING_ACADEMIC_QA',
            'progress': 80,
            'next_action': 'RUN_ACADEMIC_QA',
            'blockers': [],
        }

    if candidate:
        if candidate.status in {'READY_FOR_QA', 'QA_PASSED', 'APPROVED_FOR_STAGING'}:
            return {
                'stage': 'CANDIDATE_QA',
                'progress': 70,
                'next_action': 'OPEN_CANDIDATE_QA',
                'blockers': [],
            }
        return {
            'stage': 'CANDIDATE_BLOCKED',
            'progress': 65,
            'next_action': 'REVIEW_CANDIDATE',
            'blockers': [candidate.status],
        }

    if generation_job:
        if generation_job.status == 'OUTPUT_VALIDATED':
            return {
                'stage': 'CANDIDATE_QA',
                'progress': 70,
                'next_action': 'OPEN_CANDIDATE_QA',
                'blockers': [],
            }
        return {
            'stage': 'GENERATION',
            'progress': 60,
            'next_action': 'OPEN_LESSON_GENERATION',
            'blockers': [] if generation_job.status not in {'FAILED', 'STALE_INPUT', 'OUTPUT_REJECTED', 'OUTPUT_SCHEMA_INVALID'} else [generation_job.status],
        }

    if skills_count > 0:
        return {
            'stage': 'GENERATION_READY' if readiness.get('queue_ready') else 'GENERATION_BLOCKED',
            'progress': 50,
            'next_action': 'QUEUE_GENERATION' if readiness.get('queue_ready') else 'REVIEW_GENERATION_READINESS',
            'blockers': list(readiness.get('blockers') or []),
        }

    if verified_links > 0:
        return {
            'stage': 'SKILL_MAPPING',
            'progress': 40,
            'next_action': 'OPEN_SKILL_MAPPING',
            'blockers': [],
        }

    if candidate_links > 0:
        return {
            'stage': 'SOURCE_REVIEW',
            'progress': 30,
            'next_action': 'REVIEW_SOURCE_LINKS',
            'blockers': [],
        }

    return {
        'stage': 'SOURCE_LINKING',
        'progress': 20,
        'next_action': 'AUTO_LINK_LESSONS',
        'blockers': [],
    }


@router.get('/matrix')
def current_semester_matrix(db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.book_code == CURRENT_BOOK_CODE).first()
    package = db.query(SourcePackage).filter(SourcePackage.package_code == CURRENT_PACKAGE_CODE).first()
    if not book or not package:
        raise HTTPException(503, 'Current semester registry is not initialized')

    backend = db.get_bind().url.get_backend_name() if db.get_bind() is not None else 'unknown'
    units = db.query(Unit).filter(Unit.book_id == book.id).order_by(Unit.order_no, Unit.unit_number).all()
    rows: list[dict] = []

    for unit in units:
        lessons = db.query(Lesson).filter(Lesson.unit_id == unit.id).order_by(Lesson.lesson_number).all()
        for lesson in lessons:
            candidate_links = db.query(LessonSourceLink).filter(
                LessonSourceLink.lesson_id == lesson.id,
                LessonSourceLink.relation == 'TEACHING_SOURCE',
                LessonSourceLink.status.in_(['CANDIDATE', 'VERIFIED_CANDIDATE']),
            ).count()
            verified_links = db.query(LessonSourceLink).filter(
                LessonSourceLink.lesson_id == lesson.id,
                LessonSourceLink.relation == 'TEACHING_SOURCE',
                LessonSourceLink.status == 'VERIFIED',
            ).count()
            skills_count = db.query(LessonSkill).filter(LessonSkill.lesson_id == lesson.id).count()
            skill_job = _latest_job(db, lesson.id, 'EXTRACT_SKILLS')
            generation_job = _latest_job(db, lesson.id, 'GENERATE_LESSON')
            candidate = db.query(ContentCandidate).filter(
                ContentCandidate.lesson_id == lesson.id,
            ).order_by(ContentCandidate.id.desc()).first()
            staged = db.query(StagedLessonVersion).filter(
                StagedLessonVersion.lesson_id == lesson.id,
            ).order_by(StagedLessonVersion.id.desc()).first()
            release_tx = db.query(ReleaseTransaction).filter(
                ReleaseTransaction.lesson_id == lesson.id,
            ).order_by(ReleaseTransaction.id.desc()).first()
            readiness = calculate_generation_readiness(db, lesson.id)
            state = _classify_lesson(
                candidate_links=candidate_links,
                verified_links=verified_links,
                skills_count=skills_count,
                generation_job=generation_job,
                candidate=candidate,
                staged=staged,
                release_tx=release_tx,
                readiness=readiness,
                database_backend=backend,
            )
            academic = _academic_snapshot(staged)
            rows.append({
                'unit': {'id': unit.id, 'unit_number': unit.unit_number, 'title': unit.title},
                'lesson': {
                    'id': lesson.id,
                    'lesson_number': lesson.lesson_number,
                    'lesson_code': lesson.lesson_code,
                    'title': lesson.title,
                    'status': lesson.status,
                },
                'stage': state['stage'],
                'progress': state['progress'],
                'next_action': state['next_action'],
                'blockers': state['blockers'],
                'source_links': {'candidate': candidate_links, 'verified': verified_links},
                'skills_count': skills_count,
                'generation_readiness': {
                    'queue_ready': bool(readiness.get('queue_ready')),
                    'execution_ready': bool(readiness.get('execution_ready')),
                    'blockers': list(readiness.get('blockers') or []),
                },
                'latest_skill_job': {'id': skill_job.id, 'status': skill_job.status} if skill_job else None,
                'latest_generation_job': {'id': generation_job.id, 'status': generation_job.status} if generation_job else None,
                'latest_candidate': {'id': candidate.id, 'status': candidate.status, 'version_label': candidate.version_label} if candidate else None,
                'latest_staged_version': {
                    'id': staged.id,
                    'status': staged.status,
                    'release_readiness': staged.release_readiness,
                    'academic_recommendation': academic.get('effective_recommendation'),
                } if staged else None,
                'latest_release_transaction': {
                    'id': release_tx.id,
                    'status': release_tx.status,
                    'content_version_id': release_tx.content_version_id,
                } if release_tx else None,
            })

    released = sum(1 for row in rows if row['stage'] == 'RELEASED')
    return {
        'semester': 1,
        'book_code': book.book_code,
        'package_code': package.package_code,
        'database_backend': backend,
        'lesson_count': len(rows),
        'released_count': released,
        'completion_percent': round((released / len(rows) * 100.0), 1) if rows else 0.0,
        'lessons': rows,
    }
