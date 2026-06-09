import { supabaseAdmin } from '../config/supabase.js';
/**
 * Assignments Routes — Manage employee-to-project assignments
 *
 * POST   /api/assignments                 — Create a new assignment (manager/HR)
 * GET    /api/assignments                 — List assignments for company
 * DELETE /api/assignments/:id             — Remove an assignment (manager/HR)
 * POST   /api/assignments/recalculate     — Recalculate capacity (complete expired assignments)
 *
 * SECURITY:
 *   - All queries are company-scoped via user.companyId
 *   - Only HR and managers can create/delete assignments
 *   - DB triggers auto-update current_project_load and last_assignment_date
 */
import { Router, Request, Response } from 'express';
import { pool, query } from '../config/db.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { logAction, AuditActions } from '../services/audit.service.js';

const router = Router();
const DEFAULT_CAPACITY_PER_ASSIGNMENT_PCT = 25;

async function getManagerVisibleEmployeeIds(companyId: string, managerId: string): Promise<string[]> {
    const result = await pool.query(
        `SELECT DISTINCT tm.employee_id
         FROM public.team_memberships tm
         JOIN public.teams t ON t.team_id = tm.team_id AND t.company_id = tm.company_id
         WHERE tm.company_id = $1
           AND tm.status = 'approved'
           AND t.manager_id = $2`,
        [companyId, managerId]
    );

    return result.rows.map(row => row.employee_id);
}

async function syncEmployeeCapacitySnapshot(companyId: string, employeeId: string) {
    const { count } = await supabaseAdmin
        .from('assignments')
        .select('assignment_id', { count: 'exact' })
        .eq('employee_id', employeeId)
        .eq('company_id', companyId);

    const currentProjectLoad = count ?? 0;
    const capacityCommittedPct = Math.min(100, currentProjectLoad * DEFAULT_CAPACITY_PER_ASSIGNMENT_PCT);

    await supabaseAdmin
        .from('employees')
        .update({
            current_project_load: currentProjectLoad,
            capacity_committed_pct: capacityCommittedPct,
        })
        .eq('employee_id', employeeId)
        .eq('company_id', companyId);
}

/**
 * POST /api/assignments — Create a new assignment
 *
 * Body: { employeeId, projectId, startDate, endDate? }
 *
 * The DB trigger `on_assignment_created` automatically:
 *   - Increments employee.current_project_load
 *   - Sets employee.last_assignment_date to today
 */
