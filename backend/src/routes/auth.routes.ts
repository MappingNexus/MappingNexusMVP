/**
 * Authentication Routes — Neon DB + Custom JWT
 *
 * POST /api/auth/login              — Login → returns JWT + user profile
 * POST /api/auth/onboard-company    — Create company + HR admin account
 * POST /api/auth/invite-user        — HR invites employee/manager
 * POST /api/auth/change-password    — Change password (authenticated)
 * POST /api/auth/forgot-password    — Send reset email with secure token link
 * POST /api/auth/reset-password     — Validate token + set new password
 * POST /api/auth/refresh            — Refresh JWT using refresh token
 * GET  /api/auth/me                 — Get current user profile from token
 */
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
import { requireAuth, requireRole, AuthenticatedRequest, clearProfileCache } from '../middleware/auth.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';
import { logAction, AuditActions } from '../services/audit.service.js';
import { revokeAllSessionsForUser } from '../services/session.service.js';
import { validate } from '../utils/validation.js';

const router = Router();
const SALT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// ── Schemas ──────────────────────────────────────────────────
const loginSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().min(1).max(256),
});

const googleAuthSchema = z.object({
    idToken: z.string().min(1),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(256),
});

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required.'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters.')
        .max(256, 'Password must be at most 256 characters.'),
});

const inviteSchema = z.object({
    email: z.string().trim().email(),
    role: z.enum(['manager', 'employee']),
    tempPassword: z.string().min(8),
});

// ── Helpers ───────────────────────────────────────────────────
const RESET_TOKEN_TTL_MS_FORGOT = 60 * 60 * 1000; // 1 hour

function signAccessToken(userId: string, email: string, tokenVersion: number): string {
    return jwt.sign({ sub: userId, email, tokenVersion }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function accountStatusMessage(status: string): string {
    switch (status) {
        case 'suspended':
            return 'Account suspended.';
        case 'deactivated':
            return 'Account deactivated.';
        case 'offboarded':
            return 'Account offboarded.';
        default:
            return 'Account inactive.';
    }
}

/**
 * Hash a token with SHA-256 for secure DB storage.
 * Used for both reset tokens and refresh tokens — we never store raw values.
 */
function hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generate a cryptographically secure refresh token, store its hash in DB,
 * and return the raw token to send to the client.
 */
async function createRefreshSession(
    userId: string,
    req: Request
): Promise<{ rawToken: string; sessionId: string }> {
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    const userAgent = req.headers['user-agent'] || null;
    const ip = req.ip || req.socket.remoteAddress || null;

    const result = await pool.query(
        `INSERT INTO public.refresh_token_sessions
             (user_id, token_hash, expires_at, user_agent, ip_address)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING session_id`,
        [userId, tokenHash, expiresAt, userAgent, ip]
    );

    return { rawToken, sessionId: result.rows[0].session_id };
}

// ── Routes ────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 */
router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        // Fetch user with company info
        const result = await pool.query(
            `SELECT u.user_id, u.password_hash, u.company_id, u.role, u.status, u.token_version,
                    c.company_name
             FROM public.users u
             JOIN public.companies c ON c.company_id = u.company_id
             WHERE u.email = $1
             LIMIT 1`,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        if (user.status !== 'active') {
            return res.status(401).json({ success: false, message: accountStatusMessage(user.status) });
        }

        const accessToken = signAccessToken(user.user_id, normalizedEmail, user.token_version);
        const { rawToken: refreshToken } = await createRefreshSession(user.user_id, req);

        // Get employee_id if role is employee
        let employeeId: string | null = null;
        if (user.role === 'employee') {
            const empResult = await pool.query(
                'SELECT employee_id FROM public.employees WHERE user_id = $1 AND is_archived = false LIMIT 1',
                [user.user_id]
            );
            employeeId = empResult.rows[0]?.employee_id || null;
        }

        logAction({
            actorId: user.user_id,
            actorRole: user.role,
            action: AuditActions.USER_LOGIN,
            companyId: user.company_id,
            metadata: { method: 'password' },
        }).catch(() => {});

        return res.json({
            success: true,
            session: {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: Math.floor(Date.now() / 1000) + 15 * 60,
            },
            user: {
                id: user.user_id,
                email: normalizedEmail,
                role: user.role,
                status: user.status,
                companyId: user.company_id,
                companyName: user.company_name,
                employeeId,
            },
        });
    } catch (err: any) {
        console.error('Login error:', err.message);
        return res.status(500).json({ success: false, message: 'Login service unavailable.' });
    }
});

