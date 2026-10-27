"""Add audited release transactions.

Revision ID: 20261027_02
Revises: 20261027_01
Create Date: 2026-10-27

The baseline revision imports current metadata and may already create this table on a
fresh database. Therefore this revision checks table existence before creating it;
on an existing database upgraded from 01 it creates the table explicitly.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = '20261027_02'
down_revision = '20261027_01'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if 'release_transactions' in inspect(bind).get_table_names():
        return
    op.create_table(
        'release_transactions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('staged_version_id', sa.Integer(), sa.ForeignKey('staged_lesson_versions.id'), nullable=False),
        sa.Column('lesson_id', sa.Integer(), sa.ForeignKey('lessons.id'), nullable=False),
        sa.Column('content_version_id', sa.Integer(), sa.ForeignKey('content_versions.id'), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('snapshot_sha256', sa.String(length=64), nullable=False),
        sa.Column('manifest_sha256', sa.String(length=64), nullable=False),
        sa.Column('manifest_json', sa.JSON(), nullable=False),
        sa.Column('released_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('released_at', sa.DateTime(), nullable=False),
        sa.UniqueConstraint('staged_version_id', name='uq_release_transactions_staged_version_id'),
        sa.UniqueConstraint('manifest_sha256', name='uq_release_transactions_manifest_sha256'),
    )
    op.create_index('ix_release_transactions_staged_version_id', 'release_transactions', ['staged_version_id'])
    op.create_index('ix_release_transactions_lesson_id', 'release_transactions', ['lesson_id'])
    op.create_index('ix_release_transactions_content_version_id', 'release_transactions', ['content_version_id'])
    op.create_index('ix_release_transactions_status', 'release_transactions', ['status'])
    op.create_index('ix_release_transactions_manifest_sha256', 'release_transactions', ['manifest_sha256'])


def downgrade() -> None:
    bind = op.get_bind()
    if 'release_transactions' not in inspect(bind).get_table_names():
        return
    op.drop_table('release_transactions')
