from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

MIGRATION_HEAD = '20261027_02'


def get_migration_status(engine: Engine) -> dict:
    inspector = inspect(engine)
    if 'alembic_version' not in inspector.get_table_names():
        return {
            'current': None,
            'head': MIGRATION_HEAD,
            'is_current': False,
            'reason': 'alembic_version_table_missing',
        }

    with engine.connect() as connection:
        current = connection.execute(text('SELECT version_num FROM alembic_version LIMIT 1')).scalar_one_or_none()
    return {
        'current': current,
        'head': MIGRATION_HEAD,
        'is_current': current == MIGRATION_HEAD,
        'reason': None if current == MIGRATION_HEAD else 'migration_head_mismatch',
    }
