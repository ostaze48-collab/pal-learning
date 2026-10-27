import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    Book,
    ContentBlock,
    ContentCandidate,
    ContentVersion,
    CurriculumVersion,
    Grade,
    Lesson,
    LessonSection,
    LessonSkill,
    LessonSourceLink,
    Question,
    QuestionSkill,
    Skill,
    SourceChunk,
    SourceFile,
    SourcePackage,
    Subject,
    Unit,
    User,
)
from app.db.staging_models import ReleaseTransaction, StagedLessonVersion
from app.factory.release_transaction import execute_audited_release


def _fixture():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    db = Session(engine)

    admin = User(email='release-admin@example.test', password_hash='x', role='ADMIN', status='ACTIVE')
    cv = CurriculumVersion(country='Palestine', academic_year='2026', edition='current', status='ACTIVE')
    grade = Grade(code='G05', name_ar='الصف الخامس', order_no=5)
    subject = Subject(code='SCI', name_ar='العلوم والحياة', name_en='Science')
    db.add_all([admin, cv, grade, subject]); db.flush()

    book = Book(
        curriculum_version_id=cv.id, grade_id=grade.id, subject_id=subject.id,
        semester=1, title='علوم خامس فصل أول', book_code='TEST.RELEASE.SCI.S1',
        edition='2026 verified', status='DRAFT',
    )
    db.add(book); db.flush()
    unit = Unit(book_id=book.id, unit_number=1, title='الخلية', order_no=1)
    db.add(unit); db.flush()
    lesson = Lesson(
        unit_id=unit.id, lesson_number=1,
        lesson_code='TEST.RELEASE.SCI.S1.U01.L01',
        title='المجهر واكتشاف الخلية', status='DRAFT', estimated_minutes=20,
    )
    db.add(lesson); db.flush()

    section = LessonSection(lesson_id=lesson.id, section_number=1, title='نسخة قديمة', order_no=1)
    db.add(section); db.flush()
    old_block = ContentBlock(
        lesson_section_id=section.id, block_type='TEXT',
        content_json={'body': 'old live content'}, order_no=1,
        version=1, status='PUBLISHED', source_refs=[],
    )
    db.add(old_block)

    package = SourcePackage(book_id=book.id, package_code='TEST-RELEASE-S1', status='INGESTING')
    db.add(package); db.flush()
    source = SourceFile(
        package_id=package.id, source_type='OFFICIAL_PACKAGE',
        edition='2026 verified', reliability_score=100, edition_match_score=100,
        status='EXTRACTED', extracted_text='المجهر واكتشاف الخلية ووظيفة المجهر.',
    )
    db.add(source); db.flush()
    chunk = SourceChunk(
        source_file_id=source.id, chunk_index=0, page_number=7,
        text='المجهر واكتشاف الخلية ووظيفة المجهر.',
    )
    db.add(chunk); db.flush()
    link = LessonSourceLink(
        lesson_id=lesson.id, source_chunk_id=chunk.id,
        relation='TEACHING_SOURCE', confidence=1.0,
        source_method='ADMIN', status='VERIFIED',
    )
    db.add(link)

    skill = Skill(
        subject_id=subject.id,
        skill_code='SK.SCI.AUTO.SCIENTIFIC_TOOLS.RELEASE',
        domain='SCIENTIFIC_TOOLS',
        name_ar='يحدد وظيفة المجهر', mastery_threshold=0.8, status='ACTIVE',
    )
    db.add(skill); db.flush()
    db.add(LessonSkill(lesson_id=lesson.id, skill_id=skill.id, relationship='TEACHES'))

    snapshot = {
        'learning_objectives': ['يحدد الطالب وظيفة المجهر.'],
        'concepts': ['المجهر', 'الملاحظة'],
        'sections': [{
            'title': 'استكشف وافهم',
            'learning_goal': 'التعرف إلى وظيفة المجهر',
            'blocks': [{
                'block_type': 'TEXT',
                'title': 'المجهر',
                'body': 'نص موثق عن وظيفة المجهر.',
                'content': {},
                'source_chunk_ids': [chunk.id],
            }],
        }],
        'questions': [{
            'question_type': 'MCQ',
            'prompt': 'ما الأداة المستخدمة لملاحظة تراكيب دقيقة؟',
            'options': ['المجهر', 'المسطرة'],
            'correct_answer': 'المجهر',
            'explanation': 'الإجابة مستندة إلى المصدر.',
            'purpose': 'MASTERY',
            'difficulty': 0.4,
            'skill_codes': [skill.skill_code],
            'source_chunk_ids': [chunk.id],
        }],
        'summary': [{'text': 'المجهر أداة للملاحظة الدقيقة.', 'source_chunk_ids': [chunk.id]}],
        'flashcards': [{'front': 'المجهر', 'back': 'أداة للملاحظة الدقيقة', 'source_chunk_ids': [chunk.id]}],
        'misconceptions': [],
        'remediation_candidates': [],
    }
    candidate = ContentCandidate(
        lesson_id=lesson.id, version_label='1.0-release-test',
        status='APPROVED_FOR_STAGING', schema_valid=True,
        provenance_score=100, output_json=snapshot, validation_json={},
    )
    db.add(candidate); db.flush()
    staged = StagedLessonVersion(
        lesson_id=lesson.id, candidate_id=candidate.id,
        version_label='1.0-release-test', status='ACADEMIC_QA_PASSED',
        snapshot_json=snapshot,
        qa_snapshot_json={
            'academic_qa': {
                'effective_recommendation': 'PASS',
                'critical_count': 0,
                'unsupported_claim_count': 0,
                'result': {'confidence': 96},
            }
        },
        release_readiness='READY', approved_by_user_id=admin.id,
    )
    db.add(staged); db.commit()
    return db, admin, lesson, link, old_block, staged


