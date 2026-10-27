from __future__ import annotations

import os
from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.deps import get_db
from ..db.models import Lesson, SourcePackage, Unit
from ..importer.discovery_catalog import discoveries_for_package
from ..services.generation_packet import build_lesson_generation_packet

router = APIRouter(
    prefix='/factory',
    tags=['content-factory-generation-readiness'],
    dependencies=[Depends(require_admin)],
)


def _provider_readiness() -> dict:
    provider = os.getenv('AI_PROVIDER', 'LOCAL_MOCK').upper()
    if provider == 'OPENAI':
        key_configured = bool(os.getenv('OPENAI_API_KEY'))
        model_configured = bool(os.getenv('OPENAI_MODEL') or os.getenv('OPENAI_MODEL_BALANCED'))
        execution_ready = key_configured and model_configured
    else:
        key_configured = False
        model_configured = False
        execution_ready = False
    return {
        'provider': provider,
        'execution_ready': execution_ready,
        'key_configured': key_configured,
        'model_configured': model_configured,
    }


def calculate_generation_readiness(db: Session, lesson_id: int) -> dict:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')

    packet = build_lesson_generation_packet(db, lesson_id)
    unit = db.query(Unit).filter(Unit.id == lesson.unit_id).first()
    package = None
    if unit:
        package = db.query(SourcePackage).filter(SourcePackage.book_id == unit.book_id).first()

    blockers: list[str] = []
    if not packet['skills']:
        blockers.append('NO_SKILLS_LINKED')
    if not packet['source_context']:
        scope_reason = (packet.get('scope_gate') or {}).get('blocking_reason')
        rejected_factual = (packet.get('authority_gate') or {}).get('rejected_teaching_sources') or []
        if scope_reason:
            blockers.append(scope_reason)
        elif rejected_factual:
            blockers.append('FACTUAL_SOURCE_AUTHORITY_BLOCKED')
        else:
            blockers.append('NO_AUTHORIZED_FACTUAL_SOURCE_LINKED')

    provider = _provider_readiness()
    discoveries = discoveries_for_package(package.package_code) if package else []
    queue_ready = not blockers

    next_actions = []
    if 'NO_SKILLS_LINKED' in blockers:
        next_actions.append('LINK_LESSON_SKILLS')
    if 'NO_AUTHORIZED_FACTUAL_SOURCE_LINKED' in blockers:
        next_actions.append('IMPORT_AND_LINK_FACTUAL_SOURCE')
    if 'FACTUAL_SOURCE_AUTHORITY_BLOCKED' in blockers:
        next_actions.append('REPLACE_OR_RECLASSIFY_UNAUTHORIZED_TEACHING_SOURCE')
    if 'LEGACY_TEACHING_SOURCE_REQUIRES_CURRENT_SCOPE_EVIDENCE' in blockers:
        next_actions.extend(['OBTAIN_CURRENT_CURRICULUM_PLAN', 'UPLOAD_CURRICULUM_PLAN', 'VERIFY_CURRENT_PLAN_SCOPE'])
    if queue_ready and not provider['execution_ready']:
        next_actions.append('CONFIGURE_REAL_AI_PROVIDER_FOR_EXECUTION')
    if queue_ready and provider['execution_ready']:
        next_actions.append('QUEUE_GENERATION_JOB')

    return {
        'lesson': packet['lesson'],
        'package_id': package.id if package else None,
        'package_code': package.package_code if package else None,
        'queue_ready': queue_ready,
        'execution_ready': queue_ready and provider['execution_ready'],
        'blockers': blockers,
        'next_actions': next_actions,
        'skills_count': len(packet['skills']),
        'authorized_factual_source_chunks': len(packet['source_context']),
        'scope_evidence_count': len(packet.get('scope_evidence') or []),
        'scope_gate': packet.get('scope_gate') or {},
        'authority_gate': packet.get('authority_gate') or {},
        'provider': provider,
        'discovery_candidates': [asdict(item) for item in discoveries],
        'policy': {
            'diagnostic_only': True,
            'creates_ai_job': False,
            'publishes_content': False,
        },
    }


@router.get('/lessons/{lesson_id}/generation-readiness')
def generation_readiness(lesson_id: int, db: Session = Depends(get_db)):
    return calculate_generation_readiness(db, lesson_id)
