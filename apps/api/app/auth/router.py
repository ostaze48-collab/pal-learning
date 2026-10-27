from __future__ import annotations

from datetime import datetime, timedelta, UTC
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..db.deps import get_db
from ..db.models import AuthSession, Grade, StudentProfile, User
from ..schemas.auth import LoginRequest, StudentRegisterRequest
from ..services.security import hash_password, verify_password, new_session_token, hash_session_token
from .deps import bearer, get_current_user

router = APIRouter(prefix='/auth', tags=['auth'])


def _issue_session(db: Session, user: User) -> dict:
    token = new_session_token()
    now = datetime.now(UTC).replace(tzinfo=None)
    session = AuthSession(
        user_id=user.id,
        token_hash=hash_session_token(token),
        expires_at=now + timedelta(days=7),
    )
    user.last_login_at = now
    db.add(session); db.commit()
    return {'access_token': token, 'token_type': 'bearer', 'expires_at': session.expires_at}


@router.post('/register-student')
def register_student(payload: StudentRegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, 'Email already registered')
    if not db.query(Grade).filter(Grade.id == payload.grade_id).first():
        raise HTTPException(404, 'Grade not found')
    try:
        encoded = hash_password(payload.password)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    user = User(email=email, password_hash=encoded, role='STUDENT', status='ACTIVE')
    db.add(user); db.flush()
    profile = StudentProfile(user_id=user.id, display_name=payload.display_name, registered_grade_id=payload.grade_id)
    db.add(profile); db.commit(); db.refresh(user); db.refresh(profile)
    session = _issue_session(db, user)
    return {'user_id': user.id, 'student_id': profile.id, 'role': user.role, **session}


@router.post('/login')
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash) or user.status != 'ACTIVE':
        raise HTTPException(401, 'Invalid email or password')
    return {'user_id': user.id, 'role': user.role, **_issue_session(db, user)}


@router.get('/me')
def me(user: User = Depends(get_current_user)):
    return {'id': user.id, 'email': user.email, 'role': user.role, 'status': user.status}


@router.post('/logout')
def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not credentials:
        raise HTTPException(401, 'Authentication required')
    session = db.query(AuthSession).filter(
        AuthSession.user_id == user.id,
        AuthSession.token_hash == hash_session_token(credentials.credentials),
        AuthSession.revoked_at.is_(None),
    ).first()
    if session:
        session.revoked_at = datetime.now(UTC).replace(tzinfo=None)
        db.commit()
    return {'logged_out': True}
