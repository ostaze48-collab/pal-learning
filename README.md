# Palestinian Learning OS — V1.0 Internal

An internal V1.0 engineering build for an AI-first Palestinian curriculum learning and recovery platform. The current build is intentionally **Admin + Student only** and keeps curriculum provenance, mastery, diagnostics, recovery and QA separate so the system can scale without rewriting the core.

## What is implemented

- Arabic RTL student and admin web surfaces.
- Grades 1–9 and curriculum/book/unit/lesson registry.
- Grade 5 Science Semester 2 demo package (`PS-G05-SCI-S2-2026`).
- Lesson Sections + reusable Content Blocks.
- Source Packages: student book, solutions, teacher guide, worksheets, exams, remedial material.
- Upload of text-based PDF/TXT/MD sources, SHA-256 checksum, extraction metadata and page-aware Source Chunks.
- Conservative curriculum structure detection before AI review.
- Lesson → Source Chunk → Page provenance links.
- Conservative سؤال/جواب solution parsing and reference-answer alignment.
- Skills, lesson-skill links, prerequisite graph and misconceptions.
- Questions linked to skills.
- Student attempts → Mastery update with confidence; one item cannot establish stable mastery.
- Diagnostic backtracking through prerequisites.
- Recovery unit demo that identifies `Equivalent Fractions` as the root gap for a Grade 7 fraction-addition scenario.
- Idempotent offline learning-event sync.
- Learning Health API.
- QA gate that blocks publication when source/answer verification is insufficient.
- Provider-neutral Content Factory generation packet. It refuses generation until lesson-level source provenance exists.
- `LOCAL_MOCK` AI Gateway: lets the entire flow be tested without API keys; generation jobs wait for a real provider adapter.
- PWA manifest + initial service worker/offline shell.

## Important quality behavior

The seeded science lesson is a **prototype**, not a claim that the latest 2026 official book has been verified. The historical reference URL remains marked as such. Production publishing is intentionally blocked until the correct current book/solutions are imported and provenance is mapped.

## Run locally

```bash
cd apps/api
python -m pip install -r requirements.txt
DATABASE_URL=sqlite:///./pal_learning.db PYTHONPATH=. python -m app.db.seed
DATABASE_URL=sqlite:///./pal_learning.db PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

In another shell:

```bash
cd apps/web
npm install
cp .env.local.example .env.local
npm run dev
```

Then open the web app and use `/admin` or `/student`.

## Core API flows

1. Create/open a Source Package.
2. `POST /importer/source-packages/{id}/upload`
3. `POST /importer/source-files/{id}/analyze`
4. `POST /importer/source-packages/{id}/link-lessons`
5. Upload solutions and call `POST /qa/source-packages/{id}/align-solutions`
6. `POST /factory/lessons/{lesson_id}/generate`
7. A provider adapter executes the generation packet.
8. Validate outputs, attach block-level source refs, run `POST /qa/lessons/{id}/run`.
9. `POST /qa/lessons/{id}/publish` only succeeds when the QA gate passes.

## Learning loop

Question → Skill → Attempt → Mastery → Diagnostic → Root Gap → Remediation → Return to grade-level learning.

The demo math chain is:

`Fraction Concept → Equivalent Fractions → Common Denominator → Fraction Addition`

## Tests

```bash
pytest -q
```

The suite covers parser contracts, mastery confidence, diagnostic root-gap selection, solution alignment, upload/chunking, lesson provenance, offline sync, QA blocking, learning health and Content Factory packet creation.

## V0.7 structured-output safety layer

AI-generated lesson output is no longer allowed to flow directly into lesson tables. The factory accepts a strict Pydantic contract and writes the result into `content_candidates`.

A candidate is `READY_FOR_QA` only when every citable block/question uses source chunks from the original generation packet and allowed lesson skills. Invalid outputs become `REJECTED`.

## V0.8 learning-intelligence loop

V0.8 adds the first closed loop between student evidence and product improvement: spaced retention, daily learning plans, root-gap recovery, and prioritized content improvement tasks.

## V0.9 account and admin security

Sensitive curriculum operations require an authenticated `ADMIN` session. Opaque random bearer tokens are stored server-side only as SHA-256 hashes. Passwords use PBKDF2-HMAC-SHA256 with a random salt and 310,000 iterations.

## V1.0 internal security boundary

V1.0 removes caller-controlled `student_id` from student learning operations. Attempt submission, diagnostics, learning events, offline sync, mastery views, retention reviews and daily plans resolve the student profile from the authenticated STUDENT session on the server.

This is an **internal V1.0 engineering milestone**, not a claim that the product is ready for public deployment. Before a real beta, the remaining critical work includes current-official-book ingestion, real AI provider integration, Alembic migrations, R2/S3 storage, tighter CORS/rate limiting, email/account recovery, child-privacy review, and production monitoring.
