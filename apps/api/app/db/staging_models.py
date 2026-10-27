from __future__ import annotations

from datetime import datetime, UTC

from sqlalchemy import DateTime, ForeignKey, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class StagedLessonVersion(Base):
    __tablename__ = 'staged_lesson_versions'

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey('lessons.id'), index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey('content_candidates.id'), unique=True, index=True)
    version_label: Mapped[str] = mapped_column(String(60))
    status: Mapped[str] = mapped_column(String(30), default='STAGING', index=True)
    snapshot_json: Mapped[dict] = mapped_column(JSON)
    qa_snapshot_json: Mapped[dict] = mapped_column(JSON)
    release_readiness: Mapped[str] = mapped_column(String(30), default='BLOCKED')
    approved_by_user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    __table_args__ = (
        UniqueConstraint('lesson_id', 'version_label', name='uq_staged_lesson_version_label'),
    )


class ReleaseTransaction(Base):
    __tablename__ = 'release_transactions'

    id: Mapped[int] = mapped_column(primary_key=True)
    staged_version_id: Mapped[int] = mapped_column(
        ForeignKey('staged_lesson_versions.id'), unique=True, index=True
    )
    lesson_id: Mapped[int] = mapped_column(ForeignKey('lessons.id'), index=True)
    content_version_id: Mapped[int | None] = mapped_column(
        ForeignKey('content_versions.id'), nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(String(30), default='COMMITTED', index=True)
    snapshot_sha256: Mapped[str] = mapped_column(String(64))
    manifest_sha256: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    manifest_json: Mapped[dict] = mapped_column(JSON)
    released_by_user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    released_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
