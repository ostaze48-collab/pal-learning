from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db.deps import get_db
from ..auth.deps import require_admin
from ..db.models import (
    ContentBlock, Lesson, LessonSection, LessonSkill, LessonSourceLink, Question, QuestionSkill,
    QAResult, ReferenceAnswer, SourceChunk, SourceFile, SourcePackage, Unit
)
from ..importer.source_policy import can_ground_facts, can_validate_answers
from ..services.solution_alignment import align_questions, parse_solution_items, validate_answer

router = APIRouter(prefix='/qa', tags=['quality-assurance'], dependencies=[Depends(require_admin)])


def _lesson_ids_for_book(db: Session, book_id: int) -> list[int]:
    unit_ids = [x.id for x in db.query(Unit).filter(Unit.book_id == book_id).all()]
    if not unit_ids:
        return []
    return [x.id for x in db.query(Lesson).filter(Lesson.unit_id.in_(unit_ids)).all()]


def _authorized_factual_lesson_links(db: Session, lesson_id: int) -> list[LessonSourceLink]:
    links = db.query(LessonSourceLink).filter(
        LessonSourceLink.lesson_id == lesson_id,
        LessonSourceLink.relation == 'TEACHING_SOURCE',
        LessonSourceLink.status.in_(['CANDIDATE', 'VERIFIED_CANDIDATE', 'VERIFIED']),
    ).all()
    authorized = []
    for link in links:
        chunk = db.query(SourceChunk).filter(SourceChunk.id == link.source_chunk_id).first()
        if not chunk:
            continue
        source = db.query(SourceFile).filter(SourceFile.id == chunk.source_file_id).first()
        if source and can_ground_facts(source.source_type):
            authorized.append(link)
    return authorized


def _source_ref_chunk_id(ref) -> int | None:
    if isinstance(ref, int):
        return ref
    if isinstance(ref, str) and ref.isdigit():
        return int(ref)
    if isinstance(ref, dict):
        for key in ('source_chunk_id', 'chunk_id', 'id'):
            value = ref.get(key)
            if isinstance(value, int):
                return value
            if isinstance(value, str) and value.isdigit():
                return int(value)
    return None


def _block_has_authorized_factual_provenance(db: Session, block: ContentBlock) -> bool:
    refs = list(block.source_refs or [])
    if not refs:
        return False
    chunk_ids = [_source_ref_chunk_id(ref) for ref in refs]
    if not chunk_ids or any(chunk_id is None for chunk_id in chunk_ids):
        return False
    chunks = db.query(SourceChunk).filter(SourceChunk.id.in_(chunk_ids)).all()
    by_id = {chunk.id: chunk for chunk in chunks}
    if len(by_id) != len(set(chunk_ids)):
        return False
    source_ids = {chunk.source_file_id for chunk in chunks}
    sources = db.query(SourceFile).filter(SourceFile.id.in_(source_ids)).all()
    by_source = {source.id: source for source in sources}
    for chunk_id in chunk_ids:
        chunk = by_id.get(chunk_id)
        source = by_source.get(chunk.source_file_id) if chunk else None
        if not source or not can_ground_facts(source.source_type):
            return False
    return True


def _reference_answer_weight(db: Session, ref: ReferenceAnswer, validation_weights: dict[str, float]) -> float:
    if not ref.source_file_id:
        return 0.0
    source = db.query(SourceFile).filter(SourceFile.id == ref.source_file_id).first()
    if not source or not can_validate_answers(source.source_type):
        return 0.0
    return validation_weights.get(ref.validation_status, 0.2)


