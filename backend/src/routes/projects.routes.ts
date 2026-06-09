import { supabaseAdmin } from '../config/supabase.js';
/**
 * Projects Routes — HR and managers create upcoming projects with required skills
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../utils/validation.js';
import { AuditActions, logAction } from '../services/audit.service.js';

const router = Router();
const ALLOWED_PROJECT_STATUSES = new Set(['planned', 'active', 'completed']);
const projectSchema = z.object({
    projectName: z.string().trim().min(1).max(160),
    requiredSkills: z.array(z.object({
        skill_name: z.string().trim().min(1).max(80).optional(),
        name: z.string().trim().min(1).max(80).optional(),
        proficiency: z.string().trim().min(1).max(40).optional(),
        count: z.coerce.number().int().min(1).max(20).optional(),
    })).max(25).optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    status: z.enum(['planned', 'active', 'completed']).optional(),
});

function normalizeRequiredSkills(requiredSkills: any[] = []) {
    return requiredSkills
        .filter(Boolean)
        .map(skill => ({
            skill_name: String(skill.skill_name || skill.name || '').trim().toLowerCase(),
            proficiency: String(skill.proficiency || 'intermediate').trim().toLowerCase(),
            count: Math.max(1, Number(skill.count || 1)),
        }))
        .filter(skill => skill.skill_name);
}

function validateProjectPayload(projectName: string, startDate?: string, endDate?: string, status?: string) {
    if (!projectName) return 'projectName is required.';
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return 'startDate must be before endDate.';
    }
    if (status && !ALLOWED_PROJECT_STATUSES.has(status)) {
        return 'Invalid project status.';
    }
    return null;
}

function getRequiredEmployeeCount(requiredSkills: any[] = []) {
    return requiredSkills.reduce((total, skill) => total + Math.max(1, Number(skill.count || 1)), 0);
}

function getProgressStatus(project: any, requiredEmployees: number, assignedEmployees: number, completionPercentage: number) {
    if (project.status === 'completed') return 'Completed';
    if (assignedEmployees === 0) return 'Not Started';

    const endTime = project.end_date ? new Date(project.end_date).getTime() : null;
    if (endTime && endTime < Date.now() && completionPercentage < 100) return 'At Risk';
    if (requiredEmployees > 0 && assignedEmployees < requiredEmployees) return 'At Risk';

    return 'In Progress';
}

async function enrichProjects(projects: any[], companyId: string) {
    if (projects.length === 0) return [];

    const assignmentSummary = new Map<string, { assignedEmployees: number; managerEmails: string[] }>();
    const projectIds = projects.map(project => project.project_id);

    try {
        const result = await pool.query(
            `SELECT
                a.project_id,
                COUNT(DISTINCT a.employee_id)::int AS assigned_employees,
                COALESCE(
                    ARRAY_REMOVE(ARRAY_AGG(DISTINCT u.email) FILTER (WHERE u.role = 'manager'), NULL),
                    ARRAY[]::text[]
                ) AS manager_emails
             FROM public.assignments a
             LEFT JOIN public.users u
                ON u.user_id = a.assigned_by
               AND u.company_id = a.company_id
             WHERE a.company_id = $1
               AND a.project_id = ANY($2::uuid[])
             GROUP BY a.project_id`,
            [companyId, projectIds]
        );

        result.rows.forEach(row => {
            assignmentSummary.set(row.project_id, {
                assignedEmployees: Number(row.assigned_employees || 0),
                managerEmails: row.manager_emails || [],
            });
        });
    } catch (err: any) {
        console.error('Project enrichment query error:', err.message);
    }

    return projects.map(project => {
        const requiredSkills = Array.isArray(project.required_skills) ? project.required_skills : [];
        const requiredEmployees = getRequiredEmployeeCount(requiredSkills);
        const summary = assignmentSummary.get(project.project_id) || { assignedEmployees: 0, managerEmails: [] };
        const completionPercentage = requiredEmployees > 0
            ? Math.min(100, Math.round((summary.assignedEmployees / requiredEmployees) * 100))
            : summary.assignedEmployees > 0 ? 100 : 0;

        return {
            ...project,
            requiredEmployees,
            assignedEmployees: summary.assignedEmployees,
            completionPercentage,
            progressStatus: getProgressStatus(project, requiredEmployees, summary.assignedEmployees, completionPercentage),
            managerEmail: summary.managerEmails[0] || null,
            manager: summary.managerEmails.length > 0 ? summary.managerEmails.join(', ') : 'Unassigned',
        };
    });
}

router.get('/', requireAuth, requireRole('hr', 'manager'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const { data, error } = await db
            .from('projects')
            .select('*')
            .eq('company_id', user.companyId)
            .order('start_date', { ascending: true });

        if (error) return res.status(500).json({ success: false, message: error.message });
        const projects = await enrichProjects(data || [], user.companyId);
        res.json({ success: true, projects });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/', requireAuth, requireRole('hr', 'manager'), validate(projectSchema), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const {
            projectName,
            requiredSkills,
            startDate,
            endDate,
            status,
        } = req.body;

        const validationError = validateProjectPayload(projectName, startDate, endDate, status);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const { data, error } = await db
            .from('projects')
            .insert({
                company_id: user.companyId,
                project_name: projectName,
                required_skills: normalizeRequiredSkills(requiredSkills),
                start_date: startDate || null,
                end_date: endDate || null,
                status: status || 'planned',
            })
            .select()
            .single();

        if (error) return res.status(500).json({ success: false, message: error.message });

        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.PROJECT_CREATED,
            targetId: data.project_id,
            companyId: user.companyId,
            metadata: {
                projectId: data.project_id,
                projectName,
                requiredEmployees: getRequiredEmployeeCount(data.required_skills || []),
                status: data.status,
            },
        });

        const [project] = await enrichProjects([data], user.companyId);
        res.status(201).json({ success: true, project });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/:id', requireAuth, requireRole('hr', 'manager'), validate(projectSchema), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const { id } = req.params;
        const {
            projectName,
            requiredSkills,
            startDate,
            endDate,
            status,
        } = req.body;

        const validationError = validateProjectPayload(projectName, startDate, endDate, status);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const { data, error } = await db
            .from('projects')
            .update({
                project_name: projectName,
                required_skills: normalizeRequiredSkills(requiredSkills),
                start_date: startDate || null,
                end_date: endDate || null,
                status: status || 'planned',
            })
            .eq('project_id', id)
            .eq('company_id', user.companyId)
            .select()
            .single();

        if (error || !data) {
            if (error?.code === 'PGRST116' || !data) {
                return res.status(404).json({ success: false, message: 'Project not found.' });
            }
            return res.status(500).json({ success: false, message: error?.message || 'Failed to update project.' });
        }

        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.PROJECT_UPDATED,
            targetId: data.project_id,
            companyId: user.companyId,
            metadata: {
                projectId: data.project_id,
                projectName,
                requiredEmployees: getRequiredEmployeeCount(data.required_skills || []),
                status: data.status,
            },
        });

        const [project] = await enrichProjects([data], user.companyId);
        res.json({ success: true, project });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
