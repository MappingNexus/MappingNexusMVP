# Frontend .env File Structure

## Create `.env` file in `frontend/` folder

```env
# Groq AI API Key (for CV/Resume analysis)
# Get from: https://console.groq.com/keys
VITE_GROQ_API_KEY=your-api-key-here

# Backend API URL (optional - defaults to http://localhost:3001)
VITE_API_URL=http://localhost:3001
```

## Quick Setup

1. Create `frontend/.env` file
2. Add the variables above
3. Restart `npm run dev` after creating/modifying `.env`

## Notes

- **VITE_ prefix required** - Vite only exposes variables starting with `VITE_`
- **Restart needed** - Changes to `.env` require restarting the dev server
- **Optional** - Frontend works without these (uses mock data for CV analysis)
- **Never commit** - Add `.env` to `.gitignore`
