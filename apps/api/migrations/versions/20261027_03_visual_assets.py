"""Add textbook visual assets.

Revision ID: 20261027_03
Revises: 20261027_02
Create Date: 2026-10-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = '20261027_03'
down_revision = '20261027_02'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if 'visual_assets' in inspect(bind).get_table_names():
        return
    op.create_table(
        'visual_assets',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('lesson_id', sa.Integer(), sa.ForeignKey('lessons.id'), nullable=False),
        sa.Column('source_file_id', sa.Integer(), sa.ForeignKey('source_files.id'), nullable=False),
        sa.Column('source_page', sa.Integer(), nullable=False),
        sa.Column('asset_kind', sa.String(length=40), nullable=False),
        sa.Column('storage_key', sa.Text(), nullable=False),
        sa.Column('low_data_storage_key', sa.Text(), nullable=True),
        sa.Column('public_url', sa.Text(), nullable=True),
        sa.Column('low_data_url', sa.Text(), nullable=True),
        sa.Column('checksum', sa.String(length=64), nullable=False),
        sa.Column('width', sa.Integer(), nullable=False),
        sa.Column('height', sa.Integer(), nullable=False),
        sa.Column('rights_status', sa.String(length=30), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('alt_text', sa.Text(), nullable=True),
        sa.Column('caption', sa.Text(), nullable=True),
        sa.Column('hotspots_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.UniqueConstraint(
            'lesson_id', 'source_file_id', 'source_page', 'asset_kind',
            name='uq_visual_asset_lesson_source_page_kind',
        ),
    )
    op.create_index('ix_visual_assets_lesson_id', 'visual_assets', ['lesson_id'])
    op.create_index('ix_visual_assets_source_file_id', 'visual_assets', ['source_file_id'])
    op.create_index('ix_visual_assets_source_page', 'visual_assets', ['source_page'])
    op.create_index('ix_visual_assets_checksum', 'visual_assets', ['checksum'])
    op.create_index('ix_visual_assets_rights_status', 'visual_assets', ['rights_status'])
    op.create_index('ix_visual_assets_status', 'visual_assets', ['status'])


def downgrade() -> None:
    bind = op.get_bind()
    if 'visual_assets' not in inspect(bind).get_table_names():
        return
    op.drop_table('visual_assets')
