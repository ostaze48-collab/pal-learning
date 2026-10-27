import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    AIJob,
    Book,
    ContentCandidate,
    Lesson,
    LessonSkill,
    LessonSourceLink,
    Skill,
    SourceChunk,
    SourceFile,
    SourcePackage,
    Unit,
)
from app.factory.router import execute_factory_job, ingest_generated_output, queue_lesson_generation
from app.schemas.factory import GeneratedLessonPayload


def _prepared_db():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    db = Session(engine)

    book = Book(
        curriculum_version_id=1,
        grade_id=5,
        subject_id=4,
        semester=1,
        title='علوم خامس فصل أول',
        book_code='TEST.SCI.S1.FRESHNESS',
        edition='2026 verified',
        status='DRAFT',
    )
    db.add(book); db.flush()
    unit = Unit(book_id=book.id, unit_number=1, title='الخلية', order_no=1)
    db.add(unit); db.flush()
    lesson = Lesson(
        unit_id=unit.id,
        lesson_number=1,
        lesson_code='TEST.SCI.S1.U01.L01.FRESHNESS',
        title='المجهر واكتشاف الخلية',
        status='DRAFT',
    )
    db.add(lesson); db.flush()
    package = SourcePackage(book_id=book.id, package_code='TEST-SCI-S1-FRESHNESS', status='INGESTING')
    db.add(package); db.flush()

    source = SourceFile(
        package_id=package.id,
        source_type='OFFICIAL_PACKAGE',
        edition='2026 current package',
        reliability_score=100,
        edition_match_score=100,
        status='EXTRACTED',
        extracted_text='الدرس الأول: المجهر واكتشاف الخلية. يستخدم المجهر لملاحظة تراكيب دقيقة.',
    )
    db.add(source); db.flush()
    chunk = SourceChunk(
        source_file_id=source.id,
        chunk_index=0,
        page_number=1,
        text='الدرس الأول: المجهر واكتشاف الخلية. يستخدم المجهر لملاحظة تراكيب دقيقة.',
    )
    db.add(chunk); db.flush()
    link = LessonSourceLink(
        lesson_id=lesson.id,
        source_chunk_id=chunk.id,
        relation='TEACHING_SOURCE',
        confidence=0.99,
        source_method='TEST_ADMIN_VERIFIED',
        status='VERIFIED',
    )
    db.add(link)

    skill = Skill(
        subject_id=4,
        skill_code='SK.SCI.AUTO.SCIENTIFIC_TOOLS.FRESHNESS01',
        domain='SCIENTIFIC_TOOLS',
        name_ar='يحدد وظيفة المجهر في ملاحظة التراكيب الدقيقة',
        mastery_threshold=0.8,
        importance=1.0,
        status='ACTIVE',
    )
    db.add(skill); db.flush()
    db.add(LessonSkill(lesson_id=lesson.id, skill_id=skill.id, relationship='TEACHES', weight=1.0))
    db.commit()
    return db, lesson, link, chunk, skill


def _payload(chunk_id: int, skill_code: str) -> GeneratedLessonPayload:
    return GeneratedLessonPayload.model_validate({
        'learning_objectives': ['أن يحدد الطالب وظيفة المجهر.'],
        'concepts': ['المجهر'],
        'sections': [{
            'title': 'التعرف إلى المجهر',
            'learning_goal': 'فهم وظيفة المجهر',
            'blocks': [{
                'block_type': 'TEXT',
                'title': 'الفكرة',
                'body': 'يستخدم المجهر لملاحظة تراكيب دقيقة.',
                'content': {},
                'source_chunk_ids': [chunk_id],
            }],
        }],
        'questions': [{
            'question_type': 'MCQ',
            'prompt': 'ما وظيفة المجهر؟',
            'options': ['ملاحظة تراكيب دقيقة', 'قياس الكتلة'],
            'correct_answer': 0,
            'explanation': 'المصدر يربط المجهر بملاحظة التراكيب الدقيقة.',
            'purpose': 'PRACTICE',
            'difficulty': 0.3,
            'skill_codes': [skill_code],
            'source_chunk_ids': [chunk_id],
        }],
        'summary': [{'text': 'المجهر يساعد على ملاحظة تراكيب دقيقة.', 'source_chunk_ids': [chunk_id]}],
        'flashcards': [],
        'misconceptions': [],
        'remediation_candidates': [],
    })


def test_execute_rejects_job_if_verified_source_link_was_revoked_after_queue(monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'LOCAL_MOCK')
    db, lesson, link, chunk, skill = _prepared_db()
    try:
        queued = queue_lesson_generation(lesson.id, db)
        job = db.query(AIJob).filter(AIJob.id == queued['job_id']).one()
        assert {x['source_chunk_id'] for x in job.input_json['source_context']} == {chunk.id}

        link.status = 'REJECTED'
        db.commit()

        with pytest.raises(HTTPException) as exc:
            execute_factory_job(job.id, db)
        assert exc.value.status_code == 409
        assert exc.value.detail['input_freshness']['fresh'] is False
        assert 'SOURCE_CHUNK_NO_LONGER_ADMIN_VERIFIED' in exc.value.detail['input_freshness']['reasons']

        db.refresh(job)
        assert job.status == 'STALE_INPUT'
        assert job.result_json['input_freshness']['removed_source_chunk_ids'] == [chunk.id]
    finally:
        db.close()


def test_ingest_rejects_output_if_source_link_was_revoked_after_queue():
    db, lesson, link, chunk, skill = _prepared_db()
    try:
        queued = queue_lesson_generation(lesson.id, db)
        job = db.query(AIJob).filter(AIJob.id == queued['job_id']).one()
        payload = _payload(chunk.id, skill.skill_code)

        link.status = 'REJECTED'
        db.commit()

        with pytest.raises(HTTPException) as exc:
            ingest_generated_output(job.id, payload, db)
        assert exc.value.status_code == 409
        assert exc.value.detail['message'] == 'Queued lesson inputs are stale and require a new job'
        assert db.query(ContentCandidate).count() == 0

        db.refresh(job)
        assert job.status == 'STALE_INPUT'
    finally:
        db.close()
