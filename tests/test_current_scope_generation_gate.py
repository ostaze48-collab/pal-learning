from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    Book,
    Lesson,
    LessonSourceLink,
    SourceChunk,
    SourceFile,
    SourcePackage,
    Unit,
)
from app.services.generation_packet import build_lesson_generation_packet


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
    db.add(package); db.flush()
    return db, lesson, package


def _add_source(db, package, lesson, *, source_type, edition, relation, text):
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
    return source, chunk


def test_legacy_student_book_is_blocked_without_current_scope_evidence():
    db, lesson, package = _db_with_lesson()
    try:
        _, teaching_chunk = _add_source(
            db, package, lesson,
            source_type='STUDENT_BOOK',
            edition='2020 third edition',
            relation='TEACHING_SOURCE',
            text='الوحدة الرابعة أجهزة جسم الإنسان والجلد — الجهاز الهيكلي',
        )
        packet = build_lesson_generation_packet(db, lesson.id)
        assert packet['scope_gate']['current_scope_evidence_required'] is True
        assert packet['scope_gate']['blocked'] is True
        assert packet['scope_gate']['blocking_reason'] == 'LEGACY_TEACHING_SOURCE_REQUIRES_CURRENT_SCOPE_EVIDENCE'
        assert packet['source_context'] == []
        assert packet['scope_evidence'] == []
    finally:
        db.close()


def test_legacy_student_book_is_allowed_after_current_plan_verification():
    db, lesson, package = _db_with_lesson()
    try:
        _, teaching_chunk = _add_source(
            db, package, lesson,
            source_type='STUDENT_BOOK',
            edition='2020 third edition',
            relation='TEACHING_SOURCE',
            text='الوحدة الرابعة أجهزة جسم الإنسان والجلد — الجهاز الهيكلي',
        )
        _, plan_chunk = _add_source(
            db, package, lesson,
            source_type='CURRICULUM_PLAN',
            edition='2025/2026 emergency plan',
            relation='CURRENT_SCOPE_EVIDENCE',
            text='الخطة الحالية: الوحدة الرابعة أجهزة جسم الإنسان والجلد — الدرس الأول الجهاز الهيكلي',
        )
        packet = build_lesson_generation_packet(db, lesson.id)
        assert packet['scope_gate']['current_scope_evidence_required'] is True
        assert packet['scope_gate']['current_scope_evidence_present'] is True
        assert packet['scope_gate']['blocked'] is False
        assert [x['source_chunk_id'] for x in packet['source_context']] == [teaching_chunk.id]
        assert [x['source_chunk_id'] for x in packet['scope_evidence']] == [plan_chunk.id]
        assert plan_chunk.id not in {x['source_chunk_id'] for x in packet['source_context']}
    finally:
        db.close()


def test_2026_student_book_does_not_require_separate_scope_plan():
    db, lesson, package = _db_with_lesson()
    try:
        _, teaching_chunk = _add_source(
            db, package, lesson,
            source_type='STUDENT_BOOK',
            edition='2026 verified edition',
            relation='TEACHING_SOURCE',
            text='الوحدة الرابعة أجهزة جسم الإنسان والجلد — الجهاز الهيكلي',
        )
        packet = build_lesson_generation_packet(db, lesson.id)
        assert packet['scope_gate']['current_teaching_source'] is True
        assert packet['scope_gate']['current_scope_evidence_required'] is False
        assert packet['scope_gate']['blocked'] is False
        assert [x['source_chunk_id'] for x in packet['source_context']] == [teaching_chunk.id]
    finally:
        db.close()
