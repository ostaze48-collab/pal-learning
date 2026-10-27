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
from app.db.base import SessionLocal
from app.db.models import LessonSourceLink, SourceChunk
from app.db.visual_models import VisualAsset
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


def _ensure_cleared_visual(lesson_id: int):
    db = SessionLocal()
    try:
        links = db.query(LessonSourceLink).filter(
            LessonSourceLink.lesson_id == lesson_id,
            LessonSourceLink.relation == 'TEACHING_SOURCE',
            LessonSourceLink.status == 'VERIFIED',
        ).order_by(LessonSourceLink.id).all()
        for link in links:
            chunk = db.query(SourceChunk).filter(SourceChunk.id == link.source_chunk_id).first()
            if not chunk or chunk.page_number is None:
                continue
            existing = db.query(VisualAsset).filter(
                VisualAsset.lesson_id == lesson_id,
                VisualAsset.source_file_id == chunk.source_file_id,
                VisualAsset.source_page == chunk.page_number,
                VisualAsset.asset_kind == 'TEXTBOOK_PAGE_CROP',
            ).first()
            if not existing:
                db.add(VisualAsset(
                    lesson_id=lesson_id,
                    source_file_id=chunk.source_file_id,
                    source_page=chunk.page_number,
                    asset_kind='TEXTBOOK_PAGE_CROP',
                    storage_key=f's3://test-bucket/candidate/lesson-{lesson_id}-page-{chunk.page_number}.png',
                    public_url=f'https://cdn.example.test/candidate/lesson-{lesson_id}-page-{chunk.page_number}.png',
                    checksum='c' * 64,
                    width=1200,
                    height=1700,
                    rights_status='CLEARED',
                    status='APPROVED',
                    alt_text='صفحة تعليمية موثقة من مصدر الدرس.',
                    caption='أصل بصري اختباري لمرحلة staging.',
                    hotspots_json=[],
                ))
                db.commit()
            return
        raise AssertionError('No verified teaching source with a page number was available for visual fixture')
    finally:
        db.close()


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
    _ensure_cleared_visual(lesson_id)


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
    _verify_teaching_links(1)

    queued = client.post('/factory/lessons/1/generate', headers=HEADERS)
    assert queued.status_code == 200, queued.text
    job_id = queued.json()['job_id']
    job = client.get(f'/factory/jobs/{job_id}', headers=HEADERS).json()
    chunk_id = job['input']['source_context'][0]['source_chunk_id']
    skill_code = job['input']['skills'][0]['skill_code']
    section_titles = [row['title'] for row in job['input'].get('section_blueprint', [])] or ['لماذا نحتاج إلى الهيكل؟']

    payload = {
        'learning_objectives': ['أن يفسر الطالب دور الجهاز الهيكلي في دعامة الجسم.'],
        'concepts': ['الجهاز الهيكلي', 'الدعامة'],
        'sections': [{
            'title': title,
            'learning_goal': 'فهم وظيفة الدعامة',
            'blocks': [{
                'block_type': 'TEXT',
                'title': 'فكرة أساسية',
                'body': 'يساعد الجهاز الهيكلي على دعامة الجسم.',
                'content': {},
                'source_chunk_ids': [chunk_id],
            }],
        } for title in section_titles],
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
    assert ingested.json()['status'] == 'READY_FOR_QA'
    assert ingested.json()['validation']['section_blueprint']['valid'] is True
    return ingested.json()['candidate_id'], section_titles[0]


def test_candidate_preflight_and_staging_do_not_publish():
    candidate_id, first_section_title = _prepare_valid_candidate()

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
    assert data['staged_version_id'] >= 1

    staged_list = client.get('/factory/lessons/1/staged-versions', headers=HEADERS)
    assert staged_list.status_code == 200, staged_list.text
    assert any(x['id'] == data['staged_version_id'] for x in staged_list.json())

    staged = client.get(f"/factory/staged-versions/{data['staged_version_id']}", headers=HEADERS)
    assert staged.status_code == 200, staged.text
    staged_data = staged.json()
    assert staged_data['candidate_id'] == candidate_id
    assert staged_data['snapshot']['sections'][0]['title'] == first_section_title
    assert staged_data['qa_snapshot']['preflight_status'] == 'PASS'

    second_approval = client.post(f'/factory/candidates/{candidate_id}/approve-staging', headers=HEADERS)
    assert second_approval.status_code == 200
    assert second_approval.json()['staged_version_id'] == data['staged_version_id']
    assert second_approval.json()['duplicate_approval'] is True

    lesson_response = client.get('/curriculum/lessons/1', headers=HEADERS)
    assert lesson_response.status_code == 200, lesson_response.text
    lesson = lesson_response.json()
    assert lesson['status'] == 'DRAFT'
