from __future__ import annotations

import hashlib
import re
from datetime import datetime, UTC

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.deps import get_db
from ..db.models import AIJob, Book, Lesson, LessonSkill, Skill, Subject, Unit
from ..schemas.skill_mapping import SkillApprovalRequest, SkillMappingPayload
from ..services.generation_packet import build_lesson_generation_packet

router = APIRouter(prefix='/factory', tags=['skill-mapping'], dependencies=[Depends(require_admin)])


def _subject_for_lesson(db: Session, lesson: Lesson) -> Subject:
    unit = db.query(Unit).filter(Unit.id == lesson.unit_id).first()
    if not unit:
        raise HTTPException(409, 'Lesson unit is missing')
    book = db.query(Book).filter(Book.id == unit.book_id).first()
    if not book:
        raise HTTPException(409, 'Lesson book is missing')
    subject = db.query(Subject).filter(Subject.id == book.subject_id).first()
    if not subject:
        raise HTTPException(409, 'Lesson subject is missing')
    return subject


def _skill_code(subject_code: str, domain: str, name_ar: str) -> str:
    safe_subject = re.sub(r'[^A-Z0-9]+', '', subject_code.upper())[:12] or 'GEN'
    safe_domain = re.sub(r'[^A-Z0-9_]+', '_', domain.upper()).strip('_')[:36] or 'GENERAL'
    digest = hashlib.sha256(f'{safe_subject}|{safe_domain}|{name_ar.strip()}'.encode('utf-8')).hexdigest()[:12].upper()
    return f'SK.{safe_subject}.AUTO.{safe_domain}.{digest}'


