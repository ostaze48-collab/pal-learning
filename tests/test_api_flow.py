import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'tests' / 'api_flow.db'
if DB.exists():
    DB.unlink()
os.environ['DATABASE_URL'] = f'sqlite:///{DB}'
os.environ['BOOTSTRAP_ADMIN_EMAIL'] = 'admin@example.test'
os.environ['BOOTSTRAP_ADMIN_PASSWORD'] = 'StrongDemoPassword123!'
os.environ['BOOTSTRAP_DEMO_STUDENT_EMAIL'] = 'demo.student@example.test'
os.environ['BOOTSTRAP_DEMO_STUDENT_PASSWORD'] = 'StudentDemoPassword123!'
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from fastapi.testclient import TestClient
from app.db.base import SessionLocal
from app.db.models import Lesson, Question
from app.db.seed import run as seed
from app.main import app

seed()
client = TestClient(app)
_login = client.post('/auth/login', json={'email':'admin@example.test','password':'StrongDemoPassword123!'})
assert _login.status_code == 200, _login.text
ADMIN_HEADERS = {'Authorization': f"Bearer {_login.json()['access_token']}"}
_student_login = client.post('/auth/login', json={'email':'demo.student@example.test','password':'StudentDemoPassword123!'})
assert _student_login.status_code == 200, _student_login.text
STUDENT_HEADERS = {'Authorization': f"Bearer {_student_login.json()['access_token']}"}


def _verify_teaching_links(lesson_id: int = 1):
    response = client.get(f'/importer/lessons/{lesson_id}/source-links', headers=ADMIN_HEADERS)
    assert response.status_code == 200, response.text
    verified = 0
    for link in response.json()['links']:
        if not link['factual_grounding_authorized']:
            continue
        if link['status'] == 'VERIFIED':
            verified += 1
            continue
        result = client.post(f"/importer/lesson-source-links/{link['id']}/verify", headers=ADMIN_HEADERS)
        assert result.status_code == 200, result.text
        assert result.json()['status'] == 'VERIFIED'
        verified += 1
    assert verified >= 1


def test_diagnostic_and_recovery_flow():
    skills = client.get('/learning/skills').json()
    target = next(x for x in skills if x['skill_code'] == 'SK.MATH.FRACTION.ADDITION')
    r = client.post('/learning/diagnostics/start', json={'target_skill_id': target['id']}, headers=STUDENT_HEADERS)
    assert r.status_code == 200
    data = r.json()
    assert data['root_gap_skill_id'] is not None
    assert data['remediation']['estimated_minutes'] == 7


def test_attempt_updates_mastery_only_for_published_question():
    blocked = client.post('/learning/questions/1/attempt', json={'answer': 1, 'response_time_ms': 5000}, headers=STUDENT_HEADERS)
    assert blocked.status_code == 404

    db = SessionLocal()
    try:
        lesson = db.query(Lesson).filter(Lesson.id == 1).one()
        question = db.query(Question).filter(Question.id == 1).one()
        lesson.status = 'PUBLISHED'
        question.status = 'PUBLISHED'
        db.commit()

        r = client.post('/learning/questions/1/attempt', json={'answer': 1, 'response_time_ms': 5000}, headers=STUDENT_HEADERS)
        assert r.status_code == 200
        assert r.json()['correct'] is True
        assert r.json()['mastery_updates'][0]['confidence'] < 0.5
    finally:
        lesson = db.query(Lesson).filter(Lesson.id == 1).one()
        question = db.query(Question).filter(Question.id == 1).one()
        lesson.status = 'DRAFT'
        question.status = 'DRAFT'
        db.commit()
        db.close()


def test_offline_sync_is_idempotent():
    payload = {'events': [{'event_uuid': 'offline-demo-1', 'event_type': 'CONTENT_VIEWED', 'device_id': 'demo-phone'}]}
    a = client.post('/learning/sync', json=payload, headers=STUDENT_HEADERS).json()
    b = client.post('/learning/sync', json=payload, headers=STUDENT_HEADERS).json()
    assert a['accepted'] == 1
    assert b['duplicates'] == 1


