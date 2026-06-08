/**
 * Seed Test Employees — Dev / QA
 *
 * Creates ONE test company ("Acme Corp") with:
 *   - 1 HR admin       →  hr@acme.test          / Test1234!
 *   - 2 Managers       →  manager1@acme.test     / Test1234!
 *                         manager2@acme.test     / Test1234!
 *   - 60 Employees     →  <first>.<last><N>@acme.test / Test1234!
 *
 * All PII encrypted via KEK-based DEK (no company secret required).
 * Each employee gets 2-5 random skills.
 *
 * Run:
 *   npx tsx src/scripts/seed-test-employees.ts
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import { encrypt } from '../services/encryption.service.js';

// ── Config ───────────────────────────────────────────────────────────────────

const COMPANY_NAME   = 'Acme Corp';
const PASSWORD       = 'Test1234!';
const EMPLOYEE_COUNT = 60;
const BCRYPT_ROUNDS  = 10;

// ── Data pools ───────────────────────────────────────────────────────────────

const FIRST_NAMES = [
    'Aarav', 'Aditi', 'Aditya', 'Akash', 'Ananya', 'Amit', 'Anisha', 'Arjun',
    'Bhavna', 'Chetan', 'Deepa', 'Divya', 'Esha', 'Gaurav', 'Geeta', 'Harish',
    'Ishaan', 'Jaya', 'Karan', 'Kavya', 'Lakshmi', 'Manoj', 'Meera', 'Mohan',
    'Nandini', 'Neha', 'Nikhil', 'Pallavi', 'Pooja', 'Prateek', 'Priya', 'Raj',
    'Rajesh', 'Ravi', 'Rekha', 'Rohit', 'Sakshi', 'Sandeep', 'Sanjay', 'Sarita',
    'Shikha', 'Shivam', 'Shreya', 'Siddharth', 'Sneha', 'Sunil', 'Swati', 'Tanvi',
    'Usha', 'Varun', 'Vijay', 'Vikram', 'Yash', 'Arun', 'Aparna', 'Harsh',
    'Isha', 'Manish', 'Nisha', 'Rahul',
];

const LAST_NAMES = [
    'Agarwal', 'Banerjee', 'Bhat', 'Chakraborty', 'Choudhury', 'Das', 'Desai',
    'Deshpande', 'Ghosh', 'Gupta', 'Iyer', 'Jain', 'Jha', 'Joshi', 'Kapoor',
    'Khan', 'Kumar', 'Malhotra', 'Mehta', 'Mishra', 'Mukherjee', 'Nair',
    'Pandey', 'Patel', 'Rao', 'Reddy', 'Roy', 'Saxena', 'Shah', 'Sharma',
    'Singh', 'Srinivasan', 'Thakur', 'Trivedi', 'Verma', 'Yadav',
];

const DEPARTMENTS = [
    'Engineering', 'Product', 'Design', 'Data', 'DevOps',
    'HR', 'Finance', 'Marketing', 'Operations', 'Customer Success',
];

const ROLES = [
    'Software Engineer', 'Backend Engineer', 'Frontend Engineer', 'Full Stack Developer',
    'Data Scientist', 'UX Designer', 'Product Manager', 'SRE', 'DevOps Engineer',
    'Data Analyst', 'HR Specialist', 'Finance Analyst', 'Marketing Manager',
    'Operations Manager', 'Customer Success Manager',
];

const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'lead', 'principal'] as const;

const CITIES = [
    'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai',
    'Pune', 'Kolkata', 'Ahmedabad', 'Noida', 'Remote',
];

const SKILLS: [string, string][] = [
    ['React', 'expert'],         ['TypeScript', 'expert'],    ['Python', 'intermediate'],
    ['AWS', 'expert'],           ['Docker', 'intermediate'],  ['PostgreSQL', 'expert'],
    ['GraphQL', 'intermediate'], ['Figma', 'expert'],         ['Next.js', 'intermediate'],
    ['Terraform', 'expert'],     ['CI/CD', 'intermediate'],   ['Node.js', 'expert'],
    ['Machine Learning', 'intermediate'], ['Rust', 'beginner'], ['Vue.js', 'intermediate'],
    ['Go', 'intermediate'],      ['Redis', 'intermediate'],   ['Kafka', 'expert'],
    ['Kubernetes', 'intermediate'], ['SQL', 'expert'],        ['Elasticsearch', 'beginner'],
    ['Power BI', 'intermediate'], ['Tableau', 'intermediate'], ['Java', 'expert'],
    ['Spring Boot', 'intermediate'], ['MongoDB', 'intermediate'], ['Agile', 'expert'],
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number): string {
    const d = new Date();
    d.setDate(d.getDate() - randomInt(0, daysBack));
    return d.toISOString().split('T')[0];
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n' + '═'.repeat(60));
    console.log('  🌱  Mapping Nexus — Test Employee Seeder');
    console.log('═'.repeat(60));

    const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);
    console.log(`\n🔐 Password hash generated for "${PASSWORD}"`);

    const client = await pool.connect();
    try {
        // ── Step 1: Company — find existing or create new ────────────────────
        let companyId: string;
        const existing = await client.query(
            `SELECT company_id FROM public.companies WHERE company_name = $1 LIMIT 1`,
            [COMPANY_NAME]
        );

        if (existing.rows.length > 0) {
            companyId = existing.rows[0].company_id;
            console.log(`\n📌 Using existing company: "${COMPANY_NAME}" (${companyId})`);
        } else {
            const created = await client.query(
                `INSERT INTO public.companies (company_name) VALUES ($1) RETURNING company_id`,
                [COMPANY_NAME]
            );
            companyId = created.rows[0].company_id;
            console.log(`\n✅ Created company: "${COMPANY_NAME}" (${companyId})`);
        }

        // ── Step 2: HR Admin ─────────────────────────────────────────────────
        const hrEmail = 'hr@acme.test';
        const hrExisting = await client.query(
            `SELECT user_id FROM public.users WHERE email = $1`, [hrEmail]
        );
        if (hrExisting.rows.length === 0) {
            await client.query(
                `INSERT INTO public.users (user_id, email, password_hash, company_id, role)
                 VALUES ($1, $2, $3, $4, 'hr')`,
                [crypto.randomUUID(), hrEmail, passwordHash, companyId]
            );
            console.log(`  👤 HR created:  ${hrEmail}  /  ${PASSWORD}`);
        } else {
            // Update password in case it changed
            await client.query(
                `UPDATE public.users SET password_hash = $1 WHERE email = $2`,
                [passwordHash, hrEmail]
            );
            console.log(`  👤 HR exists:   ${hrEmail}  (password reset to ${PASSWORD})`);
        }

        // ── Step 3: Managers ─────────────────────────────────────────────────
        for (let i = 1; i <= 2; i++) {
            const mgrEmail = `manager${i}@acme.test`;
            const mgrExisting = await client.query(
                `SELECT user_id FROM public.users WHERE email = $1`, [mgrEmail]
            );
            if (mgrExisting.rows.length === 0) {
                await client.query(
                    `INSERT INTO public.users (user_id, email, password_hash, company_id, role)
                     VALUES ($1, $2, $3, $4, 'manager')`,
                    [crypto.randomUUID(), mgrEmail, passwordHash, companyId]
                );
                console.log(`  👤 Manager${i} created: ${mgrEmail}  /  ${PASSWORD}`);
            } else {
                await client.query(
                    `UPDATE public.users
                     SET password_hash = $1,
                         role = 'manager',
                         company_id = $2
                     WHERE email = $3`,
                    [passwordHash, companyId, mgrEmail]
                );
                console.log(`  👤 Manager${i} exists:  ${mgrEmail}  (role=manager, password reset to ${PASSWORD})`);
            }
        }

        // ── Step 4: Employees ────────────────────────────────────────────────
        console.log(`\n📊 Creating ${EMPLOYEE_COUNT} employees...`);

        const usedEmails = new Set<string>();
        let created = 0;
        let skipped = 0;

        for (let i = 0; i < EMPLOYEE_COUNT; i++) {
            const firstName = pick(FIRST_NAMES);
            const lastName  = pick(LAST_NAMES);
            const fullName  = `${firstName} ${lastName}`;

            // Unique email
            let suffix = randomInt(1, 999);
            let email  = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix}@acme.test`;
            while (usedEmails.has(email)) {
                suffix = randomInt(1, 9999);
                email  = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix}@acme.test`;
            }
            usedEmails.add(email);

            // Skip if user already exists
            const userCheck = await client.query(
                `SELECT user_id FROM public.users WHERE email = $1`, [email]
            );
            if (userCheck.rows.length > 0) { skipped++; continue; }

            const department  = pick(DEPARTMENTS);
            const seniority   = pick([...SENIORITY_LEVELS]);
            const location    = pick(CITIES);
            const costPerDay  = randomInt(2000, 25000);
            const perfScore   = +(Math.random() * 4 + 1).toFixed(2);
            const tenure      = +(Math.random() * 12).toFixed(1);
            const projectLoad = randomInt(0, 5);
            const capacity    = Math.min(100, projectLoad * 20 + randomInt(0, 30));

            // Encrypt PII using KEK-based DEK (no company secret)
            const nameEnc  = await encrypt(fullName,         companyId);
            const emailEnc = await encrypt(email,            companyId);
            const costEnc  = await encrypt(String(costPerDay), companyId);
            const perfEnc  = await encrypt(String(perfScore),  companyId);

            // Create auth user
            const userId = crypto.randomUUID();
            await client.query(
                `INSERT INTO public.users (user_id, email, password_hash, company_id, role)
                 VALUES ($1, $2, $3, $4, 'employee')`,
                [userId, email, passwordHash, companyId]
            );

            // Create employee profile linked to the user
            const empRes = await client.query(
                `INSERT INTO public.employees
                    (user_id, company_id,
                     name_encrypted, work_email_encrypted,
                     cost_per_day_encrypted, performance_score_encrypted,
                     department, seniority_level, location, travel_eligible,
                     current_project_load, capacity_committed_pct,
                     last_assignment_date, tenure_years, is_archived)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,FALSE)
                 RETURNING employee_id`,
                [
                    userId, companyId,
                    nameEnc, emailEnc,
                    costEnc, perfEnc,
                    department, seniority, location,
                    Math.random() > 0.4,
                    projectLoad, capacity,
                    projectLoad > 0 ? randomDate(60) : null,
                    tenure,
                ]
            );

            const employeeId = empRes.rows[0]?.employee_id;
            if (!employeeId) { skipped++; continue; }

            // Insert 2-5 random skills (plain INSERT, no unique constraint exists)
            const empSkills = pickN(SKILLS, randomInt(2, 5));
            for (const [skillName, proficiency] of empSkills) {
                await client.query(
                    `INSERT INTO public.skills
                        (employee_id, company_id, skill_name, proficiency, last_used_date)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [employeeId, companyId, skillName, proficiency, randomDate(randomInt(5, 180))]
                );
            }

            created++;
            if (created % 10 === 0) {
                console.log(`    ...${created}/${EMPLOYEE_COUNT} created`);
            }
        }

        console.log('\n' + '═'.repeat(60));
        console.log('  ✅  SEEDING COMPLETE');
        console.log('═'.repeat(60));
        console.log(`\n  Company:    ${COMPANY_NAME}`);
        console.log(`  Company ID: ${companyId}`);
        console.log(`  Employees:  ${created} created  (${skipped} skipped — already exist)`);
        console.log(`\n  ── Credentials (password: ${PASSWORD}) ──────────────`);
        console.log(`  HR:        hr@acme.test`);
        console.log(`  Manager 1: manager1@acme.test`);
        console.log(`  Manager 2: manager2@acme.test`);
        console.log(`  Employees: <firstname>.<lastname><N>@acme.test`);
        console.log('\n' + '═'.repeat(60) + '\n');

    } catch (err: any) {
        console.error('\n❌ Seeding failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(err => {
    console.error('❌ Fatal:', err);
    process.exit(1);
});
