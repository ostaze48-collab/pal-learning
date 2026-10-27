import os
import socket
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.importer.router import _normalize_remote_content_type, _validate_source_url


def _public_dns(*args, **kwargs):
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('1.1.1.1', 443))]


def _private_dns(*args, **kwargs):
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('127.0.0.1', 443))]


def test_registered_source_requires_https_and_allowlisted_host(monkeypatch):
    monkeypatch.setenv('CURRICULUM_SOURCE_HOSTS', 'moe.edu.ps,download.sh-pal.com')
    monkeypatch.setattr(socket, 'getaddrinfo', _public_dns)

    assert _validate_source_url('https://moe.edu.ps/m/4070') == 'moe.edu.ps'

    with pytest.raises(ValueError, match='HTTPS'):
        _validate_source_url('http://moe.edu.ps/m/4070')

    with pytest.raises(ValueError, match='allowlisted'):
        _validate_source_url('https://example.com/file.pdf')


def test_registered_source_rejects_private_dns_resolution(monkeypatch):
    monkeypatch.setenv('CURRICULUM_SOURCE_HOSTS', 'moe.edu.ps')
    monkeypatch.setattr(socket, 'getaddrinfo', _private_dns)

    with pytest.raises(ValueError, match='non-public'):
        _validate_source_url('https://moe.edu.ps/m/4070')


def test_remote_pdf_signature_overrides_generic_mime():
    assert _normalize_remote_content_type('application/octet-stream', b'%PDF-1.7\nbody') == 'application/pdf'
    assert _normalize_remote_content_type('application/x-pdf', b'%PDF-1.4\nbody') == 'application/pdf'


def test_remote_binary_without_pdf_signature_is_rejected():
    with pytest.raises(ValueError, match='Unsupported remote curriculum content type'):
        _normalize_remote_content_type('application/octet-stream', b'not-a-pdf')
