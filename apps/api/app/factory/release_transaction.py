from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.base import engine
from ..db.deps import get_db
from ..db.models import (
    ContentBlock,
    ContentVersion,
    Lesson,
    LessonSection,
    LessonSkill,
    LessonSourceLink,
    Question,
    QuestionSkill,
    Skill,
    SourceChunk,
    SourceFile,
    User,
)
from ..db.staging_models import ReleaseTransaction, StagedLessonVersion
from ..importer.source_policy import can_ground_facts
from ..schemas.factory import GeneratedLessonPayload
from ..services.release_manifest import build_release_manifest
from .release_gate import calculate_final_release_gate

router = APIRouter(prefix='/factory', tags=['audited-release-transaction'])

PRODUCTION_DATABASES = {'postgresql', 'postgres'}


def _artifact_source_chunk_ids(payload: GeneratedLessonPayload) -> set[int]:
    ids: set[int] = set()
    for section in payload.sections:
        for block in section.blocks:
            ids.update(block.source_chunk_ids)
    for question in payload.questions:
        ids.update(question.source_chunk_ids)
    for item in payload.summary:
        ids.update(item.source_chunk_ids)
    for item in payload.flashcards:
        ids.update(item.source_chunk_ids)
    for item in payload.misconceptions:
        ids.update(item.source_chunk_ids)
    for item in payload.remediation_candidates:
        ids.update(item.source_chunk_ids)
    return ids


def _artifact_skill_codes(payload: GeneratedLessonPayload) -> set[str]:
    codes: set[str] = set()
    for question in payload.questions:
        codes.update(question.skill_codes)
    for item in payload.misconceptions:
        codes.update(item.skill_codes)
    for item in payload.remediation_candidates:
        codes.update(item.skill_codes)
    return codes


def _validate_live_release_evidence(db: Session, lesson_id: int, payload: GeneratedLessonPayload) -> dict:
    source_ids = _artifact_source_chunk_ids(payload)
    invalid_sources: list[dict] = []
    for chunk_id in sorted(source_ids):
        row = db.query(SourceChunk, SourceFile).join(
            SourceFile, SourceFile.id == SourceChunk.source_file_id
        ).filter(SourceChunk.id == chunk_id).first()
        link = db.query(LessonSourceLink).filter(
            LessonSourceLink.lesson_id == lesson_id,
            LessonSourceLink.source_chunk_id == chunk_id,
            LessonSourceLink.relation == 'TEACHING_SOURCE',
            LessonSourceLink.status == 'VERIFIED',
        ).first()
        if not row:
            invalid_sources.append({'source_chunk_id': chunk_id, 'reason': 'SOURCE_CHUNK_MISSING'})
            continue
        _, source = row
        if not link:
            invalid_sources.append({'source_chunk_id': chunk_id, 'reason': 'ADMIN_VERIFIED_TEACHING_LINK_MISSING'})
            continue
        if not can_ground_facts(source.source_type):
            invalid_sources.append({
                'source_chunk_id': chunk_id,
                'source_type': source.source_type,
                'reason': 'SOURCE_TYPE_NOT_AUTHORIZED_FOR_FACTUAL_GROUNDING',
            })

    skill_rows = db.query(LessonSkill, Skill).join(
        Skill, Skill.id == LessonSkill.skill_id
    ).filter(LessonSkill.lesson_id == lesson_id).all()
    allowed_skill_codes = {skill.skill_code for _, skill in skill_rows}
    unknown_skills = sorted(_artifact_skill_codes(payload) - allowed_skill_codes)

    if invalid_sources or unknown_skills:
        raise HTTPException(
            409,
            detail={
                'message': 'Release evidence changed after staging; rerun validation and staging',
                'invalid_sources': invalid_sources,
                'unknown_skill_codes': unknown_skills,
            },
        )
    return {
        'source_chunk_ids': sorted(source_ids),
        'skill_codes': sorted(_artifact_skill_codes(payload)),
    }


def _block_content(block) -> dict:
    content = dict(block.content or {})
    if block.title is not None:
        content['title'] = block.title
    if block.body is not None:
        content['body'] = block.body
    return content


def _release_result(tx: ReleaseTransaction, *, idempotent: bool) -> dict:
    return {
        'release_transaction_id': tx.id,
        'staged_version_id': tx.staged_version_id,
        'lesson_id': tx.lesson_id,
        'content_version_id': tx.content_version_id,
        'status': tx.status,
        'snapshot_sha256': tx.snapshot_sha256,
        'manifest_sha256': tx.manifest_sha256,
        'released_at': tx.released_at,
        'idempotent_replay': idempotent,
        'publication_authorized': tx.status == 'COMMITTED',
    }


