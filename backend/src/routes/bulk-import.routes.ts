import { supabaseAdmin } from '../config/supabase.js';
import bcrypt from 'bcrypt';
/**
 * Bulk Import Routes — CSV employee upload
 *
 * POST /api/employees/bulk-import — HR uploads CSV, creates all accounts
 *
 * Expected CSV columns (header row required):
 *   name, email, department, seniority, location, costPerDay, skills, travelEligible, performanceScore, tenureYears
 *
 * "skills" column: semicolon-separated (e.g. "Python;React;AWS")
 * "travelEligible" column: "true" or "false"
 *
 * SECURITY:
 *   - HR only (requireRole('hr'))
 *   - Company-scoped (all employees created under HR's company)
 *   - Each employee gets a unique auth account + encrypted PII
 *   - Embeddings generated for all skills
 */
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool, query } from '../config/db.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { encryptFields } from '../services/encryption.service.js';
import { logAction, AuditActions } from '../services/audit.service.js';
import { generateSkillEmbedding } from '../services/embedding.service.js';
import {
    sendPasswordSetupEmail,
    getInviteEmailFailureMessage,
    getInviteEmailSentMessage,
} from '../services/password-reset.service.js';

const router = Router();

function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pw = '';
    const bytes = crypto.randomBytes(16);
    for (let i = 0; i < 16; i++) pw += chars[bytes[i] % chars.length];
    return pw;
}

/**
 * Parse CSV text into array of row objects.
 * Handles quoted fields with commas inside.
 */
function parseCSV(text: string): Record<string, string>[] {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return []; // need header + at least 1 row

    // Parse a single CSV line respecting quoted fields
    function parseLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // skip escaped quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current.trim());
        return result;
    }

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);
        if (values.length === 0 || (values.length === 1 && !values[0])) continue;
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
        rows.push(row);
    }

    return rows;
}

/**
 * POST /api/employees/bulk-import
 * HR uploads CSV text in request body → system creates all accounts.
 */
router.post('/', requireAuth, requireRole('hr'), async (req: Request, res: Response) => {
    try {
        const user = (req as AuthenticatedRequest).user;
        const { csv, role: targetRole } = req.body;

        if (!csv || typeof csv !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Request body must include "csv" field with CSV text content.',
            });
        }

        const assignRole: 'employee' | 'manager' = targetRole === 'manager' ? 'manager' : 'employee';
        const rows = parseCSV(csv);

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'CSV has no data rows. Ensure the file has a header row and at least one data row.',
            });
        }

        if (rows.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 500 employees per import. Split your CSV into batches.',
            });
        }

        // Validate required columns exist
        const firstRow = rows[0];
        if (!('name' in firstRow) || !('email' in firstRow) || !('department' in firstRow)) {
            return res.status(400).json({
                success: false,
                message: 'CSV must have columns: name, email, department. Found: ' + Object.keys(firstRow).join(', '),
            });
        }

        const results: {
            row: number;
            email: string;
            status: 'created' | 'failed';
            onboarding?: string;
            error?: string;
        }[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const name = row.name || '';
            const email = (row.email || '').toLowerCase().trim();
            const department = row.department || '';

            if (!name || !email || !department) {
                results.push({ row: i + 2, email: email || '(empty)', status: 'failed', error: 'Missing name, email, or department' });
                continue;
            }

            try {
                // 1. Generate temp password
                const tempPassword = generateTempPassword();

                // 2. Create auth account
                const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: { company_id: user.companyId, role: assignRole },
                });

                if (authError) {
                    results.push({ row: i + 2, email, status: 'failed', error: (authError as any).message });
                    continue;
                }

                // 3. If manager, the auth trigger already creates the users row.
                if (assignRole === 'manager') {
                    const inviteResult = await sendPasswordSetupEmail(email);
                    results.push({
                        row: i + 2,
                        email,
                        status: 'created',
                        onboarding: inviteResult.error
                            ? getInviteEmailFailureMessage(email)
                            : getInviteEmailSentMessage(email),
                    });
                    continue; // Managers don't get employee records
                }

                // 4. Encrypt PII
                const costPerDay = row.costperday ? parseFloat(row.costperday) : null;
                const performanceScore = row.performancescore ? parseFloat(row.performancescore) : null;
                const encrypted = await encryptFields({
                    name_encrypted: name,
                    work_email_encrypted: email,
                    cost_per_day_encrypted: costPerDay,
                    performance_score_encrypted: performanceScore,
                }, user.companyId);

                // 5. Insert employee record
                const seniority = row.seniority || 'mid';
                const location = row.location || 'Remote';
                const travelEligible = row.traveleligible === 'true' || row.traveleligible === 'yes';
                const tenureYears = row.tenureyears ? parseFloat(row.tenureyears) : 0;

                const { data: employee, error: empError } = await supabaseAdmin
                    .from('employees')
                    .insert({
                        user_id: authUser.user.id,
                        company_id: user.companyId,
                        name_encrypted: encrypted.name_encrypted,
                        work_email_encrypted: encrypted.work_email_encrypted,
                        cost_per_day_encrypted: encrypted.cost_per_day_encrypted,
                        performance_score_encrypted: encrypted.performance_score_encrypted,
                        department,
                        seniority_level: seniority,
                        location,
                        travel_eligible: travelEligible,
                        tenure_years: tenureYears,
                    })
                    .select()
                    .single();

                if (empError) {
                    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
                    results.push({ row: i + 2, email, status: 'failed', error: (empError as any).message });
                    continue;
                }

                // 6. Parse and insert skills with embeddings
                const skillsRaw = row.skills || '';
                const skillNames = skillsRaw.split(';').map(s => s.trim()).filter(Boolean);

                if (skillNames.length > 0) {
                    const skillRowsRowsRaw = await Promise.all(skillNames.map(async (skillName) => {
                        let embedding: number[] | null = null;
                        try {
                            embedding = await generateSkillEmbedding(skillName, 'intermediate');
                        } catch { /* non-fatal */ }
                        return {
                            employee_id: employee.employee_id,
                            company_id: user.companyId,
                            skill_name: skillName,
                            proficiency: 'intermediate',
                            last_used_date: new Date().toISOString().split('T')[0],
                            embedding: embedding ? JSON.stringify(embedding) : null,
                        } as any;
                    }));
                    await supabaseAdmin.from('skills').insert(skillRowsRowsRaw);
                }

                const inviteResult = await sendPasswordSetupEmail(email);
                results.push({
                    row: i + 2,
                    email,
                    status: 'created',
                    onboarding: inviteResult.error
                        ? getInviteEmailFailureMessage(email)
                        : getInviteEmailSentMessage(email),
                });

            } catch (err: any) {
                results.push({ row: i + 2, email, status: 'failed', error: err.message });
            }
        }

        const created = results.filter(r => r.status === 'created').length;
        const failed = results.filter(r => r.status === 'failed').length;

        // Audit log
        await logAction({
            actorId: user.userId,
            actorRole: user.role,
            action: 'bulk_import',
            companyId: user.companyId,
            metadata: { totalRows: rows.length, created, failed, role: assignRole },
        });

        res.json({
            success: true,
            message: `Import complete: ${created} created, ${failed} failed out of ${rows.length} rows.`,
            summary: { total: rows.length, created, failed },
            results,
        });
    } catch (err: any) {
        console.error('Bulk import error:', err.message);
        res.status(500).json({ success: false, message: 'Bulk import failed: ' + err.message });
    }
});

export default router;
