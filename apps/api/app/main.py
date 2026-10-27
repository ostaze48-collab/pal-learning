import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .db.base import Base, SessionLocal, engine
from .db.migration_status import get_migration_status
from .db.publication_integrity import quarantine_unreleased_demo_content
from .curriculum.router import router as curriculum_router
from .importer.router import router as importer_router
from .importer.official_catalog import (
    quarantine_unverified_catalog_sources,
    router as official_catalog_router,
)
from .importer.scope_evidence import router as scope_evidence_router
from .importer.source_policy_router import router as source_policy_router
from .learning.router import router as learning_router
from .qa.router import router as qa_router
from .admin.router import router as admin_router
from .admin.readiness import router as readiness_router
from .factory.router import router as factory_router
from .factory.candidate_qa import router as candidate_qa_router
from .factory.academic_qa import router as academic_qa_router
from .factory.release_gate import router as release_gate_router
from .auth.router import router as auth_router

VERSION = '1.10.0'
DEFAULT_ORIGINS = 'http://localhost:3000,https://pal-learning-web.onrender.com'
allowed_origins = [x.strip() for x in os.getenv('ALLOWED_ORIGINS', DEFAULT_ORIGINS).split(',') if x.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Local/demo SQLite remains self-bootstrapping. Persistent databases are
    # migration-managed and must be prepared with `alembic upgrade head` first.
    if engine.url.get_backend_name() == 'sqlite':
        Base.metadata.create_all(bind=engine)
        # Repair legacy demo state on every local/demo startup. Catalog links do
        # not become semester-specific sources until scope is proven, and seeded
        # prototype lessons remain DRAFT until a future audited release transaction.
        with SessionLocal() as db:
            quarantine_unverified_catalog_sources(db)
            quarantine_unreleased_demo_content(db)
    yield


app = FastAPI(title='Palestinian Learning OS API', version=VERSION, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allow_headers=['Authorization', 'Content-Type'],
)


def database_health() -> dict:
    backend = engine.url.get_backend_name()
    return {
        'backend': backend,
        'persistent': backend != 'sqlite',
        'production_recommended': backend in {'postgresql', 'postgres'},
    }


@app.get('/health')
def health():
    return {
        'status': 'ok',
        'version': VERSION,
        'database': database_health(),
        'capabilities': [
            'curriculum', 'importer', 'source-chunks', 'lesson-source-provenance',
            'solution-alignment', 'skills', 'mastery', 'diagnostic', 'recovery',
            'offline-sync', 'qa-gate', 'learning-health', 'content-factory-packets',
            'structured-ai-output', 'content-candidates', 'retention', 'daily-plan',
            'improvement-queue', 'admin-auth', 'revocable-sessions',
            'student-session-binding', 'student-publication-visibility-gate',
            'published-question-attempt-gate', 'published-learning-event-reference-gate',
            'official-package-priority', 'readiness-check', 'safe-registered-source-fetch',
            'provider-backed-content-factory', 'candidate-preflight-qa',
            'admin-staging-approval', 'immutable-staged-versions',
            'release-gated-academic-ai-qa', 'final-non-publishing-release-gate',
            'release-manifest-sha256', 'direct-legacy-publish-disabled',
            'production-readiness-diagnostics', 'alembic-migration-gate',
            'official-source-catalog', 'catalog-scope-quarantine',
            'unreleased-demo-publication-quarantine', 'current-curriculum-plan-scope-evidence',
            'source-authority-policy-enforcement',
        ],
    }


@app.get('/ready')
def ready():
    try:
        with engine.connect() as connection:
            connection.execute(text('SELECT 1'))
        backend = engine.url.get_backend_name()
        if backend in {'postgresql', 'postgres'}:
            migration = get_migration_status(engine)
            if not migration['is_current']:
                raise HTTPException(
                    status_code=503,
                    detail={
                        'message': 'Database migration is not current',
                        'migration': migration,
                    },
                )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail='Database is not ready') from exc
    return {
        'status': 'ready',
        'version': VERSION,
        'database': database_health(),
    }


app.include_router(curriculum_router)
app.include_router(importer_router)
app.include_router(official_catalog_router)
app.include_router(scope_evidence_router)
app.include_router(source_policy_router)
app.include_router(learning_router)
app.include_router(qa_router)
app.include_router(admin_router)
app.include_router(readiness_router)
app.include_router(factory_router)
app.include_router(candidate_qa_router)
app.include_router(academic_qa_router)
app.include_router(release_gate_router)
app.include_router(auth_router)
