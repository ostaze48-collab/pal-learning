from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.deps import get_db
from ..db.models import Lesson, Question, ReferenceAnswer, SourceFile
from ..importer.source_policy import can_validate_answers

router = APIRouter(
    prefix='/qa',
    tags=['quality-assurance-reference-console'],
    dependencies=[Depends(require_admin)],
)


@router.get('/lessons/{lesson_id}/reference-answers')
def list_lesson_reference_answers(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')

    questions = db.query(Question).filter(Question.lesson_id == lesson_id).order_by(Question.id).all()
    rows = []
    for question in questions:
        ref = db.query(ReferenceAnswer).filter(ReferenceAnswer.question_id == question.id).first()
        source = None
        if ref and ref.source_file_id:
            source = db.query(SourceFile).filter(SourceFile.id == ref.source_file_id).first()
        authorized = bool(source and can_validate_answers(source.source_type))
        rows.append({
            'question_id': question.id,
            'question_code': question.question_code,
            'prompt': question.prompt,
            'question_status': question.status,
            'reference_answer': ref.answer_text if ref else None,
            'validation_status': ref.validation_status if ref else 'MISSING',
            'confidence': float(ref.confidence or 0) if ref else 0.0,
            'source_file_id': ref.source_file_id if ref else None,
            'source_type': source.source_type if source else None,
            'source_filename': source.original_filename if source else None,
            'source_edition': source.edition if source else None,
            'source_authorized_for_answer_validation': authorized,
        })

    counts: dict[str, int] = {}
    for row in rows:
        key = row['validation_status']
        counts[key] = counts.get(key, 0) + 1

    return {
        'lesson_id': lesson.id,
        'lesson_code': lesson.lesson_code,
        'lesson_title': lesson.title,
        'questions': len(questions),
        'status_counts': counts,
        'reference_answers': rows,
        'publication_authorized': False,
        'note': 'Reference answers validate answer keys only. They are not factual lesson-grounding sources.',
    }
