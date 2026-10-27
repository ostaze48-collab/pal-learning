from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import Book, Lesson, LessonSourceLink, SourceChunk, SourceFile, SourcePackage, Unit
from app.services.generation_packet import build_lesson_generation_packet


def test_verified_candidate_is_excluded_until_admin_verifies_teaching_link():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    db = Session(engine)
    try:
        book = Book(
            curriculum_version_id=1,
            grade_id=5,
            subject_id=4,
            semester=1,
            title='علوم خامس فصل أول',
            book_code='TEST.GEN.VERIFIED.LINK',
            edition='2026 current',
            status='DRAFT',
        )
        db.add(book); db.flush()
        unit = Unit(book_id=book.id, unit_number=1, title='الخلية', order_no=1)
        db.add(unit); db.flush()
        lesson = Lesson(
            unit_id=unit.id,
            lesson_number=1,
            lesson_code='TEST.GEN.VERIFIED.LINK.L01',
            title='المجهر واكتشاف الخلية',
            status='DRAFT',
        )
        db.add(lesson); db.flush()
        package = SourcePackage(book_id=book.id, package_code='TEST-GEN-VERIFIED-LINK', status='INGESTING')
        db.add(package); db.flush()
        source = SourceFile(
            package_id=package.id,
            source_type='OFFICIAL_PACKAGE',
            edition='2026 current',
            reliability_score=100,
            edition_match_score=95,
            status='EXTRACTED',
            extracted_text='المجهر واكتشاف الخلية',
            file_key='s3://test/current-science.pdf',
            extraction_meta={'durable_storage': True},
        )
        db.add(source); db.flush()
        chunk = SourceChunk(source_file_id=source.id, chunk_index=0, page_number=1, text='المجهر واكتشاف الخلية')
        db.add(chunk); db.flush()
        link = LessonSourceLink(
            lesson_id=lesson.id,
            source_chunk_id=chunk.id,
            relation='TEACHING_SOURCE',
            confidence=0.97,
            source_method='PRIMARY_SOURCE_TITLE_MATCH_V1',
            status='VERIFIED_CANDIDATE',
        )
        db.add(link); db.commit()

        packet = build_lesson_generation_packet(db, lesson.id)
        assert packet['contract_version'] == 'lesson-generation-packet/v5'
        assert packet['source_context'] == []
        assert packet['authority_gate']['admin_verified_teaching_source_required'] is True
        assert packet['authority_gate']['verified_teaching_source_count'] == 0
        assert packet['authority_gate']['unverified_teaching_source_count'] == 1
        rejected = packet['authority_gate']['rejected_teaching_sources']
        assert rejected[0]['source_chunk_id'] == chunk.id
        assert rejected[0]['link_status'] == 'VERIFIED_CANDIDATE'
        assert rejected[0]['reason'] == 'TEACHING_SOURCE_LINK_REQUIRES_ADMIN_VERIFICATION'

        link.status = 'VERIFIED'
        db.commit()
        packet = build_lesson_generation_packet(db, lesson.id)
        assert [x['source_chunk_id'] for x in packet['source_context']] == [chunk.id]
        assert packet['authority_gate']['verified_teaching_source_count'] == 1
        assert packet['authority_gate']['unverified_teaching_source_count'] == 0
        assert packet['authority_gate']['factual_sources_authorized'] is True
    finally:
        db.close()
