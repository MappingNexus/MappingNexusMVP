/**
 * Authentication & Authorization Middleware
 *
 * Uses custom JWT (jsonwebtoken) + Neon DB lookup.
 * Replaces Supabase Auth verification.
 *
 * Flow: Bearer token → jwt.verify(JWT_SECRET) → lookup users table
 *       → attach { userId, email, companyId, role } to req
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { logAction } from '../services/audit.service.js';
import { supabaseAdmin } from '../config/supabase.js';


export interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
        companyId: string;
        role: 'hr' | 'manager' | 'employee';
        status: 'active' | 'suspended' | 'deactivated' | 'offboarded';
    };
}

// In-memory profile cache (30s TTL) — avoids DB hit on every request
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

/** Compatibility hook for callers that previously cleared cached auth profiles. */
export function clearProfileCache(userId: string) {
    void userId;
}

/**
 * requireAuth — Verifies JWT and attaches user context to req.
 */
export const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            message: 'Authentication required. Provide Bearer token.',
        });
        return;
    }

    const token = authHeader.split(' ')[1];

    let payload: any;
    try {
        payload = jwt.verify(token, env.JWT_SECRET);
    } catch (err: any) {
        res.status(401).json({
            success: false,
            message: err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.',
        });
        return;
    }

    const userId: string = payload.sub || payload.userId;
    if (!userId) {
        res.status(401).json({ success: false, message: 'Malformed token.' });
        return;
    }

    try {
        const result = await pool.query(
            'SELECT company_id, role, status FROM public.users WHERE user_id = $1 LIMIT 1',
            [userId]
        );

        if (result.rows.length === 0) {
            res.status(403).json({
                success: false,
                message: 'User profile not found. Contact your HR administrator.',
            });
            return;
        }

        const profile = result.rows[0];
        if (profile.status !== 'active') {
            res.status(401).json({
                success: false,
                message: accountStatusMessage(profile.status),
            });
            return;
        }

        const authReq = req as AuthenticatedRequest;
        authReq.user = {
            userId,
            email: payload.email || '',
            companyId: profile.company_id,
            role: profile.role,
            status: profile.status,
        };

        next();
    } catch (err: any) {
        console.error('Auth middleware DB error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Authentication service unavailable.',
        });
    }
};

/**
 * requireRole — Checks if authenticated user has one of the allowed roles.
 * Must be used AFTER requireAuth.
 */
export const requireRole = (...allowedRoles: Array<'hr' | 'manager' | 'employee'>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as AuthenticatedRequest).user;

        if (!user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }

        if (!allowedRoles.includes(user.role)) {
            logAction({
                actorId: user.userId,
                actorRole: user.role,
                action: 'unauthorized_access_attempt',
                targetId: undefined,
                companyId: user.companyId,
                metadata: {
                    attemptedEndpoint: req.originalUrl,
                    requiredRoles: allowedRoles,
                    method: req.method,
                },
            }).catch(() => {});

            res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
            });
            return;
        }

        next();
    };
};

/**
 * requireTenant — Validates that a resource's company_id matches the user's.
 */
export const requireTenant = (getCompanyIdFromReq: (req: Request) => string | undefined) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const user = (req as AuthenticatedRequest).user;
        const resourceCompanyId = getCompanyIdFromReq(req);

        if (!user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }

        if (resourceCompanyId && resourceCompanyId !== user.companyId) {
            await logAction({
                actorId: user.userId,
                actorRole: user.role,
                action: 'cross_tenant_access_blocked',
                targetId: undefined,
                companyId: user.companyId,
                metadata: {
                    attemptedCompanyId: resourceCompanyId,
                    endpoint: req.originalUrl,
                    method: req.method,
                    severity: 'CRITICAL',
                },
            });

            console.error(
                `🚨 CROSS-TENANT ACCESS BLOCKED: User ${user.userId} (company ${user.companyId}) ` +
                `attempted to access company ${resourceCompanyId} via ${req.method} ${req.originalUrl}`
            );

            res.status(403).json({ success: false, message: 'Access denied.' });
            return;
        }

        next();
    };
};

/**
 * getSupabaseClient — Returns the shim client for use in route files.
 * In Neon mode, all requests use the same pool (RLS enforced in middleware).
 */
export function getSupabaseClient(_req: Request): typeof supabaseAdmin {
    return supabaseAdmin;
}
