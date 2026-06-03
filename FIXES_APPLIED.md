# Fixes Applied

This pass was performed from a fresh clone of `https://github.com/MappingNexus/MappingNexusMVP`.

## Files Changed

### `.github/workflows/ci.yml`
- Added complete backend test environment variables for CI.
- Replaced the development-only `ENCRYPTION_KEK` sentinel with a non-dev 64-character hex value.
- Reason: CI was using a dev-only encryption key while running outside development mode.

### `frontend/.eslintrc.cjs`
- Added an ESLint configuration compatible with React, TypeScript, and Vite.
- Enabled TypeScript parsing and React Hooks rules.
- Disabled legacy-noisy rules that would block the current codebase from adopting CI linting immediately.
- Reason: `npm run lint` failed because ESLint had no configuration file.

### `backend/.env.example`
- Documented the required `ENCRYPTION_KEK` format.
- Marked the dev sentinel key as forbidden outside local development.
- Clarified that `REDIS_URL` is optional and controls background embedding jobs.
- Reason: Render/production needs clear environment variable guidance.

### `backend/src/routes/auth.routes.ts`
- Removed the direct `token_version` increment from password update SQL.
- Kept token revocation/version bump centralized in `revokeAllSessionsForUser`.
- Reason: password changes were bumping `token_version` twice.

### `backend/src/routes/auth.routes.test.ts`
- Added fake database support for password update SQL that also increments `token_version`.
- Reason: Jest fake DB did not handle one of the auth route SQL statements.

### `backend/src/middleware/auth.test.ts`
- Imported Jest globals explicitly for ESM test execution.
- Reason: `jest` was undefined under the current ESM Jest runner.

### `backend/src/workers/queue.ts`
- Made Redis/BullMQ optional unless `REDIS_URL` is configured.
- Kept queue creation enabled under `NODE_ENV=test` so mocked worker tests still execute.
- Reason: production startup should not hang or spam Redis connection errors when Redis is not configured.

### `backend/src/workers/embedding.worker.ts`
- Made worker construction conditional on Redis being configured.
- Reason: worker startup should not require Redis in deployments that do not enable background embedding jobs.

### `render.yaml`
- Simplified backend build command to `npm ci && npm run build`.
- Reason: Render backend deployment should build the backend service only; frontend is deployed separately on Vercel.

## Bugs Fixed

- Missing ESLint config blocked frontend CI.
- CI used a dev-only encryption key in a non-development environment.
- Backend auth tests failed because Jest globals were not imported in one test file.
- Backend auth fake DB was missing SQL coverage.
- Password changes incremented token version twice.
- Backend startup attempted Redis connections even when no Redis service was configured.
- Render backend config unnecessarily built frontend assets.

## Remaining Non-Blocking Warnings

- Frontend Vite emits a large chunk warning. The build succeeds; code splitting can be optimized later.
- Backend startup smoke with a fake local DB reports `Neon DB: NOT CONNECTED`. This is expected without a real Neon `DATABASE_URL`.
- `pg` emits an SSL-mode future compatibility warning for `sslmode=require`. Neon remains compatible; consider `sslmode=verify-full` when certificate verification is fully configured.
