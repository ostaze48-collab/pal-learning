from __future__ import annotations

from datetime import datetime, UTC

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.deps import get_db
from ..db.models import AIJob, SourceChunk, SourceFile, User
from ..db.staging_models import StagedLessonVersion
from ..schemas.academic_qa import AcademicQAResult
from .candidate_qa import _candidate_source_ids

router = APIRouter(prefix='/factory', tags=['content-factory-academic-qa'])


def _build_academic_source_context(db: Session, snapshot: dict) -> list[dict]:
    chunk_ids = sorted(_candidate_source_ids(snapshot or {}))
    if not chunk_ids:
        return []
    chunks = db.query(SourceChunk).filter(SourceChunk.id.in_(chunk_ids)).all()
    source_ids = {chunk.source_file_id for chunk in chunks}
    sources = db.query(SourceFile).filter(SourceFile.id.in_(source_ids)).all() if source_ids else []
    source_map = {row.id: row for row in sources}
    return [
        {
            'source_chunk_id': chunk.id,
            'page_number': chunk.page_number,
            'text': chunk.text,
            'source_file_id': chunk.source_file_id,
            'source_type': source_map.get(chunk.source_file_id).source_type if source_map.get(chunk.source_file_id) else None,
            'reliability_score': source_map.get(chunk.source_file_id).reliability_score if source_map.get(chunk.source_file_id) else None,
            'edition_match_score': source_map.get(chunk.source_file_id).edition_match_score if source_map.get(chunk.source_file_id) else None,
        }
        for chunk in sorted(chunks, key=lambda x: x.id)
    ]


