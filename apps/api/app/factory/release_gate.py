from __future__ import annotations

from datetime import datetime, UTC

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.base import engine
from ..db.deps import get_db
from ..db.models import User
from ..db.staging_models import StagedLessonVersion

router = APIRouter(prefix='/factory', tags=['content-factory-release-gate'])


def calculate_final_release_gate(staged: StagedLessonVersion, database_backend: str) -> dict:
    qa = staged.qa_snapshot_json or {}
    academic = qa.get('academic_qa') or {}
    academic_result = academic.get('result') or {}
    confidence = float(academic_result.get('confidence') or 0)
    recommendation = academic.get('effective_recommendation')

    checks = {
        'deterministic_release_ready': staged.release_readiness == 'READY',
        'academic_qa_present': bool(academic),
        'academic_qa_passed': staged.status == 'ACADEMIC_QA_PASSED',
        'academic_effective_recommendation_pass': recommendation == 'PASS',
        'academic_confidence_at_least_85': confidence >= 85,
        'no_critical_findings': int(academic.get('critical_count') or 0) == 0,
        'no_unsupported_claims': int(academic.get('unsupported_claim_count') or 0) == 0,
        'persistent_production_database': database_backend in {'postgresql', 'postgres'},
        'immutable_staging_snapshot_present': bool(staged.snapshot_json),
    }
    ready = all(checks.values())
    blockers = [key for key, passed in checks.items() if not passed]
    return {
        'decision': 'READY_FOR_RELEASE_TRANSACTION' if ready else 'BLOCKED',
        'checks': checks,
        'blockers': blockers,
        'database_backend': database_backend,
        'release_readiness': staged.release_readiness,
        'academic_recommendation': recommendation,
        'academic_confidence': confidence,
        'publication_authorized': False,
        'note': 'This gate never publishes content. A separate audited release transaction is required.',
    }


@router.post('/staged-versions/{staged_version_id}/release-gate')
def run_final_release_gate(
    staged_version_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    staged = db.query(StagedLessonVersion).filter(StagedLessonVersion.id == staged_version_id).first()
    if not staged:
        raise HTTPException(404, 'Staged lesson version not found')

    result = calculate_final_release_gate(staged, engine.url.get_backend_name())
    qa = dict(staged.qa_snapshot_json or {})
    qa['final_release_gate'] = {
        **result,
        'checked_at': datetime.now(UTC).isoformat(),
        'checked_by_user_id': admin.id,
    }
    staged.qa_snapshot_json = qa
    db.commit()
    return {
        'staged_version_id': staged.id,
        **result,
    }
