from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db.base import Base, engine
from .curriculum.router import router as curriculum_router
from .importer.router import router as importer_router
from .learning.router import router as learning_router
from .qa.router import router as qa_router
from .admin.router import router as admin_router
from .factory.router import router as factory_router
from .auth.router import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title='Palestinian Learning OS API', version='1.0.0', lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/health')
def health():
    return {
        'status': 'ok',
        'version': '1.0.0',
        'capabilities': [
            'curriculum', 'importer', 'source-chunks', 'lesson-source-provenance',
            'solution-alignment', 'skills', 'mastery', 'diagnostic', 'recovery',
            'offline-sync', 'qa-gate', 'learning-health', 'content-factory-packets', 'structured-ai-output', 'content-candidates', 'retention', 'daily-plan', 'improvement-queue', 'admin-auth', 'revocable-sessions', 'student-session-binding'
        ],
    }


app.include_router(curriculum_router)
app.include_router(importer_router)
app.include_router(learning_router)
app.include_router(qa_router)
app.include_router(admin_router)

app.include_router(factory_router)

app.include_router(auth_router)
