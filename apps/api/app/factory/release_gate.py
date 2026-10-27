from __future__ import annotations

from datetime import datetime, UTC

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.base import engine
from ..db.deps import get_db
from ..db.models import User
from ..db.staging_models import StagedLessonVersion
from ..services.release_manifest import build_release_manifest
from ..services.release_policy import release_policy_status

router = APIRouter(prefix='/factory', tags=['content-factory-release-gate'])


def _visual_rights_check(snapshot: dict | None) -> dict:
    unresolved = []
    image_count = 0
    for section_index, section in enumerate((snapshot or {}).get('sections') or []):
        for block_index, block in enumerate(section.get('blocks') or []):
            if block.get('block_type') != 'IMAGE':
                continue
            image_count += 1
            content = block.get('content') or {}
            status = content.get('rights_status')
            if status != 'CLEARED':
                unresolved.append({
                    'section_index': section_index,
                    'block_index': block_index,
                    'title': block.get('title') or content.get('title'),
                    'rights_status': status or 'MISSING',
                    'asset_kind': content.get('asset_kind'),
                    'source_label': content.get('source_label'),
                    'source_page': content.get('source_page'),
                })
    return {
        'image_count': image_count,
        'unresolved_count': len(unresolved),
        'all_visual_rights_cleared': not unresolved,
        'unresolved': unresolved,
    }


def calculate_final_release_gate(staged: StagedLessonVersion, database_backend: str) -> dict:
    qa = staged.qa_snapshot_json or {}
    academic = qa.get('academic_qa') or {}
    academic_result = academic.get('result') or {}
    confidence = float(academic_result.get('confidence') or 0)
    recommendation = academic.get('effective_recommendation')
    release_policy = release_policy_status()
    release_manifest = build_release_manifest(staged)
    visual_rights = _visual_rights_check(staged.snapshot_json)

    # This gate answers only whether the immutable staged snapshot is ready to be
    # handed to a future audited release transaction. Transaction availability is
    # intentionally NOT one of these checks; otherwise the gate could never say
    # READY_FOR_RELEASE_TRANSACTION before that mechanism exists.
    checks = {
        'deterministic_release_ready': staged.release_readiness == 'READY',
        'academic_qa_present': bool(academic),
        'academic_qa_passed': staged.status == 'ACADEMIC_QA_PASSED',
        'academic_effective_recommendation_pass': recommendation == 'PASS',
        'academic_confidence_at_least_85': confidence >= 85,
        'no_critical_findings': int(academic.get('critical_count') or 0) == 0,
        'no_unsupported_claims': int(academic.get('unsupported_claim_count') or 0) == 0,
        'all_visual_rights_cleared': visual_rights['all_visual_rights_cleared'],
        'persistent_production_database': database_backend in {'postgresql', 'postgres'},
        'immutable_staging_snapshot_present': bool(staged.snapshot_json),
        'release_manifest_present': bool(release_manifest.get('snapshot_sha256')) and bool(release_manifest.get('manifest_sha256')),
        'legacy_direct_publish_disabled': bool(release_policy['direct_legacy_publish_disabled']),
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
        'visual_rights': visual_rights,
        'release_manifest': release_manifest,
        'release_policy': release_policy,
        'release_transaction_available': bool(release_policy['audited_release_transaction_implemented']),
        # The gate is deliberately non-mutating. Even when a transaction is built,
        # this endpoint will remain an assessment endpoint rather than a publisher.
        'publication_authorized': False,
        'next_action': (
            'RUN_AUDITED_RELEASE_TRANSACTION'
            if ready and release_policy['audited_release_transaction_implemented']
            else 'BUILD_OR_ENABLE_AUDITED_RELEASE_TRANSACTION'
            if ready
            else 'RESOLVE_RELEASE_GATE_BLOCKERS'
        ),
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
