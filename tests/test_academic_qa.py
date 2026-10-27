import os
import sys
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'tests' / 'academic_qa.db'
if DB.exists():
    DB.unlink()
os.environ['DATABASE_URL'] = f'sqlite:///{DB}'
os.environ['BOOTSTRAP_ADMIN_EMAIL'] = 'academic.admin@example.test'
os.environ['BOOTSTRAP_ADMIN_PASSWORD'] = 'AcademicQaTestPassword123!'
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from fastapi.testclient import TestClient
from app.db.seed import run as seed
from app.main import app

seed()
client = TestClient(app)
login = client.post('/auth/login', json={
    'email': 'academic.admin@example.test',
    'password': 'AcademicQaTestPassword123!',
})
assert login.status_code == 200, login.text
HEADERS = {'Authorization': f"Bearer {login.json()['access_token']}"}


def _verify_teaching_links(lesson_id: int = 1):
    response = client.get(f'/importer/lessons/{lesson_id}/source-links', headers=HEADERS)
    assert response.status_code == 200, response.text
    verified = 0
    for link in response.json()['links']:
        if not link['factual_grounding_authorized']:
            continue
        if link['status'] == 'VERIFIED':
            verified += 1
            continue
        result = client.post(f"/importer/lesson-source-links/{link['id']}/verify", headers=HEADERS)
        assert result.status_code == 200, result.text
        assert result.json()['status'] == 'VERIFIED'
        verified += 1
    assert verified >= 1


def _stage_release_ready_lesson():
    text = '''
العلوم والحياة الصف الخامس الفصل الثاني 2026
الوحدة الرابعة: أجهزة جسم الإنسان والجلد
الدرس الأول: الجهاز الهيكلي
يساعد الجهاز الهيكلي على دعامة الجسم وحماية بعض الأعضاء والمساعدة على الحركة.
'''.strip()
    text += f'\nTEST_NONCE {uuid4()}'
    upload = client.post(
        '/importer/source-packages/1/upload',
        data={'source_type': 'STUDENT_BOOK', 'edition': '2026', 'reliability_score': '100'},
        files={'file': ('academic-qa-science-2026.txt', text.encode('utf-8'), 'text/plain')},
        headers=HEADERS,
    )
    assert upload.status_code in {200, 409}, upload.text
    if upload.status_code == 200:
        assert upload.json()['edition_match_score'] >= 90
    else:
        assert upload.json()['detail']['existing_source_file_id'] >= 1

    linked = client.post('/importer/source-packages/1/link-lessons', headers=HEADERS)
    assert linked.status_code == 200, linked.text
    _verify_teaching_links(1)

    queued = client.post('/factory/lessons/1/generate', headers=HEADERS)
    assert queued.status_code == 200, queued.text
    job_id = queued.json()['job_id']
    packet = client.get(f'/factory/jobs/{job_id}', headers=HEADERS).json()['input']
    chunk_id = packet['source_context'][0]['source_chunk_id']
    skill_code = packet['skills'][0]['skill_code']

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
        'summary': [{
            'text': 'الجهاز الهيكلي يساعد على دعامة الجسم.',
            'source_chunk_ids': [chunk_id],
        }],
        'flashcards': [],
        'misconceptions': [],
        'remediation_candidates': [],
    }
    ingested = client.post(f'/factory/jobs/{job_id}/ingest-output', json=payload, headers=HEADERS)
    assert ingested.status_code == 200, ingested.text
    candidate_id = ingested.json()['candidate_id']

    qa = client.post(f'/factory/candidates/{candidate_id}/qa', headers=HEADERS)
    assert qa.status_code == 200, qa.text
    assert qa.json()['preflight_status'] == 'PASS'
    assert qa.json()['release_readiness'] == 'READY'

    staged = client.post(f'/factory/candidates/{candidate_id}/approve-staging', headers=HEADERS)
    assert staged.status_code == 200, staged.text
    return staged.json()['staged_version_id'], chunk_id


def test_academic_qa_queue_waits_for_provider_and_overrides_false_pass():
    staged_id, chunk_id = _stage_release_ready_lesson()

    queued = client.post(f'/factory/staged-versions/{staged_id}/academic-qa/queue', headers=HEADERS)
    assert queued.status_code == 200, queued.text
    job_id = queued.json()['job_id']
    assert queued.json()['source_chunks'] >= 1

    executed = client.post(f'/factory/jobs/{job_id}/execute', headers=HEADERS)
    assert executed.status_code == 200, executed.text
    assert executed.json()['status'] == 'WAITING_PROVIDER'

    result = {
        'errors': [],
        'conflicts': [],
        'unsupported_claims': [{
            'code': 'UNSUPPORTED-001',
            'severity': 'ERROR',
            'category': 'SOURCE_GROUNDING',
            'message': 'ادعاء تجريبي غير مدعوم بالمصدر.',
            'source_chunk_ids': [chunk_id],
        }],
        'question_issues': [],
        'age_appropriateness_issues': [],
        'confidence': 99,
        'recommendation': 'PASS',
        'summary': 'المراجع اقترح PASS لكن توجد مطالبة غير مدعومة.',
    }
    stored = client.post(
        f'/factory/academic-qa/jobs/{job_id}/ingest-output',
        json=result,
        headers=HEADERS,
    )
    assert stored.status_code == 200, stored.text
    data = stored.json()
    assert data['provider_recommendation'] == 'PASS'
    assert data['effective_recommendation'] == 'BLOCK'
    assert data['status'] == 'ACADEMIC_QA_BLOCKED'
    assert data['publication_authorized'] is False

    staged = client.get(f'/factory/staged-versions/{staged_id}', headers=HEADERS).json()
    assert staged['qa_snapshot']['academic_qa']['effective_recommendation'] == 'BLOCK'
    assert staged['qa_snapshot']['academic_qa']['publication_authorized'] is False


def test_academic_qa_rejects_citation_outside_review_packet():
    staged_id, _ = _stage_release_ready_lesson()
    queued = client.post(f'/factory/staged-versions/{staged_id}/academic-qa/queue', headers=HEADERS)
    assert queued.status_code == 200
    job_id = queued.json()['job_id']
    result = {
        'errors': [{
            'code': 'BAD-CITE',
            'severity': 'ERROR',
            'category': 'SOURCE_GROUNDING',
            'message': 'مرجع غير موجود في حزمة المراجعة.',
            'source_chunk_ids': [999999],
        }],
        'conflicts': [],
        'unsupported_claims': [],
        'question_issues': [],
        'age_appropriateness_issues': [],
        'confidence': 80,
        'recommendation': 'REVIEW',
        'summary': 'اختبار مرجع خارج الحزمة.',
    }
    response = client.post(
        f'/factory/academic-qa/jobs/{job_id}/ingest-output',
        json=result,
        headers=HEADERS,
    )
    assert response.status_code == 422
