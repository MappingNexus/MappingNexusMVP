# Vercel Deployment

This repo deploys the frontend to Vercel from the `frontend` directory.

Current frontend stack:

- Vite
- React
- TypeScript

## Vercel Project Settings

Use these settings in Vercel:

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Required Frontend Environment Variables

Set these in the Vercel project:

```env
VITE_API_URL=https://<your-render-backend-host>
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
```

Optional:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

What they do:

- `VITE_API_URL`: points the frontend to the deployed Express backend.
- `VITE_GOOGLE_CLIENT_ID`: enables Google sign-in in the frontend.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: optional browser Supabase client for password recovery support.

## Backend Expectations

Vercel only hosts the frontend in this setup. The backend is expected to be deployed separately, using the current repo’s Render-based setup in:

- [render.yaml](/E:/MappingNexusMVP/MappingNexusMVP/render.yaml)

The frontend will call the backend URL configured in `VITE_API_URL`.

## Deploy Steps

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Set the project Root Directory to `frontend`.
4. Add the required environment variables.
5. Deploy.

## Verify The Deployment

After deploy:

1. Open the Vercel site URL.
2. Confirm the login page renders.
3. Confirm browser requests go to the expected backend from `VITE_API_URL`.
4. Log in and verify the app loads dashboard data successfully.

## Common Issues

- Blank or broken app on load:
  - Check `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID`.
- API requests failing:
  - Confirm the Render backend is live and its CORS settings include the Vercel frontend origin.
- Password recovery browser flow unavailable:
  - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if you want that path enabled.
