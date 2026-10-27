from __future__ import annotations

from fastapi import APIRouter, Depends

from ..auth.deps import require_admin
from .source_policy import AUTHORITY_CAPABILITIES, public_source_policy

router = APIRouter(
    prefix='/importer/source-policy',
    tags=['curriculum-source-policy'],
    dependencies=[Depends(require_admin)],
)


@router.get('')
def get_source_authority_policy():
    return {
        'policy_version': 'source-authority/v1',
        'capabilities': list(AUTHORITY_CAPABILITIES),
        'sources': public_source_policy(),
        'rules': {
            'unknown_source_types': 'DENY_ALL',
            'factual_generation_requires': 'factual_grounding=true',
            'current_scope_links_require': 'current_scope_evidence=true',
            'answer_reference_requires': 'answer_validation=true',
        },
    }
