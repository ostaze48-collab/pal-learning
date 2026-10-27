import os
import sys
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'tests' / 'demo_matching_activity.db'
if DB.exists():
    DB.unlink()

os.environ['DATABASE_URL'] = f'sqlite:///{DB}'
os.environ['EXPERIMENTAL_DEMO'] = 'true'
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from fastapi.testclient import TestClient
from app.db.base import SessionLocal
from app.db.models import LearningEvent
from app.db.seed import run as seed
from app.main import app

seed()


def test_matching_activity_is_interactive_and_records_learning_event():
    with TestClient(app) as client:
        grades = client.get('/curriculum/grades').json()
        grade5 = next(row for row in grades if row['code'] == 'G05')
        registered = client.post('/auth/register-student', json={
            'email': f'activity.{uuid4().hex[:10]}@example.test',
            'password': 'ActivityStudentPassword123!',
            'display_name': 'طالب نشاط المطابقة',
            'grade_id': grade5['id'],
        })
        assert registered.status_code == 200, registered.text
        headers = {'Authorization': f"Bearer {registered.json()['access_token']}"}
        student_id = registered.json()['student_id']

        activity = client.get('/demo/activity', headers=headers)
        assert activity.status_code == 200, activity.text
        payload = activity.json()
        assert payload['lesson_code'] == 'PS.G05.SCI.S1.U01.L01'
        assert payload['total'] >= 2
        assert len(payload['items']) == payload['total']
        assert len(payload['choices']) == payload['total']
        assert all('label' in item for item in payload['items'])
        assert 'correct_answer' not in payload

        # Submit one choice per item. The server, not the client, owns the answer key.
        answers = {
            item['id']: payload['choices'][index % len(payload['choices'])]
            for index, item in enumerate(payload['items'])
        }
        checked = client.post(
            f"/demo/activity/{payload['activity_id']}/check",
            json={'answers': answers},
            headers=headers,
        )
        assert checked.status_code == 200, checked.text
        result = checked.json()
        assert result['total'] == payload['total']
        assert 0 <= result['score'] <= result['total']
        assert 0 <= result['percent'] <= 100
        assert len(result['results']) == result['total']

        with SessionLocal() as db:
            event = db.query(LearningEvent).filter(
                LearningEvent.student_id == student_id,
                LearningEvent.event_type == 'ACTIVITY_COMPLETED',
            ).order_by(LearningEvent.id.desc()).first()
            assert event is not None
            assert event.metadata_json['activity_type'] == 'MATCHING'
            assert event.metadata_json['total'] == payload['total']
