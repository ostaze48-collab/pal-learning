from __future__ import annotations

from sqlalchemy.engine import Engine

from .base import engine
from .migration_status import get_migration_status
from .seed import run as seed_run


def validate_bootstrap_state(database_backend: str, migration: dict | None = None) -> dict:
    """Return bootstrap mode or fail closed for a stale persistent schema.

    SQLite is intentionally self-bootstrapping for local/demo use. Persistent
    databases must already be at the application's Alembic head before seed data
    is allowed to run.
    """
    if database_backend == 'sqlite':
        return {
            'allowed': True,
            'mode': 'SQLITE_DEMO',
            'migration_required': False,
        }

    if database_backend not in {'postgresql', 'postgres'}:
        raise RuntimeError(f'Unsupported persistent database backend: {database_backend}')

    migration = migration or {}
    if not migration.get('is_current'):
        current = migration.get('current') or 'none'
        head = migration.get('head') or 'unknown'
        reason = migration.get('reason') or 'migration_not_current'
        raise RuntimeError(
            f'Database bootstrap blocked: Alembic migration is not current '
            f'(current={current}, head={head}, reason={reason}). '
            'Run `alembic upgrade head` before seeding PostgreSQL.'
        )

    return {
        'allowed': True,
        'mode': 'PERSISTENT_MIGRATION_MANAGED',
        'migration_required': True,
        'migration_revision': migration.get('current'),
        'migration_head': migration.get('head'),
    }


def ensure_schema_ready(db_engine: Engine = engine) -> dict:
    backend = db_engine.url.get_backend_name()
    if backend == 'sqlite':
        return validate_bootstrap_state(backend)
    migration = get_migration_status(db_engine)
    return validate_bootstrap_state(backend, migration)


def run() -> None:
    state = ensure_schema_ready(engine)
    print(
        'Database bootstrap approved: '
        f"mode={state['mode']} "
        f"revision={state.get('migration_revision', 'n/a')}"
    )
    seed_run()


if __name__ == '__main__':
    run()