router.post('/', requireAuth, requireRole('hr', 'manager'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const { employeeId, projectId, startDate, endDate } = req.body;

        if (!employeeId || !projectId || !startDate) {
            return res.status(400).json({
                success: false,
                message: 'employeeId, projectId, and startDate are required.',
            });
        }

        if (user.role === 'manager') {
            const visibleEmployeeIds = await getManagerVisibleEmployeeIds(user.companyId, user.userId);
            if (!visibleEmployeeIds.includes(employeeId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Managers can only create assignments for approved team members.',
                });
            }
        }

        // Verify employee belongs to the same company
        const { data: employee, error: empError } = await supabaseAdmin
            .from('employees')
            .select('employee_id, company_id')
            .eq('employee_id', employeeId)
            .eq('company_id', user.companyId)
            .single();

        if (empError || !employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found in your company.',
            });
        }

        // Verify project belongs to the same company
        const { data: project, error: projError } = await supabaseAdmin
            .from('projects')
            .select('project_id, company_id')
            .eq('project_id', projectId)
            .eq('company_id', user.companyId)
            .single();

        if (projError || !project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found in your company.',
            });
        }

        // Check for duplicate assignment
        const { data: existing } = await supabaseAdmin
            .from('assignments')
            .select('assignment_id')
            .eq('employee_id', employeeId)
            .eq('project_id', projectId)
            .eq('company_id', user.companyId)
            .maybeSingle();

        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'This employee is already assigned to this project.',
            });
        }

        // Insert assignment — DB trigger handles current_project_load + last_assignment_date
        const { data: assignment, error: insertError } = await supabaseAdmin
            .from('assignments')
            .insert({
                employee_id: employeeId,
                project_id: projectId,
                company_id: user.companyId,
                assigned_by: user.userId,
                start_date: startDate,
                end_date: endDate || null,
            })
            .select()
            .single();

        if (insertError) {
            return res.status(500).json({ success: false, message: insertError.message });
        }

        // Audit log
        logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.ASSIGNMENT_CREATED,
            targetId: employeeId,
            companyId: user.companyId,
            metadata: {
                assignmentId: assignment.assignment_id,
                projectId,
            },
        }).catch(() => {});

        await syncEmployeeCapacitySnapshot(user.companyId, employeeId);

        res.status(201).json({ success: true, assignment });
    } catch (err: any) {
        console.error('Assignment creation error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/assignments — List assignments for the company
 *
 * Query params: employeeId?, projectId?
 */
router.get('/', requireAuth, requireRole('hr', 'manager'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const { employeeId, projectId } = req.query;
        let visibleEmployeeIds: string[] | null = null;

        if (user.role === 'manager') {
            visibleEmployeeIds = await getManagerVisibleEmployeeIds(user.companyId, user.userId);
            if (visibleEmployeeIds.length === 0) {
                return res.json({ success: true, assignments: [] });
            }
        }

        let query = supabaseAdmin
            .from('assignments')
            .select(`
                *,
                projects:project_id (project_name, status, start_date, end_date),
                employees:employee_id (employee_id, department, seniority_level)
            `)
            .eq('company_id', user.companyId)
            .order('created_at', { ascending: false });

        if (employeeId) {
            if (visibleEmployeeIds && !visibleEmployeeIds.includes(employeeId as string)) {
                return res.json({ success: true, assignments: [] });
            }
            query = query.eq('employee_id', employeeId as string);
        } else if (visibleEmployeeIds) {
            query = query.in('employee_id', visibleEmployeeIds);
        }
        if (projectId) {
            query = query.eq('project_id', projectId as string);
        }

        const { data, error } = await query;

        if (error) return res.status(500).json({ success: false, message: error.message });
        res.json({ success: true, assignments: data || [] });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * DELETE /api/assignments/:id — Remove an assignment
 *
 * The DB trigger `on_assignment_deleted` automatically:
 *   - Decrements employee.current_project_load (floor 0)
 */
router.delete('/:id', requireAuth, requireRole('hr', 'manager'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const assignmentId = req.params.id;
        let visibleEmployeeIds: string[] | null = null;

        if (user.role === 'manager') {
            visibleEmployeeIds = await getManagerVisibleEmployeeIds(user.companyId, user.userId);
        }

        // Fetch to verify ownership + get employee_id for audit
        const { data: assignment, error: fetchError } = await supabaseAdmin
            .from('assignments')
            .select('assignment_id, employee_id, project_id, company_id')
            .eq('assignment_id', assignmentId)
            .eq('company_id', user.companyId)
            .single();

        if (fetchError || !assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found in your company.',
            });
        }

        if (visibleEmployeeIds && !visibleEmployeeIds.includes(assignment.employee_id)) {
            return res.status(403).json({
                success: false,
                message: 'Managers can only remove assignments for their approved team members.',
            });
        }

        // Delete — DB trigger handles current_project_load decrement
        const { error: deleteError } = await supabaseAdmin
            .from('assignments')
            .delete()
            .eq('assignment_id', assignmentId);

        if (deleteError) {
            return res.status(500).json({ success: false, message: deleteError.message });
        }

        // Audit log
        logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.ASSIGNMENT_REMOVED,
            targetId: assignment.employee_id,
            companyId: user.companyId,
            metadata: {
                assignmentId,
                projectId: assignment.project_id,
            },
        }).catch(() => {});

        await syncEmployeeCapacitySnapshot(user.companyId, assignment.employee_id);

        res.json({ success: true, message: 'Assignment removed.' });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/assignments/recalculate — Recalculate capacity
 *
 * Finds all assignments whose end_date has passed, removes them,
 * and recalculates each affected employee's current_project_load.
 *
 * Can be called manually or wired to a cron job.
 */
router.post('/recalculate', requireAuth, requireRole('hr'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;

        // Find expired assignments for this company
        const { data: expired, error: fetchError } = await supabaseAdmin
            .from('assignments')
            .select('assignment_id, employee_id, project_id')
            .eq('company_id', user.companyId)
            .not('end_date', 'is', null)
            .lte('end_date', new Date().toISOString().split('T')[0]);

        if (fetchError) {
            return res.status(500).json({ success: false, message: fetchError.message });
        }

        if (!expired || expired.length === 0) {
            return res.json({
                success: true,
                message: 'No expired assignments found.',
                expiredCount: 0,
                affectedEmployees: [],
            });
        }

        // Collect unique affected employee IDs
        const affectedEmployeeIds = [...new Set(expired.map(a => a.employee_id))];

        // Delete expired assignments — DB triggers will decrement loads
        const expiredIds = expired.map(a => a.assignment_id);
        const { error: deleteError } = await supabaseAdmin
            .from('assignments')
            .delete()
            .in('assignment_id', expiredIds);

        if (deleteError) {
            return res.status(500).json({ success: false, message: deleteError.message });
        }

        // Recalculate current_project_load for all affected employees in a
        // single query per employee batch (avoids N+1 problem)
        if (affectedEmployeeIds.length > 0) {
            for (const empId of affectedEmployeeIds) {
                const { count } = await supabaseAdmin
                    .from('assignments')
                    .select('assignment_id', { count: 'exact' })
                    .eq('employee_id', empId)
                    .eq('company_id', user.companyId); // company isolation required

                await supabaseAdmin
                    .from('employees')
                    .update({
                        current_project_load: count ?? 0,
                        capacity_committed_pct: Math.min(100, (count ?? 0) * DEFAULT_CAPACITY_PER_ASSIGNMENT_PCT),
                    })
                    .eq('employee_id', empId)
                    .eq('company_id', user.companyId); // company isolation required
            }
        }

        // Audit log
        logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.CAPACITY_RECALCULATED,
            companyId: user.companyId,
            metadata: {
                count: expired.length,
            },
        }).catch(() => {});

        res.json({
            success: true,
            message: `Recalculated capacity. ${expired.length} expired assignment(s) removed.`,
            expiredCount: expired.length,
            affectedEmployees: affectedEmployeeIds,
        });
    } catch (err: any) {
        console.error('Capacity recalculation error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
