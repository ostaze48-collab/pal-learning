import os

from fastapi import APIRouter, Depends

from ..auth.deps import require_admin
from ..db.base import engine
from ..db.migration_status import get_migration_status
from ..db.models import User
from ..services.production_readiness import evaluate_production_readiness

router = APIRouter(prefix='/admin', tags=['admin-readiness'])
DEFAULT_ORIGINS = 'http://localhost:3000,https://pal-learning-web.onrender.com'


def _allowed_origins() -> list[str]:
    return [
        x.strip()
        for x in os.getenv('ALLOWED_ORIGINS', DEFAULT_ORIGINS).split(',')
        if x.strip()
    ]


@router.get('/production-readiness')
def production_readiness(admin: User = Depends(require_admin)):
    migration = get_migration_status(engine)
    result = evaluate_production_readiness(
        database_backend=engine.url.get_backend_name(),
        allowed_origins=_allowed_origins(),
        migration_current=migration['is_current'],
        migration_revision=migration['current'],
        migration_head=migration['head'],
    )
    return {
        'ready': result.ready,
        'checks': result.checks,
        'blockers': result.blockers,
        'details': {
            **result.details,
            'migration_reason': migration['reason'],
        },
    }
