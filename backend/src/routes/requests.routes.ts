import { supabaseAdmin } from '../config/supabase.js';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../utils/validation.js';
import { logAction } from '../services/audit.service.js';

const router = Router();

const skillSchema = z.object({
    skill_name: z.string().trim().min(1).max(80),
    proficiency: z.enum(['beginner', 'intermediate', 'expert']).optional(),
    count: z.coerce.number().int().min(1).max(20).optional(),
}).transform((skill) => ({
    skill_name: skill.skill_name.trim().toLowerCase(),
    proficiency: skill.proficiency || 'intermediate',
    count: skill.count || 1,
}));

const createRequestSchema = z.object({
    requestedRole: z.string().trim().min(2).max(120),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    skillsRequired: z.array(skillSchema).max(12).default([]),
});

const requestIdParams = z.object({
    id: z.string().uuid(),
});

const reviewSchema = z.object({
    note: z.string().trim().max(500).optional(),
});

router.post('/', requireAuth, requireRole('manager'), validate(createRequestSchema), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const { requestedRole, priority, skillsRequired } = req.body;

        const { data, error } = await db
            .from('employee_requests')
            .insert({
                company_id: user.companyId,
                manager_id: user.userId,
                requested_role: requestedRole,
                skills_required: skillsRequired,
                priority,
                status: 'Pending',
            })
            .select('*')
            .single();

        if (error || !data) {
            return res.status(500).json({ success: false, message: error?.message || 'Failed to create request.' });
        }

        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: 'employee_request_created',
            targetId: data.request_id,
            companyId: user.companyId,
            metadata: { priority, requestedRole }
        });

        res.status(201).json({
            success: true,
            request: {
                requestId: data.request_id,
                managerId: data.manager_id,
                requestedRole: data.requested_role,
                skillsRequired: data.skills_required,
                priority: data.priority,
                status: data.status,
                viewedAt: data.viewed_at,
                reviewNote: data.review_note,
                createdAt: data.created_at,
                reviewedAt: data.reviewed_at,
                createdEmployeeId: data.created_employee_id,
            },
        });
    } catch (err: any) {
        console.error('Employee request create error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to create request.' });
    }
});

router.get('/', requireAuth, requireRole('hr', 'manager'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;

        let query = db
            .from('employee_requests')
            .select('*, manager:manager_id(user_id)')
            .eq('company_id', user.companyId)
            .order('created_at', { ascending: false });

        if (user.role === 'manager') {
            query = query.eq('manager_id', user.userId);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        const unseen = user.role === 'hr'
            ? (data || []).filter(request => !request.viewed_at && request.status === 'Pending').map(request => request.request_id)
            : [];

        if (unseen.length > 0) {
            await db
                .from('employee_requests')
                .update({ viewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                .eq('company_id', user.companyId)
                .in('request_id', unseen);
        }

        res.json({
            success: true,
            requests: (data || []).map(request => ({
                requestId: request.request_id,
                managerId: request.manager_id,
                requestedRole: request.requested_role,
                skillsRequired: request.skills_required || [],
                priority: request.priority,
                status: request.status,
                viewedAt: request.viewed_at || (unseen.includes(request.request_id) ? new Date().toISOString() : null),
                reviewNote: request.review_note,
                createdAt: request.created_at,
                reviewedAt: request.reviewed_at,
                createdEmployeeId: request.created_employee_id,
            })),
        });
    } catch (err: any) {
        console.error('Employee request list error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
    }
});

router.get('/:id', requireAuth, requireRole('hr', 'manager'), validate(requestIdParams, 'params'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const { id } = req.params;

        let query = db
            .from('employee_requests')
            .select('*')
            .eq('company_id', user.companyId)
            .eq('request_id', id);

        if (user.role === 'manager') {
            query = query.eq('manager_id', user.userId);
        }

        const { data, error } = await query.single();

        if (error || !data) {
            return res.status(404).json({ success: false, message: 'Request not found.' });
        }

        if (user.role === 'hr' && !data.viewed_at) {
            await db
                .from('employee_requests')
                .update({ viewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                .eq('company_id', user.companyId)
                .eq('request_id', id);
            data.viewed_at = new Date().toISOString();
        }

        res.json({
            success: true,
            request: {
                requestId: data.request_id,
                managerId: data.manager_id,
                requestedRole: data.requested_role,
                skillsRequired: data.skills_required || [],
                priority: data.priority,
                status: data.status,
                viewedAt: data.viewed_at,
                reviewNote: data.review_note,
                createdAt: data.created_at,
                reviewedAt: data.reviewed_at,
                createdEmployeeId: data.created_employee_id,
            },
        });
    } catch (err: any) {
        console.error('Employee request fetch error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch request.' });
    }
});

router.put('/:id/approve', requireAuth, requireRole('hr'), validate(requestIdParams, 'params'), validate(reviewSchema), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const { id } = req.params;
        const { note } = req.body;

        const now = new Date().toISOString();
        const { data, error } = await db
            .from('employee_requests')
            .update({
                status: 'Approved',
                reviewed_by: user.userId,
                reviewed_at: now,
                viewed_at: now,
                review_note: note || null,
                updated_at: now,
            })
            .eq('company_id', user.companyId)
            .eq('request_id', id)
            .eq('status', 'Pending')
            .select('*')
            .single();

        if (error || !data) {
            return res.status(404).json({ success: false, message: error?.message || 'Request not found.' });
        }

        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: 'employee_request_approved',
            targetId: id,
            companyId: user.companyId,
            metadata: { priority: data.priority, requestedRole: data.requested_role }
        });

        res.json({
            success: true,
            request: {
                requestId: data.request_id,
                requestedRole: data.requested_role,
                skillsRequired: data.skills_required || [],
                priority: data.priority,
                status: data.status,
                viewedAt: data.viewed_at,
                reviewNote: data.review_note,
                createdAt: data.created_at,
                reviewedAt: data.reviewed_at,
                createdEmployeeId: data.created_employee_id,
            },
        });
    } catch (err: any) {
        console.error('Employee request approve error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to approve request.' });
    }
});

router.put('/:id/deny', requireAuth, requireRole('hr'), validate(requestIdParams, 'params'), validate(reviewSchema), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const { id } = req.params;
        const { note } = req.body;
        const now = new Date().toISOString();

        const { data, error } = await db
            .from('employee_requests')
            .update({
                status: 'Denied',
                reviewed_by: user.userId,
                reviewed_at: now,
                viewed_at: now,
                review_note: note || 'Denied by HR.',
                updated_at: now,
            })
            .eq('company_id', user.companyId)
            .eq('request_id', id)
            .eq('status', 'Pending')
            .select('*')
            .single();

        if (error || !data) {
            return res.status(404).json({ success: false, message: error?.message || 'Request not found.' });
        }

        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: 'employee_request_denied',
            targetId: id,
            companyId: user.companyId,
            metadata: { reason: data.review_note, requestedRole: data.requested_role }
        });

        res.json({
            success: true,
            request: {
                requestId: data.request_id,
                requestedRole: data.requested_role,
                skillsRequired: data.skills_required || [],
                priority: data.priority,
                status: data.status,
                viewedAt: data.viewed_at,
                reviewNote: data.review_note,
                createdAt: data.created_at,
                reviewedAt: data.reviewed_at,
                createdEmployeeId: data.created_employee_id,
            },
        });
    } catch (err: any) {
        console.error('Employee request deny error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to deny request.' });
    }
});

export default router;