def execute_audited_release(
    db: Session,
    *,
    staged_version_id: int,
    admin_user_id: int,
    database_backend: str,
) -> dict:
    if database_backend not in PRODUCTION_DATABASES:
        raise HTTPException(
            409,
            detail={
                'message': 'Audited release requires PostgreSQL',
                'blocker': 'PERSISTENT_POSTGRES_REQUIRED',
                'database_backend': database_backend,
            },
        )

    existing = db.query(ReleaseTransaction).filter(
        ReleaseTransaction.staged_version_id == staged_version_id
    ).first()
    if existing:
        return _release_result(existing, idempotent=True)

    staged = db.query(StagedLessonVersion).filter(
        StagedLessonVersion.id == staged_version_id
    ).with_for_update().first()
    if not staged:
        raise HTTPException(404, 'Staged lesson version not found')

    final_gate = calculate_final_release_gate(staged, database_backend)
    if final_gate['decision'] != 'READY_FOR_RELEASE_TRANSACTION':
        raise HTTPException(
            409,
            detail={
                'message': 'Final release gate is blocked',
                'blockers': final_gate['blockers'],
                'release_gate': final_gate,
            },
        )

    try:
        payload = GeneratedLessonPayload.model_validate(staged.snapshot_json or {})
    except ValidationError as exc:
        raise HTTPException(
            409,
            detail={'message': 'Staged snapshot no longer satisfies the release schema', 'errors': exc.errors()},
        ) from exc

    evidence = _validate_live_release_evidence(db, staged.lesson_id, payload)
    manifest = build_release_manifest(staged)

    lesson = db.query(Lesson).filter(Lesson.id == staged.lesson_id).with_for_update().first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')

    duplicate_version = db.query(ContentVersion).filter(
        ContentVersion.lesson_id == lesson.id,
        ContentVersion.version_number == staged.version_label,
    ).first()
    if duplicate_version:
        raise HTTPException(
            409,
            detail={
                'message': 'Content version label already exists without a matching release transaction',
                'content_version_id': duplicate_version.id,
            },
        )

    academic = (staged.qa_snapshot_json or {}).get('academic_qa') or {}
    confidence = float((academic.get('result') or {}).get('confidence') or 0)
    now = datetime.now(UTC).replace(tzinfo=None)

    previous_versions = db.query(ContentVersion).filter(
        ContentVersion.lesson_id == lesson.id,
        ContentVersion.status == 'PUBLISHED',
    ).all()
    previous_content_version_ids = [row.id for row in previous_versions]
    for row in previous_versions:
        row.status = 'SUPERSEDED'

    content_version = ContentVersion(
        lesson_id=lesson.id,
        version_number=staged.version_label,
        status='PUBLISHED',
        generated_by='AUDITED_AI_FACTORY',
        prompt_version='STAGED_SNAPSHOT',
        quality_score=confidence,
        published_at=now,
    )
    db.add(content_version)
    db.flush()

    sections = db.query(LessonSection).filter(LessonSection.lesson_id == lesson.id).all()
    section_by_number = {row.section_number: row for row in sections}
    archived_block_ids: list[int] = []
    for section in sections:
        old_blocks = db.query(ContentBlock).filter(
            ContentBlock.lesson_section_id == section.id,
            ContentBlock.status == 'PUBLISHED',
        ).all()
        for block in old_blocks:
            block.status = 'ARCHIVED'
            archived_block_ids.append(block.id)

    published_section_ids: list[int] = []
    published_block_ids: list[int] = []
    contains_summary_block = any(
        block.block_type == 'SUMMARY'
        for section in payload.sections
        for block in section.blocks
    )
    contains_flashcard_block = any(
        block.block_type == 'FLASHCARD'
        for section in payload.sections
        for block in section.blocks
    )

    last_section: LessonSection | None = None
    last_order = 0
    for section_number, generated_section in enumerate(payload.sections, start=1):
        section = section_by_number.get(section_number)
        if not section:
            section = LessonSection(
                lesson_id=lesson.id,
                section_number=section_number,
                title=generated_section.title,
                order_no=section_number,
            )
            db.add(section)
            db.flush()
            section_by_number[section_number] = section
        else:
            section.title = generated_section.title
            section.order_no = section_number
        published_section_ids.append(section.id)
        last_section = section
        last_order = 0
        for order_no, generated_block in enumerate(generated_section.blocks, start=1):
            block = ContentBlock(
                lesson_section_id=section.id,
                block_type=generated_block.block_type,
                content_json=_block_content(generated_block),
                order_no=order_no,
                version=content_version.id,
                status='PUBLISHED',
                source_refs=list(generated_block.source_chunk_ids),
            )
            db.add(block)
            db.flush()
            published_block_ids.append(block.id)
            last_order = order_no

    if last_section is None:
        raise HTTPException(409, 'Release snapshot has no lesson sections')

    if not contains_summary_block:
        for item in payload.summary:
            last_order += 1
            block = ContentBlock(
                lesson_section_id=last_section.id,
                block_type='SUMMARY',
                content_json={'text': item.text},
                order_no=last_order,
                version=content_version.id,
                status='PUBLISHED',
                source_refs=list(item.source_chunk_ids),
            )
            db.add(block); db.flush(); published_block_ids.append(block.id)

    if not contains_flashcard_block:
        for item in payload.flashcards:
            last_order += 1
            block = ContentBlock(
                lesson_section_id=last_section.id,
                block_type='FLASHCARD',
                content_json={'front': item.front, 'back': item.back},
                order_no=last_order,
                version=content_version.id,
                status='PUBLISHED',
                source_refs=list(item.source_chunk_ids),
            )
            db.add(block); db.flush(); published_block_ids.append(block.id)

    old_questions = db.query(Question).filter(
        Question.lesson_id == lesson.id,
        Question.status.in_(['PUBLISHED', 'APPROVED']),
    ).all()
    archived_question_ids = [q.id for q in old_questions]
    for question in old_questions:
        question.status = 'ARCHIVED'

    skill_map = {
        skill.skill_code: skill
        for _, skill in db.query(LessonSkill, Skill).join(
            Skill, Skill.id == LessonSkill.skill_id
        ).filter(LessonSkill.lesson_id == lesson.id).all()
    }
    published_question_ids: list[int] = []
    for index, item in enumerate(payload.questions, start=1):
        question = Question(
            lesson_id=lesson.id,
            question_code=f'{lesson.lesson_code}.REL{content_version.id}.Q{index:03d}',
            question_type=item.question_type,
            prompt=item.prompt,
            options_json=item.options,
            correct_answer_json=item.correct_answer,
            difficulty=item.difficulty,
            purpose=item.purpose,
            explanation=item.explanation,
            status='PUBLISHED',
        )
        db.add(question)
        db.flush()
        published_question_ids.append(question.id)
        for skill_code in item.skill_codes:
            skill = skill_map[skill_code]
            db.add(QuestionSkill(question_id=question.id, skill_id=skill.id, weight=1.0))

    lesson.status = 'PUBLISHED'
    staged.status = 'RELEASED'

    tx_manifest = {
        **manifest,
        'release_transaction_version': 'audited-release/v1',
        'live_evidence_revalidation': evidence,
        'previous_content_version_ids': previous_content_version_ids,
        'archived_block_ids': archived_block_ids,
        'archived_question_ids': archived_question_ids,
        'published_section_ids': published_section_ids,
        'published_block_ids': published_block_ids,
        'published_question_ids': published_question_ids,
        'content_version_id': content_version.id,
    }
    tx = ReleaseTransaction(
        staged_version_id=staged.id,
        lesson_id=lesson.id,
        content_version_id=content_version.id,
        status='COMMITTED',
        snapshot_sha256=manifest['snapshot_sha256'],
        manifest_sha256=manifest['manifest_sha256'],
        manifest_json=tx_manifest,
        released_by_user_id=admin_user_id,
        released_at=now,
    )
    db.add(tx)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(tx)
    return _release_result(tx, idempotent=False)


@router.post('/staged-versions/{staged_version_id}/release')
def release_staged_version(
    staged_version_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return execute_audited_release(
        db,
        staged_version_id=staged_version_id,
        admin_user_id=admin.id,
        database_backend=engine.url.get_backend_name(),
    )


@router.get('/release-transactions/{release_transaction_id}')
def get_release_transaction(
    release_transaction_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    tx = db.query(ReleaseTransaction).filter(ReleaseTransaction.id == release_transaction_id).first()
    if not tx:
        raise HTTPException(404, 'Release transaction not found')
    return {
        **_release_result(tx, idempotent=False),
        'manifest': tx.manifest_json,
        'released_by_user_id': tx.released_by_user_id,
    }
