# 🚀 Hosting Your Database & App for Production

To make your app accessible to others (and have Google Sign-In work for them), you need to move your Local Database, Backend, and Frontend to the cloud.

Here is the recommended free/cheap stack for your **PERN** stack (Postgres, Express, React, Node):

## 1️⃣ Host the Database (Postgres)
We recommend **Neon** or **Supabase** (both have great free tiers and work perfectly with Prisma).

### Option A: Neon (Recommended for Prisma)
1. Go to [Neon.tech](https://neon.tech) and Sign Up.
2. Create a new Project (e.g., `mapping-nexus`).
3. It will give you a **Connection String** that looks like:
   ```
   postgres://alex:AbC123@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Copy this string.**

### Option B: Supabase
1. Go to [Supabase.com](https://supabase.com).
2. Create a Project.
3. Go to **Project Settings > Database** -> **Connection String** -> **URI**.
4. **Copy this string.** (Make sure to replace `[YOUR-PASSWORD]` with the password you set).

---

## 2️⃣ Connect Your App to the Cloud DB
1. Open your project locally.
2. In `backend/.env`, replace your local `DATABASE_URL` with the one you just copied.
3. Run the migration to push your schema to the cloud:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
   *Note: This creates the tables in your new cloud database.*

---

## 3️⃣ Host the Backend (Node/Express)
We recommend **Render** (easiest free tier for Node).

1. Push your code to **GitHub**.
2. Go to [Render.com](https://render.com).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repo.
5. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start` (or `npx ts-node server.ts`)
   - **Environment Variables**: Add `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `JWT_SECRET`, etc.
6. Deploy! Render will give you a URL like `https://mapping-nexus-api.onrender.com`.

---

## 4️⃣ Host the Frontend (React/Vite)
We recommend **Vercel** (Best for React/Vite).

1. Go to [Vercel.com](https://vercel.com).
2. "Add New Project" -> Import from GitHub.
3. Settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: Update your API URL!
     - `VITE_API_URL`: `https://mapping-nexus-api.onrender.com/api` (The URL from Step 3).
4. Deploy! Vercel will give you a URL like `https://mapping-nexus.vercel.app`.

---

## 5️⃣ CRITICAL: Update Google Cloud Console
Now that you have live URLs, you must tell Google they are safe.

1. Go to **Google Cloud Console > credentials**.
2. Edit your **OAuth 2.0 Client ID**.
3. Under **Authorized JavaScript origins**, ADD your new Frontend URL:
   - `https://mapping-nexus.vercel.app`
4. Click **Save**.

🎉 **Done!** Now anyone typically can go to your Vercel URL, and Google Sign-In will work.
