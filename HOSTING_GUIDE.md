# Hosting Guide

This runbook matches the current repository as it exists today:

- Backend: Express + TypeScript
- Frontend: Vite + React + TypeScript
- Database: Neon / PostgreSQL
- Backend deployment: Render via [render.yaml](/E:/MappingNexusMVP/MappingNexusMVP/render.yaml)
- Frontend deployment: Vercel

It is written as a fresh-start setup from a clean machine and a fresh database.

## 1. Prerequisites

- Node.js 20+
- npm
- A fresh Neon Postgres database
- Git

Optional but useful:

- `psql` for inspecting the database manually

## 2. Clone And Install

From a clean machine:

```bash
git clone <your-repo-url>
cd MappingNexusMVP
cd backend && npm install
cd ../frontend && npm install
cd ..
```

## 3. Required Environment Variables

Set backend and frontend variables separately.

### Backend env vars

Create `backend/.env`.

Required for normal backend startup:

```env
DATABASE_URL=postgres://<user>:<password>@<host>/<db>?sslmode=require
JWT_SECRET=<long-random-secret>
OPENROUTER_API_KEY=<your-openrouter-api-key>
ENCRYPTION_KEK=<64-hex-character-key>
```

Recommended / commonly needed:

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@mappingnexus.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_CALENDAR_REDIRECT_URI=
MICROSOFT_TENANT_ID=common
CALENDAR_SYNC_CRON=15 2 * * *
CALENDAR_SYNC_TIMEZONE=Asia/Kolkata
REDIS_URL=redis://localhost:6379
```

Backend env var descriptions:

- `DATABASE_URL`: Neon/Postgres connection string used by the backend and migration runner.
- `JWT_SECRET`: signs and verifies backend JWTs.
- `OPENROUTER_API_KEY`: required by the AI matching route for LLM ranking.
- `ENCRYPTION_KEK`: server-managed encryption key for protected HR data. Must be exactly 64 hex chars.
- `NODE_ENV`: use `development` locally, `production` in deployment.
- `PORT`: backend HTTP port. Default local value is `3001`.
- `FRONTEND_URL`: frontend origin used for CORS and password-reset links.
- `CORS_ORIGIN`: comma-separated list of allowed browser origins.
- `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`: optional SMTP settings. If unset in local dev, email falls back to console/dev behavior.
- `GOOGLE_CLIENT_ID`: used for Google sign-in and calendar integration.
- `GOOGLE_CLIENT_SECRET`: only needed for Google Calendar OAuth flows.
- `GOOGLE_CALENDAR_REDIRECT_URI`: redirect URI for Google Calendar OAuth.
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_CALENDAR_REDIRECT_URI`, `MICROSOFT_TENANT_ID`: only needed for Microsoft calendar integration.
- `CALENDAR_SYNC_CRON`, `CALENDAR_SYNC_TIMEZONE`: optional scheduler settings for calendar sync.
- `REDIS_URL`: optional Redis connection string for the BullMQ worker queue.

### Frontend env vars

Create `frontend/.env.local`.

Required for the normal app flow:

```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=
```

Optional:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Frontend env var descriptions:

- `VITE_API_URL`: backend base URL used by the API client and Vite dev proxy target.
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID used by the login UI.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: optional browser Supabase client config for password recovery flows. If omitted, the app still runs, but Supabase browser recovery support is unavailable.

## 4. Database Setup And Migration

The current migration entrypoint in this repo is:

- [backend/run-migration.ts](/E:/MappingNexusMVP/MappingNexusMVP/backend/run-migration.ts)

It applies:

- [backend/supabase/migrations/neon_master_migration.sql](/E:/MappingNexusMVP/MappingNexusMVP/backend/supabase/migrations/neon_master_migration.sql)

Run the migration from the backend directory:

```bash
cd backend
npx tsx run-migration.ts
cd ..
```

If you also need the follow-up table/calendar backfill migration for an older database, there is a separate helper:

- [backend/run-017-backfill.ts](/E:/MappingNexusMVP/MappingNexusMVP/backend/run-017-backfill.ts)

That is not part of the normal fresh-database flow.

## 5. Seed Synthetic Data

Generate seed data after the schema exists:

```bash
cd backend
npm run generate-data
cd ..
```

This creates synthetic companies, users, employees, skills, teams, and related data using the current backend scripts.

## 6. Reindex Embeddings

After seeding or importing employees, regenerate embeddings with the unified embedding model:

```bash
cd backend
npm run reindex-embeddings
cd ..
```

This command runs:

- [backend/src/scripts/backfill-embeddings.ts](/E:/MappingNexusMVP/MappingNexusMVP/backend/src/scripts/backfill-embeddings.ts)

## 7. Start The Backend

For local development:

```bash
cd backend
npm run dev
```

For a production-style local start:

```bash
cd backend
npm run build
npm start
```

## 8. Start The Frontend

In a separate terminal:

```bash
cd frontend
npm run dev
```

The frontend dev server runs on `http://localhost:5173`.

## 9. Smoke Test Checklist

Use this checklist after both apps are running.

1. Open `http://localhost:5173`.
2. Confirm the login page loads without a blank screen.
3. Log in with one of the synthetic accounts printed by `npm run generate-data`.
4. Confirm the dashboard loads and API requests succeed.
5. Open the employee or manager views and verify records are visible.
6. Run the matching engine with a small skill query and confirm ranked matches return.
7. Create or save a project from the manager flow and confirm it appears in project lists.
8. Assign a candidate to a project and confirm no API error is returned.
9. Refresh the page and confirm the session survives reload.
10. Confirm the backend health endpoint responds at `http://localhost:3001/api/health`.

## 10. Deployment Notes

### Backend on Render

The current backend deployment file is:

- [render.yaml](/E:/MappingNexusMVP/MappingNexusMVP/render.yaml)

Current Render model in this repo:

- Root directory: `backend`
- Build command: installs backend, builds backend, then installs/builds frontend
- Start command: `npm start`

At minimum, set these Render environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `OPENROUTER_API_KEY`
- `ENCRYPTION_KEK`
- `FRONTEND_URL`
- `CORS_ORIGIN`

Set email and calendar OAuth variables only if you are using those flows.

### Frontend on Vercel

Deploy the `frontend` directory as a Vite project.

At minimum, set:

- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only if you want browser-side Supabase password recovery support.
