import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.main import app


def test_published_lesson_runtime_routes_are_registered():
    paths = set(app.openapi()['paths'])
    assert '/learning/lessons/{lesson_id}/runtime' in paths
    assert '/learning/lessons/{lesson_id}/questions' in paths
    assert '/learning/lessons/{lesson_id}/progress' in paths
    assert '/learning/lessons/{lesson_id}/session-state' in paths


def test_api_advertises_published_lesson_runtime_capability():
    health_route = next(route for route in app.routes if getattr(route, 'path', None) == '/health')
    payload = health_route.endpoint()
    assert payload['version'] == '1.23.0'
    assert 'published-lesson-runtime' in payload['capabilities']
    assert 'textbook-visual-asset-extraction' in payload['capabilities']
    assert 'admin-visual-rights-review' in payload['capabilities']
