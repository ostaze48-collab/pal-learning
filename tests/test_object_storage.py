from pathlib import Path

from app.services.object_storage import persist_source_bytes, storage_configuration


def _clear(monkeypatch):
    for key in (
        'STORAGE_BACKEND','S3_BUCKET','R2_BUCKET','S3_ENDPOINT_URL','R2_ENDPOINT_URL',
        'S3_ACCESS_KEY_ID','R2_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY','R2_SECRET_ACCESS_KEY',
        'S3_PUBLIC_BASE_URL','R2_PUBLIC_BASE_URL','S3_REGION',
    ):
        monkeypatch.delenv(key, raising=False)


def test_local_storage_is_demo_only(monkeypatch, tmp_path):
    _clear(monkeypatch)
    config = storage_configuration()
    assert config.backend == 'LOCAL'
    assert config.durable is False
    assert config.configured is True

    local = tmp_path / 'book.pdf'
    local.write_bytes(b'%PDF-test')
    key = persist_source_bytes(
        data=b'%PDF-test',
        filename='book.pdf',
        checksum='a' * 64,
        content_type='application/pdf',
        local_path=local,
    )
    assert key == str(local)


def test_r2_requires_all_credentials(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv('STORAGE_BACKEND', 'R2')
    monkeypatch.setenv('R2_BUCKET', 'pal-learning')
    config = storage_configuration()
    assert config.durable is True
    assert config.configured is False
    assert 'S3_ENDPOINT_URL' in config.missing
    assert 'S3_ACCESS_KEY_ID' in config.missing
    assert 'S3_SECRET_ACCESS_KEY' in config.missing


def test_r2_configuration_can_be_complete_without_network_call(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv('STORAGE_BACKEND', 'R2')
    monkeypatch.setenv('R2_BUCKET', 'pal-learning')
    monkeypatch.setenv('R2_ENDPOINT_URL', 'https://account.r2.cloudflarestorage.com')
    monkeypatch.setenv('R2_ACCESS_KEY_ID', 'access')
    monkeypatch.setenv('R2_SECRET_ACCESS_KEY', 'secret')
    config = storage_configuration()
    assert config.backend == 'R2'
    assert config.durable is True
    assert config.configured is True
    assert config.missing == ()
