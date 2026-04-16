import bcrypt from 'bcrypt';
import { supabaseAdmin } from '../config/supabase.js';
/**
 * Employee Routes — Phase 5
 *
 * HR: Full CRUD + provisioning (creates auth account + encrypted profile)
 * Manager: Read-only access to approved team members (no cost_per_day)
 * Employee: Read own profile + update skills/availability/travel
 *
 * POST   /api/employees           — HR creates employee + provisions auth account
 * GET    /api/employees           — List employees (role-scoped)
 * GET    /api/employees/:id       — Get single employee (role-scoped)
 * PUT    /api/employees/:id       — Update employee (HR: all fields, Employee: limited)
 * DELETE /api/employees/:id       — Archive employee (HR only, soft delete)
 */
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { pool, query } from '../config/db.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { encrypt, decrypt, decryptFields, encryptFields, hashForDisplay } from '../services/encryption.service.js';
import { logAction, AuditActions } from '../services/audit.service.js';
import { generateSkillEmbedding } from '../services/embedding.service.js';
import {
    sendPasswordSetupEmail,
    getInviteEmailFailureMessage,
    getInviteEmailSentMessage,
} from '../services/password-reset.service.js';
import { requireCompanySecret, getCompanySecret } from '../utils/company-secret.js';
import { validate } from '../utils/validation.js';

const router = Router();
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 160;
const MAX_DEPARTMENT_LENGTH = 120;
const MAX_SKILLS_PER_EMPLOYEE = 25;
const MAX_SKILL_NAME_LENGTH = 80;
const ALLOWED_PROFICIENCIES = new Set(['beginner', 'intermediate', 'expert']);
const availabilityWindowSchema = z.object({
    availabilityWindowId: z.string().uuid().optional(),
    windowType: z.enum(['holiday', 'project_commitment', 'personal', 'other']),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    note: z.string().max(250).optional(),
});

const createEmployeeSchema = z.object({
    name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
    workEmail: z.string().trim().email().max(MAX_EMAIL_LENGTH),
    department: z.string().trim().min(1).max(MAX_DEPARTMENT_LENGTH),
    seniorityLevel: z.enum(['junior', 'mid', 'senior', 'lead', 'principal']).optional(),
    costPerDay: z.coerce.number().min(0).max(1000000).optional().nullable(),
    location: z.string().trim().max(120).optional(),
    travelEligible: z.boolean().optional(),
    skills: z.array(z.object({
        name: z.string().trim().min(1).max(MAX_SKILL_NAME_LENGTH),
        proficiency: z.enum(['beginner', 'intermediate', 'expert']).optional(),
    })).max(MAX_SKILLS_PER_EMPLOYEE).optional(),
    performanceScore: z.coerce.number().min(0).max(5).optional().nullable(),
    availabilityFrom: z.string().optional().nullable(),
    availabilityTo: z.string().optional().nullable(),
    availabilityWindows: z.array(availabilityWindowSchema).max(12).optional(),
    tenureYears: z.coerce.number().min(0).max(50).optional().nullable(),
    role: z.enum(['employee', 'manager']).optional(),
    requestId: z.string().uuid().optional(),
});

const updateEmployeeSchema = z.object({
    name: z.string().trim().min(1).max(MAX_NAME_LENGTH).optional(),
    workEmail: z.string().trim().email().max(MAX_EMAIL_LENGTH).optional(),
    department: z.string().trim().min(1).max(MAX_DEPARTMENT_LENGTH).optional(),
    seniorityLevel: z.enum(['junior', 'mid', 'senior', 'lead', 'principal']).optional(),
    costPerDay: z.coerce.number().min(0).max(1000000).optional().nullable(),
    location: z.string().trim().max(120).optional(),
    travelEligible: z.boolean().optional(),
    performanceScore: z.coerce.number().min(0).max(5).optional().nullable(),
    skills: z.array(z.object({
        name: z.string().trim().min(1).max(MAX_SKILL_NAME_LENGTH),
        proficiency: z.enum(['beginner', 'intermediate', 'expert']).optional(),
    })).max(MAX_SKILLS_PER_EMPLOYEE).optional(),
    availabilityFrom: z.string().optional().nullable(),
    availabilityTo: z.string().optional().nullable(),
    availabilityWindows: z.array(availabilityWindowSchema).max(12).optional(),
    tenureYears: z.coerce.number().min(0).max(50).optional().nullable(),
    currentProjectLoad: z.coerce.number().int().min(0).max(20).optional(),
});

