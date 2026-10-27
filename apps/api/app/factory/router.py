from __future__ import annotations

import os
from datetime import datetime, UTC
from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ..db.deps import get_db
from ..auth.deps import require_admin
from ..db.models import AIJob, ContentCandidate, Lesson
from ..services.ai_gateway import AIGateway
from ..services.generation_packet import build_lesson_generation_packet
from ..schemas.factory import GeneratedLessonPayload
from .generation_readiness import calculate_generation_readiness

router = APIRouter(prefix='/factory', tags=['content-factory'], dependencies=[Depends(require_admin)])


@router.get('/status')
def factory_status():
    """Return non-secret provider readiness information for the admin UI."""
    provider = os.getenv('AI_PROVIDER', 'LOCAL_MOCK').upper()
    if provider == 'OPENAI':
        model_configured = bool(os.getenv('OPENAI_MODEL') or os.getenv('OPENAI_MODEL_BALANCED'))
        key_configured = bool(os.getenv('OPENAI_API_KEY'))
        generation_ready = model_configured and key_configured
    else:
        model_configured = False
        key_configured = False
        generation_ready = False
    return {
        'provider': provider,
        'generation_ready': generation_ready,
        'model_configured': model_configured,
        'key_configured': key_configured,
        'mode': 'REAL_PROVIDER' if generation_ready else 'LOCAL_MOCK' if provider == 'LOCAL_MOCK' else 'MISCONFIGURED',
    }


