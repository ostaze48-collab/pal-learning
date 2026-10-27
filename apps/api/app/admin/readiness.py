from fastapi import APIRouter, Depends

from ..auth.deps import require_admin
from ..db.base import engine
from ..db.models import User
from ..main_runtime import get_allowed_origins
from ..services.production_readiness import evaluate_production_readiness

router = APIRouter(prefix='/admin', tags=['admin-readiness'])


@router.get('/production-readiness')
def production_readiness(admin: User = Depends(require_admin)):
    result = evaluate_production_readiness(
        database_backend=engine.url.get_backend_name(),
        allowed_origins=get_allowed_origins(),
    )
    return {
        'ready': result.ready,
        'checks': result.checks,
        'blockers': result.blockers,
        'details': result.details,
    }
