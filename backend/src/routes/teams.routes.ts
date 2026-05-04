import { supabaseAdmin } from '../config/supabase.js';
/**
 * Team Management Routes — Phase 4
 *
 * Workflow: Manager requests employee → HR approves/rejects → Employee added to team
 *
 * POST   /api/teams                             — HR creates team
 * GET    /api/teams                             — List teams (role-scoped)
 * POST   /api/teams/membership-request          — Manager requests an employee
 * GET    /api/teams/pending-requests            — HR views pending requests
 * PUT    /api/teams/membership-request/:id/approve — HR approves request
 * PUT    /api/teams/membership-request/:id/reject  — HR rejects request
 * GET    /api/teams/:teamId/members             — Get team members
 */
import { Router, Request, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { logAction, AuditActions } from '../services/audit.service.js';
import { decrypt, hashForDisplay } from '../services/encryption.service.js';
import { getCompanySecret } from '../utils/company-secret.js';

const router = Router();

/**
 * POST /api/teams
 * HR creates a new team and assigns a manager.
 */
router.post('/', requireAuth, requireRole('hr', 'manager'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const { teamName, managerId } = req.body;

        const targetManagerId = user.role === 'manager' ? user.userId : managerId;

        if (!teamName || !targetManagerId) {
            return res.status(400).json({
                success: false,
                message: 'teamName and managerId are required.',
            });
        }

        // Verify manager exists in same company
        const { data: manager } = await db
            .from('users')
            .select('user_id, role')
            .eq('user_id', targetManagerId)
            .eq('company_id', user.companyId)
            .eq('role', 'manager')
            .single();

        if (!manager) {
            return res.status(400).json({
                success: false,
                message: 'Manager not found in your company.',
            });
        }

        const { data: team, error } = await db
            .from('teams')
            .insert({
                team_name: teamName,
                manager_id: targetManagerId,
                company_id: user.companyId,
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.TEAM_CREATED,
            targetId: team.team_id,
            companyId: user.companyId,
            metadata: { teamName, managerId }
        });

        res.status(201).json({ success: true, team });
    } catch (err: any) {
        console.error('Create team error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to create team.' });
    }
});

/**
 * GET /api/teams
 * List teams — HR sees all, Manager sees their own.
 */
router.get('/', requireAuth, requireRole('hr', 'manager'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;

        let query = db
            .from('teams')
            .select('*, team_memberships(count)')
            .eq('company_id', user.companyId);

        if (user.role === 'manager') {
            query = query.eq('manager_id', user.userId);
        }

        const { data: teams, error } = await query;

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        const mapped = (teams || []).map((t: any) => ({
            teamId: t.team_id,
            teamName: t.team_name,
            managerId: t.manager_id,
            companyId: t.company_id,
            createdAt: t.created_at,
        }));

        res.json({ success: true, teams: mapped });
    } catch (err: any) {
        console.error('List teams error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch teams.' });
    }
});

/**
 * POST /api/teams/membership-request
 * Manager requests an employee for their team.
 */
router.post('/membership-request', requireAuth, requireRole('manager'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const { teamId, employeeId, reason } = req.body;

        if (!teamId || !employeeId) {
            return res.status(400).json({
                success: false,
                message: 'teamId and employeeId are required.',
            });
        }

        // Verify team belongs to this manager
        const { data: team } = await db
            .from('teams')
            .select('team_id')
            .eq('team_id', teamId)
            .eq('manager_id', user.userId)
            .eq('company_id', user.companyId)
            .single();

        if (!team) {
            return res.status(403).json({ success: false, message: 'This is not your team.' });
        }

        // Verify employee exists in same company
        const { data: employee } = await db
            .from('employees')
            .select('employee_id')
            .eq('employee_id', employeeId)
            .eq('company_id', user.companyId)
            .eq('is_archived', false)
            .single();

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        // Check for existing active membership
        const { data: existing } = await db
            .from('team_memberships')
            .select('membership_id, status')
            .eq('team_id', teamId)
            .eq('employee_id', employeeId)
            .in('status', ['pending', 'approved'])
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: `Employee already has a ${existing[0].status} membership for this team.`,
            });
        }

        const { data: membership, error } = await db
            .from('team_memberships')
            .insert({
                team_id: teamId,
                employee_id: employeeId,
                company_id: user.companyId,
                status: 'pending',
                requested_by: user.userId,
                request_reason: reason || null,
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.TEAM_REQUEST_CREATED,
            targetId: membership.membership_id,
            companyId: user.companyId,
            metadata: { teamId, employeeId: employeeId }
        });

        res.status(201).json({ success: true, membership });
    } catch (err: any) {
        console.error('Membership request error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to create membership request.' });
    }
});

/**
 * GET /api/teams/pending-requests
 * HR views all pending membership requests for their company.
 */
