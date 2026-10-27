from __future__ import annotations

from sqlalchemy.orm import Session

from ..db.models import (
    Lesson, LessonSkill, LessonSourceLink, Question, Skill, SourceChunk, SourceFile
)


def build_lesson_generation_packet(db: Session, lesson_id: int) -> dict:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise ValueError('Lesson not found')

    skill_rows = db.query(LessonSkill, Skill).join(Skill, Skill.id == LessonSkill.skill_id).filter(
        LessonSkill.lesson_id == lesson_id
    ).all()
    skills = [
        {
            'skill_id': skill.id,
            'skill_code': skill.skill_code,
            'name_ar': skill.name_ar,
            'domain': skill.domain,
            'relationship': link.relationship,
            'mastery_threshold': skill.mastery_threshold,
        }
        for link, skill in skill_rows
    ]

    links = db.query(LessonSourceLink).filter(
        LessonSourceLink.lesson_id == lesson_id,
        LessonSourceLink.status.in_(['CANDIDATE', 'VERIFIED_CANDIDATE', 'VERIFIED'])
    ).order_by(LessonSourceLink.confidence.desc()).all()
    source_context = []
    for link in links[:12]:
        chunk = db.query(SourceChunk).filter(SourceChunk.id == link.source_chunk_id).first()
        if not chunk:
            continue
        source = db.query(SourceFile).filter(SourceFile.id == chunk.source_file_id).first()
        source_context.append({
            'source_file_id': source.id if source else None,
            'source_type': source.source_type if source else None,
            'source_chunk_id': chunk.id,
            'page_number': chunk.page_number,
            'confidence': link.confidence,
            'text': chunk.text[:2200],
        })

    existing_questions = db.query(Question).filter(Question.lesson_id == lesson_id).all()
    return {
        'contract_version': 'lesson-generation-packet/v1',
        'lesson': {
            'id': lesson.id,
            'lesson_code': lesson.lesson_code,
            'title': lesson.title,
            'estimated_minutes': lesson.estimated_minutes,
        },
        'skills': skills,
        'source_context': source_context,
        'existing_questions': [
            {
                'question_code': q.question_code,
                'prompt': q.prompt,
                'purpose': q.purpose,
                'difficulty': q.difficulty,
            } for q in existing_questions
        ],
        'generation_rules': {
            'language': 'Arabic',
            'direction': 'RTL',
            'grounding': 'Use only supplied curriculum context for factual curriculum claims.',
            'provenance_required': True,
            'provenance_field': 'source_chunk_ids',
            'lesson_loop': ['EXPLORE', 'UNDERSTAND', 'TRY', 'CHECK', 'DEEPEN', 'MASTERY', 'SUMMARY'],
            'avoid': [
                'invented curriculum facts',
                'long lecture-like blocks',
                'unsupported answer keys',
                'stigmatising grade-level labels during remediation',
            ],
        },
        'requested_output': {
            'learning_objectives': True,
            'concepts': True,
            'lesson_sections': True,
            'content_blocks': True,
            'practice_questions': True,
            'mastery_questions': True,
            'misconceptions': True,
            'remediation_candidates': True,
            'summary': True,
            'flashcards': True,
        },
    }