/**
 * POST /api/auth/google
 */
router.post('/google', authLimiter, validate(googleAuthSchema), async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body;
        
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(401).json({ success: false, message: 'Invalid Google token.' });
        }
        
        const normalizedEmail = payload.email.toLowerCase().trim();

        // Fetch user with company info
        const result = await pool.query(
            `SELECT u.user_id, u.company_id, u.role, u.status, u.token_version, c.company_name
             FROM public.users u
             JOIN public.companies c ON c.company_id = u.company_id
             WHERE u.email = $1
             LIMIT 1`,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'No account found for this Google email. Contact your HR Admin.' });
        }

        const user = result.rows[0];

        if (user.status !== 'active') {
            return res.status(401).json({ success: false, message: accountStatusMessage(user.status) });
        }

        const accessToken = signAccessToken(user.user_id, normalizedEmail, user.token_version);
        const { rawToken: refreshToken } = await createRefreshSession(user.user_id, req);

        let employeeId: string | null = null;
        if (user.role === 'employee') {
            const empResult = await pool.query(
                'SELECT employee_id FROM public.employees WHERE user_id = $1 AND is_archived = false LIMIT 1',
                [user.user_id]
            );
            employeeId = empResult.rows[0]?.employee_id || null;
        }

        logAction({
            actorId: user.user_id,
            actorRole: user.role,
            action: AuditActions.USER_LOGIN,
            companyId: user.company_id,
            metadata: { method: 'google_oauth' },
        }).catch(() => {});

        return res.json({
            success: true,
            session: {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: Math.floor(Date.now() / 1000) + 15 * 60,
            },
            user: {
                id: user.user_id,
                email: normalizedEmail,
                role: user.role,
                status: user.status,
                companyId: user.company_id,
                companyName: user.company_name,
                employeeId,
            },
        });
    } catch (err: any) {
        console.error('Google Auth error:', err.message);
        return res.status(401).json({ success: false, message: 'Google authentication failed.' });
    }
});

/**
 * POST /api/auth/refresh
 *
 * Secure refresh token rotation:
 *   1. Hash the incoming raw token, look it up in refresh_token_sessions
 *   2. If found AND already revoked → replay attack detected → revoke ALL sessions for that user
 *   3. If found AND valid → issue new access + refresh tokens, revoke old session
 *   4. Return new tokens to client
 */