@router.post('/lessons/{lesson_id}/generate')
def queue_lesson_generation(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')

    readiness = calculate_generation_readiness(db, lesson_id)
    if not readiness['queue_ready']:
        raise HTTPException(
            409,
            detail={
                'message': 'Lesson is not ready for generation',
                'blockers': readiness['blockers'],
                'next_actions': readiness['next_actions'],
                'generation_readiness': readiness,
            },
        )

    try:
        packet = build_lesson_generation_packet(db, lesson_id)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc

    job = AIJob(
        job_type='GENERATE_LESSON',
        source_type='LESSON',
        source_id=lesson_id,
        status='QUEUED',
        priority=80,
        model_route='BALANCED',
        prompt_version='lesson_generator/v2',
        progress=0,
        input_json=packet,
    )
    db.add(job); db.commit(); db.refresh(job)
    return {
        'job_id': job.id,
        'status': job.status,
        'lesson_id': lesson_id,
        'source_chunks': len(packet['source_context']),
        'skills': len(packet['skills']),
        'generation_readiness': {
            'queue_ready': readiness['queue_ready'],
            'execution_ready': readiness['execution_ready'],
            'provider': readiness['provider'],
        },
    }


@router.get('/lessons/{lesson_id}/jobs')
def list_lesson_jobs(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')
    rows = db.query(AIJob).filter(
        AIJob.source_type == 'LESSON',
        AIJob.source_id == lesson_id,
    ).order_by(AIJob.id.desc()).limit(30).all()
    return [
        {
            'id': row.id,
            'job_type': row.job_type,
            'status': row.status,
            'progress': row.progress,
            'model_route': row.model_route,
            'prompt_version': row.prompt_version,
            'error': row.error,
            'created_at': row.created_at,
            'started_at': row.started_at,
            'completed_at': row.completed_at,
            'provider': ((row.result_json or {}).get('provider')),
        }
        for row in rows
    ]


@router.get('/jobs/{job_id}')
def get_factory_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    if not job:
        raise HTTPException(404, 'Job not found')
    return {
        'id': job.id, 'job_type': job.job_type, 'status': job.status,
        'progress': job.progress, 'model_route': job.model_route,
        'prompt_version': job.prompt_version, 'input': job.input_json,
        'result': job.result_json, 'error': job.error,
    }


@router.post('/jobs/{job_id}/execute')
def execute_factory_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    if not job:
        raise HTTPException(404, 'Job not found')
    provider = os.getenv('AI_PROVIDER', 'LOCAL_MOCK')
    gateway = AIGateway(provider=provider)
    job.status = 'RUNNING'; job.progress = 15; job.started_at = datetime.now(UTC).replace(tzinfo=None); db.commit()
    try:
        response = gateway.run(job.job_type, {'text': str(job.input_json or ''), 'packet': job.input_json or {}}, job.model_route)
        job.result_json = {
            'provider': response.provider,
            'output': response.output,
            'usage': response.usage,
        }
        if response.output.get('requires_provider_for_generation'):
            job.status = 'WAITING_PROVIDER'
            job.progress = 25
        else:
            job.status = 'COMPLETED'
            job.progress = 100
            job.completed_at = datetime.now(UTC).replace(tzinfo=None)
    except Exception as exc:
        job.status = 'FAILED'; job.error = str(exc); job.completed_at = datetime.now(UTC).replace(tzinfo=None)
    db.commit(); db.refresh(job)
    return {'job_id': job.id, 'status': job.status, 'progress': job.progress, 'result': job.result_json, 'error': job.error}


def _store_candidate(job: AIJob, payload: GeneratedLessonPayload, db: Session) -> dict:
    if job.job_type != 'GENERATE_LESSON' or job.source_type != 'LESSON' or not job.source_id:
        raise HTTPException(409, 'Job is not a lesson-generation job')

    packet = job.input_json or {}
    allowed_chunks = {x.get('source_chunk_id') for x in packet.get('source_context', []) if x.get('source_chunk_id')}
    allowed_skills = {x.get('skill_code') for x in packet.get('skills', []) if x.get('skill_code')}
    output = payload.model_dump()

    invalid_chunks = []
    unknown_skills = []
    cited = 0
    total_citable = 0

    def validate_artifact(item: dict, where: str, *, check_skills: bool = False) -> None:
        nonlocal cited, total_citable
        total_citable += 1
        refs = item.get('source_chunk_ids', [])
        if refs:
            cited += 1
        for ref in refs:
            if ref not in allowed_chunks:
                invalid_chunks.append({'where': where, 'ref': ref})
        if check_skills:
            for code in item.get('skill_codes', []):
                if code not in allowed_skills:
                    unknown_skills.append(code)

    for section in output.get('sections', []):
        for block in section.get('blocks', []):
            validate_artifact(block, 'block')
    for question in output.get('questions', []):
        validate_artifact(question, 'question', check_skills=True)
    for item in output.get('summary', []):
        validate_artifact(item, 'summary')
    for item in output.get('flashcards', []):
        validate_artifact(item, 'flashcard')
    for item in output.get('misconceptions', []):
        validate_artifact(item, 'misconception', check_skills=True)
    for item in output.get('remediation_candidates', []):
        validate_artifact(item, 'remediation', check_skills=True)

    provenance_score = round(100 * cited / total_citable, 1) if total_citable else 0.0
    valid = not invalid_chunks and not unknown_skills and provenance_score == 100.0
    count = db.query(ContentCandidate).filter(ContentCandidate.lesson_id == job.source_id).count() + 1
    candidate = ContentCandidate(
        lesson_id=job.source_id, ai_job_id=job.id, version_label=f'candidate-{count}',
        status='READY_FOR_QA' if valid else 'REJECTED',
        schema_valid=True, provenance_score=provenance_score, output_json=output,
        validation_json={
            'allowed_chunk_ids': sorted(allowed_chunks),
            'invalid_chunk_refs': invalid_chunks,
            'unknown_skill_codes': sorted(set(unknown_skills)),
            'citable_items': total_citable,
            'cited_items': cited,
            'all_citable_items_have_refs': provenance_score == 100.0,
        },
    )
    db.add(candidate)
    job.status = 'OUTPUT_VALIDATED' if valid else 'OUTPUT_REJECTED'
    job.progress = 70 if valid else 60
    db.commit(); db.refresh(candidate)
    return {
        'candidate_id': candidate.id, 'version_label': candidate.version_label,
        'status': candidate.status, 'schema_valid': candidate.schema_valid,
        'provenance_score': candidate.provenance_score,
        'validation': candidate.validation_json,
    }


@router.post('/jobs/{job_id}/ingest-output')
def ingest_generated_output(job_id: int, payload: GeneratedLessonPayload, db: Session = Depends(get_db)):
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    if not job:
        raise HTTPException(404, 'Job not found')
    return _store_candidate(job, payload, db)


@router.post('/jobs/{job_id}/ingest-provider-output')
def ingest_provider_output(job_id: int, db: Session = Depends(get_db)):
    """Validate the provider output already stored on the job.

    Execution and ingestion are deliberately separate. A provider can finish a job,
    but its output cannot become a ContentCandidate until it passes the strict
    GeneratedLessonPayload schema and the same provenance/skill allowlists used for
    manually ingested output.
    """
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    if not job:
        raise HTTPException(404, 'Job not found')
    if job.job_type != 'GENERATE_LESSON' or job.source_type != 'LESSON' or not job.source_id:
        raise HTTPException(409, 'Job is not a lesson-generation job')

    output = ((job.result_json or {}).get('output') or {})
    if not isinstance(output, dict) or not output:
        raise HTTPException(409, 'Provider output is not available')
    if output.get('requires_provider_for_generation'):
        raise HTTPException(409, 'This job still requires a real generation provider')
    if output.get('parse_status') == 'NON_JSON_OUTPUT':
        job.status = 'OUTPUT_SCHEMA_INVALID'
        job.error = 'Provider returned non-JSON output'
        db.commit()
        raise HTTPException(422, 'Provider output is not valid JSON')

    try:
        payload = GeneratedLessonPayload.model_validate(output)
    except ValidationError as exc:
        job.status = 'OUTPUT_SCHEMA_INVALID'
        job.progress = 55
        job.error = 'Provider output does not match GeneratedLessonPayload'
        db.commit()
        raise HTTPException(
            422,
            detail={
                'message': 'Provider output does not match GeneratedLessonPayload',
                'errors': exc.errors(include_url=False),
            },
        ) from exc

    return _store_candidate(job, payload, db)


@router.get('/candidates/{candidate_id}')
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    row = db.query(ContentCandidate).filter(ContentCandidate.id == candidate_id).first()
    if not row:
        raise HTTPException(404, 'Content candidate not found')
    return {
        'id': row.id,
        'lesson_id': row.lesson_id,
        'ai_job_id': row.ai_job_id,
        'version_label': row.version_label,
        'status': row.status,
        'schema_valid': row.schema_valid,
        'provenance_score': row.provenance_score,
        'validation': row.validation_json,
        'output': row.output_json,
        'created_at': row.created_at,
    }


@router.get('/lessons/{lesson_id}/candidates')
def list_candidates(lesson_id: int, db: Session = Depends(get_db)):
    rows = db.query(ContentCandidate).filter(ContentCandidate.lesson_id == lesson_id).order_by(ContentCandidate.id.desc()).all()
    return [
        {
            'id': x.id, 'version_label': x.version_label, 'status': x.status,
            'schema_valid': x.schema_valid, 'provenance_score': x.provenance_score,
            'validation': x.validation_json, 'created_at': x.created_at,
        } for x in rows
    ]