def test_qa_gate_blocks_unverified_source_provenance():
    r = client.post('/qa/lessons/1/run', headers=ADMIN_HEADERS)
    assert r.status_code == 200
    data = r.json()
    assert data['status'] != 'PASS'
    p = client.post('/qa/lessons/1/publish', headers=ADMIN_HEADERS)
    assert p.status_code == 409
    assert p.json()['detail']['publication_authorized'] is False


def test_learning_health_endpoint():
    r = client.get('/admin/learning-health', headers=ADMIN_HEADERS)
    assert r.status_code == 200
    data = r.json()
    assert data['students'] >= 1
    assert len(data['weakest_skills']) >= 1


def test_import_text_source_analyze_and_link_lesson():
    text = 'الوحدة الرابعة: أجهزة جسم الإنسان والجلد\nالدرس الأول: الجهاز الهيكلي\nالجهاز الهيكلي يدعم الجسم ويحمي بعض الأعضاء.\nالدرس الثاني: الجهاز العضلي'
    r = client.post(
        '/importer/source-packages/1/upload',
        data={'source_type': 'STUDENT_BOOK', 'edition': '2026', 'reliability_score': '95'},
        files={'file': ('science-2026-demo.txt', text.encode('utf-8'), 'text/plain')},
        headers=ADMIN_HEADERS,
    )
    assert r.status_code == 200
    source_id = r.json()['source_file_id']
    chunks = client.get(f'/importer/source-files/{source_id}/chunks', headers=ADMIN_HEADERS)
    assert chunks.status_code == 200
    assert len(chunks.json()) >= 1
    structure = client.post(f'/importer/source-files/{source_id}/analyze', headers=ADMIN_HEADERS).json()
    assert structure['unit_count'] == 1
    assert structure['lesson_count'] == 2
    linked = client.post('/importer/source-packages/1/link-lessons', headers=ADMIN_HEADERS).json()
    assert any(x.get('lesson_title') == 'الجهاز الهيكلي' and x.get('linked') for x in linked['candidates'])
    _verify_teaching_links(1)


def test_solution_upload_and_alignment():
    text = 'سؤال 1: ما الجزء الذي يعطي جسم الإنسان دعامة أساسية؟\nجواب: العظام'
    r = client.post(
        '/importer/source-packages/1/upload',
        data={'source_type': 'SOLUTIONS', 'edition': '2026', 'reliability_score': '90'},
        files={'file': ('solutions-demo.txt', text.encode('utf-8'), 'text/plain')},
        headers=ADMIN_HEADERS,
    )
    assert r.status_code == 200
    aligned = client.post('/qa/source-packages/1/align-solutions', headers=ADMIN_HEADERS)
    assert aligned.status_code == 200
    data = aligned.json()
    assert data['solution_items_detected'] == 1
    assert data['answer_validation_source_policy_enforced'] is True
    first = next(x for x in data['matches'] if x['question_id'] == 1)
    assert first['matched'] is True
    assert first['source_file_id'] == r.json()['source_file_id']
    assert first['validation']['status'] == 'VERIFIED_MATCH'


def test_generation_packet_requires_and_uses_provenance():
    client.post('/importer/source-packages/1/link-lessons', headers=ADMIN_HEADERS)
    _verify_teaching_links(1)
    r = client.post('/factory/lessons/1/generate', headers=ADMIN_HEADERS)
    assert r.status_code == 200
    data = r.json()
    assert data['source_chunks'] >= 1
    assert data['skills'] >= 1
    job = client.get(f"/factory/jobs/{data['job_id']}", headers=ADMIN_HEADERS).json()
    assert job['input']['generation_rules']['provenance_required'] is True
    assert job['input']['generation_rules']['source_authority_enforced'] is True
    assert len(job['input']['source_context']) >= 1
    executed = client.post(f"/factory/jobs/{data['job_id']}/execute", headers=ADMIN_HEADERS)
    assert executed.status_code == 200
    assert executed.json()['status'] == 'WAITING_PROVIDER'


