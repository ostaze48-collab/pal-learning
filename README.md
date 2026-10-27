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

## Next engineering milestones

- Real AI provider adapter(s) behind the current gateway.
- Structured output schema validation for generated lesson packages.
- Block-level provenance enforcement.
- Versioned content candidate → QA → publish workflow.
- Authentication/authorization and Admin 2FA before public beta.
- Proper Alembic migrations instead of prototype `create_all` startup.
- Object storage adapter (R2/S3) instead of local upload storage.
- PostgreSQL + pgvector RAG retrieval.
- Full PWA lesson package download and IndexedDB answer queue.

## V0.7 structured-output safety layer

AI-generated lesson output is no longer allowed to flow directly into lesson tables. The factory accepts a strict Pydantic contract and writes the result into `content_candidates`.

A candidate is `READY_FOR_QA` only when:

- every citable block has at least one source chunk;
- every question has source chunks;
- every cited chunk belongs to the job's original generation packet;
- every question skill code belongs to the lesson's allowed skills;
- the full payload passes the structured schema.

Otherwise it becomes `REJECTED`. Publication remains a later, separate operation behind academic/source QA.

## V0.8 learning-intelligence loop

V0.8 adds the first closed loop between student evidence and product improvement:

- Mastered skills receive a spaced retention date instead of being treated as permanently complete.
- `/learning/students/{id}/reviews-due` exposes scheduled review needs.
- `/learning/students/{id}/daily-plan?minutes=20` composes a small plan from retention, root-gap recovery and target-skill practice.
- `/admin/improvement-queue/rebuild` converts weak mastery evidence into prioritized improvement tasks using severity, affected students and downstream skill dependencies.
- The student never sees a stigmatizing global downgrade such as “you are Grade 4”; recovery is presented as a short prerequisite review before continuing.

## V0.9 account and admin security

Sensitive curriculum operations now require an authenticated `ADMIN` session. V0.9 uses opaque random bearer tokens rather than putting identity claims into browser-readable tokens. Only a SHA-256 hash of each session token is stored in the database, sessions expire after seven days, and logout revokes the session immediately.

Passwords are stored with PBKDF2-HMAC-SHA256 using a per-password random salt and 310,000 iterations.

To bootstrap the first local admin before running the seed:

```bash
export BOOTSTRAP_ADMIN_EMAIL=admin@example.com
export BOOTSTRAP_ADMIN_PASSWORD='use-a-strong-password'
python -m app.db.seed
```

The password is never written to the repository. The browser admin login stores the returned session token locally and sends it only to protected API calls.

Current security scope: admin/import/QA/factory routes are protected. Student learning endpoints are still prototype endpoints accepting `student_id`; binding every learning action to the authenticated student's profile is the next security milestone before public beta.

# V1.0 internal security boundary

V1.0 removes caller-controlled `student_id` from student learning operations. Attempt submission, diagnostics, learning events, offline sync, mastery views, retention reviews and daily plans resolve the student profile from the authenticated STUDENT session on the server.

An ADMIN token cannot be used as a student token, unauthenticated learning writes are rejected, and offline event UUIDs cannot be claimed by another student account. Learning request schemas also reject unknown fields such as an injected `student_id`.

This is an **internal V1.0 engineering milestone**, not a claim that the product is ready for public deployment. Before a real beta, the remaining critical work includes current-official-book ingestion, real AI provider integration, Alembic migrations, R2/S3 storage, tighter CORS/rate limiting, email/account recovery, child-privacy review, and production monitoring.
