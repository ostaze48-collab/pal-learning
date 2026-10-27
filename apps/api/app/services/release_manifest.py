from __future__ import annotations

import hashlib
import json
from typing import Any


MANIFEST_VERSION = 'release-manifest/v1'


def canonical_json_bytes(value: Any) -> bytes:
    """Serialize JSON deterministically for hashing/audit comparisons."""
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(',', ':'),
        allow_nan=False,
    ).encode('utf-8')


def sha256_json(value: Any) -> str:
    return hashlib.sha256(canonical_json_bytes(value)).hexdigest()


def build_release_manifest(staged) -> dict:
    snapshot = getattr(staged, 'snapshot_json', None) or {}
    qa_snapshot = getattr(staged, 'qa_snapshot_json', None) or {}
    academic = qa_snapshot.get('academic_qa') or {}
    academic_result = academic.get('result') or {}

    identity = {
        'staged_version_id': getattr(staged, 'id', None),
        'lesson_id': getattr(staged, 'lesson_id', None),
        'candidate_id': getattr(staged, 'candidate_id', None),
        'version_label': getattr(staged, 'version_label', None),
    }
    manifest_core = {
        'manifest_version': MANIFEST_VERSION,
        'identity': identity,
        'snapshot_sha256': sha256_json(snapshot),
        'snapshot_bytes': len(canonical_json_bytes(snapshot)),
        'release_readiness': getattr(staged, 'release_readiness', None),
        'academic_qa': {
            'effective_recommendation': academic.get('effective_recommendation'),
            'confidence': float(academic_result.get('confidence') or 0),
            'critical_count': int(academic.get('critical_count') or 0),
            'unsupported_claim_count': int(academic.get('unsupported_claim_count') or 0),
        },
    }
    return {
        **manifest_core,
        # The manifest hash excludes itself and therefore remains reproducible.
        'manifest_sha256': sha256_json(manifest_core),
    }
