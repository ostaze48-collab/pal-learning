import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .db.base import Base, engine
from .curriculum.router import router as curriculum_router
from .importer.router import router as importer_router
from .learning.router import router as learning_router
from .qa.router import router as qa_router
from .admin.router import router as admin_router
from .admin.readiness import router as readiness_router
from .factory.router import router as factory_router
from .factory.candidate_qa import router as candidate_qa_router
from .factory.academic_qa import router as academic_qa_router
from .factory.release_gate import router as release_gate_router
from .auth.router import router as auth_router

VERSION = '1.7.0'
DEFAULT_ORIGINS = 'http://localhost:3000,https://pal-learning-web.onrender.com'
allowed_origins = [x.strip() for x in os.getenv('ALLOWED_ORIGINS', DEFAULT_ORIGINS).split(',') if x.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Local/demo SQLite remains self-bootstrapping. Persistent databases are
    # migration-managed and must be prepared with `alembic upgrade head` first.
    if engine.url.get_backend_name() == 'sqlite':
        Base.metadata.create_all(bind=engine)
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
            'student-session-binding', 'official-package-priority', 'readiness-check',
            'safe-registered-source-fetch', 'provider-backed-content-factory',
            'candidate-preflight-qa', 'admin-staging-approval', 'immutable-staged-versions',
            'release-gated-academic-ai-qa', 'final-non-publishing-release-gate',
            'production-readiness-diagnostics', 'alembic-migration-gate',
        ],
    }


@app.get('/ready')
def ready():
    try:
        with engine.connect() as connection:
            connection.execute(text('SELECT 1'))
    except Exception as exc:
        raise HTTPException(status_code=503, detail='Database is not ready') from exc
    return {
        'status': 'ready',
        'version': VERSION,
        'database': database_health(),
    }


app.include_router(curriculum_router)
app.include_router(importer_router)
app.include_router(learning_router)
app.include_router(qa_router)
app.include_router(admin_router)
app.include_router(readiness_router)
app.include_router(factory_router)
app.include_router(candidate_qa_router)
app.include_router(academic_qa_router)
app.include_router(release_gate_router)
app.include_router(auth_router)
