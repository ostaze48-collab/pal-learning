import pytest

from app.db.bootstrap import validate_bootstrap_state


def test_sqlite_bootstrap_remains_available_for_demo():
    state = validate_bootstrap_state('sqlite')
    assert state['allowed'] is True
    assert state['mode'] == 'SQLITE_DEMO'
    assert state['migration_required'] is False


def test_postgres_bootstrap_requires_current_migration():
    with pytest.raises(RuntimeError, match='Alembic migration is not current'):
        validate_bootstrap_state('postgresql', {
            'current': None,
            'head': '20261027_01',
            'is_current': False,
            'reason': 'alembic_version_table_missing',
        })


def test_postgres_bootstrap_accepts_current_head():
    state = validate_bootstrap_state('postgresql', {
        'current': '20261027_01',
        'head': '20261027_01',
        'is_current': True,
        'reason': None,
    })
    assert state['allowed'] is True
    assert state['mode'] == 'PERSISTENT_MIGRATION_MANAGED'
    assert state['migration_revision'] == '20261027_01'


def test_unknown_persistent_backend_is_rejected():
    with pytest.raises(RuntimeError, match='Unsupported persistent database backend'):
        validate_bootstrap_state('mysql', {'is_current': True})
