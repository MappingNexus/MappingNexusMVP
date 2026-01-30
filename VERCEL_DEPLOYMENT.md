# Vercel Deployment Guide

## Quick Fix Summary

The build was failing because Vercel didn't know how to handle your monorepo structure. I've added the necessary configuration files:

1. ✅ `vercel.json` - Tells Vercel how to build and route your app
2. ✅ `api/index.ts` - Serverless function wrapper for your Express backend
3. ✅ `package.json` - Root build script
4. ✅ Updated `backend/server.ts` - Works in both local and serverless environments
5. ✅ Updated CORS settings - Allows your Vercel domain

## What Changed

### 1. Server Configuration
- Backend now detects Vercel environment and doesn't start listening (serverless)
- CORS updated to allow your Vercel deployment URL

### 2. Build Process
- Root `package.json` provides build command
- `vercel.json` configures the build and routing

### 3. API Routing
- `/api/*` routes go to your Express backend via serverless functions
- Everything else serves your React frontend

## Next Steps

### 1. Push Changes to GitHub
```bash
git add .
git commit -m "Add Vercel configuration"
git push
```

### 2. Configure Vercel Project Settings

In your Vercel dashboard:

**Build Settings:**
- **Framework Preset**: Other
- **Root Directory**: `.` (keep as root)
- **Build Command**: `cd frontend && npm run build` (or leave empty, vercel.json handles it)
- **Output Directory**: `frontend/dist`
- **Install Command**: `cd backend && npm install && cd ../frontend && npm install` (or leave empty)

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

### Build Fails with "Cannot find module"
- Ensure both `backend/node_modules` and `frontend/node_modules` exist
- Check that `installCommand` in vercel.json runs correctly

### API Returns 404
- Verify `api/index.ts` exists
- Check `vercel.json` rewrites configuration
- Ensure backend dependencies are installed

### Database Connection Errors
- Verify `DATABASE_URL` is set correctly
- Check database allows external connections
- Ensure SSL mode: `?sslmode=require`

### CORS Errors
- Add your Vercel URL to CORS origins (already done)
- Check `FRONTEND_URL` environment variable

## File Structure

```
MappingNexus/
├── vercel.json          # Vercel configuration
├── package.json         # Root build script
├── api/
│   └── index.ts        # Serverless function entry point
├── frontend/           # React app
│   └── dist/          # Build output (created during build)
└── backend/            # Express API
    └── server.ts       # Express app (exported for serverless)
```

## How It Works

1. **Build Phase**: 
   - Installs backend dependencies
   - Installs frontend dependencies
   - Builds frontend to `frontend/dist`

2. **Runtime**:
   - Static files (React app) served from `frontend/dist`
   - `/api/*` requests routed to `api/index.ts` → Express app
   - Express app runs as serverless function

3. **Database**:
   - Prisma Client generated during install (postinstall script)
   - Migrations run manually after deployment

## Important Notes

- ⚠️ **Database**: You need a hosted PostgreSQL database (Vercel Postgres, Supabase, Neon, etc.)
- ⚠️ **Migrations**: Run `prisma migrate deploy` after first deployment
- ⚠️ **Seeding**: Run `npm run seed` in backend after migrations
- ✅ **Auto-deploy**: Pushing to main branch triggers deployment
- ✅ **Preview**: Pull requests get preview deployments automatically

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
