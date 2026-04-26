import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

type UserRole = 'hr' | 'manager' | 'employee';
type UserStatus = 'active' | 'suspended' | 'deactivated' | 'offboarded';

interface TestUser {
    user_id: string;
    email: string;
    password_hash: string;
    company_id: string;
    role: UserRole;
    status: UserStatus;
    token_version: number;
    reset_token: string | null;
    reset_token_expires: Date | null;
    reset_token_used: boolean;
}

interface TestCompany {
    company_id: string;
    company_name: string;
}

interface TestRefreshSession {
    session_id: string;
    user_id: string;
    token_hash: string;
    expires_at: Date;
    revoked: boolean;
    replaced_by: string | null;
    user_agent: string | null;
    ip_address: string | null;
    created_at: Date;
    last_used_at: Date;
}

const TEST_JWT_SECRET = 'mappingnexus-jest-secret';

const passThrough = (_req: express.Request, _res: express.Response, next: express.NextFunction) => next();
const logActionMock = jest.fn(async () => undefined);

let db: FakeDb;

const pool = {
    query: jest.fn((sql: string, params?: any[]) => db.query(sql, params)),
    connect: jest.fn(async () => db.connect()),
    on: jest.fn(),
};

jest.unstable_mockModule('../config/env.js', () => ({
    env: {
        DATABASE_URL: 'postgres://mocked',
        JWT_SECRET: TEST_JWT_SECRET,
        OPENROUTER_API_KEY: 'sk-or-placeholder',
        ENCRYPTION_KEK: 'deadbeefcafebabedeadbeefcafebabedeadbeefcafebabedeadbeefcafebabe',
        NODE_ENV: 'test',
        PORT: 3001,
        IS_DEV: true,
        FRONTEND_URL: 'http://frontend.test',
        EMAIL_SERVICE: 'gmail',
        EMAIL_USER: '',
        EMAIL_PASSWORD: '',
        EMAIL_FROM: 'noreply@mappingnexus.com',
        CORS_ORIGIN: 'http://localhost:5173',
        GOOGLE_CLIENT_ID: 'jest-google-client-id.apps.googleusercontent.com',
    },
}));

jest.unstable_mockModule('../config/db.js', () => ({
    pool,
    query: (sql: string, params?: any[]) => pool.query(sql, params),
    verifyDatabaseConnection: jest.fn(async () => true),
}));

jest.unstable_mockModule('../config/supabase.js', () => ({
    supabaseAdmin: { from: jest.fn() },
}));

jest.unstable_mockModule('../middleware/rateLimiter.js', () => ({
    authLimiter: passThrough,
    passwordResetLimiter: passThrough,
    apiLimiter: passThrough,
    matchingLimiter: passThrough,
}));

jest.unstable_mockModule('../services/audit.service.js', () => ({
    logAction: logActionMock,
    AuditActions: {
        USER_LOGIN: 'user_login',
        USER_CREATED: 'user_created',
        USER_SUSPENDED: 'user_suspended',
        USER_DEACTIVATED: 'user_deactivated',
        USER_OFFBOARDED: 'user_offboarded',
        USER_REACTIVATED: 'user_reactivated',
        USER_ROLE_CHANGED: 'user_role_changed',
        PASSWORD_CHANGED: 'password_changed',
        INVITE_RESENT: 'invite_resent',
    },
}));

class FakeDb {
    users = new Map<string, TestUser>();
    companies = new Map<string, TestCompany>();
    refreshSessions = new Map<string, TestRefreshSession>();
    queries: Array<{ sql: string; params: any[] }> = [];
    private companyCounter = 0;
    private sessionCounter = 0;

    connect() {
        return {
            query: jest.fn((sql: string, params?: any[]) => this.query(sql, params)),
            release: jest.fn(),
        };
    }