def _valid_generated_payload(chunk_id: int, skill_code: str):
    return {
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
            'prompt': 'ما الجزء الذي يساعد على دعامة الجسم؟',
            'options': ['العظام', 'الشعر'],
            'correct_answer': 0,
            'explanation': 'العظام تكوّن الجهاز الهيكلي.',
            'purpose': 'PRACTICE',
            'difficulty': 0.4,
            'skill_codes': [skill_code],
            'source_chunk_ids': [chunk_id],
        }],
        'summary': [{'text': 'الجهاز الهيكلي يساعد على دعامة الجسم.', 'source_chunk_ids': [chunk_id]}],
        'flashcards': [],
        'misconceptions': [],
        'remediation_candidates': [],
    }


def test_structured_output_candidate_accepts_only_packet_provenance():
    client.post('/importer/source-packages/1/link-lessons', headers=ADMIN_HEADERS)
    _verify_teaching_links(1)
    queued_response = client.post('/factory/lessons/1/generate', headers=ADMIN_HEADERS)
    assert queued_response.status_code == 200, queued_response.text
    queued = queued_response.json()
    job = client.get(f"/factory/jobs/{queued['job_id']}", headers=ADMIN_HEADERS).json()
    chunk_id = job['input']['source_context'][0]['source_chunk_id']
    skill_code = job['input']['skills'][0]['skill_code']
    payload = _valid_generated_payload(chunk_id, skill_code)
    r = client.post(f"/factory/jobs/{queued['job_id']}/ingest-output", json=payload, headers=ADMIN_HEADERS)
    assert r.status_code == 200
    data = r.json()
    assert data['status'] == 'READY_FOR_QA'
    assert data['provenance_score'] == 100.0


def test_structured_output_rejects_out_of_packet_source():
    client.post('/importer/source-packages/1/link-lessons', headers=ADMIN_HEADERS)
    _verify_teaching_links(1)
    queued_response = client.post('/factory/lessons/1/generate', headers=ADMIN_HEADERS)
    assert queued_response.status_code == 200, queued_response.text
    queued = queued_response.json()
    job = client.get(f"/factory/jobs/{queued['job_id']}", headers=ADMIN_HEADERS).json()
    skill_code = job['input']['skills'][0]['skill_code']
    payload = _valid_generated_payload(999999, skill_code)
    r = client.post(f"/factory/jobs/{queued['job_id']}/ingest-output", json=payload, headers=ADMIN_HEADERS)
    assert r.status_code == 200
    data = r.json()
    assert data['status'] == 'REJECTED'
    assert data['validation']['invalid_chunk_refs']


def test_structured_output_rejects_out_of_packet_flashcard_source():
    client.post('/importer/source-packages/1/link-lessons', headers=ADMIN_HEADERS)
    _verify_teaching_links(1)
    queued_response = client.post('/factory/lessons/1/generate', headers=ADMIN_HEADERS)
    assert queued_response.status_code == 200, queued_response.text
    queued = queued_response.json()
    job = client.get(f"/factory/jobs/{queued['job_id']}", headers=ADMIN_HEADERS).json()
    chunk_id = job['input']['source_context'][0]['source_chunk_id']
    skill_code = job['input']['skills'][0]['skill_code']
    payload = _valid_generated_payload(chunk_id, skill_code)
    payload['flashcards'] = [{
        'front': 'ما وظيفة الدعامة؟',
        'back': 'يساعد الهيكل على دعامة الجسم.',
        'source_chunk_ids': [999999],
    }]
    r = client.post(f"/factory/jobs/{queued['job_id']}/ingest-output", json=payload, headers=ADMIN_HEADERS)
    assert r.status_code == 200
    data = r.json()
    assert data['status'] == 'REJECTED'
    assert any(x['where'] == 'flashcard' for x in data['validation']['invalid_chunk_refs'])


