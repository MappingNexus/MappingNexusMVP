/**
 * Mapping Nexus — Main Server (v2 — Neon DB)
 *
 * Express backend using Neon (PostgreSQL) for all DB operations.
 * Custom JWT auth. No Supabase.
 *
 * Middleware stack:
 *   1. CORS
 *   2. JSON body parser
 *   3. Rate limiting (per endpoint category)
 *   4. Auth (JWT verify → Neon DB lookup)
 *   5. Role check (requireRole)
 *   6. Tenant check (requireTenant)
 */
/**
 * Mapping Nexus — Main Server (v2 — Neon DB)
 *
 * Express backend using Neon (PostgreSQL) for all DB operations.
 * Custom JWT auth. No Supabase.
 *
 * Middleware stack:
 *   1. CORS
 *   2. JSON body parser
 *   3. Rate limiting (per endpoint category)
 *   4. Auth (JWT verify → Neon DB lookup)
 *   5. Role check (requireRole)
 *   6. Tenant check (requireTenant)
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { verifyDatabaseConnection } from './config/db.js';
import { apiLimiter } from './middleware/rateLimiter.js';
// import './workers/embedding.worker.js'; // Disabled to prevent Redis connection spam
import { startCalendarSyncScheduler } from './workers/calendar-sync.scheduler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import employeeRoutes from './routes/employees.routes.js';
import teamRoutes from './routes/teams.routes.js';
import matchingRoutes from './routes/matching.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import auditRoutes from './routes/audit.routes.js';
import telemetryRoutes from './routes/telemetry.routes.js';
import projectRoutes from './routes/projects.routes.js';
import assignmentRoutes from './routes/assignments.routes.js';
import bulkImportRoutes from './routes/bulk-import.routes.js';
import requestRoutes from './routes/requests.routes.js';
import calendarRoutes from './routes/calendar.routes.js';

const app = express();
app.set('trust proxy', 1);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

const allowedOrigins = env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

if (env.FRONTEND_URL && !allowedOrigins.includes(env.FRONTEND_URL)) {
    allowedOrigins.push(env.FRONTEND_URL);
}

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-company-secret', 'X-Company-Secret'],
}));

app.use(express.json({ limit: '10mb' }));

// Global rate limit (200/min per IP for all API routes)
app.use('/api', apiLimiter);

// ============================================================
// ROUTE MOUNTING
// ============================================================

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employees/bulk-import', bulkImportRoutes); // MUST be before /api/employees
app.use('/api/employees', employeeRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/match', matchingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/calendar', calendarRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// FRONTEND HOSTING
// ============================================================

if (hasFrontendBuild) {
    app.use(express.static(frontendDistPath));

    app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
        res.sendFile(frontendIndexPath);
    });
}

// ============================================================
// ERROR HANDLING
// ============================================================

app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found.' });
});

app.use((_req, res) => {
    res.status(404).json({ success: false, message: hasFrontendBuild ? 'Page not found.' : 'Frontend not deployed.' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: env.IS_DEV ? err.message : 'Internal server error.',
    });
});

// ============================================================
// SERVER START
// ============================================================

if (!process.env.VERCEL) {
    const HOST = '0.0.0.0';
    app.listen(env.PORT, HOST, async () => {
        console.log('\n' + '='.repeat(55));
        console.log('  🚀 MAPPING NEXUS API — v2.0 (Neon DB)');
        console.log('='.repeat(55));
        console.log(`  Server:     http://${HOST}:${env.PORT}`);
        console.log(`  Env:        ${env.NODE_ENV}`);

        const dbOk = await verifyDatabaseConnection();
        startCalendarSyncScheduler();
        console.log(`  Neon DB:    ${dbOk ? '✅ Connected' : '❌ NOT CONNECTED'}`);
        console.log(`  OpenRouter: ${env.OPENROUTER_API_KEY && !env.OPENROUTER_API_KEY.includes('placeholder') ? '✅ Configured' : '❌ Missing'}`);
        console.log(`  Encryption: ${env.ENCRYPTION_KEK ? '✅ KEK loaded' : '❌ Missing'}`);
        console.log(`  Email:      ${env.EMAIL_USER ? `✅ ${env.EMAIL_SERVICE}` : '📋 Console (dev)'}`);
        console.log('='.repeat(55) + '\n');
    });
}

export default app;
