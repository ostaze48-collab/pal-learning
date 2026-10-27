import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'tests' / 'candidate_staging.db'
if DB.exists():
    DB.unlink()
os.environ['DATABASE_URL'] = f'sqlite:///{DB}'
os.environ['BOOTSTRAP_ADMIN_EMAIL'] = 'candidate.admin@example.test'
os.environ['BOOTSTRAP_ADMIN_PASSWORD'] = 'CandidateAdminPassword123!'
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from fastapi.testclient import TestClient
from app.db.seed import run as seed
from app.main import app

seed()
client = TestClient(app)
login = client.post('/auth/login', json={
    'email': 'candidate.admin@example.test',
    'password': 'CandidateAdminPassword123!',
})
assert login.status_code == 200, login.text
HEADERS = {'Authorization': f"Bearer {login.json()['access_token']}"}


def _prepare_valid_candidate():
    source_text = '''
العلوم والحياة — الصف الخامس — الفصل الثاني 2026
الوحدة الرابعة: أجهزة جسم الإنسان والجلد
الدرس الأول: الجهاز الهيكلي
يساعد الجهاز الهيكلي على دعامة الجسم وحماية بعض الأعضاء والمساعدة على الحركة.
'''.strip()
    uploaded = client.post(
        '/importer/source-packages/1/upload',
        data={'source_type': 'STUDENT_BOOK', 'edition': '2026', 'reliability_score': '100'},
        files={'file': ('science-grade5-2026.txt', source_text.encode('utf-8'), 'text/plain')},
        headers=HEADERS,
    )
    assert uploaded.status_code == 200, uploaded.text
    assert uploaded.json()['edition_match_score'] >= 90

    linked = client.post('/importer/source-packages/1/link-lessons', headers=HEADERS)
    assert linked.status_code == 200, linked.text

    queued = client.post('/factory/lessons/1/generate', headers=HEADERS)
    assert queued.status_code == 200, queued.text
    job_id = queued.json()['job_id']
    job = client.get(f'/factory/jobs/{job_id}', headers=HEADERS).json()
    chunk_id = job['input']['source_context'][0]['source_chunk_id']
    skill_code = job['input']['skills'][0]['skill_code']

    payload = {
        'learning_objectives': ['أن يفسر الطالب دور الجهاز الهيكلي في دعامة الجسم.'],
        'concepts': ['الجهاز الهيكلي', 'الدعامة'],
        'sections': [{
            'title': 'لماذا نحتاج إلى الهيكل؟',
            'learning_goal': 'فهم وظيفة الدعامة',
            'blocks': [{
                'block_type': 'TEXT',
                'title': 'فكرة أساسية',
                'body': 'يساعد الجهاز الهيكلي على دعامة الجسم.',
                'content': {},
                'source_chunk_ids': [chunk_id],
            }],
        }],
        'questions': [{
            'question_type': 'MCQ',
            'prompt': 'ما إحدى وظائف الجهاز الهيكلي؟',
            'options': ['دعامة الجسم', 'هضم الغذاء'],
            'correct_answer': 0,
            'explanation': 'يساعد الجهاز الهيكلي على دعامة الجسم.',
            'purpose': 'PRACTICE',
            'difficulty': 0.4,
            'skill_codes': [skill_code],
            'source_chunk_ids': [chunk_id],
        }],
        'summary': ['الجهاز الهيكلي يساعد على دعامة الجسم.'],
        'flashcards': [],
        'misconceptions': [],
        'remediation_candidates': [],
    }
    ingested = client.post(f'/factory/jobs/{job_id}/ingest-output', json=payload, headers=HEADERS)
    assert ingested.status_code == 200, ingested.text
    assert ingested.json()['status'] == 'READY_FOR_QA'
    return ingested.json()['candidate_id']


def test_candidate_preflight_and_staging_do_not_publish():
    candidate_id = _prepare_valid_candidate()

    qa = client.post(f'/factory/candidates/{candidate_id}/qa', headers=HEADERS)
    assert qa.status_code == 200, qa.text
    qa_data = qa.json()
    assert qa_data['preflight_status'] == 'PASS'
    assert qa_data['release_readiness'] in {'READY', 'BLOCKED'}
    assert 'source_evidence' in qa_data

    approved = client.post(f'/factory/candidates/{candidate_id}/approve-staging', headers=HEADERS)
    assert approved.status_code == 200, approved.text
    data = approved.json()
    assert data['status'] == 'APPROVED_FOR_STAGING'
    assert data['release_readiness'] == qa_data['release_readiness']
    assert data['publication_authorized'] is False

    lesson = client.get('/curriculum/lessons/1').json()
    # Staging approval is intentionally separate from the live lesson state.
    assert lesson['status'] == 'PUBLISHED'
