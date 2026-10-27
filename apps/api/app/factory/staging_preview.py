from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.deps import get_db
from ..db.models import Lesson, User
from ..db.staging_models import StagedLessonVersion

router = APIRouter(prefix='/factory', tags=['staging-preview'])

PREVIEW_AUDIENCE = 'pal-learning-staging-preview'
PREVIEW_PURPOSE = 'STAGING_PREVIEW'
PREVIEW_ALGORITHM = 'HS256'
DEFAULT_PREVIEW_TTL_SECONDS = 900
MAX_PREVIEW_TTL_SECONDS = 3600


class PreviewResolveRequest(BaseModel):
    token: str = Field(min_length=20, max_length=4096)


def _secret() -> str:
    value = os.getenv('JWT_SECRET', '')
    if len(value) < 32 or value.lower() in {'change-me', 'changeme'}:
        raise HTTPException(503, 'Staging preview signing secret is not production-ready')
    return value


def _ttl_seconds() -> int:
    raw = os.getenv('STAGING_PREVIEW_TTL_SECONDS', str(DEFAULT_PREVIEW_TTL_SECONDS))
    try:
        value = int(raw)
    except ValueError:
        value = DEFAULT_PREVIEW_TTL_SECONDS
    return max(60, min(MAX_PREVIEW_TTL_SECONDS, value))


def create_preview_token(staged_version_id: int, approved_by_user_id: int) -> tuple[str, datetime]:
    now = datetime.now(UTC)
    expires_at = now + timedelta(seconds=_ttl_seconds())
    claims = {
        'sub': f'staged:{staged_version_id}',
        'purpose': PREVIEW_PURPOSE,
        'staged_version_id': staged_version_id,
        'approved_by_user_id': approved_by_user_id,
        'iat': int(now.timestamp()),
        'exp': int(expires_at.timestamp()),
        'aud': PREVIEW_AUDIENCE,
    }
    token = jwt.encode(claims, _secret(), algorithm=PREVIEW_ALGORITHM)
    return token, expires_at


def decode_preview_token(token: str) -> dict:
    try:
        claims = jwt.decode(
            token,
            _secret(),
            algorithms=[PREVIEW_ALGORITHM],
            audience=PREVIEW_AUDIENCE,
        )
    except JWTError as exc:
        raise HTTPException(401, 'Invalid or expired staging preview token') from exc
    if claims.get('purpose') != PREVIEW_PURPOSE:
        raise HTTPException(401, 'Invalid staging preview purpose')
    staged_version_id = claims.get('staged_version_id')
    if not isinstance(staged_version_id, int):
        raise HTTPException(401, 'Invalid staging preview target')
    return claims


@router.post('/staged-versions/{staged_version_id}/preview-token')
def issue_staging_preview_token(
    staged_version_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    staged = db.query(StagedLessonVersion).filter(StagedLessonVersion.id == staged_version_id).first()
    if not staged:
        raise HTTPException(404, 'Staged lesson version not found')
    if staged.status != 'STAGING':
        raise HTTPException(409, 'Only active STAGING snapshots can be previewed')

    token, expires_at = create_preview_token(staged.id, admin.id)
    return {
        'staged_version_id': staged.id,
        'lesson_id': staged.lesson_id,
        'version_label': staged.version_label,
        'token': token,
        'expires_at': expires_at.isoformat(),
        'expires_in_seconds': _ttl_seconds(),
        'web_preview_fragment': f'/preview/staged#token={token}',
        'publication_authorized': False,
        'tracking_disabled': True,
        'note': 'The token lives in the URL fragment so it is not sent with the page request. It only resolves a staging snapshot.',
    }


@router.post('/staged-preview/resolve')
def resolve_staging_preview(
    payload: PreviewResolveRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    claims = decode_preview_token(payload.token)
    staged_id = int(claims['staged_version_id'])
    staged = db.query(StagedLessonVersion).filter(StagedLessonVersion.id == staged_id).first()
    if not staged or staged.status != 'STAGING':
        raise HTTPException(404, 'Staging preview is no longer available')

    lesson = db.query(Lesson).filter(Lesson.id == staged.lesson_id).first()
    if not lesson:
        raise HTTPException(404, 'Lesson not found')

    response.headers['Cache-Control'] = 'no-store, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['X-Robots-Tag'] = 'noindex, nofollow, noarchive'
    return {
        'preview': True,
        'tracking_disabled': True,
        'publication_authorized': False,
        'lesson': {
            'id': lesson.id,
            'lesson_code': lesson.lesson_code,
            'title': lesson.title,
            'live_status': lesson.status,
        },
        'staged_version': {
            'id': staged.id,
            'candidate_id': staged.candidate_id,
            'version_label': staged.version_label,
            'status': staged.status,
            'release_readiness': staged.release_readiness,
            'created_at': staged.created_at,
        },
        'snapshot': staged.snapshot_json,
        'qa_snapshot': staged.qa_snapshot_json,
    }
