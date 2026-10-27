import os
import socket
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.importer.router import _validate_source_url


def _public_dns(*args, **kwargs):
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('203.0.113.20', 443))]


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
