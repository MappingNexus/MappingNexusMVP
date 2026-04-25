# Mapping Nexus MVP

A full-stack resource planning and workforce management platform with AI-powered employee embedding matching, temporal availability tracking, and role-based access control.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. **Configure Environment Variables:**

**Backend `.env`:**
```env
DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<db>?sslmode=require
JWT_SECRET=mappingnexus-local-dev-secret-change-in-prod
OPENROUTER_API_KEY=sk-or-v1-...
ENCRYPTION_KEK=deadbeefcafebabedeadbeefcafebabedeadbeefcafebabedeadbeefcafebabe
PORT=3001
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## 🔐 Login Credentials & Google OAuth

The application uses Role-Based Access Control (RBAC). Your dashboard view depends entirely on your database `role`.

**Google OAuth:**
You can sign in using the **"Sign in with Google"** button once your account has been provisioned by an HR administrator.

*Note: For demo purposes, the Tenant Secret (Security Vault) requirement has been bypassed so you can sign in with 1-click.*

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS
- `@react-oauth/google`
- Lucide React

**Backend:**
- Node.js + Express + TypeScript
- Neon Postgres Serverless (via `pg` pool)
- Custom JWT Authentication
- Google Auth Library (`google-auth-library`)

**AI/ML:**
- OpenRouter API (Parallelized Embedding Generation & Context-Aware Matching)

---

## ✨ Core Features

- **Google OAuth:** 1-click seamless login.
- **AI Matching Engine:** Finds the best employees for a project by generating parallelized skill embeddings and scoring them via LLM.
- **Calendar-Aware Logic:** Matching engine analyzes `availability_windows` to penalize candidates with upcoming holidays or project overlap.
- **Enterprise Security (Vault):** E2E Encryption architecture using a Tenant Secret (KEK) to protect PII at the database level.
- **Role-Based Access Control:** Separate dashboards for HR, Managers, and Employees.

---

## 🧠 AI Architecture & Matching Engine

The core value proposition of Mapping Nexus is its high-accuracy AI employee-to-project matching system. It operates in a multi-stage pipeline:

1. **Parallelized Embedding Generation:** When new employees or roles are ingested, the system uses `text-embedding-3-small` (via OpenRouter) to convert their skillsets into high-dimensional vectors. Batch operations use `Promise.all` for extreme concurrency.
2. **Vector Similarity Search (pgvector):** When a manager requests staffing, the backend queries the Neon PostgreSQL database using Cosine Similarity (`<=>`) to instantly find the top 50 mathematically closest candidate profiles.
3. **Temporal Retrieval-Augmented Generation (RAG):** The system fetches the calendar `availability_windows` for the top candidates, checking for conflicting holidays or pre-booked projects over the next 30 days.
4. **LLM Decision Matrix:** A fast LLM model evaluates the filtered candidates against the exact project requirements, heavily penalizing candidates with scheduling conflicts, and returns a final `confidence_score` (0-100%) along with an analytical justification.

---

## 💾 Demo Data Generation

If you are setting up a fresh database instance, you will need to populate it with synthetic profiles and embeddings to test the AI engine.

**1. Generate Dummy Candidates:**
*(If a seeder exists, run your standard seeder command here)*

**2. Backfill AI Embeddings:**
Once you have raw employee data, you must generate their vector embeddings so the AI can search them mathematically:
```bash
cd backend
npx tsx src/scripts/backfill-embeddings.ts
```
*This script is heavily optimized to process hundreds of employees concurrently via in-memory caching and Promise batching.*

---

## 🐛 Troubleshooting

**Backend won't start / DB Error:**
- Ensure `DATABASE_URL` is pointing to the correct Neon DB string.
- If getting JWT or Encryption errors, ensure your `.env` contains `JWT_SECRET` and `ENCRYPTION_KEK`.

**Google Login Failed:**
- Ensure `VITE_GOOGLE_CLIENT_ID` (frontend) and `GOOGLE_CLIENT_ID` (backend) exactly match your Google Cloud Console Client ID.

---

## 📄 License

Private - Pre-seed Startup
