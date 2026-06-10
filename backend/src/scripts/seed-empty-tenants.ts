/**
 * Seeds accurate demo workforce data into existing empty tenants.
 *
 * This does not create frontend mock data. It writes real rows to Neon tables
 * used by dashboards: users, employees, skills, projects, teams,
 * team_memberships, assignments, availability_window, and employee_cvs.
 */
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import { encrypt } from '../services/encryption.service.js';

const DEMO_PASSWORD = 'DemoPass123!';
const SALT_ROUNDS = 12;

type Seniority = 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
type Proficiency = 'beginner' | 'intermediate' | 'expert';

const departments = ['Engineering', 'Product', 'Design', 'Data', 'DevOps', 'QA', 'Security', 'Customer Success'];
const employees = [
    ['Aarav Mehta', 'Engineering', 'lead', 4.7, ['React', 'TypeScript', 'System Design']],
    ['Nisha Rao', 'Engineering', 'senior', 4.5, ['Python', 'PostgreSQL', 'API Design']],
    ['Ishaan Kapoor', 'Product', 'mid', 4.0, ['Roadmapping', 'Analytics', 'Agile']],
    ['Aditi Menon', 'Design', 'senior', 4.6, ['Figma', 'Design Systems', 'User Research']],
    ['Rohan Malhotra', 'DevOps', 'principal', 4.8, ['AWS', 'Kubernetes', 'Terraform']],
    ['Parth Sharma', 'DevOps', 'mid', 4.1, ['Docker', 'CI/CD', 'Monitoring']],
    ['Maya Iyer', 'Data', 'senior', 4.4, ['SQL', 'Power BI', 'Forecasting']],
    ['Tanya Gupta', 'QA', 'mid', 4.0, ['Automation', 'Playwright', 'Regression Testing']],
    ['Dev Patel', 'Security', 'senior', 4.3, ['Security Review', 'IAM', 'Threat Modeling']],
    ['Omkar Reddy', 'Customer Success', 'mid', 3.9, ['Onboarding', 'CRM', 'Stakeholder Management']],
    ['Sanya Chopra', 'Engineering', 'junior', 3.8, ['JavaScript', 'CSS', 'React']],
    ['Kabir Sen', 'Product', 'lead', 4.5, ['Program Management', 'Scrum', 'Prioritization']],
    ['Farah Qureshi', 'Data', 'mid', 4.2, ['Python', 'Machine Learning', 'Data Quality']],
    ['Sara Khan', 'QA', 'senior', 4.4, ['Test Strategy', 'Cypress', 'Accessibility']],
    ['Manav Singh', 'Customer Success', 'junior', 3.7, ['Support Ops', 'Documentation', 'Training']],
] as Array<[string, string, Seniority, number, string[]]>;

const projects = [
    ['Atlas Workforce Intelligence', 'active', [['React', 'expert', 2], ['Python', 'intermediate', 2], ['SQL', 'intermediate', 1]]],
    ['Nimbus Reliability Sprint', 'active', [['AWS', 'expert', 1], ['Kubernetes', 'expert', 1], ['Automation', 'intermediate', 1]]],
    ['Pulse Enterprise Migration', 'planned', [['Program Management', 'expert', 1], ['Security Review', 'intermediate', 1], ['Data Quality', 'intermediate', 1]]],
    ['Sutra Partner Launch', 'active', [['Figma', 'expert', 1], ['React', 'intermediate', 1], ['CRM', 'intermediate', 1]]],
    ['Helios Compliance Review', 'planned', [['IAM', 'expert', 1], ['Threat Modeling', 'intermediate', 1], ['Documentation', 'intermediate', 1]]],
] as const;

function id() {
    return crypto.randomUUID();
}

function slugify(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'tenant';
}

function tenantSlug(company: { company_id: string; company_name: string }) {
    return `${slugify(company.company_name)}${company.company_id.replace(/-/g, '').slice(0, 6)}`;
}

function date(offsetDays: number) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
}

