/**
 * Synthetic Data Generator — Phase 10
 *
 * Generates 2 companies with 500+ employees, teams, and pending requests.
 * Uses Supabase Admin API for auth account creation.
 * All PII is encrypted using the encryption service.
 *
 * Run: npm run generate-data
 */
import { supabaseAdmin } from '../config/supabase.js';
import { encrypt } from '../services/encryption.service.js';
import crypto from 'crypto';

// Indian names
const FIRST_NAMES = [
    'Aarav', 'Aditi', 'Aditya', 'Akash', 'Ananya', 'Amit', 'Anisha', 'Arjun', 'Bhavna', 'Chetan',
    'Deepa', 'Deva', 'Divya', 'Esha', 'Gaurav', 'Geeta', 'Harish', 'Ishaan', 'Jaya', 'Karan',
    'Kavya', 'Lakshmi', 'Manoj', 'Meera', 'Mohan', 'Nandini', 'Neha', 'Nikhil', 'Pallavi', 'Pooja',
    'Prateek', 'Priya', 'Raj', 'Rajesh', 'Ravi', 'Rekha', 'Rohit', 'Sakshi', 'Sandeep', 'Sanjay',
    'Sarita', 'Shikha', 'Shivam', 'Shreya', 'Siddharth', 'Sneha', 'Sunil', 'Swati', 'Tanvi', 'Usha',
    'Varun', 'Vijay', 'Vikram', 'Yash', 'Zara', 'Arun', 'Aparna', 'Harsh', 'Isha', 'Manish',
];

const LAST_NAMES = [
    'Agarwal', 'Banerjee', 'Bhat', 'Chakraborty', 'Choudhury', 'Das', 'Desai', 'Deshpande',
    'Ghosh', 'Gupta', 'Iyer', 'Jain', 'Jha', 'Joshi', 'Kapoor', 'Khan', 'Kumar', 'Malhotra',
    'Mehta', 'Mishra', 'Mukherjee', 'Nair', 'Pandey', 'Patel', 'Rao', 'Reddy', 'Roy', 'Saxena',
    'Shah', 'Sharma', 'Singh', 'Srinivasan', 'Thakur', 'Trivedi', 'Verma', 'Yadav',
];

const CITIES = [
    'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata',
    'Ahmedabad', 'Jaipur', 'Noida', 'Gurugram', 'Chandigarh', 'Kochi', 'Remote',
];

