import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth, requireRole, AuthenticatedRequest, clearProfileCache } from '../middleware/auth.js';
import { logAction, AuditActions } from '../services/audit.service.js';
import { forceLogoutUserSessions, revokeAllSessionsForUser } from '../services/session.service.js';
import { validate } from '../utils/validation.js';

const router = Router();

type UserStatus = 'active' | 'suspended' | 'deactivated' | 'offboarded';
type UserRole = 'hr' | 'manager' | 'employee';

const changeRoleSchema = z.object({
    role: z.enum(['hr', 'manager', 'employee']),
});

const lifecycleActions: Record<string, { status: UserStatus; auditAction: string; message: string }> = {
    suspend: {
        status: 'suspended',
        auditAction: AuditActions.USER_SUSPENDED,
        message: 'User suspended.',
    },
    deactivate: {
        status: 'deactivated',
        auditAction: AuditActions.USER_DEACTIVATED,
        message: 'User deactivated.',
    },
    offboard: {
        status: 'offboarded',
        auditAction: AuditActions.USER_OFFBOARDED,
        message: 'User offboarded.',
    },
};

router.get('/users', requireAuth, requireRole('hr'), async (req: Request, res: Response) => {
    const admin = (req as AuthenticatedRequest).user;
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;

    try {
        const params: any[] = [admin.companyId];
        let roleClause = '';

        if (role) {
            if (!['hr', 'manager', 'employee'].includes(role)) {
                return res.status(400).json({ success: false, message: 'Invalid role filter.' });
            }
            params.push(role);
            roleClause = `AND role = $${params.length}`;
        }

        const result = await pool.query(
            `SELECT user_id, email, role, status, created_at
             FROM public.users
             WHERE company_id = $1
               ${roleClause}
             ORDER BY created_at DESC`,
            params
        );

        return res.json({
            success: true,
            users: result.rows.map(row => ({
                userId: row.user_id,
                email: row.email,
                role: row.role,
                status: row.status,
                createdAt: row.created_at,
            })),
        });
    } catch (err: any) {
        console.error('List admin users error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
    }
});

async function updateUserLifecycleStatus(req: Request, res: Response, action: keyof typeof lifecycleActions) {
    const admin = (req as AuthenticatedRequest).user;
    const targetUserId = req.params.id;
    const config = lifecycleActions[action];
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const targetResult = await client.query(
            `SELECT user_id, company_id, status
             FROM public.users
             WHERE user_id = $1
             FOR UPDATE`,
            [targetUserId]
        );

        if (targetResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const target = targetResult.rows[0];
        if (target.company_id !== admin.companyId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        await client.query(
            `UPDATE public.users
             SET status = $1
             WHERE user_id = $2`,
            [config.status, targetUserId]
        );

        const revokedSessions = await forceLogoutUserSessions(targetUserId, client);

        await client.query('COMMIT');
        clearProfileCache(targetUserId);

        logAction({
            actorId: admin.userId,
            actorRole: admin.role,
            action: config.auditAction,
            targetId: targetUserId,
            companyId: admin.companyId,
            metadata: {
                previousStatus: target.status,
                status: config.status,
                revokedSessions,
            },
        }).catch(() => {});

        return res.json({
            success: true,
            message: config.message,
            userId: targetUserId,
            status: config.status,
            revokedSessions,
        });
    } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(`User ${action} error:`, err.message);
        return res.status(500).json({ success: false, message: `Failed to ${action} user.` });
    } finally {
        client.release();
    }
}

router.post('/users/:id/suspend', requireAuth, requireRole('hr'), (req, res) =>
    updateUserLifecycleStatus(req, res, 'suspend')
);

router.post('/users/:id/deactivate', requireAuth, requireRole('hr'), (req, res) =>
    updateUserLifecycleStatus(req, res, 'deactivate')
);

router.post('/users/:id/offboard', requireAuth, requireRole('hr'), (req, res) =>
    updateUserLifecycleStatus(req, res, 'offboard')
);

router.post('/users/:id/role', requireAuth, requireRole('hr'), validate(changeRoleSchema), async (req: Request, res: Response) => {
    const admin = (req as AuthenticatedRequest).user;
    const targetUserId = req.params.id;
    const newRole = req.body.role as UserRole;
    const client = await pool.connect();

    try {
        if (targetUserId === admin.userId) {
            return res.status(400).json({ success: false, message: 'Admins cannot change their own role.' });
        }

        await client.query('BEGIN');

        const targetResult = await client.query(
            `SELECT user_id, company_id, role
             FROM public.users
             WHERE user_id = $1
             FOR UPDATE`,
            [targetUserId]
        );

        if (targetResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const target = targetResult.rows[0];
        if (target.company_id !== admin.companyId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        if (target.role === newRole) {
            await client.query('COMMIT');
            return res.json({
                success: true,
                message: 'User role unchanged.',
                userId: targetUserId,
                role: newRole,
                revokedSessions: 0,
            });
        }

        await client.query(
            `UPDATE public.users
             SET role = $1
             WHERE user_id = $2`,
            [newRole, targetUserId]
        );

        const revokedSessions = await revokeAllSessionsForUser(targetUserId, client);

        await client.query('COMMIT');
        clearProfileCache(targetUserId);

        logAction({
            actorId: admin.userId,
            actorRole: admin.role,
            action: AuditActions.USER_ROLE_CHANGED,
            targetId: targetUserId,
            companyId: admin.companyId,
            metadata: {
                previousRole: target.role,
                newRole,
                revokedSessions,
            },
        }).catch(() => {});

        return res.json({
            success: true,
            message: 'User role updated. All sessions for that user have been revoked.',
            userId: targetUserId,
            role: newRole,
            revokedSessions,
        });
    } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('User role change error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to change user role.' });
    } finally {
        client.release();
    }
});

router.post('/users/:id/reactivate', requireAuth, requireRole('hr'), async (req: Request, res: Response) => {
    const admin = (req as AuthenticatedRequest).user;
    const targetUserId = req.params.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const targetResult = await client.query(
            `SELECT user_id, company_id, status
             FROM public.users
             WHERE user_id = $1
             FOR UPDATE`,
            [targetUserId]
        );

        if (targetResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const target = targetResult.rows[0];
        if (target.company_id !== admin.companyId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        if (target.status !== 'suspended') {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                message: 'Only suspended users can be reactivated.',
                status: target.status,
            });
        }

        await client.query(
            `UPDATE public.users
             SET status = 'active'
             WHERE user_id = $1`,
            [targetUserId]
        );

        const revokedSessions = await forceLogoutUserSessions(targetUserId, client);

        await client.query('COMMIT');
        clearProfileCache(targetUserId);

        logAction({
            actorId: admin.userId,
            actorRole: admin.role,
            action: AuditActions.USER_REACTIVATED,
            targetId: targetUserId,
            companyId: admin.companyId,
            metadata: {
                previousStatus: target.status,
                status: 'active',
                revokedSessions,
            },
        }).catch(() => {});

        return res.json({
            success: true,
            message: 'User reactivated.',
            userId: targetUserId,
            status: 'active',
            revokedSessions,
        });
    } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('User reactivate error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to reactivate user.' });
    } finally {
        client.release();
    }
});

export default router;
