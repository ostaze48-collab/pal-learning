import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    AIJob,
    Book,
    Lesson,
    LessonSkill,
    LessonSourceLink,
    Skill,
    SourceChunk,
    SourceFile,
    SourcePackage,
    Unit,
)
from app.db.visual_models import VisualAsset
from app.factory.generation_readiness import calculate_generation_readiness
from app.factory.router import queue_lesson_generation


def _db_with_lesson():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    db = Session(engine)
    book = Book(
        curriculum_version_id=1,
        grade_id=5,
        subject_id=4,
        semester=2,
        title='العلوم والحياة — الصف الخامس — الفصل الثاني',
        book_code='PS.G05.SCI.S2',
        edition='2026/latest-to-verify',
        status='DRAFT',
    )
    db.add(book); db.flush()
    unit = Unit(book_id=book.id, unit_number=4, title='أجهزة جسم الإنسان والجلد', order_no=1)
    db.add(unit); db.flush()
    lesson = Lesson(
        unit_id=unit.id,
        lesson_number=1,
        lesson_code='PS.G05.SCI.S2.U04.L01',
        title='الجهاز الهيكلي',
        status='DRAFT',
    )
    db.add(lesson); db.flush()
    package = SourcePackage(book_id=book.id, package_code='PS-G05-SCI-S2-2026', status='INGESTING')
    db.add(package); db.commit()
    return db, lesson, package


def _add_skill(db, lesson):
    skill = Skill(
        subject_id=4,
        skill_code='SK.SCI.HUMAN_BODY.SKELETON.SUPPORT.READINESS',
        domain='HUMAN_BODY',
        name_ar='يفسر دور الجهاز الهيكلي في دعامة الجسم',
        mastery_threshold=0.8,
        status='ACTIVE',
    )
    db.add(skill); db.flush()
    db.add(LessonSkill(lesson_id=lesson.id, skill_id=skill.id, relationship='TEACHES'))
    db.commit()
    return skill


def _add_link(db, package, lesson, *, source_type, edition, relation):
    text = 'الوحدة الرابعة أجهزة جسم الإنسان والجلد — الدرس الأول الجهاز الهيكلي'
    source = SourceFile(
        package_id=package.id,
        source_type=source_type,
        edition=edition,
        reliability_score=100,
        edition_match_score=100,
        status='EXTRACTED',
        extracted_text=text,
    )
    db.add(source); db.flush()
    chunk = SourceChunk(source_file_id=source.id, chunk_index=0, page_number=1, text=text)
    db.add(chunk); db.flush()
    db.add(LessonSourceLink(
        lesson_id=lesson.id,
        source_chunk_id=chunk.id,
        relation=relation,
        confidence=1.0,
        source_method='TEST',
        status='VERIFIED',
    ))
    db.commit()
    return chunk


def _add_cleared_visual(db, lesson, teaching_chunk):
    asset = VisualAsset(
        lesson_id=lesson.id,
        source_file_id=teaching_chunk.source_file_id,
        source_page=teaching_chunk.page_number or 1,
        asset_kind='TEXTBOOK_PAGE_CROP',
        storage_key='s3://test-bucket/visuals/readiness.png',
        public_url='https://cdn.example.test/visuals/readiness.png',
        checksum='a' * 64,
        width=1200,
        height=1700,
        rights_status='CLEARED',
        status='APPROVED',
        alt_text='صفحة تعليمية موثقة مرتبطة بالدرس.',
        caption='شكل تعليمي للاختبار.',
        hotspots_json=[],
    )
    db.add(asset)
    db.commit()
    return asset


def test_readiness_reports_missing_skills_and_factual_source(monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'LOCAL_MOCK')
    db, lesson, _ = _db_with_lesson()
    try:
        result = calculate_generation_readiness(db, lesson.id)
        assert result['queue_ready'] is False
        assert result['execution_ready'] is False
        assert 'NO_SKILLS_LINKED' in result['blockers']
        assert 'NO_AUTHORIZED_FACTUAL_SOURCE_LINKED' in result['blockers']
        assert 'NO_CLEARED_VISUAL_ASSET' in result['blockers']
        assert result['policy']['creates_ai_job'] is False
        assert result['policy']['publishes_content'] is False
        assert result['policy']['science_visual_first_required'] is True
        assert len(result['discovery_candidates']) == 1
        assert result['discovery_candidates'][0]['ingestion_mode'] == 'UPLOAD_REQUIRED'
    finally:
        db.close()