async function syncAvailabilityWindows(
    db: any,
    employeeId: string,
    companyId: string,
    actorId: string,
    windows?: Array<{ windowType: string; startDate: string; endDate: string; note?: string }>
) {
    if (!windows) return;

    await db
        .from('availability_window')
        .delete()
        .eq('employee_id', employeeId)
        .eq('company_id', companyId);

    if (windows.length === 0) return;

    await db
        .from('availability_window')
        .insert(windows.map(window => ({
            employee_id: employeeId,
            company_id: companyId,
            window_type: window.windowType,
            start_date: window.startDate,
            end_date: window.endDate,
            note: window.note || null,
            created_by: actorId,
        })));
}

async function getManagerVisibleEmployeeIds(
    db: any,
    companyId: string,
    managerId: string
): Promise<string[]> {
    const { data, error } = await db
        .from('team_memberships')
        .select('employee_id, teams!inner(manager_id)')
        .eq('company_id', companyId)
        .eq('status', 'approved')
        .eq('teams.manager_id', managerId);

    if (error) {
        throw new Error(`Failed to scope manager team members: ${error.message}`);
    }

    return (data || []).map((membership: any) => membership.employee_id);
}

/**
 * Generate a secure temporary password.
 */
function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    const bytes = crypto.randomBytes(16);
    for (let i = 0; i < 16; i++) {
        password += chars[bytes[i] % chars.length];
    }
    return password;
}

function normalizeSkillName(skillName: string): string {
    return skillName.trim().replace(/\s+/g, ' ').toLowerCase();
}

function validateAndNormalizeSkills(skills: any[]): {
    valid: boolean;
    message?: string;
    normalizedSkills?: Array<{ skill_name: string; proficiency: 'beginner' | 'intermediate' | 'expert'; last_used_date: string }>;
} {
    if (skills.length > MAX_SKILLS_PER_EMPLOYEE) {
        return { valid: false, message: `Maximum ${MAX_SKILLS_PER_EMPLOYEE} skills allowed.` };
    }

    const seen = new Set<string>();
    const normalizedSkills: any[] = [];

    for (const skill of skills) {
        const rawSkillName = String(skill?.name || skill?.skill_name || '').trim();
        const normalizedSkillName = normalizeSkillName(rawSkillName);
        const proficiencyValue = String(skill?.proficiency || 'intermediate').toLowerCase();
        const lastUsedDate = String(skill?.lastUsedDate || skill?.last_used_date || new Date().toISOString().split('T')[0]);

        if (!normalizedSkillName) {
            return { valid: false, message: 'Skill names cannot be empty.' };
        }
        if (normalizedSkillName.length > MAX_SKILL_NAME_LENGTH) {
            return { valid: false, message: `Skill names must be ${MAX_SKILL_NAME_LENGTH} characters or fewer.` };
        }
        if (!ALLOWED_PROFICIENCIES.has(proficiencyValue)) {
            return { valid: false, message: 'Invalid skill proficiency value.' };
        }
        if (Number.isNaN(Date.parse(lastUsedDate))) {
            return { valid: false, message: 'Invalid skill last used date.' };
        }
        if (seen.has(normalizedSkillName)) {
            return { valid: false, message: 'Duplicate skill detected.' };
        }

        seen.add(normalizedSkillName);
        normalizedSkills.push({
            skill_name: normalizedSkillName,
            proficiency: proficiencyValue as 'beginner' | 'intermediate' | 'expert',
            last_used_date: lastUsedDate,
        });
    }

    return { valid: true, normalizedSkills };
}

