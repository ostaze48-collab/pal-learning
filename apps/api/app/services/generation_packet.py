from __future__ import annotations

from sqlalchemy.orm import Session

from ..db.models import (
    Lesson, LessonSection, LessonSkill, LessonSourceLink, Question, Skill, SourceChunk, SourceFile
)
from ..importer.source_policy import can_ground_facts, can_prove_current_scope
from .visual_asset_pipeline import generation_visual_assets


def _source_payload(db: Session, link: LessonSourceLink) -> dict | None:
    chunk = db.query(SourceChunk).filter(SourceChunk.id == link.source_chunk_id).first()
    if not chunk:
        return None
    source = db.query(SourceFile).filter(SourceFile.id == chunk.source_file_id).first()
    extraction_meta = dict(source.extraction_meta or {}) if source else {}
    file_key = source.file_key if source else None
    durable_storage = bool(
        extraction_meta.get('durable_storage')
        or (isinstance(file_key, str) and file_key.startswith('s3://'))
    )
    return {
        'source_file_id': source.id if source else None,
        'source_type': source.source_type if source else None,
        'source_edition': source.edition if source else None,
        'source_file_key': file_key,
        'durable_storage': durable_storage,
        'source_chunk_id': chunk.id,
        'page_number': chunk.page_number,
        'confidence': link.confidence,
        'relation': link.relation,
        'link_status': link.status,
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

    section_rows = db.query(LessonSection).filter(
        LessonSection.lesson_id == lesson_id
    ).order_by(LessonSection.order_no, LessonSection.id).all()
    section_blueprint = [
        {
            'section_number': section.section_number,
            'title': section.title,
            'order_no': section.order_no,
        }
        for section in section_rows
    ]

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

    unverified_teaching_links = db.query(LessonSourceLink).filter(
        LessonSourceLink.lesson_id == lesson_id,
        LessonSourceLink.relation == 'TEACHING_SOURCE',
        LessonSourceLink.status.in_(['CANDIDATE', 'VERIFIED_CANDIDATE']),
    ).all()
    teaching_links = db.query(LessonSourceLink).filter(
        LessonSourceLink.lesson_id == lesson_id,
        LessonSourceLink.relation == 'TEACHING_SOURCE',
        LessonSourceLink.status == 'VERIFIED',
    ).order_by(LessonSourceLink.confidence.desc()).all()

    source_context = []
    rejected_teaching_sources = [
        {
            'source_chunk_id': link.source_chunk_id,
            'link_status': link.status,
            'reason': 'TEACHING_SOURCE_LINK_REQUIRES_ADMIN_VERIFICATION',
        }
        for link in unverified_teaching_links
    ]
    for link in teaching_links[:12]:
        item = _source_payload(db, link)
        if not item:
            continue
        if not can_ground_facts(item.get('source_type')):
            rejected_teaching_sources.append({
                'source_file_id': item.get('source_file_id'),
                'source_type': item.get('source_type'),
                'source_chunk_id': item.get('source_chunk_id'),
                'link_status': item.get('link_status'),
                'reason': 'SOURCE_TYPE_NOT_AUTHORIZED_FOR_FACTUAL_GROUNDING',
            })
            continue
        source_context.append(item)

    scope_links = db.query(LessonSourceLink).filter(
        LessonSourceLink.lesson_id == lesson_id,
        LessonSourceLink.relation == 'CURRENT_SCOPE_EVIDENCE',
        LessonSourceLink.status == 'VERIFIED',
    ).order_by(LessonSourceLink.confidence.desc()).all()
    scope_evidence = []
    rejected_scope_sources = []
    for link in scope_links[:6]:
        item = _source_payload(db, link)
        if not item:
            continue
        if not can_prove_current_scope(item.get('source_type')):
            rejected_scope_sources.append({
                'source_file_id': item.get('source_file_id'),
                'source_type': item.get('source_type'),
                'source_chunk_id': item.get('source_chunk_id'),
                'reason': 'SOURCE_TYPE_NOT_AUTHORIZED_FOR_CURRENT_SCOPE',
            })
            continue
        scope_evidence.append({
            'source_file_id': item['source_file_id'],
            'source_type': item['source_type'],
            'source_edition': item['source_edition'],
            'source_file_key': item['source_file_key'],
            'durable_storage': item['durable_storage'],
            'source_chunk_id': item['source_chunk_id'],
            'page_number': item['page_number'],
            'confidence': item['confidence'],
            'relation': item['relation'],
            'text_preview': item['text'][:700],
        })

    current_teaching_source = any(_looks_current_teaching_source(item) for item in source_context)
    scope_evidence_required = bool(source_context) and not current_teaching_source
    effective_source_context = source_context
    scope_block_reason = None
    if scope_evidence_required and not scope_evidence:
        effective_source_context = []
        scope_block_reason = 'LEGACY_TEACHING_SOURCE_REQUIRES_CURRENT_SCOPE_EVIDENCE'

    allowed_source_pages = {
        (int(item['source_file_id']), int(item['page_number']))
        for item in effective_source_context
        if item.get('source_file_id') is not None and item.get('page_number') is not None
    }
    visual_assets = generation_visual_assets(db, lesson_id, allowed_source_pages)

    existing_questions = db.query(Question).filter(Question.lesson_id == lesson_id).all()
    return {
        'contract_version': 'lesson-generation-packet/v7',
        'lesson': {
            'id': lesson.id,
            'lesson_code': lesson.lesson_code,
            'title': lesson.title,
            'estimated_minutes': lesson.estimated_minutes,
        },
        'section_blueprint': section_blueprint,
        'skills': skills,
        'source_context': effective_source_context,
        'visual_assets': visual_assets,
        'scope_evidence': scope_evidence,
        'authority_gate': {
            'rejected_teaching_sources': rejected_teaching_sources,
            'rejected_scope_sources': rejected_scope_sources,
            'admin_verified_teaching_source_required': True,
            'verified_teaching_source_count': len(teaching_links),
            'unverified_teaching_source_count': len(unverified_teaching_links),
            'factual_sources_authorized': not rejected_teaching_sources and bool(teaching_links),
            'scope_sources_authorized': not rejected_scope_sources,
        },
        'scope_gate': {
            'current_teaching_source': current_teaching_source,
            'current_scope_evidence_required': scope_evidence_required,
            'current_scope_evidence_present': bool(scope_evidence),
            'blocked': bool(scope_block_reason),
            'blocking_reason': scope_block_reason,
        },
        'storage_gate': {
            'all_factual_sources_durable': all(item.get('durable_storage') for item in effective_source_context) if effective_source_context else False,
            'non_durable_factual_source_file_ids': [
                item.get('source_file_id') for item in effective_source_context if not item.get('durable_storage')
            ],
        },
        'visual_gate': {
            'cleared_asset_count': len(visual_assets),
            'only_effective_source_pages_allowed': True,
            'admin_rights_clearance_required': True,
            'public_delivery_url_required': True,
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
            'grounding': 'Use only supplied Admin-verified curriculum teaching context for factual curriculum claims.',
            'provenance_required': True,
            'provenance_field': 'source_chunk_ids',
            'scope_evidence_is_non_factual': True,
            'source_authority_enforced': True,
            'admin_verified_teaching_source_required': True,
            'durable_source_storage_tracked': True,
            'visual_first_when_cleared_asset_exists': True,
            'visual_assets_are_server_allowlisted': True,
            'section_blueprint_enforced': bool(section_blueprint),
            'section_blueprint_rule': 'When section_blueprint is non-empty, preserve its section count, order, and pedagogical intent. Do not merge, delete, or invent stages.',
            'lesson_loop': ['EXPLORE', 'UNDERSTAND', 'TRY', 'CHECK', 'DEEPEN', 'MASTERY', 'SUMMARY'],
            'interactive_block_types': ['IMAGE', 'MATCHING', 'CLASSIFY', 'COMPARE_GRID'],
            'avoid': [
                'invented curriculum facts',
                'invented image URLs, page numbers, rights decisions, or hotspot coordinates',
                'using unreviewed lesson-source candidates as factual context',
                'using curriculum-plan text as factual lesson explanation',
                'using solution/reference-answer sources as factual lesson explanation',
                'changing an approved pedagogical section blueprint without explicit admin revision',
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
