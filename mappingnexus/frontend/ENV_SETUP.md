# Frontend Environment Variables Setup

## Quick Setup

1. **Create `.env` file** in the `frontend/` folder
2. **Copy from `.env.example`** and fill in your values
3. **Restart dev server** after changing `.env` files

## Environment Variables

### Required (Optional for UI-only)
- `VITE_GROQ_API_KEY` - Groq AI API key for CV/Resume analysis
  - Get from: https://console.groq.com/keys
  - If not set, CV upload will use mock data

### Optional
- `VITE_API_URL` - Backend API URL (defaults to `http://localhost:3001`)
  - Only needed if backend runs on different port/URL
  - Frontend can run without backend for UI development

## Example `.env` File

```env
# Groq AI API Key (for CV analysis)
VITE_GROQ_API_KEY=gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Backend API URL (optional)
VITE_API_URL=http://localhost:3001
```

## Important Notes

1. **Vite requires `VITE_` prefix** - Only variables starting with `VITE_` are exposed to client code
2. **Restart required** - Changes to `.env` require restarting `npm run dev`
3. **Never commit `.env`** - Add `.env` to `.gitignore`
4. **UI works without API key** - Frontend will use mock data if Groq API key is missing

## Usage in Code

```typescript
// Access environment variables
const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

## For Production

In production, set these as environment variables in your hosting platform:
- Netlify: Site settings → Environment variables
- Vercel: Project settings → Environment variables
- Other platforms: Check their documentation