router.post('/refresh', async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.status(400).json({ success: false, message: 'Refresh token required.' });
        }

        const tokenHash = hashToken(refresh_token);

        // Look up the session by token hash
        const sessionResult = await client.query(
            `SELECT s.session_id, s.user_id, s.revoked, s.expires_at, s.replaced_by,
                    u.email, u.role, u.company_id, u.status, u.token_version
             FROM public.refresh_token_sessions s
             JOIN public.users u ON u.user_id = s.user_id
             WHERE s.token_hash = $1
             LIMIT 1`,
            [tokenHash]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
        }

        const session = sessionResult.rows[0];

        if (session.status !== 'active') {
            return res.status(401).json({ success: false, message: accountStatusMessage(session.status) });
        }

        // ── REPLAY ATTACK DETECTION ─────────────────────────────
        // If this token was already revoked, someone is reusing a stolen token.
        // Revoke ALL sessions for this user as a safety measure.
        if (session.revoked) {
            await revokeAllSessionsForUser(session.user_id, client);

            console.error(
                `🚨 REFRESH TOKEN REPLAY DETECTED: user=${session.user_id} session=${session.session_id}. All sessions revoked.`
            );

            logAction({
                actorId: session.user_id,
                actorRole: session.role,
                action: 'refresh_token_replay_detected',
                companyId: session.company_id,
                metadata: { severity: 'CRITICAL', sessionId: session.session_id },
            }).catch(() => {});

            return res.status(401).json({
                success: false,
                message: 'Security violation detected. All sessions have been revoked. Please log in again.',
            });
        }

        // ── EXPIRY CHECK ────────────────────────────────────────
        if (new Date(session.expires_at) < new Date()) {
            // Mark as revoked for cleanliness
            await client.query(
                'UPDATE public.refresh_token_sessions SET revoked = true WHERE session_id = $1',
                [session.session_id]
            );
            return res.status(401).json({ success: false, message: 'Refresh token expired. Please log in again.' });
        }

        // ── ROTATE: revoke old token + issue new pair ────────────
        await client.query('BEGIN');

        // Create the new refresh session first
        const { rawToken: newRefreshToken, sessionId: newSessionId } =
            await (async () => {
                const raw = crypto.randomBytes(48).toString('hex');
                const hash = hashToken(raw);
                const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
                const userAgent = req.headers['user-agent'] || null;
                const ip = req.ip || req.socket.remoteAddress || null;

                const r = await client.query(
                    `INSERT INTO public.refresh_token_sessions
                         (user_id, token_hash, expires_at, user_agent, ip_address)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING session_id`,
                    [session.user_id, hash, expiresAt, userAgent, ip]
                );
                return { rawToken: raw, sessionId: r.rows[0].session_id };
            })();

        // Revoke the old session and link it to the new one
        await client.query(
            `UPDATE public.refresh_token_sessions
             SET revoked = true, replaced_by = $1
             WHERE session_id = $2`,
            [newSessionId, session.session_id]
        );

        await client.query('COMMIT');

        // Issue new access token
        const newAccessToken = signAccessToken(session.user_id, session.email, session.token_version);

        return res.json({
            success: true,
            session: {
                access_token: newAccessToken,
                refresh_token: newRefreshToken,
                expires_at: Math.floor(Date.now() / 1000) + 15 * 60,
            },
        });
    } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Token refresh error:', err.message);
        return res.status(500).json({ success: false, message: 'Token refresh failed.' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/auth/logout
 * Revokes the refresh token session on the server side.
 */
router.post('/logout', async (req: Request, res: Response) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.json({ success: true, message: 'Logged out.' });
        }

        const tokenHash = hashToken(refresh_token);

        await pool.query(
            `UPDATE public.refresh_token_sessions
             SET revoked = true
             WHERE token_hash = $1 AND revoked = false`,
            [tokenHash]
        );

        return res.json({ success: true, message: 'Session revoked.' });
    } catch (err: any) {
        console.error('Logout error:', err.message);
        return res.json({ success: true, message: 'Logged out.' });
    }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;

    try {
        const result = await pool.query(
            `SELECT c.company_name FROM public.companies c WHERE c.company_id = $1`,
            [user.companyId]
        );

        let employeeId: string | null = null;
        if (user.role === 'employee') {
            const empResult = await pool.query(
                'SELECT employee_id FROM public.employees WHERE user_id = $1 AND is_archived = false LIMIT 1',
                [user.userId]
            );
            employeeId = empResult.rows[0]?.employee_id || null;
        }

        return res.json({
            success: true,
            user: {
                id: user.userId,
                email: user.email,
                role: user.role,
                status: user.status,
                companyId: user.companyId,
                companyName: result.rows[0]?.company_name || 'Company',
                employeeId,
            },
        });
    } catch (err: any) {
        console.error('Get me error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
    }
});

// ── Onboard schema ──────────────────────────────────────────
const onboardSchema = z.object({
    companyName: z.string().trim().min(1, 'Company name is required.').max(200),
    adminName: z.string().trim().min(1, 'Admin name is required.').max(200),
    adminEmail: z.string().trim().email('Invalid email format.'),
    adminPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters.')
        .max(256, 'Password must be at most 256 characters.')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
        .regex(/[0-9]/, 'Password must contain at least one number.'),
});

