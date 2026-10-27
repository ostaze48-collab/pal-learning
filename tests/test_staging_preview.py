import base64

import pytest
from fastapi import HTTPException

from app.factory.staging_preview import (
    PREVIEW_PURPOSE,
    create_preview_token,
    decode_preview_token,
)


def test_staging_preview_token_is_short_lived_and_scoped(monkeypatch):
    monkeypatch.setenv('JWT_SECRET', 'preview-secret-' + ('x' * 48))
    monkeypatch.setenv('STAGING_PREVIEW_TTL_SECONDS', '120')

    token, expires_at = create_preview_token(42, 7)
    claims = decode_preview_token(token)

    assert claims['purpose'] == PREVIEW_PURPOSE
    assert claims['staged_version_id'] == 42
    assert claims['approved_by_user_id'] == 7
    assert claims['sub'] == 'staged:42'
    assert 0 < claims['exp'] - claims['iat'] <= 120
    assert int(expires_at.timestamp()) == claims['exp']


def test_staging_preview_rejects_tampered_token(monkeypatch):
    monkeypatch.setenv('JWT_SECRET', 'preview-secret-' + ('x' * 48))
    token, _ = create_preview_token(11, 3)
    replacement = 'A' if token[-1] != 'A' else 'B'
    tampered = token[:-1] + replacement

    with pytest.raises(HTTPException) as exc:
        decode_preview_token(tampered)
    assert exc.value.status_code == 401


def test_staging_preview_rejects_equivalent_noncanonical_signature(monkeypatch):
    monkeypatch.setenv('JWT_SECRET', 'preview-secret-' + ('x' * 48))
    token, _ = create_preview_token(11, 3)
    header, payload, signature = token.split('.')
    padding = '=' * ((4 - len(signature) % 4) % 4)
    expected_bytes = base64.urlsafe_b64decode((signature + padding).encode('ascii'))
    alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

    equivalent = None
    for candidate in alphabet:
        if candidate == signature[-1]:
            continue
        candidate_signature = signature[:-1] + candidate
        try:
            decoded = base64.urlsafe_b64decode((candidate_signature + padding).encode('ascii'))
        except ValueError:
            continue
        if decoded == expected_bytes:
            equivalent = candidate_signature
            break

    assert equivalent is not None
    noncanonical = f'{header}.{payload}.{equivalent}'

    with pytest.raises(HTTPException) as exc:
        decode_preview_token(noncanonical)
    assert exc.value.status_code == 401


def test_staging_preview_fails_closed_with_weak_secret(monkeypatch):
    monkeypatch.setenv('JWT_SECRET', 'short')
    with pytest.raises(HTTPException) as exc:
        create_preview_token(1, 1)
    assert exc.value.status_code == 503