function samplePdfBase64(name: string) {
    const escaped = name.replace(/[()\\]/g, '');
    const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 82 >>
stream
BT /F1 18 Tf 72 720 Td (${escaped} - Demo Resume) Tj 0 -28 Td (Mapping Nexus seeded PDF profile.) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
trailer
<< /Root 1 0 R /Size 6 >>
startxref
560
%%EOF`;
    return Buffer.from(pdf).toString('base64');
}

async function upsertUser(email: string, role: 'manager' | 'employee', companyId: string, passwordHash: string) {
    const result = await pool.query(
        `INSERT INTO public.users (user_id, email, password_hash, company_id, role, status)
         VALUES ($1, $2, $3, $4, $5, 'active')
         ON CONFLICT (email) DO UPDATE SET
            company_id = EXCLUDED.company_id,
            role = EXCLUDED.role,
            status = 'active'
         RETURNING user_id`,
        [id(), email, passwordHash, companyId, role]
    );
    return result.rows[0].user_id as string;
}

async function seedCompany(company: { company_id: string; company_name: string }) {
    const forceReseed = process.env.FORCE_RESEED_DEMO === 'true';
    const existing = await pool.query(
        'SELECT COUNT(*)::int AS count FROM public.employees WHERE company_id = $1 AND is_archived = false',
        [company.company_id]
    );
    if (!forceReseed && existing.rows[0].count >= employees.length) {
        console.log(`Skipping ${company.company_name}: already has ${existing.rows[0].count} employees.`);
        return;
    }

    const slug = tenantSlug(company);
    const legacySlug = slugify(company.company_name);
    if (forceReseed || existing.rows[0].count > 0) {
        console.log(`Repairing partial demo seed for ${company.company_name}: found ${existing.rows[0].count} employees.`);
        await pool.query('DELETE FROM public.employee_requests WHERE company_id = $1', [company.company_id]);
        await pool.query('DELETE FROM public.employee_cvs WHERE company_id = $1', [company.company_id]);
        await pool.query('DELETE FROM public.availability_window WHERE company_id = $1', [company.company_id]);
        await pool.query('DELETE FROM public.skills WHERE company_id = $1', [company.company_id]);
        await pool.query('DELETE FROM public.team_memberships WHERE company_id = $1', [company.company_id]);
        await pool.query('DELETE FROM public.assignments WHERE company_id = $1', [company.company_id]);
        await pool.query('DELETE FROM public.employees WHERE company_id = $1', [company.company_id]);
        await pool.query('DELETE FROM public.projects WHERE company_id = $1', [company.company_id]);
        await pool.query('DELETE FROM public.teams WHERE company_id = $1', [company.company_id]);
        await pool.query('DELETE FROM public.users WHERE company_id = $1 AND email LIKE $2', [company.company_id, `%@${slug}.demo`]);
        await pool.query('DELETE FROM public.users WHERE company_id = $1 AND email LIKE $2', [company.company_id, `%@${legacySlug}.demo`]);
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
    const managers: string[] = [];

    for (let i = 1; i <= 3; i += 1) {
        managers.push(await upsertUser(`manager${i}@${slug}.demo`, 'manager', company.company_id, passwordHash));
    }

    const teamIds: string[] = [];
    for (let i = 0; i < managers.length; i += 1) {
        const team = await pool.query(
            `INSERT INTO public.teams (team_id, manager_id, company_id, team_name)
             VALUES ($1, $2, $3, $4)
             RETURNING team_id`,
            [id(), managers[i], company.company_id, `${departments[i]} Delivery Team`]
        );
        teamIds.push(team.rows[0].team_id);
    }

    const projectIds: string[] = [];
    for (let i = 0; i < projects.length; i += 1) {
        const [name, status, requiredSkills] = projects[i];
        const project = await pool.query(
            `INSERT INTO public.projects (project_id, company_id, project_name, required_skills, start_date, end_date, status)
             VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
             RETURNING project_id`,
            [
                id(),
                company.company_id,
                name,
                JSON.stringify(requiredSkills.map(skill => ({ skill_name: skill[0], proficiency: skill[1], count: skill[2] }))),
                date(-10 + i * 3),
                date(45 + i * 12),
                status,
            ]
        );
        projectIds.push(project.rows[0].project_id);
    }

    for (let i = 0; i < employees.length; i += 1) {
        const [name, department, seniority, performanceScore, skillNames] = employees[i];
        const email = `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/\.$/, '')}@${slug}.demo`;
        const userId = await upsertUser(email, 'employee', company.company_id, passwordHash);
        const encryptedName = await encrypt(name, company.company_id);
        const encryptedEmail = await encrypt(email, company.company_id);
        const encryptedCost = await encrypt(String(8500 + i * 750), company.company_id);
        const encryptedPerformance = await encrypt(String(performanceScore), company.company_id);

        const employee = await pool.query(
            `INSERT INTO public.employees (
                employee_id, user_id, company_id, name_encrypted, work_email_encrypted,
                cost_per_day_encrypted, performance_score_encrypted, department,
                seniority_level, location, travel_eligible, tenure_years,
                current_project_load, capacity_committed_pct, last_assignment_date
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, 0, NULL)
             RETURNING employee_id`,
            [
                id(),
                userId,
                company.company_id,
                encryptedName,
                encryptedEmail,
                encryptedCost,
                encryptedPerformance,
                department,
                seniority,
                ['Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune'][i % 5],
                i % 3 !== 0,
                Number((0.8 + i * 0.35).toFixed(1)),
            ]
        );

        const employeeId = employee.rows[0].employee_id as string;
        const teamId = teamIds[i % teamIds.length];
        const managerId = managers[i % managers.length];

        await pool.query(
            `INSERT INTO public.team_memberships
                (membership_id, team_id, employee_id, company_id, status, requested_by, reviewed_by, review_note, reviewed_at)
             VALUES ($1, $2, $3, $4, 'approved', $5, $5, 'Seeded demo team membership.', now())`,
            [id(), teamId, employeeId, company.company_id, managerId]
        );

        const assignmentCount = i % 5 === 0 ? 2 : i % 4 === 0 ? 0 : 1;
        for (let a = 0; a < assignmentCount; a += 1) {
            await pool.query(
                `INSERT INTO public.assignments (assignment_id, employee_id, project_id, company_id, assigned_by, start_date, end_date)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [id(), employeeId, projectIds[(i + a) % projectIds.length], company.company_id, managerId, date(-12 + i), date(45 + i * 2)]
            );
        }

        await pool.query(
            `UPDATE public.employees
             SET current_project_load = $1,
                 capacity_committed_pct = LEAST(100, $1 * 25),
                 last_assignment_date = CASE WHEN $1 > 0 THEN CURRENT_DATE ELSE NULL END
             WHERE employee_id = $2`,
            [assignmentCount, employeeId]
        );

        for (const [index, skillName] of skillNames.entries()) {
            await pool.query(
                `INSERT INTO public.skills (skill_id, employee_id, company_id, skill_name, proficiency, last_used_date, embedding)
                 VALUES ($1, $2, $3, $4, $5, $6, NULL)`,
                [id(), employeeId, company.company_id, skillName.toLowerCase(), (index === 0 ? 'expert' : 'intermediate') satisfies Proficiency, date(-8 - index * 11)]
            );
        }

        if (i < 6) {
            await pool.query(
                `INSERT INTO public.employee_cvs
                    (employee_id, company_id, file_name, mime_type, file_data_base64, uploaded_by, uploaded_at)
                 VALUES ($1, $2, $3, 'application/pdf', $4, $5, now())`,
                [employeeId, company.company_id, `${name.replace(/\s+/g, '-')}-Resume.pdf`, samplePdfBase64(name), managers[0]]
            );
        }

        if (i % 6 === 0) {
            await pool.query(
                `INSERT INTO public.availability_window
                    (availability_window_id, employee_id, company_id, window_type, start_date, end_date, note, created_by)
                 VALUES ($1, $2, $3, 'project_commitment', $4, $5, $6, $7)`,
                [id(), employeeId, company.company_id, date(5), date(18), 'Seeded project commitment window.', managers[0]]
            );
        }
    }

    await pool.query(
        `INSERT INTO public.employee_requests
            (request_id, company_id, manager_id, requested_role, skills_required, priority, status, review_note)
         VALUES ($1, $2, $3, 'Senior Backend Engineer', $4::jsonb, 'high', 'Pending', 'Seeded staffing request for dashboard demo.')`,
        [id(), company.company_id, managers[0], JSON.stringify([{ skill_name: 'node.js', proficiency: 'expert', count: 1 }])]
    );

    console.log(`Seeded ${company.company_name}: 3 managers, 15 employees, 5 projects, teams, assignments, skills, resumes.`);
}

async function main() {
    const forceReseed = process.env.FORCE_RESEED_DEMO === 'true';
    const companies = forceReseed
        ? await pool.query(
            `SELECT company_id, company_name
             FROM public.companies
             WHERE company_name <> 'Asteria Digital Operations Pvt Ltd'
             ORDER BY created_at DESC`
        )
        : await pool.query(
            `SELECT c.company_id, c.company_name
             FROM public.companies c
             LEFT JOIN public.employees e ON e.company_id = c.company_id AND e.is_archived = false
             GROUP BY c.company_id, c.company_name
             HAVING COUNT(e.employee_id) < $1
             ORDER BY c.created_at DESC`,
            [employees.length]
        );

    if (companies.rows.length === 0) {
        console.log('No empty tenants found. Nothing to seed.');
        return;
    }

    for (const company of companies.rows) {
        await seedCompany(company);
    }

    console.log(`Password for seeded demo managers/employees: ${DEMO_PASSWORD}`);
}

main()
    .catch(err => {
        console.error('Seed empty tenants failed:', err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });
