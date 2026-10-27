from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.admin.current_semester import current_semester_pipeline
from app.db.base import Base
from app.db.current_semester import (
    CURRENT_BOOK_CODE,
    CURRENT_PACKAGE_CODE,
    MINISTRY_G5_SCIENCE_URL,
    ensure_current_semester_registry,
)
from app.db.models import (
    AIJob,
    Book,
    CurriculumVersion,
    Grade,
    Lesson,
    LessonSkill,
    LessonSourceLink,
    Skill,
    SourceChunk,
    SourceFile,
    SourcePackage,
    Subject,
)
from app.db.visual_models import VisualAsset
from app.factory.router import queue_lesson_generation


def _session():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    db = Session(engine)
    cv = CurriculumVersion(
        country='Palestine', academic_year='2026', edition='Latest Verified Edition', status='ACTIVE'
    )
    grade = Grade(code='G05', name_ar='الصف الخامس', order_no=5)
    subject = Subject(code='SCI', name_ar='العلوم والحياة', name_en='Science')
    db.add_all([cv, grade, subject]); db.commit()
    result = ensure_current_semester_registry(db)
    assert result['ready'] is True
    return db, subject


def _stage_map(payload):
    return {stage['key']: stage for stage in payload['stages']}


def test_pipeline_starts_fail_closed_and_points_to_source_fetch():
    db, _ = _session()
    try:
        payload = current_semester_pipeline(db)
        stages = _stage_map(payload)

        assert payload['semester'] == 1
        assert payload['package_code'] == CURRENT_PACKAGE_CODE
        assert payload['lesson']['lesson_code'] == f'{CURRENT_BOOK_CODE}.U01.L01'
        assert stages['REGISTRY']['status'] == 'DONE'
        assert stages['DURABLE_STORAGE']['status'] == 'DONE'
        assert stages['SOURCE_FETCH']['status'] == 'READY'
        assert stages['SOURCE_FETCH']['action'] == 'FETCH_OFFICIAL_SOURCE'
        assert stages['SEMESTER_SCOPE']['status'] == 'BLOCKED'
        assert stages['LESSON_LINKING']['status'] == 'BLOCKED'
        assert stages['SOURCE_REVIEW']['status'] == 'BLOCKED'
        assert stages['VISUAL_ASSETS']['status'] == 'BLOCKED'
        assert stages['SKILL_MAPPING']['status'] == 'BLOCKED'
        assert stages['LESSON_GENERATION']['status'] == 'BLOCKED'
        assert payload['next_stage']['key'] == 'SOURCE_FETCH'
        assert payload['counts'] == {
            'candidate_source_links': 0,
            'verified_source_links': 0,
            'linked_skills': 0,
            'visual_assets': 0,
            'visual_pending': 0,
            'visual_cleared': 0,
            'visual_redraw': 0,
        }
        assert payload['generation_readiness']['queue_ready'] is False
        assert 'NO_SKILLS_LINKED' in payload['generation_readiness']['blockers']
        assert 'NO_CLEARED_VISUAL_ASSET' in payload['generation_readiness']['blockers']
    finally:
        db.close()


