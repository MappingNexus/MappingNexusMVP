/**
 * Audit Log Routes — Phase 9
 *
 * GET /api/audit-logs — HR views audit trail (company-scoped, paginated)
 */
import { Router, Request, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { getAuditLogs } from '../services/audit.service.js';

const router = Router();

/**
 * GET /api/audit-logs
 * HR views paginated audit trail for their company.
 */
router.get('/', requireAuth, requireRole('hr'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
        const offset = parseInt(req.query.offset as string) || 0;
        const action = req.query.action as string | undefined;

        const result = await getAuditLogs(user.companyId, { limit, offset, action });
        const rows = result.rows;
        const total = rows.length > 0 && rows[0].total_count != null
            ? parseInt(rows[0].total_count)
            : rows.length;
        const cleanRows = rows.map((r: any) => { const c = { ...r }; delete c.total_count; return c; });

        res.json({
            success: true,
            logs: cleanRows,
            total,
            limit,
            offset,
        });
    } catch (err: any) {
        console.error('Audit logs error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
    }
});

export default router;