@router.post('/source-packages/{package_id}/align-solutions')
def align_solution_source(package_id: int, db: Session = Depends(get_db)):
    package = db.query(SourcePackage).filter(SourcePackage.id == package_id).first()
    if not package:
        raise HTTPException(404, 'Package not found')
    solution_files = db.query(SourceFile).filter(
        SourceFile.package_id == package_id,
        SourceFile.source_type == 'SOLUTIONS',
    ).all()
    solution_files = [source for source in solution_files if can_validate_answers(source.source_type)]
    if not solution_files:
        raise HTTPException(409, 'No policy-authorized SOLUTIONS source has been imported')

    parsed_items = []
    for source in solution_files:
        items = parse_solution_items(source.extracted_text or '')
        for item in items:
            parsed_items.append({**item, 'source_file_id': source.id})
    if not parsed_items:
        raise HTTPException(409, 'No conservative سؤال/جواب pairs were detected; AI/admin review is required')

    lesson_ids = _lesson_ids_for_book(db, package.book_id)
    questions = db.query(Question).filter(Question.lesson_id.in_(lesson_ids)).all() if lesson_ids else []
    prompts = [q.prompt for q in questions]
    aligned = align_questions(prompts, parsed_items, threshold=0.36)
    authorized_ids = {source.id for source in solution_files}
    results = []
    for q, match in zip(questions, aligned):
        if not match.get('matched'):
            results.append({'question_id': q.id, **match})
            continue

        matched_source_id = match.get('source_file_id')
        if matched_source_id not in authorized_ids:
            results.append({
                'question_id': q.id,
                **match,
                'matched': False,
                'authority_blocked': True,
                'blocking_reason': 'REFERENCE_SOURCE_NOT_AUTHORIZED_FOR_ANSWER_VALIDATION',
            })
            continue

        ref_answer = match.get('reference_answer') or ''
        expected = q.correct_answer_json
        if isinstance(expected, dict) and 'value' in expected:
            expected = expected['value']
        if isinstance(expected, int) and q.options_json and 0 <= expected < len(q.options_json):
            expected_text = str(q.options_json[expected])
        else:
            expected_text = str(expected or '')
        validation = validate_answer(expected_text, ref_answer)
        ref = db.query(ReferenceAnswer).filter(ReferenceAnswer.question_id == q.id).first()
        if not ref:
            ref = ReferenceAnswer(question_id=q.id, answer_text=ref_answer)
            db.add(ref)
        ref.answer_text = ref_answer
        ref.confidence = float(match.get('score', 0))
        ref.validation_status = validation['status']
        ref.source_file_id = int(matched_source_id)
        results.append({'question_id': q.id, **match, 'validation': validation})
    db.commit()
    return {
        'package_id': package_id,
        'solution_items_detected': len(parsed_items),
        'questions_checked': len(questions),
        'matches': results,
        'answer_validation_source_policy_enforced': True,
    }