    async query(sql: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
        this.queries.push({ sql, params });
        const normalized = normalizeSql(sql);

        if (['begin', 'commit', 'rollback'].includes(normalized)) {
            return result([]);
        }

        if (normalized.includes('from public.users u') && normalized.includes('where u.email = $1')) {
            const user = this.findUserByEmail(params[0]);
            if (!user) return result([]);
            const company = this.companies.get(user.company_id);
            return result([{
                ...user,
                company_name: company?.company_name || 'Company',
            }]);
        }

        if (normalized.startsWith('select user_id from public.users where email = $1')) {
            const user = this.findUserByEmail(params[0]);
            return result(user ? [{ user_id: user.user_id }] : []);
        }

        if (normalized.startsWith('select password_hash from public.users where user_id = $1')) {
            const user = this.users.get(params[0]);
            return result(user ? [{ password_hash: user.password_hash }] : []);
        }

        if (normalized.startsWith('select company_id, role, status, token_version from public.users')) {
            const user = this.users.get(params[0]);
            return result(user ? [{
                company_id: user.company_id,
                role: user.role,
                status: user.status,
                token_version: user.token_version,
            }] : []);
        }

        if (normalized.startsWith('select c.company_name from public.companies c where c.company_id = $1')) {
            const company = this.companies.get(params[0]);
            return result(company ? [{ company_name: company.company_name }] : []);
        }

        if (normalized.startsWith('select employee_id from public.employees')) {
            return result([]);
        }

        if (normalized.startsWith('insert into public.refresh_token_sessions')) {
            const sessionId = `session-${++this.sessionCounter}`;
            const [userId, tokenHash, expiresAt, userAgent, ipAddress] = params;
            const session: TestRefreshSession = {
                session_id: sessionId,
                user_id: userId,
                token_hash: tokenHash,
                expires_at: new Date(expiresAt),
                revoked: false,
                replaced_by: null,
                user_agent: userAgent,
                ip_address: ipAddress,
                created_at: new Date(),
                last_used_at: new Date(),
            };
            this.refreshSessions.set(sessionId, session);
            return result([{ session_id: sessionId }], 1);
        }

        if (normalized.startsWith('select s.session_id')) {
            const session = [...this.refreshSessions.values()].find(s => s.token_hash === params[0]);
            if (!session) return result([]);
            const user = this.users.get(session.user_id);
            if (!user) return result([]);
            return result([{
                session_id: session.session_id,
                user_id: session.user_id,
                revoked: session.revoked,
                expires_at: session.expires_at,
                replaced_by: session.replaced_by,
                email: user.email,
                role: user.role,
                company_id: user.company_id,
                status: user.status,
                token_version: user.token_version,
            }]);
        }

        if (normalized.startsWith('update public.refresh_token_sessions set revoked = true, replaced_by = $1')) {
            const session = this.refreshSessions.get(params[1]);
            if (!session) return result([], 0);
            session.revoked = true;
            session.replaced_by = params[0];
            return result([], 1);
        }

        if (normalized.startsWith('update public.refresh_token_sessions set revoked = true where session_id = $1')) {
            const session = this.refreshSessions.get(params[0]);
            if (!session) return result([], 0);
            session.revoked = true;
            return result([], 1);
        }

        if (normalized.includes('update public.refresh_token_sessions') && normalized.includes('where token_hash = $1 and revoked = false')) {
            const session = [...this.refreshSessions.values()].find(s => s.token_hash === params[0] && !s.revoked);
            if (!session) return result([], 0);
            session.revoked = true;
            return result([], 1);
        }

        if (normalized.includes('update public.refresh_token_sessions') && normalized.includes('where user_id = $1') && normalized.includes('and revoked = false')) {
            let rowCount = 0;
            for (const session of this.refreshSessions.values()) {
                if (session.user_id === params[0] && !session.revoked) {
                    session.revoked = true;
                    rowCount += 1;
                }
            }
            return result([], rowCount);
        }

        if (normalized.startsWith('update public.users set token_version = token_version + 1')) {
            const user = this.users.get(params[0]);
            if (!user) return result([], 0);
            user.token_version += 1;
            return result([], 1);
        }

        if (normalized.startsWith('insert into public.companies')) {
            const company: TestCompany = {
                company_id: `company-${++this.companyCounter}`,
                company_name: params[0],
            };
            this.companies.set(company.company_id, company);
            return result([company], 1);
        }

        if (normalized.startsWith('insert into public.users')) {
            const role = params[4] || 'hr';
            const user: TestUser = {
                user_id: params[0],
                email: params[1],
                password_hash: params[2],
                company_id: params[3],
                role,
                status: 'active',
                token_version: 0,
                reset_token: null,
                reset_token_expires: null,
                reset_token_used: false,
            };
            this.users.set(user.user_id, user);
            return result([], 1);
        }

        if (normalized.startsWith('update public.users set reset_token = $1')) {
            const user = this.users.get(params[2]);
            if (!user) return result([], 0);
            user.reset_token = params[0];
            user.reset_token_expires = new Date(params[1]);
            user.reset_token_used = false;
            return result([], 1);
        }

        if (normalized.startsWith('select user_id, company_id, role, reset_token_expires, reset_token_used')) {
            const user = [...this.users.values()].find(u => u.reset_token === params[0]);
            return result(user ? [{
                user_id: user.user_id,
                company_id: user.company_id,
                role: user.role,
                reset_token_expires: user.reset_token_expires,
                reset_token_used: user.reset_token_used,
            }] : []);
        }

        if (normalized.startsWith('update public.users set password_hash = $1, reset_token_used = true')) {
            const user = this.users.get(params[1]);
            if (!user) return result([], 0);
            user.password_hash = params[0];
            user.reset_token_used = true;
            return result([], 1);
        }

        if (normalized.startsWith('update public.users set password_hash = $1 where user_id = $2')) {
            const user = this.users.get(params[1]);
            if (!user) return result([], 0);
            user.password_hash = params[0];
            return result([], 1);
        }

        if (normalized.startsWith('select user_id, company_id, status from public.users')) {
            const user = this.users.get(params[0]);
            return result(user ? [{
                user_id: user.user_id,
                company_id: user.company_id,
                status: user.status,
            }] : []);
        }

        if (normalized.startsWith('select user_id, company_id, role from public.users')) {
            const user = this.users.get(params[0]);
            return result(user ? [{
                user_id: user.user_id,
                company_id: user.company_id,
                role: user.role,
            }] : []);
        }

        if (normalized.startsWith('update public.users set status = $1 where user_id = $2')) {
            const user = this.users.get(params[1]);
            if (!user) return result([], 0);
            user.status = params[0];
            return result([], 1);
        }

        if (normalized.startsWith("update public.users set status = 'active' where user_id = $1")) {
            const user = this.users.get(params[0]);
            if (!user) return result([], 0);
            user.status = 'active';
            return result([], 1);
        }

        if (normalized.startsWith('update public.users set role = $1 where user_id = $2')) {
            const user = this.users.get(params[1]);
            if (!user) return result([], 0);
            user.role = params[0];
            return result([], 1);
        }

        throw new Error(`Unhandled SQL in auth test fake DB: ${sql}`);
    }