def test_legacy_book_reports_current_plan_and_visual_blockers(monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'LOCAL_MOCK')
    db, lesson, package = _db_with_lesson()
    try:
        _add_skill(db, lesson)
        teaching_chunk = _add_link(
            db, package, lesson,
            source_type='STUDENT_BOOK',
            edition='2020 third edition',
            relation='TEACHING_SOURCE',
        )
        _add_cleared_visual(db, lesson, teaching_chunk)
        result = calculate_generation_readiness(db, lesson.id)
        assert result['queue_ready'] is False
        assert result['blockers'] == [
            'LEGACY_TEACHING_SOURCE_REQUIRES_CURRENT_SCOPE_EVIDENCE',
            'NO_CLEARED_VISUAL_ASSET',
        ]
        assert result['scope_gate']['current_scope_evidence_required'] is True
        assert result['scope_gate']['current_scope_evidence_present'] is False
        assert result['visual_gate']['ready'] is False
        assert result['visual_gate']['cleared_asset_count'] == 0
        assert result['next_actions'] == [
            'OBTAIN_CURRENT_CURRICULUM_PLAN',
            'UPLOAD_CURRICULUM_PLAN',
            'VERIFY_CURRENT_PLAN_SCOPE',
            'EXTRACT_REVIEW_AND_CLEAR_VISUAL_ASSET',
        ]
    finally:
        db.close()


def test_verified_current_plan_makes_queue_ready_but_mock_provider_blocks_execution(monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'LOCAL_MOCK')
    db, lesson, package = _db_with_lesson()
    try:
        _add_skill(db, lesson)
        teaching_chunk = _add_link(
            db, package, lesson,
            source_type='STUDENT_BOOK',
            edition='2020 third edition',
            relation='TEACHING_SOURCE',
        )
        _add_cleared_visual(db, lesson, teaching_chunk)
        _add_link(
            db, package, lesson,
            source_type='CURRICULUM_PLAN',
            edition='2025/2026 emergency plan',
            relation='CURRENT_SCOPE_EVIDENCE',
        )
        result = calculate_generation_readiness(db, lesson.id)
        assert result['queue_ready'] is True
        assert result['execution_ready'] is False
        assert result['blockers'] == []
        assert result['authorized_factual_source_chunks'] == 1
        assert result['scope_evidence_count'] == 1
        assert result['visual_gate']['ready'] is True
        assert result['visual_gate']['cleared_asset_count'] == 1
        assert result['next_actions'] == ['CONFIGURE_REAL_AI_PROVIDER_FOR_EXECUTION']
        assert result['provider']['provider'] == 'LOCAL_MOCK'
        assert result['authority_gate']['factual_sources_authorized'] is True
    finally:
        db.close()


def test_generate_endpoint_cannot_bypass_readiness_blockers(monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'LOCAL_MOCK')
    db, lesson, _ = _db_with_lesson()
    try:
        with pytest.raises(HTTPException) as exc:
            queue_lesson_generation(lesson.id, db)
        assert exc.value.status_code == 409
        assert exc.value.detail['message'] == 'Lesson is not ready for generation'
        assert 'NO_SKILLS_LINKED' in exc.value.detail['blockers']
        assert 'NO_AUTHORIZED_FACTUAL_SOURCE_LINKED' in exc.value.detail['blockers']
        assert 'NO_CLEARED_VISUAL_ASSET' in exc.value.detail['blockers']
        assert db.query(AIJob).count() == 0
    finally:
        db.close()


def test_generate_endpoint_queues_after_all_non_provider_gates_pass(monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'LOCAL_MOCK')
    db, lesson, package = _db_with_lesson()
    try:
        _add_skill(db, lesson)
        teaching_chunk = _add_link(
            db, package, lesson,
            source_type='STUDENT_BOOK',
            edition='2020 third edition',
            relation='TEACHING_SOURCE',
        )
        _add_cleared_visual(db, lesson, teaching_chunk)
        _add_link(
            db, package, lesson,
            source_type='CURRICULUM_PLAN',
            edition='2025/2026 emergency plan',
            relation='CURRENT_SCOPE_EVIDENCE',
        )
        queued = queue_lesson_generation(lesson.id, db)
        assert queued['status'] == 'QUEUED'
        assert queued['skills'] == 1
        assert queued['source_chunks'] == 1
        assert queued['generation_readiness']['queue_ready'] is True
        assert queued['generation_readiness']['execution_ready'] is False
        job = db.query(AIJob).filter(AIJob.id == queued['job_id']).one()
        assert len((job.input_json or {}).get('visual_assets') or []) == 1
        assert db.query(AIJob).count() == 1
    finally:
        db.close()
