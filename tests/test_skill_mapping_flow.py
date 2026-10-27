import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
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
    Unit,
)
from app.factory.skill_mapping import approve_skill_mapping, ingest_skill_output, queue_skill_mapping
from app.schemas.skill_mapping import SkillApprovalRequest, SkillMappingPayload


def _db():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    return Session(engine)


def _lesson(db: Session):
    cv = CurriculumVersion(country='Palestine', academic_year='2026', edition='current', status='ACTIVE')
    grade = Grade(code='G05', name_ar='الصف الخامس', order_no=5)
    subject = Subject(code='SCI', name_ar='العلوم والحياة', name_en='Science')
    db.add_all([cv, grade, subject]); db.flush()
    book = Book(
        curriculum_version_id=cv.id,
        grade_id=grade.id,
        subject_id=subject.id,
        semester=1,
        title='علوم خامس فصل أول',
        book_code='TEST.SCI.S1.SKILLMAP',
        edition='current',
        status='DRAFT',
    )
    db.add(book); db.flush()
    unit = Unit(book_id=book.id, unit_number=1, title='الخلية', order_no=1)
    db.add(unit); db.flush()
    lesson = Lesson(
        unit_id=unit.id,
        lesson_number=1,
        lesson_code='TEST.SCI.S1.U01.L01.SKILLMAP',
        title='المجهر واكتشاف الخلية',
        status='DRAFT',
    )
    db.add(lesson); db.flush()
    package = SourcePackage(book_id=book.id, package_code='TEST-SCI-S1-SKILLMAP', status='INGESTING')
    db.add(package); db.flush()
    return subject, lesson, package


def _attach_factual_source(db: Session, lesson: Lesson, package: SourcePackage):
    source = SourceFile(
        package_id=package.id,
        source_type='OFFICIAL_PACKAGE',
        edition='2026 current package',
        reliability_score=100,
        edition_match_score=90,
        status='EXTRACTED',
        extracted_text='المجهر أداة تساعد في ملاحظة تراكيب دقيقة. الخلية وحدة بنائية في الكائنات الحية.',
        file_key='s3://test-bucket/current-science.pdf',
        extraction_meta={'durable_storage': True},
    )
    db.add(source); db.flush()
    chunk = SourceChunk(
        source_file_id=source.id,
        chunk_index=0,
        page_number=1,
        text='المجهر أداة تساعد في ملاحظة تراكيب دقيقة. الخلية وحدة بنائية في الكائنات الحية.',
    )
    db.add(chunk); db.flush()
    db.add(LessonSourceLink(
        lesson_id=lesson.id,
        source_chunk_id=chunk.id,
        relation='TEACHING_SOURCE',
        confidence=0.99,
        source_method='TEST',
        status='VERIFIED',
    ))
    db.commit()
    return chunk


def test_skill_mapping_queue_requires_authorized_factual_source_context():
    db = _db()
    try:
        _, lesson, _ = _lesson(db)
        db.commit()
        with pytest.raises(HTTPException) as exc:
            queue_skill_mapping(lesson.id, db)
        assert exc.value.status_code == 409
        assert exc.value.detail['message'] == 'Skill mapping requires admin-verified factual teaching-source links'
        assert db.query(AIJob).count() == 0
    finally:
        db.close()


def test_skill_mapping_rejects_citation_outside_packet():
    db = _db()
    try:
        _, lesson, package = _lesson(db)
        chunk = _attach_factual_source(db, lesson, package)
        queued = queue_skill_mapping(lesson.id, db)
        payload = SkillMappingPayload.model_validate({
            'skills': [{
                'name_ar': 'يحدد وظيفة المجهر في ملاحظة التراكيب الدقيقة',
                'domain': 'SCIENTIFIC_TOOLS',
                'measurable_outcome_ar': 'يحدد الطالب وظيفة المجهر من وصف أو موقف علمي.',
                'description_ar': 'مهارة مرتبطة باستخدام المجهر لفهم ما يمكن ملاحظته.',
                'mastery_threshold': 0.8,
                'importance': 1.0,
                'source_chunk_ids': [chunk.id + 999],
            }]
        })
        with pytest.raises(HTTPException) as exc:
            ingest_skill_output(queued['job_id'], payload, db)
        assert exc.value.status_code == 422
        job = db.query(AIJob).filter(AIJob.id == queued['job_id']).one()
        assert job.status == 'SKILL_MAPPING_REJECTED'
        assert db.query(Skill).count() == 0
    finally:
        db.close()


def test_skill_mapping_creates_skill_only_after_admin_approval():
    db = _db()
    try:
        subject, lesson, package = _lesson(db)
        chunk = _attach_factual_source(db, lesson, package)
        queued = queue_skill_mapping(lesson.id, db)
        payload = SkillMappingPayload.model_validate({
            'skills': [{
                'name_ar': 'يحدد وظيفة المجهر في ملاحظة التراكيب الدقيقة',
                'domain': 'SCIENTIFIC_TOOLS',
                'measurable_outcome_ar': 'يحدد الطالب وظيفة المجهر من وصف أو موقف علمي.',
                'description_ar': 'مهارة قابلة للقياس مستندة إلى النص المصدر.',
                'mastery_threshold': 0.8,
                'importance': 1.2,
                'source_chunk_ids': [chunk.id],
            }]
        })
        ingested = ingest_skill_output(queued['job_id'], payload, db)
        assert ingested['status'] == 'SKILL_MAPPING_READY_FOR_REVIEW'
        assert db.query(Skill).count() == 0
        assert db.query(LessonSkill).count() == 0

        approved = approve_skill_mapping(
            queued['job_id'],
            SkillApprovalRequest(proposal_indices=[0]),
            db,
        )
        assert approved['status'] == 'SKILL_MAPPING_APPROVED'
        assert approved['server_generated_skill_codes'] is True
        skill = db.query(Skill).one()
        assert skill.subject_id == subject.id
        assert skill.skill_code.startswith('SK.SCI.AUTO.SCIENTIFIC_TOOLS.')
        assert skill.name_ar == 'يحدد وظيفة المجهر في ملاحظة التراكيب الدقيقة'
        link = db.query(LessonSkill).one()
        assert link.lesson_id == lesson.id
        assert link.skill_id == skill.id
        assert link.relationship == 'TEACHES'
    finally:
        db.close()