/**
 * Decrypt employee record for API response.
 * Strips cost_per_day for managers (they see range instead).
 */
async function formatEmployeeResponse(
    db: any,
    emp: any,
    companyId: string,
    viewerRole: string,
    companySecret?: string
) {
    const decrypted = await decryptFields({
        name: emp.name_encrypted,
        workEmail: emp.work_email_encrypted,
        costPerDay: emp.cost_per_day_encrypted,
        performanceScore: emp.performance_score_encrypted,
    }, companyId, companySecret);

    // Get skills
    const { data: skills } = await db
        .from('skills')
        .select('skill_id, skill_name, proficiency, last_used_date')
        .eq('employee_id', emp.employee_id)
        .eq('company_id', companyId);

    const { data: windows } = await db
        .from('availability_window')
        .select('availability_window_id, window_type, start_date, end_date, note')
        .eq('employee_id', emp.employee_id)
        .eq('company_id', companyId)
        .order('start_date', { ascending: true });

    const displayId = hashForDisplay(emp.employee_id);

    const response: any = {
        employeeId: emp.employee_id,
        displayId,
        name: decrypted.name || `Employee ${displayId}`,
        workEmail: decrypted.workEmail,
        department: emp.department,
        seniorityLevel: emp.seniority_level,
        location: emp.location,
        travelEligible: emp.travel_eligible,
        availabilityFrom: emp.availability_from,
        availabilityTo: emp.availability_to,
        currentProjectLoad: emp.current_project_load,
        capacityCommittedPct: emp.capacity_committed_pct,
        lastAssignmentDate: emp.last_assignment_date,
        tenureYears: emp.tenure_years,
        isArchived: emp.is_archived,
        skills: skills || [],
        availabilityWindows: (windows || []).map(window => ({
            availabilityWindowId: window.availability_window_id,
            windowType: window.window_type,
            startDate: window.start_date,
            endDate: window.end_date,
            note: window.note,
        })),
        createdAt: emp.created_at,
        updatedAt: emp.updated_at,
    };

    // HR and employee see all fields
    if (viewerRole === 'hr' || viewerRole === 'employee') {
        response.costPerDay = decrypted.costPerDay ? parseFloat(decrypted.costPerDay) : null;
        response.performanceScore = decrypted.performanceScore ? parseFloat(decrypted.performanceScore) : null;
    }

    // Manager gets cost range instead of exact value
    if (viewerRole === 'manager') {
        const cost = decrypted.costPerDay ? parseFloat(decrypted.costPerDay) : null;
        if (cost) {
            const lower = Math.floor(cost / 5000) * 5000;
            response.costRange = `₹${lower.toLocaleString()} - ₹${(lower + 5000).toLocaleString()}/day`;
        }
        response.performanceScore = decrypted.performanceScore ? parseFloat(decrypted.performanceScore) : null;
    }

    return response;
}

/**
 * POST /api/employees
 * HR creates a new employee + provisions Supabase auth account.
 */