@router.post('/staged-versions/{staged_version_id}/academic-qa/queue')
def queue_academic_qa(
    staged_version_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    staged = db.query(StagedLessonVersion).filter(StagedLessonVersion.id == staged_version_id).first()
    if not staged:
        raise HTTPException(404, 'Staged lesson version not found')
    if staged.release_readiness != 'READY':
        raise HTTPException(409, {
            'message': 'Academic QA cannot start until deterministic release readiness is READY',
            'release_readiness': staged.release_readiness,
        })

    existing = db.query(AIJob).filter(
        AIJob.job_type == 'QA_CONTENT',
        AIJob.source_type == 'STAGED_LESSON',
        AIJob.source_id == staged.id,
        AIJob.status.notin_(['FAILED', 'OUTPUT_REJECTED', 'OUTPUT_SCHEMA_INVALID']),
    ).order_by(AIJob.id.desc()).first()
    if existing:
        return {
            'job_id': existing.id,
            'status': existing.status,
            'staged_version_id': staged.id,
            'duplicate': True,
        }

    source_context = _build_academic_source_context(db, staged.snapshot_json or {})
    if not source_context:
        raise HTTPException(409, 'Staged lesson has no source context for academic review')

    job = AIJob(
        job_type='QA_CONTENT',
        source_type='STAGED_LESSON',
        source_id=staged.id,
        status='QUEUED',
        priority=95,
        model_route='HIGH_REASONING',
        prompt_version='academic_qa/v1',
        progress=0,
        input_json={
            'staged_version_id': staged.id,
            'lesson_id': staged.lesson_id,
            'snapshot': staged.snapshot_json,
            'deterministic_qa': staged.qa_snapshot_json,
            'source_context': source_context,
            'review_rules': {
                'source_grounding_required': True,
                'independent_review': True,
                'publication_authorized': False,
            },
        },
    )
    db.add(job)
    staged.status = 'ACADEMIC_QA_QUEUED'
    qa = dict(staged.qa_snapshot_json or {})
    qa['academic_qa_queue'] = {
        'queued_at': datetime.now(UTC).isoformat(),
        'queued_by_user_id': admin.id,
    }
    staged.qa_snapshot_json = qa
    db.commit(); db.refresh(job)
    return {
        'job_id': job.id,
        'status': job.status,
        'staged_version_id': staged.id,
        'source_chunks': len(source_context),
        'duplicate': False,
    }


def _store_academic_result(db: Session, job: AIJob, result: AcademicQAResult) -> dict:
    if job.job_type != 'QA_CONTENT' or job.source_type != 'STAGED_LESSON' or not job.source_id:
        raise HTTPException(409, 'Job is not an academic QA job')
    staged = db.query(StagedLessonVersion).filter(StagedLessonVersion.id == job.source_id).first()
    if not staged:
        raise HTTPException(404, 'Staged lesson version not found')

    input_json = job.input_json or {}
    allowed_chunks = {
        x.get('source_chunk_id')
        for x in input_json.get('source_context', [])
        if x.get('source_chunk_id') is not None
    }
    output = result.model_dump()
    invalid_refs = []
    all_issues = []
    for key in ['errors', 'conflicts', 'unsupported_claims', 'question_issues', 'age_appropriateness_issues']:
        for issue in output.get(key, []):
            all_issues.append(issue)
            for ref in issue.get('source_chunk_ids', []):
                if ref not in allowed_chunks:
                    invalid_refs.append({'category': key, 'ref': ref})
    if invalid_refs:
        job.status = 'OUTPUT_REJECTED'
        job.progress = 60
        job.error = 'Academic QA output cited source chunks outside the review packet'
        db.commit()
        raise HTTPException(422, {
            'message': job.error,
            'invalid_chunk_refs': invalid_refs,
        })

    critical_count = sum(1 for item in all_issues if item.get('severity') == 'CRITICAL')
    error_count = sum(1 for item in all_issues if item.get('severity') == 'ERROR')
    unsupported_count = len(output.get('unsupported_claims', []))

    provider_recommendation = output['recommendation']
    if critical_count or unsupported_count:
        effective_recommendation = 'BLOCK'
    elif error_count and provider_recommendation == 'PASS':
        effective_recommendation = 'REVIEW'
    else:
        effective_recommendation = provider_recommendation

    confidence = float(output['confidence'])
    if effective_recommendation == 'PASS' and confidence >= 85:
        stage_status = 'ACADEMIC_QA_PASSED'
    elif effective_recommendation == 'BLOCK':
        stage_status = 'ACADEMIC_QA_BLOCKED'
    else:
        stage_status = 'ACADEMIC_QA_REVIEW'

    provider = ((job.result_json or {}).get('provider')) or 'MANUAL_TEST_INPUT'
    academic_record = {
        'job_id': job.id,
        'provider': provider,
        'completed_at': datetime.now(UTC).isoformat(),
        'result': output,
        'provider_recommendation': provider_recommendation,
        'effective_recommendation': effective_recommendation,
        'critical_count': critical_count,
        'error_count': error_count,
        'unsupported_claim_count': unsupported_count,
        'publication_authorized': False,
    }
    qa = dict(staged.qa_snapshot_json or {})
    qa['academic_qa'] = academic_record
    staged.qa_snapshot_json = qa
    staged.status = stage_status
    job.status = 'QA_VALIDATED'
    job.progress = 100
    job.completed_at = datetime.now(UTC).replace(tzinfo=None)
    job.result_json = {
        **(job.result_json or {}),
        'validated_academic_qa': academic_record,
    }
    db.commit()
    return {
        'job_id': job.id,
        'staged_version_id': staged.id,
        'status': staged.status,
        'provider_recommendation': provider_recommendation,
        'effective_recommendation': effective_recommendation,
        'confidence': confidence,
        'publication_authorized': False,
    }


@router.post('/academic-qa/jobs/{job_id}/ingest-output')
def ingest_academic_qa_output(
    job_id: int,
    payload: AcademicQAResult,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    if not job:
        raise HTTPException(404, 'Academic QA job not found')
    return _store_academic_result(db, job, payload)


@router.post('/academic-qa/jobs/{job_id}/ingest-provider-output')
def ingest_academic_provider_output(
    job_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    job = db.query(AIJob).filter(AIJob.id == job_id).first()
    if not job:
        raise HTTPException(404, 'Academic QA job not found')
    output = ((job.result_json or {}).get('output') or {})
    if not isinstance(output, dict) or not output:
        raise HTTPException(409, 'Provider academic QA output is not available')
    if output.get('requires_provider_for_generation'):
        raise HTTPException(409, 'This academic QA job still requires a real provider')
    if output.get('parse_status') == 'NON_JSON_OUTPUT':
        job.status = 'OUTPUT_SCHEMA_INVALID'
        job.error = 'Provider returned non-JSON academic QA output'
        db.commit()
        raise HTTPException(422, job.error)
    try:
        result = AcademicQAResult.model_validate(output)
    except Exception as exc:
        job.status = 'OUTPUT_SCHEMA_INVALID'
        job.progress = 55
        job.error = 'Provider output does not match AcademicQAResult'
        db.commit()
        raise HTTPException(422, job.error) from exc
    return _store_academic_result(db, job, result)
