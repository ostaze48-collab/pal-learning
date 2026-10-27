# Build Status — V1.0 Internal

Validated: 27 automated tests passed.

## Proven working flows

- Curriculum registry (grades, subjects, books, units, lessons).
- Source package upload for text-based PDF/TXT/MD.
- SHA-256 deduplication metadata and page-aware source chunks.
- Heuristic unit/lesson structure extraction.
- Lesson-to-source-chunk provenance linking.
- Solutions parsing/alignment and reference-answer validation.
- Skill graph and prerequisite backtracking.
- Question attempts updating mastery with bounded confidence.
- Root-gap diagnostic and short remediation lookup.
- Retention scheduling and adaptive daily plan.
- Idempotent offline event sync.
- Learning Health and Content Improvement Queue.
- QA gate blocking unverified publication.
- Provider-neutral AI generation packets.
- Structured AI output validation with provenance and skill-code checks.
- Content candidates isolated from published lesson data.
- Admin authentication with revocable opaque sessions.
- Student authentication and server-side student-profile binding.
- PWA manifest + initial service worker shell.

## Intentionally not production-ready yet

- Latest official 2026 curriculum files are not bundled or claimed verified.
- AI provider adapter remains `LOCAL_MOCK` until a provider/key is configured.
- PostgreSQL/pgvector production deployment is not exercised in this ZIP; automated tests use SQLite.
- Prototype startup still uses SQLAlchemy `create_all`; Alembic migrations are the next database milestone.
- Local upload storage must be replaced by R2/S3 for deployment.
- CORS, rate limits, account recovery, monitoring, backups and child-privacy controls require production hardening.
