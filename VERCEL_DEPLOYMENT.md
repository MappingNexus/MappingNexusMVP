# Vercel Deployment Guide - Frontend Only

## Quick Setup for Frontend-Only Deployment

You only want to deploy the frontend React app. Here's the simple setup:

## Next Steps

### 1. Configure Vercel Project Settings

In your Vercel dashboard:

**Build Settings:**
- **Framework Preset**: `Vite` (Vercel will auto-detect)
- **Root Directory**: `frontend` ⬅️ **IMPORTANT: Set this to `frontend`**
- **Build Command**: `npm run build` (or leave empty, Vite preset handles it)
- **Output Directory**: `dist` (or leave empty, Vite preset handles it)
- **Install Command**: (leave empty, Vite preset handles it)

**That's it!** Vercel will:
1. Navigate to `frontend/` directory
2. Run `npm install`
3. Run `npm run build`
4. Serve the `dist/` folder as static site

### 2. Environment Variables (Optional)

If your frontend needs environment variables, add them in Vercel:

**Frontend Environment Variables:**
- `VITE_GROQ_API_KEY` - Your Groq API key (if needed)
- `VITE_API_URL` - Your backend API URL (if backend is deployed elsewhere)

**Note:** Vite only exposes variables prefixed with `VITE_` to the frontend.

### 3. Deploy

- Push to your main branch (auto-deploys)
- Or manually trigger deployment in Vercel dashboard

**Environment Variables:**
Add these in Project Settings → Environment Variables:

```
DATABASE_URL=your-postgresql-connection-string
NODE_ENV=production
VITE_GROQ_API_KEY=your-groq-api-key
```

**Optional:**
```
FRONTEND_URL=https://your-project.vercel.app
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 3. Redeploy

After pushing, Vercel will automatically redeploy. Or manually trigger:
- Go to Deployments → Click "Redeploy"

### 4. Run Database Migrations

After first successful deployment, run migrations:

```bash
# Option 1: Using Vercel CLI
vercel env pull .env.local
cd backend
npx prisma migrate deploy
npx prisma generate

# Option 2: Direct connection
cd backend
export DATABASE_URL="your-production-database-url"
npx prisma migrate deploy
npx prisma generate
npm run seed
```

## Troubleshooting

### Build Fails
- **Check Root Directory**: Must be set to `frontend` (not `.`)
- **Check Framework**: Should be `Vite` (auto-detected)
- **Check Build Logs**: Vercel dashboard → Deployments → View logs

### API Calls Fail (404)
- Your frontend calls `/api/*` but there's no backend deployed
- **Option 1**: Deploy backend separately and update `VITE_API_URL` env var
- **Option 2**: Update `frontend/services/api.ts` to use full backend URL

### Environment Variables Not Working
- Vite only exposes variables starting with `VITE_`
- Make sure you prefix them: `VITE_API_URL`, `VITE_GROQ_API_KEY`, etc.
- Restart deployment after adding env vars

## File Structure

```
MappingNexus/
├── frontend/           # React app (THIS IS YOUR ROOT IN VERCEL)
│   ├── dist/          # Build output (created during build)
│   ├── package.json
│   └── vite.config.ts
└── backend/           # Express API (NOT DEPLOYED - ignored by Vercel)
    └── ...
```

## How It Works

1. **Vercel Settings**: Root Directory = `frontend`
2. **Build Phase**: 
   - Vercel navigates to `frontend/`
   - Runs `npm install`
   - Runs `npm run build` (which runs `tsc && vite build`)
   - Outputs to `frontend/dist/`

3. **Runtime**:
   - Static files served from `dist/`
   - All routes serve your React app (SPA)
   - API calls to `/api/*` will fail unless you deploy backend separately

## Important Notes

- ✅ **Simple**: Just set Root Directory to `frontend`
- ✅ **No Backend**: Backend folder is completely ignored
- ✅ **Static Site**: Pure frontend deployment
- ⚠️ **API Calls**: If frontend calls `/api/*`, those will 404 unless you deploy backend elsewhere
- ✅ **Auto-deploy**: Pushing to main branch triggers deployment

## Testing Deployment

1. Visit: `https://your-project.vercel.app`
2. Check API: `https://your-project.vercel.app/api/health`
3. Test login with credentials from README.md

## Need Help?

Check Vercel deployment logs:
- Dashboard → Deployments → Click deployment → View Function Logs

Common issues are usually:
- Missing environment variables
- Database connection problems
- Build command errors
- Missing dependencies