def calculate_lesson_qa(db: Session, lesson_id: int) -> dict:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')
    sections = db.query(LessonSection).filter(LessonSection.lesson_id == lesson_id).all()
    section_ids = [x.id for x in sections]
    blocks = db.query(ContentBlock).filter(ContentBlock.lesson_section_id.in_(section_ids)).all() if section_ids else []
    lesson_skills = db.query(LessonSkill).filter(LessonSkill.lesson_id == lesson_id).all()
    questions = db.query(Question).filter(Question.lesson_id == lesson_id).all()

    blocks_with_any_refs = sum(1 for block in blocks if block.source_refs)
    blocks_with_authorized_factual_refs = sum(
        1 for block in blocks if _block_has_authorized_factual_provenance(db, block)
    )
    all_lesson_source_links = db.query(LessonSourceLink).filter(LessonSourceLink.lesson_id == lesson_id).all()
    factual_lesson_source_links = _authorized_factual_lesson_links(db, lesson_id)
    source_alignment = (100 * blocks_with_authorized_factual_refs / len(blocks)) if blocks else 0
    if blocks and blocks_with_authorized_factual_refs == 0 and factual_lesson_source_links:
        source_alignment = 60  # factual lesson provenance exists, but block-level provenance is still incomplete
    elif blocks and blocks_with_authorized_factual_refs == 0:
        source_alignment = 25  # no authorized factual lesson-level provenance has been mapped yet

    linked_question_ids = {
        x.question_id for x in db.query(QuestionSkill).filter(
            QuestionSkill.question_id.in_([q.id for q in questions])
        ).all()
    } if questions else set()
    skill_coverage = (100 * len(linked_question_ids) / len(questions)) if questions else 0
    if lesson_skills and not questions:
        skill_coverage = 20

    valid_questions = sum(1 for q in questions if q.prompt and q.correct_answer_json is not None and q.status in {'PUBLISHED','APPROVED'})
    question_quality = (100 * valid_questions / len(questions)) if questions else 0

    refs = db.query(ReferenceAnswer).filter(ReferenceAnswer.question_id.in_([q.id for q in questions])).all() if questions else []
    validation_weights = {
        'VERIFIED_MATCH': 1.0,
        'SEMANTIC_MATCH': 0.9,
        'REVIEW': 0.5,
        'DEMO_REQUIRES_SOURCE_VERIFICATION': 0.25,
        'UNVERIFIED': 0.2,
        'CONFLICT': 0.0,
    }
    authorized_reference_answers = sum(
        1 for ref in refs
        if ref.source_file_id
        and (
            (source := db.query(SourceFile).filter(SourceFile.id == ref.source_file_id).first()) is not None
            and can_validate_answers(source.source_type)
        )
    )
    answer_validation = (
        100 * (sum(_reference_answer_weight(db, ref, validation_weights) for ref in refs) / len(questions))
        if questions else 0
    )

    overall = (
        source_alignment * 0.35 +
        skill_coverage * 0.20 +
        question_quality * 0.20 +
        answer_validation * 0.25
    )
    status = 'PASS' if overall >= 85 and source_alignment >= 80 and answer_validation >= 85 else ('REVIEW' if overall >= 60 else 'BLOCKED')
    return {
        'lesson_id': lesson_id,
        'lesson_code': lesson.lesson_code,
        'source_alignment_score': round(source_alignment, 1),
        'skill_coverage_score': round(skill_coverage, 1),
        'question_quality_score': round(question_quality, 1),
        'answer_validation_score': round(answer_validation, 1),
        'overall_score': round(overall, 1),
        'status': status,
        'details': {
            'sections': len(sections),
            'blocks': len(blocks),
            'blocks_with_source_refs': blocks_with_any_refs,
            'blocks_with_authorized_factual_source_refs': blocks_with_authorized_factual_refs,
            'lesson_skills': len(lesson_skills),
            'lesson_source_links': len(all_lesson_source_links),
            'authorized_factual_lesson_source_links': len(factual_lesson_source_links),
            'questions': len(questions),
            'reference_answers': len(refs),
            'authorized_answer_validation_refs': authorized_reference_answers,
        },
    }


@router.post('/lessons/{lesson_id}/run')
def run_lesson_qa(lesson_id: int, db: Session = Depends(get_db)):
    result = calculate_lesson_qa(db, lesson_id)
    row = QAResult(
        lesson_id=lesson_id,
        overall_score=result['overall_score'],
        source_alignment_score=result['source_alignment_score'],
        skill_coverage_score=result['skill_coverage_score'],
        question_quality_score=result['question_quality_score'],
        answer_validation_score=result['answer_validation_score'],
        details_json=result['details'],
        status=result['status'],
    )
    db.add(row); db.commit(); db.refresh(row)
    return {'qa_result_id': row.id, **result}


@router.post('/lessons/{lesson_id}/publish')
def publish_lesson(lesson_id: int, db: Session = Depends(get_db)):
    """Legacy route retained only as an explicit fail-closed compatibility guard.

    Publication is intentionally unavailable until an audited release transaction
    is implemented after staging, academic QA and the final non-publishing release gate.
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')
    raise HTTPException(
        409,
        detail={
            'message': 'Direct lesson publication is disabled',
            'publication_authorized': False,
            'required_flow': [
                'CANDIDATE_QA',
                'STAGING_APPROVAL',
                'ACADEMIC_QA',
                'FINAL_RELEASE_GATE',
                'AUDITED_RELEASE_TRANSACTION_NOT_IMPLEMENTED',
            ],
        },
    )
