/**
 * Authentication Routes — Neon DB + Custom JWT
 *
 * POST /api/auth/login              — Login → returns JWT + user profile
 * POST /api/auth/onboard-company    — Create company + HR admin account
 * POST /api/auth/invite-user        — HR invites employee/manager
 * POST /api/auth/change-password    — Change password (authenticated)
 * POST /api/auth/forgot-password    — Send reset email (OTP/link via Gmail)
 * POST /api/auth/refresh            — Refresh JWT using refresh token
 * GET  /api/auth/me                 — Get current user profile from token
 */
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { requireAuth, requireRole, AuthenticatedRequest, clearProfileCache } from '../middleware/auth.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';
import { logAction, AuditActions } from '../services/audit.service.js';
import { validate } from '../utils/validation.js';

const router = Router();
const SALT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = '8h';
const REFRESH_TOKEN_TTL = '30d';

// ── Schemas ──────────────────────────────────────────────────
const loginSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().min(1).max(256),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(256),
});

const inviteSchema = z.object({
    email: z.string().trim().email(),
    role: z.enum(['manager', 'employee']),
    tempPassword: z.string().min(8),
});

// ── Helpers ───────────────────────────────────────────────────
function signAccessToken(userId: string, email: string): string {
    return jwt.sign({ sub: userId, email }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function signRefreshToken(userId: string): string {
    return jwt.sign({ sub: userId, type: 'refresh' }, env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
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
            `SELECT u.user_id, u.password_hash, u.company_id, u.role,
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

        const accessToken = signAccessToken(user.user_id, normalizedEmail);
        const refreshToken = signRefreshToken(user.user_id);

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
                expires_at: Math.floor(Date.now() / 1000) + 8 * 3600,
            },
            user: {
                id: user.user_id,
                email: normalizedEmail,
                role: user.role,
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
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.status(400).json({ success: false, message: 'Refresh token required.' });
        }

        let payload: any;
        try {
            payload = jwt.verify(refresh_token, env.JWT_SECRET);
        } catch {
            return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
        }

        if (payload.type !== 'refresh') {
            return res.status(401).json({ success: false, message: 'Invalid token type.' });
        }

        const result = await pool.query(
            'SELECT email FROM public.users WHERE user_id = $1 LIMIT 1',
            [payload.sub]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        const newAccessToken = signAccessToken(payload.sub, result.rows[0].email);

        return res.json({
            success: true,
            session: {
                access_token: newAccessToken,
                expires_at: Math.floor(Date.now() / 1000) + 8 * 3600,
            },
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: 'Token refresh failed.' });
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

/**
 * POST /api/auth/onboard-company
 * Creates a new company + HR admin user.
 */
router.post('/onboard-company', authLimiter, async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const { companyName, adminName, adminEmail, adminPassword } = req.body;

        if (!companyName || !adminEmail || !adminPassword) {
            return res.status(400).json({
                success: false,
                message: 'companyName, adminEmail, and adminPassword are required.',
            });
        }

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
            metadata: { role: 'hr' },
        }).catch(() => {});

        return res.status(201).json({
            success: true,
            message: 'Company and HR admin account created successfully.',
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

    try {
        const result = await pool.query(
            'SELECT password_hash FROM public.users WHERE user_id = $1',
            [user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!valid) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        }

        const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await pool.query(
            'UPDATE public.users SET password_hash = $1 WHERE user_id = $2',
            [newHash, user.userId]
        );

        clearProfileCache(user.userId);

        logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.PASSWORD_CHANGED,
            companyId: user.companyId,
        }).catch(() => {});

        return res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err: any) {
        console.error('Change password error:', err.message);
        return res.status(500).json({ success: false, message: 'Password change failed.' });
    }
});

/**
 * POST /api/auth/forgot-password
 * Sends a temp password reset token to the user's email via Gmail.
 * (Simple OTP approach — no Supabase magic links needed)
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
            return res.json(SAFE_RESPONSE);
        }

        // Generate a short-lived reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

        await pool.query(
            `UPDATE public.users SET reset_token = $1, reset_token_expires = $2 WHERE user_id = $3`,
            [resetToken, expiresAt, result.rows[0].user_id]
        );

        // In dev — just log the token. In prod — send email via Gmail.
        const resetUrl = `${env.FRONTEND_URL || 'http://localhost:5173'}/change-password?token=${resetToken}`;

        if (env.IS_DEV) {
            console.log(`\n🔑 Password reset token for ${normalizedEmail}:\n   ${resetUrl}\n`);
        } else {
            // Email sending — uses Gmail service from email.service.ts
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