/**
 * POST /api/auth/onboard-company
 * Creates a new company + HR admin user.
 */
router.post('/onboard-company', authLimiter, validate(onboardSchema), async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const { companyName, adminName, adminEmail, adminPassword } = req.body;

        const normalizedEmail = adminEmail.toLowerCase().trim();

        // Check email not already used
        const existing = await client.query(
            'SELECT user_id FROM public.users WHERE email = $1',
            [normalizedEmail]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Email already registered.' });
        }

        await client.query('BEGIN');

        // Create company
        const compResult = await client.query(
            `INSERT INTO public.companies (company_name) VALUES ($1) RETURNING company_id, company_name`,
            [companyName.trim()]
        );
        const company = compResult.rows[0];

        // Hash password + create HR user
        const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
        const userId = crypto.randomUUID();

        await client.query(
            `INSERT INTO public.users (user_id, email, password_hash, company_id, role)
             VALUES ($1, $2, $3, $4, 'hr')`,
            [userId, normalizedEmail, passwordHash, company.company_id]
        );

        await client.query('COMMIT');

        logAction({
            actorId: userId,
            actorRole: 'hr',
            action: AuditActions.USER_CREATED,
            companyId: company.company_id,
            metadata: { role: 'hr', adminName: adminName.trim() },
        }).catch(() => {});

        return res.status(201).json({
            success: true,
            message: `Workspace "${company.company_name}" created. Sign in with ${normalizedEmail} to get started.`,
            company: {
                companyId: company.company_id,
                companyName: company.company_name,
            },
        });
    } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Company onboarding error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to onboard company.' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/auth/invite-user
 * HR invites a manager or employee with a temp password.
 */