@router.post('/lessons/{lesson_id}/skill-mapping/queue')
def queue_skill_mapping(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')

    packet = build_lesson_generation_packet(db, lesson_id)
    source_context = packet.get('source_context') or []
    if not source_context:
        raise HTTPException(409, detail={
            'message': 'Skill mapping requires authorized factual source context',
            'scope_gate': packet.get('scope_gate') or {},
            'authority_gate': packet.get('authority_gate') or {},
        })

    input_json = {
        'contract_version': 'skill-mapping-packet/v1',
        'lesson': packet['lesson'],
        'source_context': source_context,
        'rules': {
            'propose_measurable_skills_only': True,
            'no_skill_codes_from_model': True,
            'provenance_required': True,
            'allowed_source_chunk_ids': [x['source_chunk_id'] for x in source_context],
            'admin_approval_required': True,
        },
    }
    job = AIJob(
        job_type='EXTRACT_SKILLS',
        source_type='LESSON',
        source_id=lesson_id,
        status='QUEUED',
        priority=90,
        model_route='HIGH_REASONING',
        prompt_version='skill_mapper/v1',
        progress=0,
        input_json=input_json,
    )
    db.add(job); db.commit(); db.refresh(job)
    return {
        'job_id': job.id,
        'lesson_id': lesson_id,
        'status': job.status,
        'source_chunks': len(source_context),
        'approval_required': True,
    }


def _ingest_skill_output(job: AIJob, raw_output: dict, db: Session) -> dict:
    if job.job_type != 'EXTRACT_SKILLS' or job.source_type != 'LESSON' or not job.source_id:
        raise HTTPException(409, 'Job is not a skill-mapping job')
    try:
        payload = SkillMappingPayload.model_validate(raw_output)
    except ValidationError as exc:
        job.status = 'SKILL_MAPPING_SCHEMA_INVALID'
        job.progress = 55
        job.error = 'Skill mapping output does not match SkillMappingPayload'
        db.commit()
        raise HTTPException(422, detail={
            'message': 'Skill mapping output does not match SkillMappingPayload',
            'errors': exc.errors(include_url=False),
        }) from exc

    packet = job.input_json or {}
    allowed = set((packet.get('rules') or {}).get('allowed_source_chunk_ids') or [])
    invalid_refs = []
    proposals = payload.model_dump()['skills']
    for index, proposal in enumerate(proposals):
        for ref in proposal['source_chunk_ids']:
            if ref not in allowed:
                invalid_refs.append({'proposal_index': index, 'source_chunk_id': ref})
    if invalid_refs:
        job.status = 'SKILL_MAPPING_REJECTED'
        job.progress = 60
        job.result_json = {
            **(job.result_json or {}),
            'skill_mapping_candidate': {
                'status': 'REJECTED',
                'invalid_source_refs': invalid_refs,
                'proposals': proposals,
            },
        }
        db.commit()
        raise HTTPException(422, detail={
            'message': 'Skill mapping cited source chunks outside the approved packet',
            'invalid_source_refs': invalid_refs,
        })

    job.status = 'SKILL_MAPPING_READY_FOR_REVIEW'
    job.progress = 70
    result = dict(job.result_json or {})
    result['skill_mapping_candidate'] = {
        'status': 'READY_FOR_ADMIN_REVIEW',
        'proposals': proposals,
        'allowed_source_chunk_ids': sorted(allowed),
        'approved_indices': [],
    }
    job.result_json = result
    db.commit(); db.refresh(job)
    return {
        'job_id': job.id,
        'status': job.status,
        'proposal_count': len(proposals),
        'proposals': proposals,
        'approval_required': True,
    }


@router.post('/skill-mapping/jobs/{job_id}/ingest-provider-output')
def ingest_skill_provider_output(job_id: int, db: Session = Depends(get_db)):
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    if not job:
        raise HTTPException(404, 'Job not found')
    output = ((job.result_json or {}).get('output') or {})
    if not isinstance(output, dict) or not output:
        raise HTTPException(409, 'Provider output is not available')
    if output.get('requires_provider_for_generation'):
        raise HTTPException(409, 'This job still requires a real generation provider')
    if output.get('parse_status') == 'NON_JSON_OUTPUT':
        raise HTTPException(422, 'Provider output is not valid JSON')
    return _ingest_skill_output(job, output, db)


@router.post('/skill-mapping/jobs/{job_id}/ingest-output')
def ingest_skill_output(job_id: int, payload: SkillMappingPayload, db: Session = Depends(get_db)):
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    if not job:
        raise HTTPException(404, 'Job not found')
    return _ingest_skill_output(job, payload.model_dump(), db)


@router.get('/lessons/{lesson_id}/skill-mapping')
def skill_mapping_status(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')
    linked = db.query(LessonSkill, Skill).join(Skill, Skill.id == LessonSkill.skill_id).filter(
        LessonSkill.lesson_id == lesson_id
    ).all()
    jobs = db.query(AIJob).filter(
        AIJob.source_type == 'LESSON',
        AIJob.source_id == lesson_id,
        AIJob.job_type == 'EXTRACT_SKILLS',
    ).order_by(AIJob.id.desc()).limit(10).all()
    return {
        'lesson_id': lesson_id,
        'linked_skills': [
            {
                'skill_id': skill.id,
                'skill_code': skill.skill_code,
                'name_ar': skill.name_ar,
                'domain': skill.domain,
                'relationship': link.relationship,
            }
            for link, skill in linked
        ],
        'jobs': [
            {
                'job_id': job.id,
                'status': job.status,
                'progress': job.progress,
                'candidate': (job.result_json or {}).get('skill_mapping_candidate'),
                'created_at': job.created_at,
            }
            for job in jobs
        ],
    }


@router.post('/skill-mapping/jobs/{job_id}/approve')
def approve_skill_mapping(job_id: int, request: SkillApprovalRequest, db: Session = Depends(get_db)):
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    if not job:
        raise HTTPException(404, 'Job not found')
    if job.status not in {'SKILL_MAPPING_READY_FOR_REVIEW', 'SKILL_MAPPING_PARTIALLY_APPROVED'}:
        raise HTTPException(409, 'Skill mapping job is not ready for approval')
    candidate = ((job.result_json or {}).get('skill_mapping_candidate') or {})
    proposals = candidate.get('proposals') or []
    indices = sorted(set(request.proposal_indices))
    if any(index < 0 or index >= len(proposals) for index in indices):
        raise HTTPException(422, 'One or more proposal indices are invalid')

    lesson = db.query(Lesson).filter(Lesson.id == job.source_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')
    subject = _subject_for_lesson(db, lesson)
    approved = []
    existing_approved = set(candidate.get('approved_indices') or [])
    for index in indices:
        proposal = proposals[index]
        code = _skill_code(subject.code, proposal['domain'], proposal['name_ar'])
        skill = db.query(Skill).filter(Skill.skill_code == code).first()
        if not skill:
            skill = Skill(
                skill_code=code,
                subject_id=subject.id,
                domain=proposal['domain'],
                name_ar=proposal['name_ar'],
                description=proposal.get('description_ar') or proposal['measurable_outcome_ar'],
                mastery_threshold=proposal['mastery_threshold'],
                importance=proposal['importance'],
                status='ACTIVE',
            )
            db.add(skill); db.flush()
        link = db.query(LessonSkill).filter(
            LessonSkill.lesson_id == lesson.id,
            LessonSkill.skill_id == skill.id,
            LessonSkill.relationship == 'TEACHES',
        ).first()
        if not link:
            db.add(LessonSkill(
                lesson_id=lesson.id,
                skill_id=skill.id,
                relationship='TEACHES',
                weight=1.0,
            ))
        existing_approved.add(index)
        approved.append({'proposal_index': index, 'skill_id': skill.id, 'skill_code': skill.skill_code})

    candidate['approved_indices'] = sorted(existing_approved)
    candidate['status'] = 'APPROVED' if len(existing_approved) == len(proposals) else 'PARTIALLY_APPROVED'
    result = dict(job.result_json or {})
    result['skill_mapping_candidate'] = candidate
    result['skill_mapping_approval'] = {
        'approved_at': datetime.now(UTC).isoformat(),
        'approved_indices': sorted(existing_approved),
        'server_generated_skill_codes': True,
        'subject_code': subject.code,
    }
    job.result_json = result
    job.status = 'SKILL_MAPPING_APPROVED' if len(existing_approved) == len(proposals) else 'SKILL_MAPPING_PARTIALLY_APPROVED'
    job.progress = 100 if job.status == 'SKILL_MAPPING_APPROVED' else 85
    db.commit()
    return {
        'job_id': job.id,
        'status': job.status,
        'approved': approved,
        'approved_indices': sorted(existing_approved),
        'server_generated_skill_codes': True,
        'subject_code': subject.code,
    }