router.post('/', requireAuth, requireRole('hr'), validate(createEmployeeSchema), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const companySecret = requireCompanySecret(req);
        const {
            name, workEmail, department, seniorityLevel, costPerDay,
            location, travelEligible, skills, performanceScore,
            availabilityFrom, availabilityTo, availabilityWindows, tenureYears, role: targetRole, requestId,
        } = req.body;

        if (!name || !workEmail || !department) {
            return res.status(400).json({
                success: false,
                message: 'name, workEmail, and department are required.',
            });
        }

        if (
            String(name).trim().length > MAX_NAME_LENGTH ||
            String(workEmail).trim().length > MAX_EMAIL_LENGTH ||
            String(department).trim().length > MAX_DEPARTMENT_LENGTH
        ) {
            return res.status(400).json({
                success: false,
                message: 'name, workEmail, and department must be within allowed length limits.',
            });
        }

        if (location !== undefined && String(location).length > 120) {
            return res.status(400).json({
                success: false,
                message: 'location must be 120 characters or fewer.',
            });
        }

        if (
            availabilityFrom &&
            availabilityTo &&
            new Date(availabilityFrom) > new Date(availabilityTo)
        ) {
            return res.status(400).json({
                success: false,
                message: 'availabilityFrom must be before availabilityTo.',
            });
        }

        const assignRole: 'employee' | 'manager' = targetRole === 'manager' ? 'manager' : 'employee';

        // 1. Generate temp password
        const tempPassword = generateTempPassword();

        // 2. Create Supabase auth account for employee
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: workEmail.toLowerCase().trim(),
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                company_id: user.companyId,
                role: assignRole,
            },
        });

        if (authError) {
            return res.status(400).json({
                success: false,
                message: `Failed to create auth account: ${(authError as any).message}`,
            });
        }

        // 2b. If creating a manager, the auth trigger creates the users row.
        if (assignRole === 'manager') {
            const inviteResult = await sendPasswordSetupEmail(workEmail);

            await logAction({
                actorId: user.userId,
                actorRole: user.role,
                action: AuditActions.USER_CREATED,
                targetId: authUser.user.id,
                companyId: user.companyId,
                metadata: { role: 'manager', email: workEmail },
            });

            return res.status(201).json({
                success: true,
                message: 'Manager account created successfully.',
                employee: { employeeId: authUser.user.id, displayId: 'MGR', department },
                onboarding: {
                    success: !inviteResult.error,
                    inviteUserId: authUser.user.id,
                    message: inviteResult.error
                        ? getInviteEmailFailureMessage(workEmail)
                        : getInviteEmailSentMessage(workEmail),
                },
            });
        }

        // 3. Encrypt PII fields
        const encrypted = await encryptFields({
            name_encrypted: name,
            work_email_encrypted: workEmail,
            cost_per_day_encrypted: costPerDay ?? null,
            performance_score_encrypted: performanceScore ?? null,
        }, user.companyId, companySecret);

        // 4. Insert employee record
        const { data: employee, error: empError } = await db
            .from('employees')
            .insert({
                user_id: authUser.user.id,
                company_id: user.companyId,
                name_encrypted: encrypted.name_encrypted,
                work_email_encrypted: encrypted.work_email_encrypted,
                cost_per_day_encrypted: encrypted.cost_per_day_encrypted,
                performance_score_encrypted: encrypted.performance_score_encrypted,
                department,
                seniority_level: seniorityLevel || 'mid',
                location: location || 'Remote',
                travel_eligible: travelEligible ?? false,
                availability_from: availabilityFrom || null,
                availability_to: availabilityTo || null,
                tenure_years: tenureYears ?? 0,
            })
            .select()
            .single();

        if (empError) {
            // Rollback: delete the auth account we created
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            return res.status(500).json({
                success: false,
                message: `Failed to create employee record: ${(empError as any).message}`,
            });
        }

        // 5. Insert skills if provided (with vector embeddings)
        if (skills && Array.isArray(skills) && skills.length > 0) {
            const skillValidation = validateAndNormalizeSkills(skills);
            if (!skillValidation.valid || !skillValidation.normalizedSkills) {
                await db.from('employees').delete().eq('employee_id', employee.employee_id).eq('company_id', user.companyId);
                await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
                return res.status(400).json({
                    success: false,
                    message: skillValidation.message || 'Invalid skills payload.',
                });
            }

            // Generate all embeddings in parallel
            const skillRows = await Promise.all(
                skillValidation.normalizedSkills.map(async s => {
                    let embedding: number[] | null = null;
                    try {
                        embedding = await generateSkillEmbedding(s.skill_name, s.proficiency);
                    } catch (embErr: any) {
                        console.warn('Embedding generation failed for', s.skill_name, embErr.message);
                    }
                    return {
                        employee_id: employee.employee_id,
                        company_id: user.companyId,
                        skill_name: s.skill_name,
                        proficiency: s.proficiency,
                        last_used_date: s.last_used_date,
                        embedding: embedding ? JSON.stringify(embedding) : null,
                    };
                })
            );

            await db.from('skills').insert(skillRows);
        }

        await syncAvailabilityWindows(db, employee.employee_id, user.companyId, user.userId, availabilityWindows);

        if (requestId) {
            await db
                .from('employee_requests')
                .update({
                    created_employee_id: employee.employee_id,
                    updated_at: new Date().toISOString(),
                })
                .eq('request_id', requestId);
        }

        // 6. Send Supabase Reset Password Email as Onboarding
        const resetData = await sendPasswordSetupEmail(workEmail);
        const emailResult = {
            success: !resetData.error,
            inviteUserId: authUser.user.id,
            message: resetData.error
                ? getInviteEmailFailureMessage(workEmail)
                : getInviteEmailSentMessage(workEmail),
        };

        // 7. Audit log
        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.EMPLOYEE_CREATED,
            targetId: employee.employee_id,
            companyId: user.companyId,
            metadata: { department, seniorityLevel: seniorityLevel || 'mid' }
        });

        res.status(201).json({
            success: true,
            message: 'Employee created successfully.',
            employee: {
                employeeId: employee.employee_id,
                displayId: hashForDisplay(employee.employee_id),
                department,
            },
            onboarding: emailResult,
        });
    } catch (err: any) {
        console.error('Create employee error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to create employee.' });
    }
});

