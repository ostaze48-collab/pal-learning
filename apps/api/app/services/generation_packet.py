from __future__ import annotations

from sqlalchemy.orm import Session

from ..db.models import (
    Lesson, LessonSkill, LessonSourceLink, Question, Skill, SourceChunk, SourceFile
)


def _source_payload(db: Session, link: LessonSourceLink) -> dict | None:
    chunk = db.query(SourceChunk).filter(SourceChunk.id == link.source_chunk_id).first()
    if not chunk:
        return None
    source = db.query(SourceFile).filter(SourceFile.id == chunk.source_file_id).first()
    return {
        'source_file_id': source.id if source else None,
        'source_type': source.source_type if source else None,
        'source_edition': source.edition if source else None,
        'source_chunk_id': chunk.id,
        'page_number': chunk.page_number,
        'confidence': link.confidence,
        'relation': link.relation,
        'text': chunk.text[:2200],
    }


def _looks_current_teaching_source(item: dict) -> bool:
    if item.get('source_type') == 'OFFICIAL_PACKAGE':
        return True
    edition = str(item.get('source_edition') or '')
    return '2026' in edition or '2025/2026' in edition or '2026/2027' in edition


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

    teaching_links = db.query(LessonSourceLink).filter(
        LessonSourceLink.lesson_id == lesson_id,
        LessonSourceLink.relation == 'TEACHING_SOURCE',
        LessonSourceLink.status.in_(['CANDIDATE', 'VERIFIED_CANDIDATE', 'VERIFIED'])
    ).order_by(LessonSourceLink.confidence.desc()).all()
    source_context = []
    for link in teaching_links[:12]:
        item = _source_payload(db, link)
        if item:
            source_context.append(item)

    scope_links = db.query(LessonSourceLink).filter(
        LessonSourceLink.lesson_id == lesson_id,
        LessonSourceLink.relation == 'CURRENT_SCOPE_EVIDENCE',
        LessonSourceLink.status == 'VERIFIED',
    ).order_by(LessonSourceLink.confidence.desc()).all()
    scope_evidence = []
    for link in scope_links[:6]:
        item = _source_payload(db, link)
        if item:
            # Scope evidence is metadata/context for gating only. It must not be
            # included in the source_chunk allowlist used by generated facts.
            scope_evidence.append({
                'source_file_id': item['source_file_id'],
                'source_type': item['source_type'],
                'source_edition': item['source_edition'],
                'source_chunk_id': item['source_chunk_id'],
                'page_number': item['page_number'],
                'confidence': item['confidence'],
                'relation': item['relation'],
                'text_preview': item['text'][:700],
            })

    current_teaching_source = any(_looks_current_teaching_source(item) for item in source_context)
    scope_evidence_required = bool(source_context) and not current_teaching_source
    # Fail closed for legacy-only teaching material until a current curriculum plan
    # confirms that this exact unit/lesson remains in scope. Returning no factual
    # context causes the existing factory queue gate to reject generation.
    effective_source_context = source_context
    scope_block_reason = None
    if scope_evidence_required and not scope_evidence:
        effective_source_context = []
        scope_block_reason = 'LEGACY_TEACHING_SOURCE_REQUIRES_CURRENT_SCOPE_EVIDENCE'

    existing_questions = db.query(Question).filter(Question.lesson_id == lesson_id).all()
    return {
        'contract_version': 'lesson-generation-packet/v2',
        'lesson': {
            'id': lesson.id,
            'lesson_code': lesson.lesson_code,
            'title': lesson.title,
            'estimated_minutes': lesson.estimated_minutes,
        },
        'skills': skills,
        'source_context': effective_source_context,
        'scope_evidence': scope_evidence,
        'scope_gate': {
            'current_teaching_source': current_teaching_source,
            'current_scope_evidence_required': scope_evidence_required,
            'current_scope_evidence_present': bool(scope_evidence),
            'blocked': bool(scope_block_reason),
            'blocking_reason': scope_block_reason,
        },
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
            'grounding': 'Use only supplied curriculum teaching context for factual curriculum claims.',
            'provenance_required': True,
            'provenance_field': 'source_chunk_ids',
            'scope_evidence_is_non_factual': True,
            'lesson_loop': ['EXPLORE', 'UNDERSTAND', 'TRY', 'CHECK', 'DEEPEN', 'MASTERY', 'SUMMARY'],
            'avoid': [
                'invented curriculum facts',
                'using curriculum-plan text as factual lesson explanation',
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
