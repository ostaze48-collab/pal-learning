from types import SimpleNamespace

from app.factory.release_gate import calculate_final_release_gate


def _ready_stage(**overrides):
    academic = {
        'result': {'confidence': 95},
        'effective_recommendation': 'PASS',
        'critical_count': 0,
        'unsupported_claim_count': 0,
    }
    data = {
        'release_readiness': 'READY',
        'status': 'ACADEMIC_QA_PASSED',
        'snapshot_json': {'sections': [{'title': 'درس'}]},
        'qa_snapshot_json': {'academic_qa': academic},
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def test_postgres_academic_pass_is_ready_but_never_publishes():
    result = calculate_final_release_gate(_ready_stage(), 'postgresql')
    assert result['decision'] == 'READY_FOR_RELEASE_TRANSACTION'
    assert result['blockers'] == []
    assert result['publication_authorized'] is False


def test_sqlite_blocks_release_even_when_content_passes():
    result = calculate_final_release_gate(_ready_stage(), 'sqlite')
    assert result['decision'] == 'BLOCKED'
    assert 'persistent_production_database' in result['blockers']
    assert result['publication_authorized'] is False


def test_academic_block_or_unsupported_claim_blocks_release():
    stage = _ready_stage(
        status='ACADEMIC_QA_BLOCKED',
        qa_snapshot_json={'academic_qa': {
            'result': {'confidence': 99},
            'effective_recommendation': 'BLOCK',
            'critical_count': 0,
            'unsupported_claim_count': 1,
        }},
    )
    result = calculate_final_release_gate(stage, 'postgresql')
    assert result['decision'] == 'BLOCKED'
    assert 'academic_qa_passed' in result['blockers']
    assert 'academic_effective_recommendation_pass' in result['blockers']
    assert 'no_unsupported_claims' in result['blockers']
