import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from app.main import app


def test_current_semester_pipeline_accepts_lesson_id_query():
    operation = app.openapi()['paths']['/admin/current-semester/pipeline']['get']
    params = {item['name']: item for item in operation.get('parameters', [])}
    assert 'lesson_id' in params
    assert params['lesson_id']['in'] == 'query'
    assert params['lesson_id']['required'] is False


def test_current_semester_pipeline_remains_admin_protected():
    operation = app.openapi()['paths']['/admin/current-semester/pipeline']['get']
    assert operation.get('security')