const DOMAINS: Record<string, { departments: string[]; skills: string[][]; roles: string[] }> = {
    'Biotech': {
        departments: ['R&D', 'Clinical Trials', 'Regulatory', 'QA', 'Manufacturing', 'Data Science'],
        skills: [
            ['CRISPR', 'expert'], ['Genomics', 'expert'], ['PCR', 'intermediate'],
            ['Bioinformatics', 'expert'], ['GMP Compliance', 'intermediate'],
            ['Python', 'intermediate'], ['R', 'expert'], ['Clinical Data Management', 'intermediate'],
            ['Regulatory Writing', 'beginner'], ['Mass Spectrometry', 'expert'],
            ['Cell Culture', 'intermediate'], ['SAS', 'beginner'], ['Biostatistics', 'expert'],
            ['Drug Discovery', 'intermediate'], ['Protein Engineering', 'expert'],
        ],
        roles: ['Research Scientist', 'Clinical Associate', 'QA Analyst', 'Lab Technician', 'Data Analyst', 'Regulatory Specialist'],
    },
    'Fintech': {
        departments: ['Engineering', 'Risk', 'Product', 'Compliance', 'Data', 'Operations'],
        skills: [
            ['React', 'expert'], ['Node.js', 'expert'], ['Python', 'intermediate'],
            ['AWS', 'intermediate'], ['SQL', 'expert'], ['Kubernetes', 'intermediate'],
            ['Risk Modeling', 'expert'], ['AML/KYC', 'intermediate'],
            ['Payment Gateway', 'expert'], ['Blockchain', 'beginner'],
            ['Machine Learning', 'intermediate'], ['TypeScript', 'expert'],
            ['Redis', 'intermediate'], ['Kafka', 'expert'], ['Go', 'intermediate'],
        ],
        roles: ['Software Engineer', 'Risk Analyst', 'Product Manager', 'Compliance Officer', 'Data Engineer', 'DevOps Engineer'],
    },
    'Manufacturing': {
        departments: ['Production', 'Supply Chain', 'Quality', 'Maintenance', 'Logistics', 'ERP'],
        skills: [
            ['SAP', 'expert'], ['Lean Manufacturing', 'expert'], ['Six Sigma', 'intermediate'],
            ['PLC Programming', 'expert'], ['SCADA', 'intermediate'],
            ['Quality Management', 'intermediate'], ['Inventory Management', 'expert'],
            ['AutoCAD', 'intermediate'], ['CNC Programming', 'expert'],
            ['Welding Tech', 'beginner'], ['Electrical Systems', 'intermediate'],
            ['Predictive Maintenance', 'intermediate'], ['IoT', 'beginner'],
            ['Power BI', 'intermediate'], ['MES', 'expert'],
        ],
        roles: ['Production Manager', 'Supply Chain Analyst', 'Quality Engineer', 'Maintenance Tech', 'ERP Consultant', 'Plant Manager'],
    },
    'IT/SaaS': {
        departments: ['Engineering', 'Product', 'Design', 'DevOps', 'Data', 'Customer Success'],
        skills: [
            ['React', 'expert'], ['TypeScript', 'expert'], ['Python', 'intermediate'],
            ['AWS', 'expert'], ['Docker', 'intermediate'], ['PostgreSQL', 'expert'],
            ['GraphQL', 'intermediate'], ['Figma', 'expert'], ['Next.js', 'intermediate'],
            ['Terraform', 'expert'], ['CI/CD', 'intermediate'], ['Elasticsearch', 'beginner'],
            ['Machine Learning', 'intermediate'], ['Rust', 'beginner'], ['Vue.js', 'intermediate'],
        ],
        roles: ['Full Stack Developer', 'Backend Engineer', 'UX Designer', 'SRE', 'Data Scientist', 'Frontend Engineer'],
    },
};

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, arr.length));
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number): string {
    const d = new Date();
    d.setDate(d.getDate() - randomInt(0, daysBack));
    return d.toISOString().split('T')[0];
}

const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'lead', 'principal'] as const;

