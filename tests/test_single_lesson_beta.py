import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from fastapi.testclient import TestClient

from app.db.base import SessionLocal
from app.db.current_semester import ensure_current_semester_registry
from app.db.demo_experiment import DEMO_LESSON_CODE, ensure_experimental_demo
from app.db.models import Grade
from app.db.seed import run as seed
from app.main import app


seed()
with SessionLocal() as db:
    ensure_current_semester_registry(db)
    state = ensure_experimental_demo(db)
    assert state['ready'] is True
    grade5 = db.query(Grade).filter(Grade.code == 'G05').one()
    GRADE5_ID = grade5.id

client = TestClient(app)
EMAIL = 'single.lesson.beta.student@example.test'
PASSWORD = 'SingleLessonBeta123!'


def _student_headers():
    register = client.post('/auth/register-student', json={
        'email': EMAIL,
        'password': PASSWORD,
        'display_name': 'Beta Student',
        'grade_id': GRADE5_ID,
    })
    if register.status_code == 200:
        token = register.json()['access_token']
    else:
        login = client.post('/auth/login', json={'email': EMAIL, 'password': PASSWORD})
        assert login.status_code == 200, login.text
        token = login.json()['access_token']
    return {'Authorization': f'Bearer {token}'}


STUDENT_HEADERS = _student_headers()


def test_demo_info_is_single_lesson_scope():
    response = client.get('/demo/info')
    assert response.status_code == 200, response.text
    body = response.json()
    assert body['experimental'] is True
    assert body['scope'] == 'single-lesson-beta'
    assert body['grade'] == 5
    assert body['lesson']['lesson_code'] == DEMO_LESSON_CODE
    assert body['lesson']['title'] == 'المجهر واكتشاف الخلية'


def test_demo_home_lesson_questions_and_progress_flow():
    home = client.get('/demo/home', headers=STUDENT_HEADERS)
    assert home.status_code == 200, home.text
    assert home.json()['lesson']['lesson_code'] == DEMO_LESSON_CODE
    assert len(home.json()['plan']) == 3

    lesson = client.get('/demo/lesson', headers=STUDENT_HEADERS)
    assert lesson.status_code == 200, lesson.text
    lesson_body = lesson.json()
    assert lesson_body['lesson']['lesson_code'] == DEMO_LESSON_CODE
    assert len(lesson_body['sections']) == 7
    block_types = {block['block_type'] for section in lesson_body['sections'] for block in section['blocks']}
    assert {'INFO_CARD', 'TEXT', 'TIMELINE', 'MATCHING', 'SUMMARY'} <= block_types

    questions = client.get('/demo/questions', headers=STUDENT_HEADERS)
    assert questions.status_code == 200, questions.text
    rows = questions.json()
    assert len(rows) == 5
    assert all('correct_answer' not in row for row in rows)

    attempt = client.post(
        f"/demo/questions/{rows[0]['id']}/attempt",
        json={'answer': 0, 'response_time_ms': 2500, 'used_hint': False, 'used_ai_help': False},
        headers=STUDENT_HEADERS,
    )
    assert attempt.status_code == 200, attempt.text
    assert attempt.json()['correct'] is True
    assert attempt.json()['mastery_updates']

    progress = client.get('/demo/progress', headers=STUDENT_HEADERS)
    assert progress.status_code == 200, progress.text
    progress_body = progress.json()
    assert len(progress_body['skills']) == 4
    assert any(row['evidence_count'] > 0 for row in progress_body['skills'])


def test_demo_recovery_and_grounded_tutor_are_lesson_scoped():
    recovery = client.get('/demo/recovery', headers=STUDENT_HEADERS)
    assert recovery.status_code == 200, recovery.text
    assert recovery.json()['status'] in {'NOT_ENOUGH_EVIDENCE', 'REVIEW_RECOMMENDED'}

    tutor = client.post('/demo/tutor', json={'action': 'explain_simple'}, headers=STUDENT_HEADERS)
    assert tutor.status_code == 200, tutor.text
    body = tutor.json()
    assert body['mode'] == 'GROUNDED_DEMO_TUTOR'
    assert body['experimental'] is True
    assert body['lesson_code'] == DEMO_LESSON_CODE
    assert 'المجهر' in body['answer']