def test_retention_review_and_daily_plan():
    due = client.get('/learning/me/reviews-due', headers=STUDENT_HEADERS)
    assert due.status_code == 200
    assert any(x['skill_code'] == 'SK.MATH.FRACTION.CONCEPT' for x in due.json())
    plan = client.get('/learning/me/daily-plan?minutes=20', headers=STUDENT_HEADERS)
    assert plan.status_code == 200
    data = plan.json()
    assert data['allocated_minutes'] <= 20
    assert any(x['type'] == 'RECOVERY' for x in data['plan'])
    recovery = next(x for x in data['plan'] if x['type'] == 'RECOVERY')
    skills = client.get('/learning/skills').json()
    eq = next(x for x in skills if x['skill_code'] == 'SK.MATH.FRACTION.EQUIVALENCE')
    assert recovery['skill_id'] == eq['id']


def test_improvement_queue_uses_learning_data():
    rebuilt = client.post('/admin/improvement-queue/rebuild', headers=ADMIN_HEADERS)
    assert rebuilt.status_code == 200
    assert rebuilt.json()['updated_tasks'] >= 1
    queue = client.get('/admin/improvement-queue', headers=ADMIN_HEADERS)
    assert queue.status_code == 200
    data = queue.json()
    assert len(data) >= 1
    assert data[0]['priority_score'] >= data[-1]['priority_score']
    assert 'average_mastery' in data[0]['reason']


def test_admin_routes_require_authentication():
    r = client.get('/admin/learning-health')
    assert r.status_code == 401
    r = client.get('/admin/learning-health', headers=ADMIN_HEADERS)
    assert r.status_code == 200


def test_auth_me_and_revocable_logout():
    login = client.post('/auth/login', json={'email':'admin@example.test','password':'StrongDemoPassword123!'})
    assert login.status_code == 200
    headers = {'Authorization': f"Bearer {login.json()['access_token']}"}
    me = client.get('/auth/me', headers=headers)
    assert me.status_code == 200
    assert me.json()['role'] == 'ADMIN'
    out = client.post('/auth/logout', headers=headers)
    assert out.status_code == 200
    assert client.get('/auth/me', headers=headers).status_code == 401


def test_student_registration_creates_separate_profile():
    r = client.post('/auth/register-student', json={
        'email':'student1@example.test',
        'password':'StudentPassword123!',
        'display_name':'طالب تجريبي',
        'grade_id':5,
    })
    assert r.status_code == 200
    data = r.json()
    assert data['role'] == 'STUDENT'
    assert data['student_id'] != 1


def test_student_learning_routes_are_bound_to_student_session():
    assert client.get('/learning/me/mastery').status_code == 401
    assert client.get('/learning/me/mastery', headers=ADMIN_HEADERS).status_code == 403
    mine = client.get('/learning/me/mastery', headers=STUDENT_HEADERS)
    assert mine.status_code == 200
    assert any(x['skill_code'] == 'SK.MATH.FRACTION.EQUIVALENCE' for x in mine.json())


def test_student_cannot_override_student_id_in_attempt_payload():
    r = client.post(
        '/learning/questions/1/attempt',
        json={'student_id': 999, 'answer': 1},
        headers=STUDENT_HEADERS,
    )
    assert r.status_code == 422


def test_offline_event_uuid_cannot_be_claimed_by_another_student():
    registered = client.post('/auth/register-student', json={
        'email':'student2@example.test',
        'password':'StudentPassword456!',
        'display_name':'طالب ثان',
        'grade_id':5,
    })
    assert registered.status_code == 200
    other_headers = {'Authorization': f"Bearer {registered.json()['access_token']}"}
    payload = {'events':[{'event_uuid':'offline-demo-1','event_type':'CONTENT_VIEWED'}]}
    r = client.post('/learning/sync', json=payload, headers=other_headers)
    assert r.status_code == 200
    assert r.json()['accepted'] == 0
    assert r.json()['errors']