def test_pipeline_marks_generation_done_only_after_output_validated(monkeypatch):
    monkeypatch.setenv('AI_PROVIDER', 'LOCAL_MOCK')
    db, subject = _session()
    try:
        book = db.query(Book).filter(Book.book_code == CURRENT_BOOK_CODE).one()
        package = db.query(SourcePackage).filter(SourcePackage.package_code == CURRENT_PACKAGE_CODE).one()
        lesson = db.query(Lesson).filter(Lesson.lesson_code == f'{CURRENT_BOOK_CODE}.U01.L01').one()
        source = db.query(SourceFile).filter(
            SourceFile.package_id == package.id,
            SourceFile.source_url == MINISTRY_G5_SCIENCE_URL,
        ).one()

        source.source_type = 'OFFICIAL_PACKAGE'
        source.status = 'EXTRACTED'
        source.edition = '2026 current verified package'
        source.edition_match_score = 95
        source.extracted_text = (
            'الوحدة الأولى: الخلية. الوحدة الثانية: خصائص المادة. '
            'الوحدة الثالثة: الطاقة في حياتنا. الدرس الأول: المجهر واكتشاف الخلية.'
        )
        source.file_key = 's3://test-curriculum/grade5-science-s1.pdf'
        source.extraction_meta = {
            'durable_storage': True,
            'registered_source_url': MINISTRY_G5_SCIENCE_URL,
            'catalog_source_code': 'PS.G05.SCI.GAZA.CURRENT.S1',
        }
        db.flush()

        chunk = SourceChunk(
            source_file_id=source.id,
            chunk_index=0,
            page_number=1,
            text='الدرس الأول: المجهر واكتشاف الخلية. يستخدم المجهر لملاحظة تراكيب دقيقة.',
        )
        db.add(chunk); db.flush()
        db.add(LessonSourceLink(
            lesson_id=lesson.id,
            source_chunk_id=chunk.id,
            relation='TEACHING_SOURCE',
            confidence=0.99,
            source_method='TEST+ADMIN_VERIFIED',
            status='VERIFIED',
        ))

        db.add(VisualAsset(
            lesson_id=lesson.id,
            source_file_id=source.id,
            source_page=1,
            asset_kind='TEXTBOOK_PAGE_CROP',
            storage_key='s3://test-curriculum/visuals/page-1.png',
            public_url='https://cdn.example.test/visuals/page-1.png',
            checksum='d' * 64,
            width=1200,
            height=1700,
            rights_status='CLEARED',
            status='APPROVED',
            alt_text='صفحة موثقة من درس المجهر واكتشاف الخلية.',
            caption='شكل تعليمي مرتبط بالمصدر الرسمي.',
            hotspots_json=[],
        ))

        skill = Skill(
            subject_id=subject.id,
            skill_code='SK.SCI.AUTO.SCIENTIFIC_TOOLS.PIPELINE01',
            domain='SCIENTIFIC_TOOLS',
            name_ar='يحدد وظيفة المجهر في ملاحظة التراكيب الدقيقة',
            description='مهارة موثقة لاختبار حالة مسار الإنتاج.',
            mastery_threshold=0.8,
            importance=1.0,
            status='ACTIVE',
        )
        db.add(skill); db.flush()
        db.add(LessonSkill(
            lesson_id=lesson.id,
            skill_id=skill.id,
            relationship='TEACHES',
            weight=1.0,
        ))
        db.commit()

        ready_payload = current_semester_pipeline(db)
        ready_stages = _stage_map(ready_payload)
        assert ready_stages['SOURCE_FETCH']['status'] == 'DONE'
        assert ready_stages['SEMESTER_SCOPE']['status'] == 'DONE'
        assert ready_stages['LESSON_LINKING']['status'] == 'DONE'
        assert ready_stages['SOURCE_REVIEW']['status'] == 'DONE'
        assert ready_stages['VISUAL_ASSETS']['status'] == 'DONE'
        assert ready_stages['SKILL_MAPPING']['status'] == 'DONE'
        assert ready_stages['LESSON_GENERATION']['status'] == 'READY'
        assert ready_stages['LESSON_GENERATION']['action'] == 'QUEUE_GENERATION'
        assert ready_payload['generation_readiness']['queue_ready'] is True
        assert ready_payload['counts']['visual_cleared'] == 1

        queued = queue_lesson_generation(lesson.id, db)
        queued_payload = current_semester_pipeline(db)
        queued_stage = _stage_map(queued_payload)['LESSON_GENERATION']
        assert queued_stage['status'] == 'READY'
        assert queued_stage['action'] == 'OPEN_LESSON_GENERATION'
        assert 'QUEUED' in queued_stage['detail']
        assert queued_payload['next_stage']['key'] == 'LESSON_GENERATION'

        job = db.query(AIJob).filter(AIJob.id == queued['job_id']).one()
        job.status = 'OUTPUT_VALIDATED'
        job.progress = 70
        db.commit()

        completed_payload = current_semester_pipeline(db)
        completed_stage = _stage_map(completed_payload)['LESSON_GENERATION']
        assert completed_stage['status'] == 'DONE'
        assert completed_stage['action'] is None
        assert completed_payload['next_stage'] is None
        assert completed_payload['counts']['verified_source_links'] == 1
        assert completed_payload['counts']['visual_cleared'] == 1
        assert completed_payload['counts']['linked_skills'] == 1
    finally:
        db.close()
