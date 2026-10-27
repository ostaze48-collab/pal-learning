from app.services.object_storage import storage_configuration


def _clear(monkeypatch):
    for key in [
        'STORAGE_BACKEND',
        'R2_BUCKET', 'R2_ENDPOINT_URL', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_BASE_URL',
        'S3_BUCKET', 'S3_ENDPOINT_URL', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_PUBLIC_BASE_URL',
    ]:
        monkeypatch.delenv(key, raising=False)


def test_r2_diagnostics_name_r2_variables(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv('STORAGE_BACKEND', 'R2')
    config = storage_configuration()
    assert config.backend == 'R2'
    assert config.durable is True
    assert config.configured is False
    assert config.missing == (
        'R2_BUCKET',
        'R2_ENDPOINT_URL',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
    )


def test_r2_accepts_native_r2_variables(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv('STORAGE_BACKEND', 'R2')
    monkeypatch.setenv('R2_BUCKET', 'curriculum')
    monkeypatch.setenv('R2_ENDPOINT_URL', 'https://example.r2.cloudflarestorage.com')
    monkeypatch.setenv('R2_ACCESS_KEY_ID', 'access')
    monkeypatch.setenv('R2_SECRET_ACCESS_KEY', 'secret')
    config = storage_configuration()
    assert config.configured is True
    assert config.missing == ()
    assert config.bucket == 'curriculum'


def test_local_storage_remains_development_only(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv('STORAGE_BACKEND', 'LOCAL')
    config = storage_configuration()
    assert config.backend == 'LOCAL'
    assert config.configured is True
    assert config.durable is False
