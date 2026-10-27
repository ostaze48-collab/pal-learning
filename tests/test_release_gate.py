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


def test_postgres_academic_pass_is_ready_for_transaction_but_gate_never_publishes():
    result = calculate_final_release_gate(_ready_stage(), 'postgresql')
    assert result['decision'] == 'READY_FOR_RELEASE_TRANSACTION'
    assert result['blockers'] == []
    assert result['publication_authorized'] is False
    assert result['checks']['legacy_direct_publish_disabled'] is True
    assert result['checks']['all_visual_rights_cleared'] is True
    assert result['release_policy']['direct_legacy_publish_disabled'] is True
    assert result['release_transaction_available'] is True
    assert result['release_policy']['audited_release_transaction_implemented'] is True
    assert result['next_action'] == 'RUN_AUDITED_RELEASE_TRANSACTION'


def test_sqlite_blocks_release_even_when_content_passes():
    result = calculate_final_release_gate(_ready_stage(), 'sqlite')
    assert result['decision'] == 'BLOCKED'
    assert 'persistent_production_database' in result['blockers']
    assert result['publication_authorized'] is False
    assert result['next_action'] == 'RESOLVE_RELEASE_GATE_BLOCKERS'


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
    assert result['publication_authorized'] is False


def test_uncleared_textbook_image_blocks_release():
    stage = _ready_stage(snapshot_json={
        'sections': [{
            'title': 'لاحظ الشكل',
            'blocks': [{
                'block_type': 'IMAGE',
                'title': 'صورة من الكتاب',
                'content': {
                    'rights_status': 'REVIEW_REQUIRED',
                    'asset_kind': 'TEXTBOOK_FIGURE',
                    'source_label': 'كتاب العلوم',
                    'source_page': 12,
                },
            }],
        }],
    })
    result = calculate_final_release_gate(stage, 'postgresql')
    assert result['decision'] == 'BLOCKED'
    assert 'all_visual_rights_cleared' in result['blockers']
    assert result['visual_rights']['unresolved_count'] == 1
    assert result['visual_rights']['unresolved'][0]['rights_status'] == 'REVIEW_REQUIRED'


def test_cleared_textbook_image_can_pass_visual_rights_gate():
    stage = _ready_stage(snapshot_json={
        'sections': [{
            'title': 'لاحظ الشكل',
            'blocks': [{
                'block_type': 'IMAGE',
                'title': 'صورة من الكتاب',
                'content': {
                    'rights_status': 'CLEARED',
                    'asset_kind': 'TEXTBOOK_FIGURE',
                    'source_label': 'كتاب العلوم',
                    'source_page': 12,
                },
            }],
        }],
    })
    result = calculate_final_release_gate(stage, 'postgresql')
    assert result['checks']['all_visual_rights_cleared'] is True
    assert result['visual_rights']['image_count'] == 1
