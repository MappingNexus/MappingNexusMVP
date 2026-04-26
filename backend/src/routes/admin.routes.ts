import { Router, Request, Response } from 'express';
import { pool } from '../config/db.js';
import { requireAuth, requireRole, AuthenticatedRequest, clearProfileCache } from '../middleware/auth.js';
import { logAction, AuditActions } from '../services/audit.service.js';
import { forceLogoutUserSessions } from '../services/session.service.js';

const router = Router();

type UserStatus = 'active' | 'suspended' | 'deactivated' | 'offboarded';

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
