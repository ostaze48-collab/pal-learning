"""Support multiple cropped textbook figures per source page.

Revision ID: 20261027_04
Revises: 20261027_03
Create Date: 2026-10-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = '20261027_04'
down_revision = '20261027_03'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {row['name'] for row in inspect(bind).get_columns('visual_assets')}
    with op.batch_alter_table('visual_assets') as batch:
        if 'parent_asset_id' not in columns:
            batch.add_column(sa.Column('parent_asset_id', sa.Integer(), nullable=True))
        if 'region_key' not in columns:
            batch.add_column(sa.Column('region_key', sa.String(length=80), nullable=False, server_default='full-page'))
        if 'crop_box_json' not in columns:
            batch.add_column(sa.Column('crop_box_json', sa.JSON(), nullable=True))
        batch.drop_constraint('uq_visual_asset_lesson_source_page_kind', type_='unique')
        batch.create_unique_constraint(
            'uq_visual_asset_lesson_source_page_kind_region',
            ['lesson_id', 'source_file_id', 'source_page', 'asset_kind', 'region_key'],
        )
        batch.create_foreign_key(
            'fk_visual_assets_parent_asset_id',
            'visual_assets',
            ['parent_asset_id'],
            ['id'],
        )
        batch.create_index('ix_visual_assets_parent_asset_id', ['parent_asset_id'])


def downgrade() -> None:
    bind = op.get_bind()
    columns = {row['name'] for row in inspect(bind).get_columns('visual_assets')}
    with op.batch_alter_table('visual_assets') as batch:
        if 'parent_asset_id' in columns:
            batch.drop_index('ix_visual_assets_parent_asset_id')
            batch.drop_constraint('fk_visual_assets_parent_asset_id', type_='foreignkey')
        batch.drop_constraint('uq_visual_asset_lesson_source_page_kind_region', type_='unique')
        batch.create_unique_constraint(
            'uq_visual_asset_lesson_source_page_kind',
            ['lesson_id', 'source_file_id', 'source_page', 'asset_kind'],
        )
        if 'crop_box_json' in columns:
            batch.drop_column('crop_box_json')
        if 'region_key' in columns:
            batch.drop_column('region_key')
        if 'parent_asset_id' in columns:
            batch.drop_column('parent_asset_id')