async function main() {
    console.log('\n🔄 Starting Mapping Nexus Synthetic Data Generator...\n');

    // ============================================================
    // STEP 1: Create 2 companies
    // ============================================================
    const companies = [
        { name: 'NexaGen Biotech Pvt Ltd', domain: 'Biotech' },
        { name: 'PayScale Technologies Ltd', domain: 'Fintech' },
    ];

    const companyIds: string[] = [];

    for (const company of companies) {
        const { data, error } = await supabaseAdmin
            .from('companies')
            .insert({ company_name: company.name })
            .select()
            .single();

        if (error) { console.error(`Failed to create company ${company.name}:`, error); continue; }
        companyIds.push(data.company_id);
        console.log(`✅ Company created: ${company.name} (${data.company_id})`);
    }

    if (companyIds.length < 2) {
        console.error('❌ Failed to create companies. Aborting.');
        process.exit(1);
    }

    // ============================================================
    // STEP 2: Create HR, Manager, Employee users per company
    // ============================================================
    const users: Record<string, { hr: string; managers: string[]; companyId: string }> = {};

    for (let ci = 0; ci < companyIds.length; ci++) {
        const companyId = companyIds[ci];
        const company = companies[ci];
        const prefix = ci === 0 ? 'nexagen' : 'payscale';

        // HR user
        const { data: hrUser, error: hrErr } = await supabaseAdmin.auth.admin.createUser({
            email: `hr@${prefix}.test`,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { company_id: companyId, role: 'hr' },
        });

        if (hrErr) { console.error(`HR creation failed:`, hrErr); continue; }
        console.log(`  👤 HR: hr@${prefix}.test (password: TestPassword123!)`);

        // 2 Managers per company
        const managerIds: string[] = [];
        for (let mi = 1; mi <= 2; mi++) {
            const { data: mgrUser, error: mgrErr } = await supabaseAdmin.auth.admin.createUser({
                email: `manager${mi}@${prefix}.test`,
                password: 'TestPassword123!',
                email_confirm: true,
                user_metadata: { company_id: companyId, role: 'manager' },
            });

            if (mgrErr) { console.error(`Manager creation failed:`, mgrErr); continue; }
            managerIds.push(mgrUser.user.id);
            console.log(`  👤 Manager: manager${mi}@${prefix}.test`);
        }

        users[companyId] = {
            hr: hrUser!.user.id,
            managers: managerIds,
            companyId,
        };
    }

    // ============================================================
    // STEP 3: Generate 500+ employees across both companies
    // ============================================================
    console.log('\n📊 Generating employees...');

    const allDomainKeys = Object.keys(DOMAINS);
    let totalEmployees = 0;

    for (let ci = 0; ci < companyIds.length; ci++) {
        const companyId = companyIds[ci];
        const primaryDomain = ci === 0 ? 'Biotech' : 'Fintech';
        const secondaryDomain = ci === 0 ? 'IT/SaaS' : 'Manufacturing';
        const targetCount = ci === 0 ? 275 : 275;

        console.log(`\n  Generating ${targetCount} employees for company ${ci + 1}...`);

        const employeeIds: string[] = [];

        for (let i = 0; i < targetCount; i++) {
            const domain = Math.random() < 0.7 ? primaryDomain : secondaryDomain;
            const domainConfig = DOMAINS[domain];

            const firstName = pick(FIRST_NAMES);
            const lastName = pick(LAST_NAMES);
            const fullName = `${firstName} ${lastName}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@company.test`;

            const department = pick(domainConfig.departments);
            const role = pick(domainConfig.roles);
            const seniority = pick([...SENIORITY_LEVELS]);
            const location = pick(CITIES);
            const costPerDay = randomInt(2000, 25000);
            const perfScore = +(Math.random() * 4 + 1).toFixed(2);
            const tenure = +(Math.random() * 12).toFixed(1);
            const projectLoad = randomInt(0, 5);
            const capacity = Math.min(100, projectLoad * 20 + randomInt(0, 30));

            // Encrypt PII
            const nameEnc = await encrypt(fullName, companyId);
            const emailEnc = await encrypt(email, companyId);
            const costEnc = await encrypt(String(costPerDay), companyId);
            const perfEnc = await encrypt(String(perfScore), companyId);

            const { data: emp, error: empErr } = await supabaseAdmin
                .from('employees')
                .insert({
                    company_id: companyId,
                    name_encrypted: nameEnc,
                    work_email_encrypted: emailEnc,
                    cost_per_day_encrypted: costEnc,
                    performance_score_encrypted: perfEnc,
                    department,
                    seniority_level: seniority,
                    location,
                    travel_eligible: Math.random() > 0.4,
                    current_project_load: projectLoad,
                    capacity_committed_pct: capacity,
                    last_assignment_date: projectLoad > 0 ? randomDate(60) : null,
                    tenure_years: tenure,
                })
                .select('employee_id')
                .single();

            if (empErr) { continue; }

            employeeIds.push(emp.employee_id);

            // Insert 2-5 skills per employee
            const numSkills = randomInt(2, 5);
            const empSkills = pickN(domainConfig.skills, numSkills);
            const skillRows = empSkills.map(([name, proficiency]) => ({
                employee_id: emp.employee_id,
                company_id: companyId,
                skill_name: name,
                proficiency,
                last_used_date: randomDate(randomInt(5, 180)),
                // Note: embeddings are NOT generated here for speed.
                // Run `npm run reindex-embeddings` after seeding to populate vectors.
            }));

            await supabaseAdmin.from('skills').insert(skillRows);
            totalEmployees++;

            if (totalEmployees % 50 === 0) {
                console.log(`    ...${totalEmployees} employees created`);
            }
        }

        // ============================================================
        // STEP 4: Create teams and memberships
        // ============================================================
        const companyUsers = users[companyId];
        if (companyUsers && companyUsers.managers.length >= 1) {
            for (let mi = 0; mi < companyUsers.managers.length; mi++) {
                const managerId = companyUsers.managers[mi];
                const teamName = `Team ${mi === 0 ? 'Alpha' : 'Beta'} — ${ci === 0 ? 'NexaGen' : 'PayScale'}`;

                const { data: team } = await supabaseAdmin
                    .from('teams')
                    .insert({
                        team_name: teamName,
                        manager_id: managerId,
                        company_id: companyId,
                    })
                    .select()
                    .single();

                if (!team) continue;

                // Assign 10-15 employees (approved)
                const teamMembers = pickN(employeeIds, randomInt(10, 15));
                for (const empId of teamMembers) {
                    await supabaseAdmin.from('team_memberships').insert({
                        team_id: team.team_id,
                        employee_id: empId,
                        company_id: companyId,
                        status: 'approved',
                        requested_by: managerId,
                        reviewed_by: companyUsers.hr,
                        reviewed_at: new Date().toISOString(),
                    });
                }

                // Create 3-5 pending requests
                const pendingMembers = pickN(
                    employeeIds.filter(id => !teamMembers.includes(id)),
                    randomInt(3, 5)
                );
                for (const empId of pendingMembers) {
                    await supabaseAdmin.from('team_memberships').insert({
                        team_id: team.team_id,
                        employee_id: empId,
                        company_id: companyId,
                        status: 'pending',
                        requested_by: managerId,
                        request_reason: pick([
                            'Needed for Q3 project ramp-up',
                            'Skill gap in current team',
                            'Backfill for departing team member',
                            'New initiative requires expertise',
                            'Cross-functional collaboration',
                        ]),
                    });
                }

                console.log(`  ✅ Team "${teamName}": ${teamMembers.length} members, ${pendingMembers.length} pending`);
            }
        }

        // Insert sample burnout signals for high-load employees
        const highLoad = employeeIds.slice(0, 5);
        for (const empId of highLoad) {
            await supabaseAdmin.from('burnout_signals').insert({
                employee_id: empId,
                company_id: companyId,
                signal_type: pick(['task_velocity', 'no_leave', 'consecutive_assignments', 'overtime_proxy', 'skills_misalignment']),
                risk_tier: pick(['medium', 'high']),
                details: { autoGenerated: true, score: randomInt(40, 95) },
            });
        }
    }

    console.log('\n' + '='.repeat(55));
    console.log('  ✅ SYNTHETIC DATA GENERATION COMPLETE');
    console.log('='.repeat(55));
    console.log(`  Total employees: ${totalEmployees}`);
    console.log(`  Companies:       ${companyIds.length}`);
    console.log(`  Teams created:   ${companyIds.length * 2}`);
    console.log('\n  Login credentials (all use password: TestPassword123!):');
    console.log('    Company 1: hr@nexagen.test / manager1@nexagen.test / manager2@nexagen.test');
    console.log('    Company 2: hr@payscale.test / manager1@payscale.test / manager2@payscale.test');
    console.log('='.repeat(55) + '\n');

    process.exit(0);
}

main().catch(err => {
    console.error('❌ Data generation failed:', err);
    process.exit(1);
});
