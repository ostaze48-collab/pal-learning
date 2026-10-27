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
    )
    assert result.ready is False
    assert 'persistent_database' in result.blockers
    assert 'jwt_secret_configured' in result.blockers
    assert 'ai_provider_is_real' in result.blockers
    assert 'ai_provider_configured' in result.blockers


def test_postgres_openai_and_hardened_runtime_can_be_ready(monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'OPENAI')
    monkeypatch.setenv('OPENAI_API_KEY', 'test-key-present-only')
    monkeypatch.setenv('OPENAI_MODEL', 'configured-model')
    monkeypatch.setenv('JWT_SECRET', 'x' * 64)
    monkeypatch.setenv('BOOTSTRAP_ADMIN_PASSWORD', 'StrongBootstrapPassword123!')

    result = evaluate_production_readiness(
        database_backend='postgresql',
        allowed_origins=['https://pal-learning-web.onrender.com'],
    )
    assert result.ready is True
    assert result.blockers == []
    assert all(result.checks.values())