router.post('/invite-user', authLimiter, requireAuth, requireRole('hr'), validate(inviteSchema), async (req: Request, res: Response) => {
    const hrUser = (req as AuthenticatedRequest).user;
    const { email, role, tempPassword } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const client = await pool.connect();
    try {
        const existing = await client.query(
            'SELECT user_id FROM public.users WHERE email = $1',
            [normalizedEmail]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Email already registered.' });
        }

        const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);
        const userId = crypto.randomUUID();

        await client.query(
            `INSERT INTO public.users (user_id, email, password_hash, company_id, role)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, normalizedEmail, passwordHash, hrUser.companyId, role]
        );

        logAction({
            actorId: hrUser.userId,
            actorRole: hrUser.role,
            action: AuditActions.USER_CREATED,
            targetId: userId,
            companyId: hrUser.companyId,
            metadata: { role },
        }).catch(() => {});

        return res.status(201).json({
            success: true,
            message: `${role} account created. Share the temp password with them and ask them to change it on first login.`,
            userId,
        });
    } catch (err: any) {
        console.error('Invite user error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to create user.' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', authLimiter, requireAuth, validate(changePasswordSchema), async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { currentPassword, newPassword } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(
            'SELECT password_hash FROM public.users WHERE user_id = $1 FOR UPDATE',
            [user.userId]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!valid) {
            await client.query('ROLLBACK');
            return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        }

        const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await client.query(
            `UPDATE public.users
             SET password_hash = $1
             WHERE user_id = $2`,
            [newHash, user.userId]
        );

        const revokedSessions = await revokeAllSessionsForUser(user.userId, client);

        await client.query('COMMIT');
        clearProfileCache(user.userId);

        logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.PASSWORD_CHANGED,
            companyId: user.companyId,
            metadata: { revokedSessions, currentSessionRevoked: true },
        }).catch(() => {});

        return res.json({
            success: true,
            message: 'Password updated successfully. Please log in again.',
            revokedSessions,
            currentSessionRevoked: true,
        });
    } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Change password error:', err.message);
        return res.status(500).json({ success: false, message: 'Password change failed.' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/auth/forgot-password
 * Generates a secure, time-limited, single-use reset token.
 * Stores only the SHA-256 hash of the token in the DB.
 * Sends the raw token to the user's email as a reset link.
 */
router.post('/forgot-password', passwordResetLimiter, async (req: Request, res: Response) => {
    // Always return success to avoid user enumeration
    const SAFE_RESPONSE = { success: true, message: 'If an account exists, a reset link has been sent.' };

    try {
        const { email } = req.body;
        if (!email) return res.json(SAFE_RESPONSE);

        const normalizedEmail = email.toLowerCase().trim();
        const result = await pool.query(
            'SELECT user_id FROM public.users WHERE email = $1',
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            // No user found — return safe response (prevent enumeration)
            return res.json(SAFE_RESPONSE);
        }

        // Generate a cryptographically secure reset token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS_FORGOT); // 1 hour

        // Store only the HASH + mark as unused
        await pool.query(
            `UPDATE public.users
             SET reset_token = $1, reset_token_expires = $2, reset_token_used = false
             WHERE user_id = $3`,
            [tokenHash, expiresAt, result.rows[0].user_id]
        );

        // Build reset URL with the RAW token (user-facing)
        const resetUrl = `${env.FRONTEND_URL || 'http://localhost:5173'}/change-password?token=${rawToken}`;

        if (env.IS_DEV) {
            console.log(`\n🔑 Password reset token for ${normalizedEmail}:\n   ${resetUrl}\n`);
        } else {
            const { sendPasswordResetEmail } = await import('../services/email.service.js');
            await sendPasswordResetEmail(normalizedEmail, resetUrl);
        }

        return res.json(SAFE_RESPONSE);
    } catch (err: any) {
        console.error('Forgot password error:', err.message);
        return res.json(SAFE_RESPONSE);
    }
});

/**
 * POST /api/auth/reset-password
 * Validates the reset token (hash comparison), checks expiry and reuse,
 * then updates the password and invalidates the token.
 */
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        const { token, newPassword } = req.body;

        // Hash the incoming raw token to compare against stored hash
        const tokenHash = hashToken(token);

        await client.query('BEGIN');

        // Look up user by hashed token
        const result = await client.query(
            `SELECT user_id, company_id, role, reset_token_expires, reset_token_used
             FROM public.users
             WHERE reset_token = $1
             LIMIT 1
             FOR UPDATE`,
            [tokenHash]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset link. Please request a new one.',
            });
        }

        const user = result.rows[0];

        // Check if token was already used (single-use enforcement)
        if (user.reset_token_used) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'This reset link has already been used. Please request a new one.',
            });
        }

        // Check if token has expired
        if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'This reset link has expired. Please request a new one.',
            });
        }

        // All checks passed — update the password and invalidate all existing tokens
        const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await client.query(
            `UPDATE public.users
             SET password_hash = $1,
                 reset_token_used = true,
                 token_version = token_version + 1
             WHERE user_id = $2`,
            [newHash, user.user_id]
        );

        const revokedSessions = await revokeAllSessionsForUser(user.user_id, client);

        await client.query('COMMIT');
        clearProfileCache(user.user_id);

        logAction({
            actorId: user.user_id,
            actorRole: user.role,
            action: AuditActions.PASSWORD_CHANGED,
            companyId: user.company_id,
            metadata: { method: 'reset_token', revokedSessions, currentSessionRevoked: true },
        }).catch(() => {});

        return res.json({ success: true, message: 'Password has been reset successfully. You can now sign in.' });
    } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Reset password error:', err.message);
        return res.status(500).json({ success: false, message: 'Password reset failed. Please try again.' });
    } finally {
        client.release();
    }
});

/**
 * GET /api/auth/invite-status
 * Returns email configuration status (for HR onboarding UI).
 */
router.get('/invite-status', requireAuth, requireRole('hr'), (_req: Request, res: Response) => {
    const configured = !!(env.EMAIL_USER && env.EMAIL_PASSWORD);
    return res.json({
        success: true,
        configured,
        message: configured ? 'Email delivery is configured.' : 'Email not configured — temp passwords are used.',
    });
});

export default router;
