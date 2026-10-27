import os

from fastapi import APIRouter, Depends

from ..auth.deps import require_admin
from ..db.base import engine
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
    result = evaluate_production_readiness(
        database_backend=engine.url.get_backend_name(),
        allowed_origins=_allowed_origins(),
    )
    return {
        'ready': result.ready,
        'checks': result.checks,
        'blockers': result.blockers,
        'details': result.details,
    }
