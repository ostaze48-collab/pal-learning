import os
import sys
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'tests' / 'pilot_end_to_end.db'
if DB.exists():
    DB.unlink()

os.environ['DATABASE_URL'] = f'sqlite:///{DB}'
os.environ['EXPERIMENTAL_DEMO'] = 'true'
os.environ['BOOTSTRAP_ADMIN_EMAIL'] = 'pilot.admin@example.test'
os.environ['BOOTSTRAP_ADMIN_PASSWORD'] = 'PilotAdminPassword123!'
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from fastapi.testclient import TestClient
from app.db.seed import run as seed
from app.main import app


seed()


def test_single_lesson_pilot_complete_student_journey():
    with TestClient(app) as client:
        health = client.get('/demo/health')
        assert health.status_code == 200, health.text
        health_data = health.json()
        assert health_data['ready'] is True
        assert health_data['scope'] == 'single-lesson-beta'
        assert health_data['lesson_code'] == 'PS.G05.SCI.S1.U01.L01'
        assert health_data['counts']['sections'] == 7
        assert health_data['counts']['questions'] == 5
        assert health_data['counts']['skills'] >= 4

        grades = client.get('/curriculum/grades')
        assert grades.status_code == 200, grades.text
        grade5 = next(row for row in grades.json() if row['code'] == 'G05')

        student_email = f'pilot.student.{uuid4().hex[:10]}@example.test'
        registered = client.post('/auth/register-student', json={
            'email': student_email,
            'password': 'PilotStudentPassword123!',
            'display_name': 'طالب النسخة التجريبية',
            'grade_id': grade5['id'],
        })
        assert registered.status_code == 200, registered.text
        student_headers = {'Authorization': f"Bearer {registered.json()['access_token']}"}

        home = client.get('/demo/home', headers=student_headers)
        assert home.status_code == 200, home.text
        home_data = home.json()
        assert home_data['course'] == {'grade': 5, 'subject': 'العلوم والحياة', 'semester': 1}
        assert home_data['lesson']['lesson_code'] == 'PS.G05.SCI.S1.U01.L01'
        assert home_data['lesson']['title'] == 'المجهر واكتشاف الخلية'
        assert home_data['skills_count'] >= 4

        lesson = client.get('/demo/lesson', headers=student_headers)
        assert lesson.status_code == 200, lesson.text
        lesson_data = lesson.json()
        assert len(lesson_data['sections']) == 7
        assert all(section['blocks'] for section in lesson_data['sections'])

        questions = client.get('/demo/questions', headers=student_headers)
        assert questions.status_code == 200, questions.text
        question_rows = questions.json()
        assert len(question_rows) == 5

        correct_attempt = client.post(
            f"/demo/questions/{question_rows[0]['id']}/attempt",
            json={'answer': 0, 'response_time_ms': 3500},
            headers=student_headers,
        )
        assert correct_attempt.status_code == 200, correct_attempt.text
        assert correct_attempt.json()['correct'] is True
        assert correct_attempt.json()['mastery_updates']

        wrong_attempt = client.post(
            f"/demo/questions/{question_rows[1]['id']}/attempt",
            json={'answer': 1, 'response_time_ms': 4200},
            headers=student_headers,
        )
        assert wrong_attempt.status_code == 200, wrong_attempt.text
        assert wrong_attempt.json()['correct'] is False
        assert wrong_attempt.json()['mastery_updates']

        progress = client.get('/demo/progress', headers=student_headers)
        assert progress.status_code == 200, progress.text
        progress_data = progress.json()
        assessed = [row for row in progress_data['skills'] if row['evidence_count'] > 0]
        assert len(assessed) >= 2
        assert any(row['status'] == 'NEEDS_SUPPORT' for row in assessed)

        recovery = client.get('/demo/recovery', headers=student_headers)
        assert recovery.status_code == 200, recovery.text
        recovery_data = recovery.json()
        assert recovery_data['status'] == 'REVIEW_RECOMMENDED'
        assert recovery_data['estimated_minutes'] == 4
        assert recovery_data['blocks']

        tutor = client.post(
            '/demo/tutor',
            json={'action': 'explain_simple'},
            headers=student_headers,
        )
        assert tutor.status_code == 200, tutor.text
        tutor_data = tutor.json()
        assert tutor_data['mode'] == 'GROUNDED_DEMO_TUTOR'
        assert tutor_data['lesson_code'] == 'PS.G05.SCI.S1.U01.L01'
        assert tutor_data['answer']

        admin_login = client.post('/auth/login', json={
            'email': 'pilot.admin@example.test',
            'password': 'PilotAdminPassword123!',
        })
        assert admin_login.status_code == 200, admin_login.text
        admin_headers = {'Authorization': f"Bearer {admin_login.json()['access_token']}"}

        dashboard = client.get('/demo/admin/dashboard', headers=admin_headers)
        assert dashboard.status_code == 200, dashboard.text
        dashboard_data = dashboard.json()
        assert dashboard_data['scope'] == 'single-lesson-beta'
        assert dashboard_data['lesson']['lesson_code'] == 'PS.G05.SCI.S1.U01.L01'
        assert dashboard_data['learning']['lesson_starts'] >= 1
        assert dashboard_data['learning']['question_attempts'] >= 2
        assert dashboard_data['ai_tutor']['requests'] >= 1
        assert dashboard_data['release_policy']['scope_locked_to_one_lesson'] is True
        assert dashboard_data['release_policy']['uses_production_publish_state'] is False
