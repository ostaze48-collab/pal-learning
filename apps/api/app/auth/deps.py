from __future__ import annotations

from datetime import datetime, UTC
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..db.deps import get_db
from ..db.models import AuthSession, StudentProfile, User
from ..services.security import hash_session_token

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not credentials or credentials.scheme.lower() != 'bearer':
        raise HTTPException(401, 'Authentication required')
    token_hash = hash_session_token(credentials.credentials)
    now = datetime.now(UTC).replace(tzinfo=None)
    session = db.query(AuthSession).filter(
        AuthSession.token_hash == token_hash,
        AuthSession.revoked_at.is_(None),
        AuthSession.expires_at > now,
    ).first()
    if not session:
        raise HTTPException(401, 'Invalid or expired session')
    user = db.query(User).filter(User.id == session.user_id, User.status == 'ACTIVE').first()
    if not user:
        raise HTTPException(401, 'User unavailable')
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != 'ADMIN':
        raise HTTPException(403, 'Admin role required')
    return user


def require_student_profile(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudentProfile:
    if user.role != 'STUDENT':
        raise HTTPException(403, 'Student role required')
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(403, 'Student profile not found')
    return profile