    addCompany(company: Partial<TestCompany> = {}) {
        const companyRow: TestCompany = {
            company_id: company.company_id || 'company-1',
            company_name: company.company_name || 'Acme Corp',
        };
        this.companies.set(companyRow.company_id, companyRow);
        return companyRow;
    }

    async addUser(user: Partial<TestUser> & { email: string; password?: string }) {
        const company = this.companies.get(user.company_id || 'company-1') || this.addCompany({
            company_id: user.company_id || 'company-1',
        });
        const userRow: TestUser = {
            user_id: user.user_id || `user-${this.users.size + 1}`,
            email: user.email.toLowerCase(),
            password_hash: user.password_hash || await bcrypt.hash(user.password || 'Password123!', 12),
            company_id: company.company_id,
            role: user.role || 'employee',
            status: user.status || 'active',
            token_version: user.token_version ?? 0,
            reset_token: user.reset_token ?? null,
            reset_token_expires: user.reset_token_expires ?? null,
            reset_token_used: user.reset_token_used ?? false,
        };
        this.users.set(userRow.user_id, userRow);
        return userRow;
    }

    addRefreshSession(
        userId: string,
        rawToken: string,
        options: Partial<Pick<TestRefreshSession, 'expires_at' | 'revoked' | 'replaced_by'>> = {}
    ) {
        const session: TestRefreshSession = {
            session_id: `session-${++this.sessionCounter}`,
            user_id: userId,
            token_hash: hashToken(rawToken),
            expires_at: options.expires_at || new Date(Date.now() + 60 * 60 * 1000),
            revoked: options.revoked ?? false,
            replaced_by: options.replaced_by ?? null,
            user_agent: null,
            ip_address: null,
            created_at: new Date(),
            last_used_at: new Date(),
        };
        this.refreshSessions.set(session.session_id, session);
        return session;
    }

    findUserByEmail(email: string) {
        return [...this.users.values()].find(u => u.email === String(email).toLowerCase());
    }

    sessionsForUser(userId: string) {
        return [...this.refreshSessions.values()].filter(s => s.user_id === userId);
    }
}

function normalizeSql(sql: string) {
    return sql.replace(/\s+/g, ' ').trim().toLowerCase();
}

function result(rows: any[], rowCount = rows.length) {
    return { rows, rowCount };
}

