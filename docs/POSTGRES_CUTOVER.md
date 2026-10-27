# Render PostgreSQL cutover

This is the required production cutover for `pal-learning-api`. Do not paste or guess a database URL from another environment.

## 1. Link the existing Render database

In the Render dashboard open `pal-learning-api` → **Environment** and set `DATABASE_URL` using **Add from database** / the internal connection string from `pal-learning-db`.

Expected database resource:

- Render database name: `pal-learning-db`
- Region: Frankfurt
- App database: `pal_learning_db`
- App database user: `pal_learning_db_user`

The API and database must remain in the same Render region so the internal connection can be used.

## 2. Use the migration-managed start command

Set the API Start Command to:

```bash
cd apps/api && alembic upgrade head && python -m app.db.bootstrap && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

`app.db.bootstrap` is a fail-closed guard: SQLite is allowed for local/demo use, but PostgreSQL seed execution is blocked unless the database is already at the current Alembic head.

The application also refuses to report PostgreSQL `/ready` when its Alembic revision is behind the code migration head.

Current migration head:

```text
20261027_01
```

## 3. Runtime configuration required for Beta readiness

Set/verify these service environment variables:

- `JWT_SECRET`: strong random secret, at least 32 characters.
- `BOOTSTRAP_ADMIN_EMAIL`: real admin email used for bootstrap.
- `BOOTSTRAP_ADMIN_PASSWORD`: strong bootstrap password.
- `ALLOWED_ORIGINS=https://pal-learning-web.onrender.com`
- `AI_PROVIDER=OPENAI` only when the real provider is intentionally enabled.
- `OPENAI_API_KEY`: secret value, dashboard-managed.
- `OPENAI_MODEL` or `OPENAI_MODEL_BALANCED`: configured model identifier.
- `CURRICULUM_SOURCE_HOSTS=moe.edu.ps,www.sh-pal.com,sh-pal.com,download.sh-pal.com`

Do not commit provider keys, database credentials, JWT secrets, or admin passwords.

## 4. Verification after deploy

1. `GET /ready` must return `200` and report PostgreSQL.
2. Admin → Production Readiness must show:
   - persistent database ✓
   - current Alembic migration ✓
   - strong JWT secret ✓
   - production CORS ✓
   - bootstrap admin configuration ✓
   - real/configured AI provider ✓ when curriculum-factory Beta is enabled
3. Candidate QA / Staging remains separate from publication.
4. Final Release Gate must still say `publication_authorized: false`; it is only a release-readiness decision.

## 5. Rollback rule

If migration or guarded bootstrap fails, do not point production back to SQLite as a silent fallback. Restore the prior Render deploy or fix the database migration, then redeploy. Production data must stay on the persistent database.
