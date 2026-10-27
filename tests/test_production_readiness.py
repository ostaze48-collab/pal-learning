from app.services.production_readiness import evaluate_production_readiness


def test_sqlite_and_local_mock_block_production(monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'LOCAL_MOCK')
    monkeypatch.setenv('JWT_SECRET', 'short')
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    monkeypatch.delenv('OPENAI_MODEL', raising=False)
    monkeypatch.delenv('BOOTSTRAP_ADMIN_PASSWORD', raising=False)

    result = evaluate_production_readiness(
        database_backend='sqlite',
        allowed_origins=['http://localhost:3000', 'https://pal-learning-web.onrender.com'],
        migration_current=False,
        migration_revision=None,
        migration_head='20261027_01',
    )
    assert result.ready is False
    assert 'persistent_database' in result.blockers
    assert 'database_migration_current' in result.blockers
    assert 'jwt_secret_configured' in result.blockers
    assert 'ai_provider_is_real' in result.blockers
    assert 'ai_provider_configured' in result.blockers
    assert 'audited_release_transaction_available' in result.blockers
    assert result.checks['source_authority_policy_fail_closed'] is True
    assert result.checks['legacy_direct_publish_disabled'] is True


def test_hardened_runtime_still_blocks_without_audited_release_transaction(monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'OPENAI')
    monkeypatch.setenv('OPENAI_API_KEY', 'test-key-present-only')
    monkeypatch.setenv('OPENAI_MODEL', 'configured-model')
    monkeypatch.setenv('JWT_SECRET', 'x' * 64)
    monkeypatch.setenv('BOOTSTRAP_ADMIN_PASSWORD', 'StrongBootstrapPassword123!')

    result = evaluate_production_readiness(
        database_backend='postgresql',
        allowed_origins=['https://pal-learning-web.onrender.com'],
        migration_current=True,
        migration_revision='20261027_01',
        migration_head='20261027_01',
    )
    assert result.ready is False
    assert result.blockers == ['audited_release_transaction_available']
    assert result.checks['persistent_database'] is True
    assert result.checks['database_migration_current'] is True
    assert result.checks['source_authority_policy_fail_closed'] is True
    assert result.checks['legacy_direct_publish_disabled'] is True
    assert result.checks['audited_release_transaction_available'] is False
    assert result.details['release_policy']['audited_release_transaction_implemented'] is False