function hashToken(rawToken: string) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function accessToken(user: TestUser, tokenVersion = user.token_version) {
    return jwt.sign(
        { sub: user.user_id, email: user.email, tokenVersion },
        TEST_JWT_SECRET,
        { expiresIn: '15m' }
    );
}

const { default: authRoutes } = await import('./auth.routes.js');
const { default: adminRoutes } = await import('./admin.routes.js');

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    return app;
}

describe('complete auth system', () => {
    let app: express.Express;

    beforeEach(() => {
        db = new FakeDb();
        app = createApp();
        logActionMock.mockClear();
    });

    describe('onboarding', () => {
        it('creates an admin account for a valid onboarding payload', async () => {
            // setup
            const payload = {
                companyName: 'Acme Corp',
                adminName: 'Ada Admin',
                adminEmail: 'Ada.Admin@Example.com',
                adminPassword: 'StrongPass123',
            };

            // action
            const response = await request(app)
                .post('/api/auth/onboard-company')
                .send(payload);

            // assertion
            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                success: true,
                company: {
                    companyName: 'Acme Corp',
                },
            });
            expect(response.body.message).toContain('ada.admin@example.com');
            const admin = db.findUserByEmail('ada.admin@example.com');
            expect(admin).toMatchObject({ role: 'hr', status: 'active', token_version: 0 });
            await expect(bcrypt.compare(payload.adminPassword, admin!.password_hash)).resolves.toBe(true);
        });

        it('returns 400 when required onboarding fields are missing', async () => {
            // setup
            const payload = { companyName: 'Acme Corp' };

            // action
            const response = await request(app)
                .post('/api/auth/onboard-company')
                .send(payload);

            // assertion
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.issues.length).toBeGreaterThan(0);
            expect(db.users.size).toBe(0);
        });

        it('returns 409 when onboarding uses a duplicate email', async () => {
            // setup
            await db.addUser({ email: 'admin@example.com', role: 'hr' });

            // action
            const response = await request(app)
                .post('/api/auth/onboard-company')
                .send({
                    companyName: 'Duplicate Co',
                    adminName: 'Ada Admin',
                    adminEmail: 'ADMIN@example.com',
                    adminPassword: 'StrongPass123',
                });

            // assertion
            expect(response.status).toBe(409);
            expect(response.body).toEqual({ success: false, message: 'Email already registered.' });
            expect(db.users.size).toBe(1);
        });
    });

    describe('forgot/reset password', () => {
        it('generates a token, accepts it, updates the password, and invalidates the token', async () => {
            // setup
            const user = await db.addUser({ email: 'reset@example.com', password: 'OldPass123' });
            db.addRefreshSession(user.user_id, 'reset-session-1');
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

            // action
            const forgotResponse = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'reset@example.com' });
            const loggedResetUrl = String(consoleSpy.mock.calls.flat().find(value => String(value).includes('/change-password?token=')));
            const resetToken = loggedResetUrl.match(/token=([a-f0-9]+)/)?.[1];
            const resetResponse = await request(app)
                .post('/api/auth/reset-password')
                .send({ token: resetToken, newPassword: 'NewPass123' });

            // assertion
            expect(forgotResponse.status).toBe(200);
            expect(forgotResponse.body.success).toBe(true);
            expect(resetToken).toBeTruthy();
            expect(user.reset_token).toBe(hashToken(resetToken!));
            expect(resetResponse.status).toBe(200);
            await expect(bcrypt.compare('NewPass123', user.password_hash)).resolves.toBe(true);
            expect(user.reset_token_used).toBe(true);
            expect(db.sessionsForUser(user.user_id).every(session => session.revoked)).toBe(true);
            expect(user.token_version).toBe(1);
        });

        it('rejects an expired reset token', async () => {
            // setup
            const user = await db.addUser({
                email: 'expired@example.com',
                password: 'OldPass123',
                reset_token: hashToken('expired-token'),
                reset_token_expires: new Date(Date.now() - 1000),
                reset_token_used: false,
            });
            const originalHash = user.password_hash;

            // action
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({ token: 'expired-token', newPassword: 'NewPass123' });

            // assertion
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('expired');
            expect(user.password_hash).toBe(originalHash);
            expect(user.reset_token_used).toBe(false);
        });

        it('rejects an already-used reset token', async () => {
            // setup
            const user = await db.addUser({
                email: 'used@example.com',
                reset_token: hashToken('used-token'),
                reset_token_expires: new Date(Date.now() + 60 * 60 * 1000),
                reset_token_used: true,
            });
            const originalHash = user.password_hash;

            // action
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({ token: 'used-token', newPassword: 'NewPass123' });

            // assertion
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('already been used');
            expect(user.password_hash).toBe(originalHash);
        });

        it('rejects an invalid random reset token', async () => {
            // setup
            await db.addUser({ email: 'random@example.com' });

            // action
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({ token: 'not-a-real-token', newPassword: 'NewPass123' });

            // assertion
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Invalid or expired reset link');
        });
    });

    describe('refresh token', () => {
        it('returns new access and refresh tokens for a valid refresh token', async () => {
            // setup
            const user = await db.addUser({ email: 'refresh@example.com', password: 'Password123!' });
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({ email: user.email, password: 'Password123!' });
            const oldRefreshToken = loginResponse.body.session.refresh_token;

            // action
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refresh_token: oldRefreshToken });

            // assertion
            expect(response.status).toBe(200);
            expect(response.body.session.access_token).toEqual(expect.any(String));
            expect(response.body.session.refresh_token).toEqual(expect.any(String));
            expect(response.body.session.refresh_token).not.toBe(oldRefreshToken);
            expect(db.sessionsForUser(user.user_id)).toHaveLength(2);
        });

        it('invalidates the old refresh token after rotation', async () => {
            // setup
            const user = await db.addUser({ email: 'rotate@example.com', password: 'Password123!' });
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({ email: user.email, password: 'Password123!' });
            const oldRefreshToken = loginResponse.body.session.refresh_token;
            const oldSession = db.sessionsForUser(user.user_id)[0];

            // action
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refresh_token: oldRefreshToken });

            // assertion
            expect(response.status).toBe(200);
            expect(oldSession.revoked).toBe(true);
            expect(oldSession.replaced_by).toEqual(expect.any(String));
        });

        it('treats old refresh token reuse after rotation as replay and revokes all sessions', async () => {
            // setup
            const user = await db.addUser({ email: 'replay@example.com', password: 'Password123!' });
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({ email: user.email, password: 'Password123!' });
            const oldRefreshToken = loginResponse.body.session.refresh_token;
            await request(app)
                .post('/api/auth/refresh')
                .send({ refresh_token: oldRefreshToken });

            // action
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refresh_token: oldRefreshToken });

            // assertion
            expect(response.status).toBe(401);
            expect(response.body.message).toContain('Security violation');
            expect(db.sessionsForUser(user.user_id).every(session => session.revoked)).toBe(true);
            expect(user.token_version).toBe(1);
        });

        it('rejects an expired refresh token', async () => {
            // setup
            const user = await db.addUser({ email: 'expired-refresh@example.com' });
            const session = db.addRefreshSession(user.user_id, 'expired-refresh-token', {
                expires_at: new Date(Date.now() - 1000),
            });

            // action
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refresh_token: 'expired-refresh-token' });

            // assertion
            expect(response.status).toBe(401);
            expect(response.body.message).toContain('expired');
            expect(session.revoked).toBe(true);
        });

        it('rejects a revoked refresh token', async () => {
            // setup
            const user = await db.addUser({ email: 'revoked-refresh@example.com' });
            db.addRefreshSession(user.user_id, 'revoked-refresh-token', { revoked: true });

            // action
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refresh_token: 'revoked-refresh-token' });

            // assertion
            expect(response.status).toBe(401);
            expect(response.body.message).toContain('Security violation');
            expect(user.token_version).toBe(1);
        });
    });

    describe('logout', () => {
        it('invalidates the refresh token server-side', async () => {
            // setup
            const user = await db.addUser({ email: 'logout@example.com', password: 'Password123!' });
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({ email: user.email, password: 'Password123!' });
            const refreshToken = loginResponse.body.session.refresh_token;

            // action
            const response = await request(app)
                .post('/api/auth/logout')
                .send({ refresh_token: refreshToken });

            // assertion
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Session revoked.');
            expect(db.sessionsForUser(user.user_id)[0].revoked).toBe(true);
        });

        it('rejects a refresh token after logout', async () => {
            // setup
            const user = await db.addUser({ email: 'logout-reuse@example.com', password: 'Password123!' });
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({ email: user.email, password: 'Password123!' });
            const refreshToken = loginResponse.body.session.refresh_token;
            await request(app).post('/api/auth/logout').send({ refresh_token: refreshToken });

            // action
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refresh_token: refreshToken });

            // assertion
            expect(response.status).toBe(401);
            expect(response.body.message).toContain('Security violation');
        });
    });

    describe('user lifecycle', () => {
        it('blocks suspended users from protected endpoints', async () => {
            // setup
            const user = await db.addUser({ email: 'suspended@example.com', status: 'suspended' });

            // action
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken(user)}`);

            // assertion
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Account suspended.');
        });

        it('blocks deactivated users from protected endpoints', async () => {
            // setup
            const user = await db.addUser({ email: 'deactivated@example.com', status: 'deactivated' });

            // action
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken(user)}`);

            // assertion
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Account deactivated.');
        });

        it('reactivates a suspended user and allows access with a fresh token', async () => {
            // setup
            const admin = await db.addUser({ user_id: 'admin-1', email: 'hr@example.com', role: 'hr' });
            const target = await db.addUser({ user_id: 'user-1', email: 'reactivate@example.com', status: 'suspended' });

            // action
            const reactivateResponse = await request(app)
                .post(`/api/admin/users/${target.user_id}/reactivate`)
                .set('Authorization', `Bearer ${accessToken(admin)}`);
            const meResponse = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken(target)}`);

            // assertion
            expect(reactivateResponse.status).toBe(200);
            expect(reactivateResponse.body.status).toBe('active');
            expect(target.status).toBe('active');
            expect(target.token_version).toBe(1);
            expect(meResponse.status).toBe(200);
            expect(meResponse.body.user.email).toBe(target.email);
        });

        it('revokes existing sessions during lifecycle changes', async () => {
            // setup
            const admin = await db.addUser({ user_id: 'admin-1', email: 'hr@example.com', role: 'hr' });
            const target = await db.addUser({ user_id: 'user-1', email: 'lifecycle@example.com' });
            db.addRefreshSession(target.user_id, 'lifecycle-token-1');
            db.addRefreshSession(target.user_id, 'lifecycle-token-2');

            // action
            const response = await request(app)
                .post(`/api/admin/users/${target.user_id}/suspend`)
                .set('Authorization', `Bearer ${accessToken(admin)}`);

            // assertion
            expect(response.status).toBe(200);
            expect(response.body.revokedSessions).toBe(2);
            expect(db.sessionsForUser(target.user_id).every(session => session.revoked)).toBe(true);
            expect(target.token_version).toBe(1);
        });
    });

    describe('session revocation', () => {
        it('revokes all sessions after a password change', async () => {
            // setup
            const user = await db.addUser({ email: 'password-change@example.com', password: 'OldPass123' });
            db.addRefreshSession(user.user_id, 'password-token-1');
            db.addRefreshSession(user.user_id, 'password-token-2');

            // action
            const response = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken(user)}`)
                .send({ currentPassword: 'OldPass123', newPassword: 'NewPass123' });

            // assertion
            expect(response.status).toBe(200);
            expect(response.body.currentSessionRevoked).toBe(true);
            expect(response.body.revokedSessions).toBe(2);
            expect(db.sessionsForUser(user.user_id).every(session => session.revoked)).toBe(true);
            expect(user.token_version).toBe(1);
            await expect(bcrypt.compare('NewPass123', user.password_hash)).resolves.toBe(true);
        });

        it('revokes all sessions after a role change', async () => {
            // setup
            const admin = await db.addUser({ user_id: 'admin-1', email: 'hr@example.com', role: 'hr' });
            const target = await db.addUser({ user_id: 'user-1', email: 'role-change@example.com', role: 'employee' });
            db.addRefreshSession(target.user_id, 'role-token-1');
            db.addRefreshSession(target.user_id, 'role-token-2');

            // action
            const response = await request(app)
                .post(`/api/admin/users/${target.user_id}/role`)
                .set('Authorization', `Bearer ${accessToken(admin)}`)
                .send({ role: 'manager' });

            // assertion
            expect(response.status).toBe(200);
            expect(response.body.role).toBe('manager');
            expect(response.body.revokedSessions).toBe(2);
            expect(target.role).toBe('manager');
            expect(target.token_version).toBe(1);
            expect(db.sessionsForUser(target.user_id).every(session => session.revoked)).toBe(true);
        });

        it('rejects an access token issued before a tokenVersion bump', async () => {
            // setup
            const user = await db.addUser({ email: 'old-access@example.com', token_version: 1 });
            const staleToken = accessToken(user, 0);

            // action
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${staleToken}`);

            // assertion
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Session expired. Please log in again.');
        });
    });
});
