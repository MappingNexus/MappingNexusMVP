# Deployment Guide

## Frontend: Vercel

Use the `frontend` folder as the Vercel app.

### Vercel Settings

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Production Branch | `main` |

### Frontend Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `VITE_API_URL` | Render backend base URL. Do not append `/api`. | `https://mappingnexusmvp-bku2.onrender.com` |
| `VITE_GOOGLE_CLIENT_ID` | Optional Google OAuth web client id. Leave unset to hide Google login. | `1234567890-example.apps.googleusercontent.com` |
| `VITE_SUPABASE_URL` | Legacy/optional Supabase URL if client-side Supabase features are re-enabled. | `https://project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Legacy/optional Supabase anon key if client-side Supabase features are re-enabled. | `ey...` |

After changing any `VITE_` variable, redeploy Vercel. Vite bakes these values into the build.

## Backend: Render

Use the `backend` folder as the Render web service.

### Render Settings

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root Directory | `backend` |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

### Backend Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string. Use pooled URL for Render. | `postgresql://user:pass@host/neondb?sslmode=require` |
| `JWT_SECRET` | Secret for signing auth tokens. Use a long random value. | `9b7f...long-random-secret` |
| `OPENROUTER_API_KEY` | API key for matching/LLM features. | `sk-or-v1-...` |
| `ENCRYPTION_KEK` | Unique 64-character hex key for AES-256 data encryption. | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` |
| `NODE_ENV` | Runtime mode. | `production` |
| `PORT` | Render injects this automatically; set only if needed. | `10000` |
| `FRONTEND_URL` | Public Vercel frontend URL for redirects and CORS. | `https://mapping-nexus-mvp.vercel.app` |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins. | `https://mapping-nexus-mvp.vercel.app` |
| `EMAIL_SERVICE` | Nodemailer service name. | `gmail` |
| `EMAIL_USER` | SMTP username. Optional if email sending is disabled. | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | SMTP app password. Optional if email sending is disabled. | `gmail-app-password` |
| `EMAIL_FROM` | From address for onboarding/reset emails. | `noreply@mappingnexus.com` |
| `GOOGLE_CLIENT_ID` | Optional Google OAuth/calendar client id. | `1234567890-example.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional Google OAuth/calendar client secret. | `GOCSPX-...` |
| `GOOGLE_CALENDAR_REDIRECT_URI` | Optional Google calendar callback URI. | `https://api.example.com/api/calendar/google/callback` |
| `MICROSOFT_CLIENT_ID` | Optional Microsoft calendar client id. | `00000000-0000-0000-0000-000000000000` |
| `MICROSOFT_CLIENT_SECRET` | Optional Microsoft calendar client secret. | `secret` |
| `MICROSOFT_CALENDAR_REDIRECT_URI` | Optional Microsoft calendar callback URI. | `https://api.example.com/api/calendar/microsoft/callback` |
| `MICROSOFT_TENANT_ID` | Microsoft tenant id. | `common` |
| `CALENDAR_SYNC_CRON` | Optional calendar sync schedule. | `15 2 * * *` |
| `CALENDAR_SYNC_TIMEZONE` | Optional calendar sync timezone. | `Asia/Kolkata` |
| `REDIS_URL` | Optional Redis URL for background embedding jobs. Leave blank to disable queue. | `redis://default:pass@host:6379` |

### ENCRYPTION_KEK Requirements

- Must be exactly 64 hexadecimal characters.
- Must be unique per deployment.
- Must not be the dev sentinel value:
  `deadbeefcafebabedeadbeefcafebabedeadbeefcafebabedeadbeefcafebabe`

Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database: Neon

- Use the pooled Neon connection string for Render.
- Ensure all migrations in `backend/supabase/migrations` are applied.
- Keep `sslmode=require` unless your deployment is configured for stricter certificate verification.

## Deployment Steps

1. Push fixes to GitHub.
2. Deploy backend on Render from the `backend` root directory.
3. Verify `https://<render-service>.onrender.com/api/health`.
4. Set Vercel `VITE_API_URL` to the Render backend base URL.
5. Deploy frontend on Vercel from the `frontend` root directory.
6. Update Render `FRONTEND_URL` and `CORS_ORIGIN` to the Vercel URL.
7. Redeploy Render after CORS changes.
8. Test HR/manager/employee login from the Vercel URL.
