import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.main import app


def test_visual_asset_admin_routes_are_registered():
    paths = app.openapi()['paths']
    assert '/importer/lessons/{lesson_id}/visual-assets/extract' in paths
    assert '/importer/lessons/{lesson_id}/visual-assets' in paths
    assert '/importer/visual-assets/{asset_id}' in paths
    assert 'post' in paths['/importer/lessons/{lesson_id}/visual-assets/extract']
    assert 'get' in paths['/importer/lessons/{lesson_id}/visual-assets']
    assert 'patch' in paths['/importer/visual-assets/{asset_id}']


def test_visual_asset_review_contract_requires_rights_status():
    schema = app.openapi()['components']['schemas']['VisualAssetReview']
    assert 'rights_status' in schema['required']
    assert 'alt_text' in schema['properties']
    assert 'hotspots' in schema['properties']
