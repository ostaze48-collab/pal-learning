from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.deps import get_db
from ..db.models import Lesson, LessonSourceLink, SourceChunk, SourceFile
from .source_policy import can_ground_facts

router = APIRouter(
    prefix='/importer',
    tags=['lesson-source-review'],
    dependencies=[Depends(require_admin)],
)


def _link_payload(db: Session, link: LessonSourceLink) -> dict:
    chunk = db.query(SourceChunk).filter(SourceChunk.id == link.source_chunk_id).first()
    source = db.query(SourceFile).filter(SourceFile.id == chunk.source_file_id).first() if chunk else None
    return {
        'id': link.id,
        'lesson_id': link.lesson_id,
        'relation': link.relation,
        'confidence': float(link.confidence or 0),
        'source_method': link.source_method,
        'status': link.status,
        'source_chunk_id': chunk.id if chunk else None,
        'page_number': chunk.page_number if chunk else None,
        'text_preview': (chunk.text[:900] if chunk else None),
        'source_file_id': source.id if source else None,
        'source_type': source.source_type if source else None,
        'source_edition': source.edition if source else None,
        'factual_grounding_authorized': bool(source and can_ground_facts(source.source_type)),
    }


@router.get('/lessons/{lesson_id}/source-links')
def list_lesson_source_links(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')
    links = db.query(LessonSourceLink).filter(
        LessonSourceLink.lesson_id == lesson_id,
        LessonSourceLink.relation == 'TEACHING_SOURCE',
    ).order_by(LessonSourceLink.confidence.desc(), LessonSourceLink.id).all()
    return {
        'lesson_id': lesson.id,
        'lesson_code': lesson.lesson_code,
        'lesson_title': lesson.title,
        'links': [_link_payload(db, link) for link in links],
    }


@router.post('/lesson-source-links/{link_id}/verify')
def verify_lesson_source_link(link_id: int, db: Session = Depends(get_db)):
    link = db.query(LessonSourceLink).filter(LessonSourceLink.id == link_id).first()
    if not link:
        raise HTTPException(404, 'Lesson source link not found')
    if link.relation != 'TEACHING_SOURCE':
        raise HTTPException(409, 'Only TEACHING_SOURCE links can be verified here')
    chunk = db.query(SourceChunk).filter(SourceChunk.id == link.source_chunk_id).first()
    source = db.query(SourceFile).filter(SourceFile.id == chunk.source_file_id).first() if chunk else None
    if not chunk or not source:
        raise HTTPException(409, 'Source chunk/file is missing')
    if not can_ground_facts(source.source_type):
        raise HTTPException(409, detail={
            'message': 'Source type is not authorized for factual grounding',
            'source_type': source.source_type,
        })
    if source.status not in {'EXTRACTED', 'ANALYZED'}:
        raise HTTPException(409, detail={
            'message': 'Source is not in a verified text-extractable state',
            'source_status': source.status,
        })
    link.status = 'VERIFIED'
    link.source_method = f'{link.source_method or "UNKNOWN"}+ADMIN_VERIFIED'
    db.commit(); db.refresh(link)
    return {
        **_link_payload(db, link),
        'verified': True,
        'note': 'Admin verification confirms this chunk belongs to this lesson. It does not override source edition/scope gates.',
    }


@router.post('/lesson-source-links/{link_id}/reject')
def reject_lesson_source_link(link_id: int, db: Session = Depends(get_db)):
    link = db.query(LessonSourceLink).filter(LessonSourceLink.id == link_id).first()
    if not link:
        raise HTTPException(404, 'Lesson source link not found')
    if link.relation != 'TEACHING_SOURCE':
        raise HTTPException(409, 'Only TEACHING_SOURCE links can be rejected here')
    link.status = 'REJECTED'
    db.commit(); db.refresh(link)
    return {'link_id': link.id, 'status': link.status, 'rejected': True}
