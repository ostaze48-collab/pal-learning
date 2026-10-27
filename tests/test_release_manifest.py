from types import SimpleNamespace

from app.services.release_manifest import build_release_manifest, canonical_json_bytes, sha256_json


def _stage(snapshot=None, confidence=95):
    return SimpleNamespace(
        id=7,
        lesson_id=3,
        candidate_id=11,
        version_label='v1.2.0',
        release_readiness='READY',
        snapshot_json=snapshot or {
            'sections': [
                {'title': 'الجهاز الهيكلي', 'blocks': [{'type': 'TEXT', 'body': 'يساعد على دعامة الجسم.'}]}
            ]
        },
        qa_snapshot_json={
            'academic_qa': {
                'result': {'confidence': confidence},
                'effective_recommendation': 'PASS',
                'critical_count': 0,
                'unsupported_claim_count': 0,
            }
        },
    )


def test_canonical_json_is_order_independent_for_object_keys():
    a = {'b': 2, 'a': {'y': 2, 'x': 1}}
    b = {'a': {'x': 1, 'y': 2}, 'b': 2}
    assert canonical_json_bytes(a) == canonical_json_bytes(b)
    assert sha256_json(a) == sha256_json(b)


def test_release_manifest_is_reproducible_for_same_staged_snapshot():
    first = build_release_manifest(_stage())
    second = build_release_manifest(_stage())
    assert first == second
    assert len(first['snapshot_sha256']) == 64
    assert len(first['manifest_sha256']) == 64
    assert first['manifest_version'] == 'release-manifest/v1'
    assert first['identity']['staged_version_id'] == 7


def test_snapshot_change_is_tamper_evident():
    original = build_release_manifest(_stage())
    changed = build_release_manifest(_stage({
        'sections': [
            {'title': 'الجهاز الهيكلي', 'blocks': [{'type': 'TEXT', 'body': 'نص مختلف ولو بحرف.'}]}
        ]
    }))
    assert original['snapshot_sha256'] != changed['snapshot_sha256']
    assert original['manifest_sha256'] != changed['manifest_sha256']


def test_qa_decision_change_changes_manifest_without_changing_snapshot_hash():
    strong = build_release_manifest(_stage(confidence=95))
    weaker = build_release_manifest(_stage(confidence=86))
    assert strong['snapshot_sha256'] == weaker['snapshot_sha256']
    assert strong['manifest_sha256'] != weaker['manifest_sha256']
