from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db.deps import get_db
from ..auth.deps import require_admin
from ..db.models import (
    Book, ContentBlock, Lesson, LessonSection, LessonSkill, LessonSourceLink, Question, QuestionSkill,
    QAResult, ReferenceAnswer, SourceFile, SourcePackage, Unit
)
from ..services.solution_alignment import align_questions, parse_solution_items, validate_answer

router = APIRouter(prefix='/qa', tags=['quality-assurance'], dependencies=[Depends(require_admin)])


def _lesson_ids_for_book(db: Session, book_id: int) -> list[int]:
    unit_ids = [x.id for x in db.query(Unit).filter(Unit.book_id == book_id).all()]
    if not unit_ids:
        return []
    return [x.id for x in db.query(Lesson).filter(Lesson.unit_id.in_(unit_ids)).all()]


@router.post('/source-packages/{package_id}/align-solutions')
def align_solution_source(package_id: int, db: Session = Depends(get_db)):
    package = db.query(SourcePackage).filter(SourcePackage.id == package_id).first()
    if not package:
        raise HTTPException(404, 'Package not found')
    solution_files = db.query(SourceFile).filter(
        SourceFile.package_id == package_id,
        SourceFile.source_type == 'SOLUTIONS',
    ).all()
    if not solution_files:
        raise HTTPException(409, 'No SOLUTIONS source has been imported')
    parsed_items = []
    item_source = {}
    for source in solution_files:
        items = parse_solution_items(source.extracted_text or '')
        for item in items:
            idx = len(parsed_items)
            parsed_items.append(item)
            item_source[idx] = source.id
    if not parsed_items:
        raise HTTPException(409, 'No conservative سؤال/جواب pairs were detected; AI/admin review is required')

    lesson_ids = _lesson_ids_for_book(db, package.book_id)
    questions = db.query(Question).filter(Question.lesson_id.in_(lesson_ids)).all() if lesson_ids else []
    prompts = [q.prompt for q in questions]
    aligned = align_questions(prompts, parsed_items, threshold=0.36)
    results = []
    for q, match in zip(questions, aligned):
        if not match.get('matched'):
            results.append({'question_id': q.id, **match})
            continue
        # Locate the matched parsed item again by strongest question similarity through align_questions result.
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
        # Best effort source: first solution source; precise source lines stay in alignment output.
        ref.source_file_id = solution_files[0].id
        results.append({'question_id': q.id, **match, 'validation': validation})
    db.commit()
    return {
        'package_id': package_id,
        'solution_items_detected': len(parsed_items),
        'questions_checked': len(questions),
        'matches': results,
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

    blocks_with_refs = sum(1 for b in blocks if b.source_refs)
    lesson_source_links = db.query(LessonSourceLink).filter(LessonSourceLink.lesson_id == lesson_id).all()
    source_alignment = (100 * blocks_with_refs / len(blocks)) if blocks else 0
    if blocks and blocks_with_refs == 0 and lesson_source_links:
        source_alignment = 60  # lesson-level provenance exists, but block-level provenance is still incomplete
    elif blocks and blocks_with_refs == 0:
        source_alignment = 25  # source package exists but exact lesson/block provenance is not yet mapped

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
    answer_validation = 100 * (sum(validation_weights.get(r.validation_status, 0.2) for r in refs) / len(questions)) if questions else 0

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
            'sections': len(sections), 'blocks': len(blocks), 'blocks_with_source_refs': blocks_with_refs,
            'lesson_skills': len(lesson_skills), 'lesson_source_links': len(lesson_source_links), 'questions': len(questions), 'reference_answers': len(refs),
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
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')
    latest = db.query(QAResult).filter(QAResult.lesson_id == lesson_id).order_by(QAResult.id.desc()).first()
    if not latest:
        raise HTTPException(409, 'Run QA before publishing')
    if latest.status != 'PASS':
        raise HTTPException(409, {
            'message': 'Publishing blocked by QA gate',
            'overall_score': latest.overall_score,
            'source_alignment_score': latest.source_alignment_score,
            'answer_validation_score': latest.answer_validation_score,
        })
    lesson.status = 'PUBLISHED'
    db.commit()
    return {'lesson_id': lesson_id, 'status': lesson.status, 'qa_result_id': latest.id}
