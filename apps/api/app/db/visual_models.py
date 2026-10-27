from datetime import datetime, UTC

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


def utcnow():
    return datetime.now(UTC).replace(tzinfo=None)


class VisualAsset(Base):
    __tablename__ = 'visual_assets'

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey('lessons.id'), index=True)
    source_file_id: Mapped[int] = mapped_column(ForeignKey('source_files.id'), index=True)
    source_page: Mapped[int] = mapped_column(Integer, index=True)
    asset_kind: Mapped[str] = mapped_column(String(40), default='TEXTBOOK_PAGE_CROP')
    storage_key: Mapped[str] = mapped_column(Text)
    low_data_storage_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    public_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    low_data_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    checksum: Mapped[str] = mapped_column(String(64), index=True)
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    rights_status: Mapped[str] = mapped_column(String(30), default='REVIEW_REQUIRED', index=True)
    status: Mapped[str] = mapped_column(String(30), default='EXTRACTED', index=True)
    alt_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    hotspots_json: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    __table_args__ = (
        UniqueConstraint(
            'lesson_id', 'source_file_id', 'source_page', 'asset_kind',
            name='uq_visual_asset_lesson_source_page_kind',
        ),
    )
