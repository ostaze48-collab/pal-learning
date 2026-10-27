from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import (
    Book,
    ContentCandidate,
    Lesson,
    LessonSourceLink,
    SourceChunk,
    SourceFile,
    SourcePackage,
    Unit,
)
from app.factory.candidate_qa import calculate_candidate_qa
from app.importer.source_policy import (
    allowed_source_types,
    can_ground_facts,
    can_prove_current_scope,
    source_allows,
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
        book_code='PS.G05.SCI.S2.AUTH',
        edition='2026/latest-to-verify',
        status='DRAFT',
    )
    db.add(book); db.flush()
    unit = Unit(book_id=book.id, unit_number=4, title='أجهزة جسم الإنسان والجلد', order_no=1)
    db.add(unit); db.flush()
    lesson = Lesson(
        unit_id=unit.id,
        lesson_number=1,
        lesson_code='PS.G05.SCI.S2.AUTH.L01',
        title='الجهاز الهيكلي',
        status='DRAFT',
    )
    db.add(lesson); db.flush()
    package = SourcePackage(book_id=book.id, package_code='PS-G05-SCI-S2-AUTH', status='INGESTING')
    db.add(package); db.flush()
    return db, lesson, package


def _add_source_link(db, package, lesson, *, source_type, relation, edition='2026 verified'):
    source = SourceFile(
        package_id=package.id,
        source_type=source_type,
        edition=edition,
        reliability_score=100,
        edition_match_score=100,
        status='EXTRACTED',
        extracted_text='أجهزة جسم الإنسان والجلد — الجهاز الهيكلي',
    )
    db.add(source); db.flush()
    chunk = SourceChunk(
        source_file_id=source.id,
        chunk_index=0,
        page_number=1,
        text='أجهزة جسم الإنسان والجلد — الجهاز الهيكلي',
    )
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


def test_source_authority_matrix_is_fail_closed():
    assert can_ground_facts('STUDENT_BOOK') is True
    assert can_ground_facts('OFFICIAL_PACKAGE') is True
    assert can_ground_facts('SOLUTIONS') is False
    assert can_ground_facts('CURRICULUM_PLAN') is False
    assert can_ground_facts('UNKNOWN_FUTURE_TYPE') is False

    assert can_prove_current_scope('CURRICULUM_PLAN') is True
    assert can_prove_current_scope('OFFICIAL_PACKAGE') is True
    assert can_prove_current_scope('STUDENT_BOOK') is False
    assert source_allows('SOLUTIONS', 'answer_validation') is True
    assert source_allows('SOLUTIONS', 'not_a_capability') is False
    assert allowed_source_types('factual_grounding') == {'STUDENT_BOOK', 'OFFICIAL_PACKAGE'}


def test_generation_packet_rejects_solution_as_teaching_source():
    db, lesson, package = _db_with_lesson()
    try:
        _, chunk = _add_source_link(
            db, package, lesson,
            source_type='SOLUTIONS',
            relation='TEACHING_SOURCE',
        )
        packet = build_lesson_generation_packet(db, lesson.id)
        assert packet['source_context'] == []
        assert packet['authority_gate']['factual_sources_authorized'] is False
        rejected = packet['authority_gate']['rejected_teaching_sources']
        assert len(rejected) == 1
        assert rejected[0]['source_chunk_id'] == chunk.id
        assert rejected[0]['source_type'] == 'SOLUTIONS'
        assert rejected[0]['reason'] == 'SOURCE_TYPE_NOT_AUTHORIZED_FOR_FACTUAL_GROUNDING'
    finally:
        db.close()


def test_generation_packet_rejects_student_book_as_scope_evidence():
    db, lesson, package = _db_with_lesson()
    try:
        _add_source_link(
            db, package, lesson,
            source_type='STUDENT_BOOK',
            relation='TEACHING_SOURCE',
            edition='2020 third edition',
        )
        _, bad_scope_chunk = _add_source_link(
            db, package, lesson,
            source_type='STUDENT_BOOK',
            relation='CURRENT_SCOPE_EVIDENCE',
            edition='2026 verified edition',
        )
        packet = build_lesson_generation_packet(db, lesson.id)
        assert packet['scope_evidence'] == []
        assert packet['scope_gate']['blocked'] is True
        assert packet['authority_gate']['scope_sources_authorized'] is False
        rejected = packet['authority_gate']['rejected_scope_sources']
        assert rejected[0]['source_chunk_id'] == bad_scope_chunk.id
        assert rejected[0]['reason'] == 'SOURCE_TYPE_NOT_AUTHORIZED_FOR_CURRENT_SCOPE'
    finally:
        db.close()


def test_candidate_qa_blocks_unauthorized_factual_source_even_with_perfect_scores():
    db, lesson, package = _db_with_lesson()
    try:
        _, chunk = _add_source_link(
            db, package, lesson,
            source_type='SOLUTIONS',
            relation='TEACHING_SOURCE',
        )
        candidate = ContentCandidate(
            lesson_id=lesson.id,
            version_label='candidate-authority-test',
            status='READY_FOR_QA',
            schema_valid=True,
            provenance_score=100,
            validation_json={
                'invalid_chunk_refs': [],
                'unknown_skill_codes': [],
            },
            output_json={
                'learning_objectives': ['هدف'],
                'concepts': ['مفهوم'],
                'sections': [
                    {
                        'title': 'قسم',
                        'blocks': [
                            {'type': 'TEXT', 'body': 'نص', 'source_chunk_ids': [chunk.id]},
                        ],
                    }
                ],
                'questions': [
                    {'prompt': 'سؤال', 'source_chunk_ids': [chunk.id]},
                ],
                'summary': [
                    {'text': 'ملخص', 'source_chunk_ids': [chunk.id]},
                ],
                'flashcards': [],
                'misconceptions': [],
                'remediation_candidates': [],
            },
        )
        db.add(candidate); db.commit(); db.refresh(candidate)

        result = calculate_candidate_qa(db, candidate)
        assert result['preflight_status'] == 'BLOCKED'
        assert result['release_readiness'] == 'BLOCKED'
        assert result['source_evidence']['score'] == 0.0
        assert result['source_evidence']['authority_violations'][0]['source_type'] == 'SOLUTIONS'
        assert 'source_authority_violation' in result['blocking_reasons']
    finally:
        db.close()
