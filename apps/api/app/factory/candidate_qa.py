from __future__ import annotations

from datetime import datetime, UTC

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.deps import get_db
from ..db.models import ContentCandidate, SourceChunk, SourceFile, User

router = APIRouter(prefix='/factory', tags=['content-factory-candidate-qa'])


def _candidate_source_ids(output: dict) -> set[int]:
    refs: set[int] = set()
    for section in output.get('sections', []) or []:
        for block in section.get('blocks', []) or []:
            refs.update(int(x) for x in (block.get('source_chunk_ids') or []) if x is not None)
    for question in output.get('questions', []) or []:
        refs.update(int(x) for x in (question.get('source_chunk_ids') or []) if x is not None)
    return refs


def _structure_metrics(output: dict) -> dict:
    sections = output.get('sections', []) or []
    blocks = [block for section in sections for block in (section.get('blocks', []) or [])]
    questions = output.get('questions', []) or []
    checks = {
        'has_learning_objectives': bool(output.get('learning_objectives')),
        'has_concepts': bool(output.get('concepts')),
        'has_sections': bool(sections),
        'has_blocks': bool(blocks),
        'has_questions': bool(questions),
        'has_summary': bool(output.get('summary')),
    }
    score = round(100 * sum(1 for passed in checks.values() if passed) / len(checks), 1)
    return {
        'checks': checks,
        'score': score,
        'sections': len(sections),
        'blocks': len(blocks),
        'questions': len(questions),
    }


def _source_evidence(db: Session, chunk_ids: set[int]) -> dict:
    if not chunk_ids:
        return {'score': 0.0, 'files': [], 'missing_chunk_ids': []}

    chunks = db.query(SourceChunk).filter(SourceChunk.id.in_(sorted(chunk_ids))).all()
    found = {row.id for row in chunks}
    missing = sorted(chunk_ids - found)
    file_ids = sorted({row.source_file_id for row in chunks})
    files = db.query(SourceFile).filter(SourceFile.id.in_(file_ids)).all() if file_ids else []
    details = []
    factors = []
    for source in files:
        reliability = max(0.0, min(100.0, float(source.reliability_score or 0)))
        edition = max(0.0, min(100.0, float(source.edition_match_score or 0)))
        factor = round(reliability * edition / 100.0, 1)
        factors.append(factor)
        details.append({
            'source_file_id': source.id,
            'source_type': source.source_type,
            'reliability_score': reliability,
            'edition_match_score': edition,
            'verified_evidence_score': factor,
            'status': source.status,
        })
    # Conservative: the weakest cited source controls release readiness.
    score = min(factors) if factors and not missing else 0.0
    return {'score': round(score, 1), 'files': details, 'missing_chunk_ids': missing}


def calculate_candidate_qa(db: Session, candidate: ContentCandidate) -> dict:
    output = candidate.output_json or {}
    validation = candidate.validation_json or {}
    structure = _structure_metrics(output)
    cited_chunks = _candidate_source_ids(output)
    evidence = _source_evidence(db, cited_chunks)

    invalid_refs = validation.get('invalid_chunk_refs') or []
    unknown_skills = validation.get('unknown_skill_codes') or []
    schema_ok = bool(candidate.schema_valid)
    provenance_ok = float(candidate.provenance_score or 0) == 100.0 and not invalid_refs and not evidence['missing_chunk_ids']
    skills_ok = not unknown_skills
    structure_ok = structure['score'] == 100.0
    candidate_not_rejected = candidate.status != 'REJECTED'

    preflight_pass = all([schema_ok, provenance_ok, skills_ok, structure_ok, candidate_not_rejected])
    preflight_status = 'PASS' if preflight_pass else 'BLOCKED'

    release_threshold = 80.0
    release_ready = preflight_pass and evidence['score'] >= release_threshold
    release_status = 'READY' if release_ready else 'BLOCKED'

    return {
        'candidate_id': candidate.id,
        'preflight_status': preflight_status,
        'release_readiness': release_status,
        'release_source_threshold': release_threshold,
        'schema_valid': schema_ok,
        'provenance_score': float(candidate.provenance_score or 0),
        'skills_valid': skills_ok,
        'structure': structure,
        'source_evidence': evidence,
        'blocking_reasons': [
            reason for condition, reason in [
                (not candidate_not_rejected, 'candidate_already_rejected'),
                (not schema_ok, 'schema_invalid'),
                (not provenance_ok, 'provenance_incomplete_or_invalid'),
                (not skills_ok, 'unknown_skill_codes'),
                (not structure_ok, 'lesson_structure_incomplete'),
                (evidence['score'] < release_threshold, 'source_evidence_not_release_ready'),
            ] if condition
        ],
    }


@router.post('/candidates/{candidate_id}/qa')
def run_candidate_qa(
    candidate_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    candidate = db.query(ContentCandidate).filter(ContentCandidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(404, 'Content candidate not found')
    result = calculate_candidate_qa(db, candidate)
    validation = dict(candidate.validation_json or {})
    validation['candidate_qa'] = {
        **result,
        'checked_at': datetime.now(UTC).isoformat(),
        'checked_by_user_id': admin.id,
    }
    candidate.validation_json = validation
    if candidate.status not in {'REJECTED', 'APPROVED_FOR_STAGING'}:
        candidate.status = 'QA_PASSED' if result['preflight_status'] == 'PASS' else 'QA_BLOCKED'
    db.commit()
    return {'status': candidate.status, **result}


@router.post('/candidates/{candidate_id}/approve-staging')
def approve_candidate_for_staging(
    candidate_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    candidate = db.query(ContentCandidate).filter(ContentCandidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(404, 'Content candidate not found')

    result = calculate_candidate_qa(db, candidate)
    if result['preflight_status'] != 'PASS':
        raise HTTPException(409, {
            'message': 'Candidate cannot enter staging until preflight QA passes',
            'candidate_qa': result,
        })

    validation = dict(candidate.validation_json or {})
    validation['candidate_qa'] = {
        **result,
        'checked_at': datetime.now(UTC).isoformat(),
        'checked_by_user_id': admin.id,
    }
    validation['staging_approval'] = {
        'approved_at': datetime.now(UTC).isoformat(),
        'approved_by_user_id': admin.id,
        'release_readiness': result['release_readiness'],
        'note': 'Staging approval does not authorize publication.',
    }
    candidate.validation_json = validation
    candidate.status = 'APPROVED_FOR_STAGING'
    db.commit()
    return {
        'candidate_id': candidate.id,
        'status': candidate.status,
        'release_readiness': result['release_readiness'],
        'publication_authorized': False,
    }
