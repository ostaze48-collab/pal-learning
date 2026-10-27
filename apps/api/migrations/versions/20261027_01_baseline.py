"""Initial Palestinian Learning OS schema baseline.

Revision ID: 20261027_01
Revises: none
Create Date: 2026-10-27

This first baseline intentionally creates the current metadata with checkfirst semantics.
Future schema changes must use explicit Alembic revisions rather than relying on create_all.
"""

from alembic import op

from app.db.base import Base
from app.db import models as _models  # noqa: F401
from app.db import staging_models as _staging_models  # noqa: F401

revision = '20261027_01'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind(), checkfirst=True)


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind(), checkfirst=True)
