import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'tests' / 'demo_beta_dashboard.db'
if DB.exists():
    DB.unlink()

os.environ['DATABASE_URL'] = f'sqlite:///{DB}'
os.environ['EXPERIMENTAL_DEMO'] = 'true'
os.environ['BOOTSTRAP_ADMIN_EMAIL'] = 'beta.admin@example.test'
os.environ['BOOTSTRAP_ADMIN_PASSWORD'] = 'BetaAdminPassword123!'
os.environ['BOOTSTRAP_DEMO_STUDENT_EMAIL'] = 'beta.student@example.test'
os.environ['BOOTSTRAP_DEMO_STUDENT_PASSWORD'] = 'BetaStudentPassword123!'
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from fastapi.testclient import TestClient
from app.db.base import SessionLocal
from app.db.current_semester import ensure_current_semester_registry
from app.db.demo_experiment import ensure_experimental_demo
from app.db.seed import run as seed
from app.main import app

seed()
with SessionLocal() as db:
    ensure_current_semester_registry(db)
    demo = ensure_experimental_demo(db)
    assert demo['ready'] is True

client = TestClient(app)
admin_login = client.post('/auth/login', json={
    'email': 'beta.admin@example.test',
    'password': 'BetaAdminPassword123!',
})
assert admin_login.status_code == 200, admin_login.text
ADMIN = {'Authorization': f"Bearer {admin_login.json()['access_token']}"}

student_login = client.post('/auth/login', json={
    'email': 'beta.student@example.test',
    'password': 'BetaStudentPassword123!',
})
assert student_login.status_code == 200, student_login.text
STUDENT = {'Authorization': f"Bearer {student_login.json()['access_token']}"}


def test_demo_health_and_scope_are_single_lesson():
    health = client.get('/demo/health')
    assert health.status_code == 200
    data = health.json()
    assert data['ready'] is True
    assert data['scope'] == 'single-lesson-beta'
    assert data['counts']['sections'] == 7
    assert data['counts']['questions'] == 5
    assert data['counts']['skills'] >= 4

    info = client.get('/demo/info')
    assert info.status_code == 200
    assert info.json()['lesson']['lesson_code'] == 'PS.G05.SCI.S1.U01.L01'
    assert info.json()['grade'] == 5
    assert info.json()['semester'] == 1


def test_beta_admin_dashboard_requires_admin():
    assert client.get('/demo/admin/dashboard').status_code == 401
    assert client.get('/demo/admin/dashboard', headers=STUDENT).status_code == 403
    response = client.get('/demo/admin/dashboard', headers=ADMIN)
    assert response.status_code == 200
    data = response.json()
    assert data['scope'] == 'single-lesson-beta'
    assert data['release_policy']['scope_locked_to_one_lesson'] is True
    assert data['release_policy']['uses_production_publish_state'] is False


def test_student_activity_appears_in_beta_operations_dashboard():
    lesson = client.get('/demo/lesson', headers=STUDENT)
    assert lesson.status_code == 200
    assert lesson.json()['lesson']['title'] == 'المجهر واكتشاف الخلية'

    questions = client.get('/demo/questions', headers=STUDENT)
    assert questions.status_code == 200
    rows = questions.json()
    assert len(rows) == 5

    first = rows[0]
    attempt = client.post(
        f"/demo/questions/{first['id']}/attempt",
        json={'answer': 0, 'response_time_ms': 3000},
        headers=STUDENT,
    )
    assert attempt.status_code == 200
    assert attempt.json()['correct'] is True

    tutor = client.post(
        '/demo/tutor',
        json={'action': 'explain_simple'},
        headers=STUDENT,
    )
    assert tutor.status_code == 200
    assert tutor.json()['mode'] == 'GROUNDED_DEMO_TUTOR'

    dashboard = client.get('/demo/admin/dashboard', headers=ADMIN)
    assert dashboard.status_code == 200
    data = dashboard.json()
    assert data['students']['attempted_lesson'] >= 1
    assert data['learning']['lesson_starts'] >= 1
    assert data['learning']['question_attempts'] >= 1
    assert data['learning']['correct_answers'] >= 1
    assert data['ai_tutor']['requests'] >= 1
