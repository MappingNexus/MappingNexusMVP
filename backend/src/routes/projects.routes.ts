import { supabaseAdmin } from '../config/supabase.js';
/**
 * Projects Routes — HR and managers create upcoming projects with required skills
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../utils/validation.js';

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
        res.json({ success: true, projects: data || [] });
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
        res.status(201).json({ success: true, project: data });
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

        res.json({ success: true, project: data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