router.get('/pending-requests', requireAuth, requireRole('hr'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const companySecret = getCompanySecret(req);

        const { data: requests, error } = await db
            .from('team_memberships')
            .select(`
                *,
                teams (team_id, team_name, manager_id),
                employees:employee_id (employee_id, department, seniority_level, name_encrypted)
            `)
            .eq('company_id', user.companyId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        // Decrypt employee names for HR view
        const formatted = await Promise.all((requests || []).map(async (r: any) => {
            let employeeName = `Employee ${hashForDisplay(r.employee_id)}`;
            if (r.employees?.name_encrypted) {
                try {
                    const decrypted = await decrypt(r.employees.name_encrypted, user.companyId, companySecret);
                    if (decrypted) employeeName = decrypted;
                } catch {}
            }
            return {
                membershipId: r.membership_id,
                teamName: r.teams?.team_name,
                teamId: r.team_id,
                employeeId: r.employee_id,
                employeeName,
                department: r.employees?.department,
                seniorityLevel: r.employees?.seniority_level,
                requestReason: r.request_reason,
                requestedBy: r.requested_by,
                createdAt: r.created_at,
            };
        }));

        res.json({ success: true, requests: formatted });
    } catch (err: any) {
        console.error('Pending requests error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
    }
});

/**
 * PUT /api/teams/membership-request/:id/approve
 * HR approves a pending membership request.
 */
router.put('/membership-request/:id/approve', requireAuth, requireRole('hr'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const { id } = req.params;
        const { note } = req.body;

        const { data: membership, error } = await db
            .from('team_memberships')
            .update({
                status: 'approved',
                reviewed_by: user.userId,
                review_note: note || null,
                reviewed_at: new Date().toISOString(),
            })
            .eq('membership_id', id)
            .eq('company_id', user.companyId)
            .eq('status', 'pending')
            .select()
            .single();

        if (error || !membership) {
            return res.status(404).json({
                success: false,
                message: 'Pending request not found or already processed.',
            });
        }

        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.TEAM_REQUEST_APPROVED,
            targetId: id,
            companyId: user.companyId,
            metadata: { teamId: membership.team_id, employeeId: membership.employee_id }
        });

        res.json({ success: true, message: 'Membership approved.', membership });
    } catch (err: any) {
        console.error('Approve request error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to approve request.' });
    }
});

/**
 * PUT /api/teams/membership-request/:id/reject
 * HR rejects a pending membership request.
 */
router.put('/membership-request/:id/reject', requireAuth, requireRole('hr'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const { id } = req.params;
        const { note } = req.body;

        const { data: membership, error } = await db
            .from('team_memberships')
            .update({
                status: 'rejected',
                reviewed_by: user.userId,
                review_note: note || 'Request rejected by HR.',
                reviewed_at: new Date().toISOString(),
            })
            .eq('membership_id', id)
            .eq('company_id', user.companyId)
            .eq('status', 'pending')
            .select()
            .single();

        if (error || !membership) {
            return res.status(404).json({
                success: false,
                message: 'Pending request not found or already processed.',
            });
        }

        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.TEAM_REQUEST_REJECTED,
            targetId: id,
            companyId: user.companyId,
            metadata: { teamId: membership.team_id, reason: note }
        });

        res.json({ success: true, message: 'Membership rejected.', membership });
    } catch (err: any) {
        console.error('Reject request error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to reject request.' });
    }
});

/**
 * GET /api/teams/:teamId/members
 * Get members of a specific team.
 */
router.get('/:teamId/members', requireAuth, requireRole('hr', 'manager'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const companySecret = getCompanySecret(req);
        const { teamId } = req.params;

        // Verify access to team
        let teamQuery = db
            .from('teams')
            .select('team_id, team_name, manager_id')
            .eq('team_id', teamId)
            .eq('company_id', user.companyId);

        if (user.role === 'manager') {
            teamQuery = teamQuery.eq('manager_id', user.userId);
        }

        const { data: team } = await teamQuery.single();

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found or access denied.' });
        }

        const { data: memberships } = await db
            .from('team_memberships')
            .select(`
                membership_id, status, created_at,
                employees:employee_id (
                    employee_id, department, seniority_level, location,
                    travel_eligible, current_project_load, name_encrypted
                )
            `)
            .eq('team_id', teamId)
            .eq('company_id', user.companyId)
            .eq('status', 'approved');

        const members = await Promise.all((memberships || []).map(async (m: any) => {
            let name = `Employee ${hashForDisplay(m.employees?.employee_id || m.membership_id)}`;
            if (m.employees?.name_encrypted) {
                try {
                    const decrypted = await decrypt(m.employees.name_encrypted, user.companyId, companySecret);
                    if (decrypted) name = decrypted;
                } catch {}
            }
            return {
                membershipId: m.membership_id,
                employeeId: m.employees?.employee_id,
                name,
                department: m.employees?.department,
                seniorityLevel: m.employees?.seniority_level,
                location: m.employees?.location,
                currentProjectLoad: m.employees?.current_project_load,
                travelEligible: m.employees?.travel_eligible,
                joinedAt: m.created_at,
            };
        }));

        res.json({ success: true, team, members });
    } catch (err: any) {
        console.error('Team members error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch team members.' });
    }
});

export default router;