router.post('/resend-invite', requireAuth, requireRole('hr'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required.',
            });
        }

        const { data: targetUser, error: targetUserError } = await db
            .from('users')
            .select('user_id, role')
            .eq('company_id', user.companyId)
            .eq('user_id', userId)
            .single();

        if (targetUserError || !targetUser || !['employee', 'manager'].includes(targetUser.role)) {
            return res.status(404).json({
                success: false,
                message: 'User not found for this company.',
            });
        }

        const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
        const email = authUserData?.user?.email?.toLowerCase().trim();

        if (authUserError || !email) {
            return res.status(404).json({
                success: false,
                message: 'User email not found.',
            });
        }

        const inviteResult = await sendPasswordSetupEmail(email);

        if (inviteResult.error) {
            return res.status(500).json({
                success: false,
                message: `Failed to resend invite email to ${email}.`,
            });
        }

        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.INVITE_RESENT,
            targetId: userId,
            companyId: user.companyId,
            metadata: { role: targetUser.role }
        });

        return res.json({
            success: true,
            message: getInviteEmailSentMessage(email),
        });
    } catch (err: any) {
        console.error('Resend invite error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to resend invite email.',
        });
    }
});

/**
 * GET /api/employees
 * List employees — scoped by role:
 *   HR: all employees in company
 *   Manager: approved team members only
 *   Employee: own profile only
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const companySecret = getCompanySecret(req);
        const { department, seniority, archived } = req.query;
        const includeArchived = archived === 'true' && user.role === 'hr';

        let query = db
            .from('employees')
            .select('*')
            .eq('company_id', user.companyId);

        if (user.role === 'manager') {
            const visibleEmployeeIds = await getManagerVisibleEmployeeIds(db, user.companyId, user.userId);

            if (visibleEmployeeIds.length === 0) {
                return res.json({ success: true, employees: [], total: 0 });
            }

            query = query.in('employee_id', visibleEmployeeIds);
        }

        if (user.role === 'employee') {
            query = query.eq('user_id', user.userId);
        }

        // Filters
        if (!includeArchived) {
            query = query.eq('is_archived', false);
        }
        if (department) {
            query = query.eq('department', department);
        }
        if (seniority) {
            query = query.eq('seniority_level', seniority);
        }

        const { data: employees, error } = await query;

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        // Decrypt and format all employees
        const formatted = await Promise.all(
            (employees || []).map(emp => formatEmployeeResponse(db, emp, user.companyId, user.role, companySecret))
        );

        res.json({
            success: true,
            employees: formatted,
            total: formatted.length,
        });
    } catch (err: any) {
        console.error('List employees error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch employees.' });
    }
});

/**
 * GET /api/employees/:id
 * Get single employee by employee_id — role-scoped.
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const companySecret = getCompanySecret(req);
        const { id } = req.params;

        if (user.role === 'manager') {
            const visibleEmployeeIds = await getManagerVisibleEmployeeIds(db, user.companyId, user.userId);
            if (!visibleEmployeeIds.includes(id)) {
                return res.status(404).json({ success: false, message: 'Employee not found.' });
            }
        }

        let query = db
            .from('employees')
            .select('*')
            .eq('employee_id', id)
            .eq('company_id', user.companyId);

        if (user.role === 'employee') {
            query = query.eq('user_id', user.userId).eq('is_archived', false);
        }

        const { data: emp, error } = await query.single();

        if (error || !emp) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        const formatted = await formatEmployeeResponse(db, emp, user.companyId, user.role, companySecret);
        res.json({ success: true, employee: formatted });
    } catch (err: any) {
        console.error('Get employee error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch employee.' });
    }
});

/**
 * PUT /api/employees/:id
 * Update employee.
 *   HR: can update all fields
 *   Employee: can update skills, location, travelEligible, availability
 */