def test_release_is_blocked_on_sqlite_without_mutation():
    db, admin, lesson, _, old_block, staged = _fixture()
    try:
        with pytest.raises(HTTPException) as exc:
            execute_audited_release(
                db, staged_version_id=staged.id,
                admin_user_id=admin.id, database_backend='sqlite',
            )
        assert exc.value.status_code == 409
        assert exc.value.detail['blocker'] == 'PERSISTENT_POSTGRES_REQUIRED'
        db.refresh(lesson); db.refresh(old_block)
        assert lesson.status == 'DRAFT'
        assert old_block.status == 'PUBLISHED'
        assert db.query(ReleaseTransaction).count() == 0
    finally:
        db.close()


def test_release_commits_live_version_atomically_and_is_idempotent():
    db, admin, lesson, _, old_block, staged = _fixture()
    try:
        result = execute_audited_release(
            db, staged_version_id=staged.id,
            admin_user_id=admin.id, database_backend='postgresql',
        )
        assert result['status'] == 'COMMITTED'
        assert result['publication_authorized'] is True
        assert result['idempotent_replay'] is False

        db.refresh(lesson); db.refresh(old_block); db.refresh(staged)
        assert lesson.status == 'PUBLISHED'
        assert old_block.status == 'ARCHIVED'
        assert staged.status == 'RELEASED'
        assert db.query(ContentVersion).filter_by(lesson_id=lesson.id, status='PUBLISHED').count() == 1
        assert db.query(ContentBlock).filter_by(status='PUBLISHED').count() == 3
        assert db.query(Question).filter_by(lesson_id=lesson.id, status='PUBLISHED').count() == 1
        assert db.query(QuestionSkill).count() == 1
        tx = db.query(ReleaseTransaction).one()
        assert tx.manifest_json['published_block_ids']
        assert tx.manifest_json['published_question_ids']
        assert len(tx.snapshot_sha256) == 64
        assert len(tx.manifest_sha256) == 64

        replay = execute_audited_release(
            db, staged_version_id=staged.id,
            admin_user_id=admin.id, database_backend='postgresql',
        )
        assert replay['release_transaction_id'] == result['release_transaction_id']
        assert replay['idempotent_replay'] is True
        assert db.query(ContentVersion).count() == 1
        assert db.query(ReleaseTransaction).count() == 1
    finally:
        db.close()


def test_release_revalidates_verified_source_link_at_transaction_time():
    db, admin, lesson, link, old_block, staged = _fixture()
    try:
        link.status = 'CANDIDATE'
        db.commit()
        with pytest.raises(HTTPException) as exc:
            execute_audited_release(
                db, staged_version_id=staged.id,
                admin_user_id=admin.id, database_backend='postgresql',
            )
        assert exc.value.status_code == 409
        assert exc.value.detail['invalid_sources'][0]['reason'] == 'ADMIN_VERIFIED_TEACHING_LINK_MISSING'
        db.refresh(lesson); db.refresh(old_block)
        assert lesson.status == 'DRAFT'
        assert old_block.status == 'PUBLISHED'
        assert db.query(ContentVersion).count() == 0
        assert db.query(ReleaseTransaction).count() == 0
    finally:
        db.close()