router.put('/:id', requireAuth, requireRole('hr', 'employee'), validate(updateEmployeeSchema), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const companySecret = getCompanySecret(req);
        const { id } = req.params;

        // Verify company ownership
        const { data: existing, error: findError } = await db
            .from('employees')
            .select('employee_id, user_id, company_id, is_archived')
            .eq('employee_id', id)
            .eq('company_id', user.companyId)
            .single();

        if (findError || !existing) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        if (existing.is_archived) {
            return res.status(400).json({ success: false, message: 'Archived employees cannot be updated.' });
        }

        // Employee can only update their own profile
        if (user.role === 'employee' && existing.user_id !== user.userId) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const updates: any = {};
        const {
            name, workEmail, department, seniorityLevel, costPerDay,
            location, travelEligible, performanceScore, skills,
            availabilityFrom, availabilityTo, availabilityWindows, tenureYears, currentProjectLoad,
        } = req.body;

        if (
            availabilityFrom !== undefined &&
            availabilityTo !== undefined &&
            availabilityFrom &&
            availabilityTo &&
            new Date(availabilityFrom) > new Date(availabilityTo)
        ) {
            return res.status(400).json({
                success: false,
                message: 'availabilityFrom must be before availabilityTo.',
            });
        }

        if (location !== undefined && String(location).length > 120) {
            return res.status(400).json({
                success: false,
                message: 'location must be 120 characters or fewer.',
            });
        }

        if (
            (name !== undefined && String(name).trim().length > MAX_NAME_LENGTH) ||
            (workEmail !== undefined && String(workEmail).trim().length > MAX_EMAIL_LENGTH) ||
            (department !== undefined && String(department).trim().length > MAX_DEPARTMENT_LENGTH)
        ) {
            return res.status(400).json({
                success: false,
                message: 'name, workEmail, and department must be within allowed length limits.',
            });
        }

        const isUpdatingProtectedFields = (
            name !== undefined ||
            workEmail !== undefined ||
            costPerDay !== undefined ||
            performanceScore !== undefined
        );
        if (isUpdatingProtectedFields && user.role !== 'hr') {
            return res.status(403).json({
                success: false,
                message: 'Only HR can update protected employee fields.',
            });
        }
        if (isUpdatingProtectedFields && !companySecret) {
            return res.status(400).json({
                success: false,
                message: 'Company secret is required when updating protected employee fields.',
            });
        }

        // HR can update everything
        if (user.role === 'hr') {
            if (name) updates.name_encrypted = await encrypt(name, user.companyId, companySecret);
            if (workEmail) updates.work_email_encrypted = await encrypt(workEmail, user.companyId, companySecret);
            if (department) updates.department = department;
            if (seniorityLevel) updates.seniority_level = seniorityLevel;
            if (costPerDay !== undefined) updates.cost_per_day_encrypted = await encrypt(String(costPerDay), user.companyId, companySecret);
            if (performanceScore !== undefined) updates.performance_score_encrypted = await encrypt(String(performanceScore), user.companyId, companySecret);
            if (tenureYears !== undefined) updates.tenure_years = tenureYears;
            if (currentProjectLoad !== undefined) updates.current_project_load = currentProjectLoad;
        }

        // Both HR and Employee can update these
        if (location) updates.location = location;
        if (travelEligible !== undefined) updates.travel_eligible = travelEligible;
        if (availabilityFrom !== undefined) updates.availability_from = availabilityFrom;
        if (availabilityTo !== undefined) updates.availability_to = availabilityTo;

        // Update employee record
        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await db
                .from('employees')
                .update(updates)
                .eq('employee_id', id)
                .eq('company_id', user.companyId);

            if (updateError) {
                return res.status(500).json({ success: false, message: (updateError as any).message });
            }
        }

        // Update skills if provided (with vector embeddings)
        if (skills && Array.isArray(skills)) {
            const skillValidation = validateAndNormalizeSkills(skills);
            if (!skillValidation.valid || !skillValidation.normalizedSkills) {
                return res.status(400).json({
                    success: false,
                    message: skillValidation.message || 'Invalid skills payload.',
                });
            }

            // Delete existing skills and re-insert
            await db
                .from('skills')
                .delete()
                .eq('employee_id', id)
                .eq('company_id', user.companyId);

            if (skillValidation.normalizedSkills.length > 0) {
                // Generate all embeddings in parallel
                const skillRows = await Promise.all(
                    skillValidation.normalizedSkills.map(async s => {
                        let embedding: number[] | null = null;
                        try {
                            embedding = await generateSkillEmbedding(s.skill_name, s.proficiency);
                        } catch (embErr: any) {
                            console.warn('Embedding generation failed for', s.skill_name, embErr.message);
                        }
                        return {
                            employee_id: id,
                            company_id: user.companyId,
                            skill_name: s.skill_name,
                            proficiency: s.proficiency,
                            last_used_date: s.last_used_date,
                            embedding: embedding ? JSON.stringify(embedding) : null,
                        };
                    })
                );
                await db.from('skills').insert(skillRows);
            }
        }

        await syncAvailabilityWindows(db, id, user.companyId, user.userId, availabilityWindows);

        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.EMPLOYEE_EDITED,
            targetId: id,
            companyId: user.companyId,
            metadata: { fieldsUpdated: Object.keys(updates) }
        });

        res.json({ success: true, message: 'Employee updated successfully.' });
    } catch (err: any) {
        console.error('Update employee error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to update employee.' });
    }
});

/**
 * DELETE /api/employees/:id
 * Soft delete (archive) — HR only. Never hard delete.
 */
router.delete('/:id', requireAuth, requireRole('hr'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const db = supabaseAdmin;
        const { id } = req.params;

        const { data: archivedEmployee, error } = await db
            .from('employees')
            .update({ is_archived: true })
            .eq('employee_id', id)
            .eq('company_id', user.companyId)
            .eq('is_archived', false)
            .select('employee_id')
            .single();

        if (error && error.code !== 'PGRST116') {
            return res.status(500).json({ success: false, message: error.message });
        }

        if (!archivedEmployee) {
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: AuditActions.EMPLOYEE_ARCHIVED,
            targetId: id,
            companyId: user.companyId
        });

        res.json({ success: true, message: 'Employee archived.' });
    } catch (err: any) {
        console.error('Archive employee error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to archive employee.' });
    }
});

export default router;
