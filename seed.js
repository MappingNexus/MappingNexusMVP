const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';

const demoCompany = {
    companyName: 'Asteria Digital Operations',
    adminName: 'Priya Shah',
    adminEmail: 'priya.hr@asteriaops.demo',
    adminPassword: 'DemoPass123!',
    companySecret: 'AsteriaDemoSecret123',
};

const today = new Date();

function isoDate(offsetDays) {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
}

async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, options);
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    return { ok: response.ok, status: response.status, data };
}

function authHeaders(token) {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Company-Secret': demoCompany.companySecret,
    };
}

async function createCompany() {
    const { data } = await apiFetch('/auth/onboard-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            companyName: demoCompany.companyName,
            adminName: demoCompany.adminName,
            adminEmail: demoCompany.adminEmail,
            adminPassword: demoCompany.adminPassword,
        }),
    });

    if (data.success) {
        console.log(`Created company: ${demoCompany.companyName}`);
        return;
    }

    if (data.message === 'Email already registered.') {
        console.log('Demo HR account already exists. Continuing with login.');
        return;
    }

    throw new Error(`Failed to onboard company: ${JSON.stringify(data)}`);
}

async function login() {
    const { data } = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: demoCompany.adminEmail,
            password: demoCompany.adminPassword,
        }),
    });

    if (!data.success) {
        throw new Error(`Failed to login as demo HR: ${JSON.stringify(data)}`);
    }

    console.log('Logged in as demo HR admin.');
    return data.session.access_token;
}

const employeesToCreate = [
    {
        name: 'Aarav Mehta',
        workEmail: 'aarav.mehta@asteriaops.demo',
        department: 'Engineering',
        seniorityLevel: 'lead',
        costPerDay: 920,
        location: 'Bengaluru',
        travelEligible: true,
        performanceScore: 4.7,
        tenureYears: 5.2,
        skills: [
            { name: 'React', proficiency: 'expert' },
            { name: 'TypeScript', proficiency: 'expert' },
            { name: 'Node.js', proficiency: 'intermediate' },
            { name: 'System Design', proficiency: 'expert' },
        ],
    },
    {
        name: 'Nisha Rao',
        workEmail: 'nisha.rao@asteriaops.demo',
        department: 'Engineering',
        seniorityLevel: 'senior',
        costPerDay: 840,
        location: 'Hyderabad',
        travelEligible: true,
        performanceScore: 4.5,
        tenureYears: 3.8,
        skills: [
            { name: 'Python', proficiency: 'expert' },
            { name: 'PostgreSQL', proficiency: 'expert' },
            { name: 'Kafka', proficiency: 'intermediate' },
            { name: 'API Design', proficiency: 'expert' },
        ],
    },
    {
        name: 'Kabir Sen',
        workEmail: 'kabir.sen@asteriaops.demo',
        department: 'Quality',
        seniorityLevel: 'mid',
        costPerDay: 520,
        location: 'Kolkata',
        travelEligible: false,
        performanceScore: 4.1,
        tenureYears: 2.4,
        skills: [
            { name: 'Automation Testing', proficiency: 'expert' },
            { name: 'Playwright', proficiency: 'intermediate' },
            { name: 'Regression Planning', proficiency: 'expert' },
        ],
    },
    {
        name: 'Maya Iyer',
        workEmail: 'maya.iyer@asteriaops.demo',
        department: 'Design',
        seniorityLevel: 'senior',
        costPerDay: 700,
        location: 'Chennai',
        travelEligible: true,
        performanceScore: 4.8,
        tenureYears: 4.1,
        skills: [
            { name: 'Figma', proficiency: 'expert' },
            { name: 'Design Systems', proficiency: 'expert' },
            { name: 'User Research', proficiency: 'intermediate' },
        ],
    },
    {
        name: 'Dev Patel',
        workEmail: 'dev.patel@asteriaops.demo',
        department: 'Data',
        seniorityLevel: 'senior',
        costPerDay: 780,
        location: 'Mumbai',
        travelEligible: true,
        performanceScore: 4.4,
        tenureYears: 3.1,
        skills: [
            { name: 'SQL', proficiency: 'expert' },
            { name: 'dbt', proficiency: 'intermediate' },
            { name: 'Power BI', proficiency: 'expert' },
            { name: 'Forecasting', proficiency: 'intermediate' },
        ],
    },
    {
        name: 'Sara Khan',
        workEmail: 'sara.khan@asteriaops.demo',
        department: 'Delivery',
        seniorityLevel: 'lead',
        costPerDay: 760,
        location: 'Pune',
        travelEligible: true,
        performanceScore: 4.6,
        tenureYears: 6.0,
        skills: [
            { name: 'Agile Delivery', proficiency: 'expert' },
            { name: 'Stakeholder Management', proficiency: 'expert' },
            { name: 'Risk Management', proficiency: 'expert' },
        ],
    },
    {
        name: 'Rohan Malhotra',
        workEmail: 'rohan.malhotra@asteriaops.demo',
        department: 'DevOps',
        seniorityLevel: 'principal',
        costPerDay: 1100,
        location: 'Gurugram',
        travelEligible: true,
        performanceScore: 4.9,
        tenureYears: 7.3,
        skills: [
            { name: 'AWS', proficiency: 'expert' },
            { name: 'Kubernetes', proficiency: 'expert' },
            { name: 'Terraform', proficiency: 'expert' },
            { name: 'Incident Response', proficiency: 'expert' },
        ],
    },
    {
        name: 'Ananya Das',
        workEmail: 'ananya.das@asteriaops.demo',
        department: 'Product',
        seniorityLevel: 'senior',
        costPerDay: 720,
        location: 'Remote',
        travelEligible: false,
        performanceScore: 4.3,
        tenureYears: 2.9,
        skills: [
            { name: 'Product Strategy', proficiency: 'expert' },
            { name: 'Roadmapping', proficiency: 'expert' },
            { name: 'Analytics', proficiency: 'intermediate' },
        ],
    },
    {
        name: 'Vikram Joshi',
        workEmail: 'vikram.joshi@asteriaops.demo',
        department: 'Security',
        seniorityLevel: 'lead',
        costPerDay: 980,
        location: 'Noida',
        travelEligible: true,
        performanceScore: 4.2,
        tenureYears: 4.7,
        skills: [
            { name: 'Cloud Security', proficiency: 'expert' },
            { name: 'Threat Modeling', proficiency: 'expert' },
            { name: 'Compliance', proficiency: 'intermediate' },
        ],
    },
    {
        name: 'Meera Nair',
        workEmail: 'meera.nair@asteriaops.demo',
        department: 'Customer Success',
        seniorityLevel: 'mid',
        costPerDay: 460,
        location: 'Kochi',
        travelEligible: true,
        performanceScore: 4.0,
        tenureYears: 1.8,
        skills: [
            { name: 'Customer Onboarding', proficiency: 'expert' },
            { name: 'SLA Management', proficiency: 'intermediate' },
            { name: 'Product Training', proficiency: 'expert' },
        ],
    },
    {
        name: 'Ishaan Kapoor',
        workEmail: 'ishaan.kapoor@asteriaops.demo',
        department: 'Engineering',
        seniorityLevel: 'junior',
        costPerDay: 360,
        location: 'Bengaluru',
        travelEligible: false,
        performanceScore: 3.7,
        tenureYears: 0.6,
        skills: [
            { name: 'React', proficiency: 'intermediate' },
            { name: 'JavaScript', proficiency: 'intermediate' },
            { name: 'CSS', proficiency: 'intermediate' },
        ],
    },
    {
        name: 'Tara Bhat',
        workEmail: 'tara.bhat@asteriaops.demo',
        department: 'Operations',
        seniorityLevel: 'mid',
        costPerDay: 430,
        location: 'Ahmedabad',
        travelEligible: true,
        performanceScore: 3.9,
        tenureYears: 2.1,
        skills: [
            { name: 'Process Optimization', proficiency: 'expert' },
            { name: 'Vendor Management', proficiency: 'intermediate' },
            { name: 'Excel Modeling', proficiency: 'expert' },
        ],
    },
    {
        name: 'Neha Trivedi',
        workEmail: 'neha.trivedi@asteriaops.demo',
        department: 'People Ops',
        seniorityLevel: 'senior',
        costPerDay: 600,
        location: 'Delhi',
        travelEligible: true,
        performanceScore: 4.4,
        tenureYears: 4.4,
        skills: [
            { name: 'Workforce Planning', proficiency: 'expert' },
            { name: 'Employee Relations', proficiency: 'expert' },
            { name: 'HR Analytics', proficiency: 'intermediate' },
        ],
    },
    {
        name: 'Omkar Reddy',
        workEmail: 'omkar.reddy@asteriaops.demo',
        department: 'Data',
        seniorityLevel: 'mid',
        costPerDay: 560,
        location: 'Hyderabad',
        travelEligible: false,
        performanceScore: 3.8,
        tenureYears: 1.2,
        skills: [
            { name: 'Python', proficiency: 'intermediate' },
            { name: 'Machine Learning', proficiency: 'intermediate' },
            { name: 'Data Quality', proficiency: 'expert' },
        ],
    },
    {
        name: 'Leena Mukherjee',
        workEmail: 'leena.mukherjee@asteriaops.demo',
        department: 'Finance',
        seniorityLevel: 'lead',
        costPerDay: 680,
        location: 'Mumbai',
        travelEligible: true,
        performanceScore: 4.6,
        tenureYears: 5.5,
        skills: [
            { name: 'Budgeting', proficiency: 'expert' },
            { name: 'ROI Modeling', proficiency: 'expert' },
            { name: 'Procurement', proficiency: 'intermediate' },
        ],
    },
];

const projectsToCreate = [
    {
        projectName: 'Atlas Workforce Intelligence',
        status: 'active',
        startDate: isoDate(-28),
        endDate: isoDate(72),
        requiredSkills: [
            { skill_name: 'React', proficiency: 'expert', count: 2 },
            { skill_name: 'Python', proficiency: 'expert', count: 1 },
            { skill_name: 'SQL', proficiency: 'expert', count: 1 },
            { skill_name: 'Design Systems', proficiency: 'expert', count: 1 },
        ],
    },
    {
        projectName: 'Nimbus Cloud Reliability Sprint',
        status: 'active',
        startDate: isoDate(-18),
        endDate: isoDate(44),
        requiredSkills: [
            { skill_name: 'AWS', proficiency: 'expert', count: 1 },
            { skill_name: 'Kubernetes', proficiency: 'expert', count: 1 },
            { skill_name: 'Incident Response', proficiency: 'expert', count: 1 },
            { skill_name: 'Cloud Security', proficiency: 'intermediate', count: 1 },
        ],
    },
    {
        projectName: 'Pulse Customer Migration',
        status: 'active',
        startDate: isoDate(-7),
        endDate: isoDate(61),
        requiredSkills: [
            { skill_name: 'Customer Onboarding', proficiency: 'expert', count: 1 },
            { skill_name: 'Agile Delivery', proficiency: 'expert', count: 1 },
            { skill_name: 'Product Training', proficiency: 'intermediate', count: 1 },
        ],
    },
    {
        projectName: 'Helios Security Review',
        status: 'planned',
        startDate: isoDate(18),
        endDate: isoDate(87),
        requiredSkills: [
            { skill_name: 'Threat Modeling', proficiency: 'expert', count: 1 },
            { skill_name: 'Compliance', proficiency: 'expert', count: 1 },
            { skill_name: 'API Design', proficiency: 'intermediate', count: 1 },
        ],
    },
    {
        projectName: 'Quartz Analytics Modernization',
        status: 'planned',
        startDate: isoDate(32),
        endDate: isoDate(118),
        requiredSkills: [
            { skill_name: 'dbt', proficiency: 'intermediate', count: 1 },
            { skill_name: 'Power BI', proficiency: 'expert', count: 1 },
            { skill_name: 'Forecasting', proficiency: 'intermediate', count: 1 },
            { skill_name: 'ROI Modeling', proficiency: 'intermediate', count: 1 },
        ],
    },
    {
        projectName: 'Legacy Portal Stabilization',
        status: 'completed',
        startDate: isoDate(-110),
        endDate: isoDate(-16),
        requiredSkills: [
            { skill_name: 'Regression Planning', proficiency: 'expert', count: 1 },
            { skill_name: 'JavaScript', proficiency: 'intermediate', count: 1 },
            { skill_name: 'Process Optimization', proficiency: 'intermediate', count: 1 },
        ],
    },
];

const assignmentPlan = [
    ['aarav.mehta@asteriaops.demo', 'Atlas Workforce Intelligence', -24, 72],
    ['nisha.rao@asteriaops.demo', 'Atlas Workforce Intelligence', -24, 72],
    ['maya.iyer@asteriaops.demo', 'Atlas Workforce Intelligence', -21, 45],
    ['dev.patel@asteriaops.demo', 'Atlas Workforce Intelligence', -14, 59],
    ['rohan.malhotra@asteriaops.demo', 'Nimbus Cloud Reliability Sprint', -18, 44],
    ['vikram.joshi@asteriaops.demo', 'Nimbus Cloud Reliability Sprint', -18, 44],
    ['nisha.rao@asteriaops.demo', 'Nimbus Cloud Reliability Sprint', -8, 30],
    ['sara.khan@asteriaops.demo', 'Pulse Customer Migration', -7, 61],
    ['meera.nair@asteriaops.demo', 'Pulse Customer Migration', -7, 61],
    ['ananya.das@asteriaops.demo', 'Pulse Customer Migration', -5, 54],
    ['kabir.sen@asteriaops.demo', 'Legacy Portal Stabilization', -90, -16],
    ['tara.bhat@asteriaops.demo', 'Legacy Portal Stabilization', -72, -16],
    ['ishaan.kapoor@asteriaops.demo', 'Atlas Workforce Intelligence', -4, 20],
    ['omkar.reddy@asteriaops.demo', 'Quartz Analytics Modernization', -2, 75],
    ['leena.mukherjee@asteriaops.demo', 'Quartz Analytics Modernization', -2, 75],
    // Extra active load to make burnout radar and utilization heatmap meaningful.
    ['aarav.mehta@asteriaops.demo', 'Nimbus Cloud Reliability Sprint', -9, 30],
    ['sara.khan@asteriaops.demo', 'Atlas Workforce Intelligence', -12, 28],
    ['vikram.joshi@asteriaops.demo', 'Helios Security Review', -3, 50],
];

async function createEmployees(token) {
    const headers = authHeaders(token);
    console.log(`Creating ${employeesToCreate.length} demo employees...`);

    for (const employee of employeesToCreate) {
        const availabilityWindows = [];
        if (employee.workEmail === 'maya.iyer@asteriaops.demo') {
            availabilityWindows.push({
                windowType: 'personal',
                startDate: isoDate(14),
                endDate: isoDate(18),
                note: 'Planned personal leave after design handoff.',
            });
        }
        if (employee.workEmail === 'rohan.malhotra@asteriaops.demo') {
            availabilityWindows.push({
                windowType: 'project_commitment',
                startDate: isoDate(0),
                endDate: isoDate(21),
                note: 'Incident response primary rotation.',
            });
        }

        const { data } = await apiFetch('/employees', {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...employee, availabilityWindows, role: 'employee' }),
        });

        if (data.success) {
            console.log(`  + ${employee.name} (${employee.department})`);
        } else {
            console.log(`  - skipped ${employee.name}: ${data.message || 'already exists or failed'}`);
        }
    }

    const { data } = await apiFetch('/employees?list_all=true', { headers });
    if (!data.success) {
        throw new Error(`Failed to read employees after seeding: ${JSON.stringify(data)}`);
    }

    const employeeMap = new Map();
    for (const employee of data.employees || []) {
        if (employee.workEmail) employeeMap.set(employee.workEmail.toLowerCase(), employee);
    }
    return employeeMap;
}

async function createProjects(token) {
    const headers = authHeaders(token);
    console.log(`Creating ${projectsToCreate.length} demo projects...`);

    for (const project of projectsToCreate) {
        const { data } = await apiFetch('/projects', {
            method: 'POST',
            headers,
            body: JSON.stringify(project),
        });

        if (data.success) {
            console.log(`  + ${project.projectName}`);
        } else {
            console.log(`  - skipped ${project.projectName}: ${data.message || 'already exists or failed'}`);
        }
    }

    const { data } = await apiFetch('/projects', { headers });
    if (!data.success) {
        throw new Error(`Failed to read projects after seeding: ${JSON.stringify(data)}`);
    }

    const projectMap = new Map();
    for (const project of data.projects || []) {
        projectMap.set(project.project_name, project);
    }
    return projectMap;
}

async function createAssignments(token, employeeMap, projectMap) {
    const headers = authHeaders(token);
    console.log(`Creating ${assignmentPlan.length} demo assignments...`);

    for (const [email, projectName, startOffset, endOffset] of assignmentPlan) {
        const employee = employeeMap.get(email);
        const project = projectMap.get(projectName);

        if (!employee || !project) {
            console.log(`  - skipped assignment ${email} -> ${projectName}: missing employee or project`);
            continue;
        }

        const { data } = await apiFetch('/assignments', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                employeeId: employee.employeeId,
                projectId: project.project_id,
                startDate: isoDate(startOffset),
                endDate: isoDate(endOffset),
            }),
        });

        if (data.success) {
            console.log(`  + ${employee.name} -> ${projectName}`);
        } else {
            console.log(`  - skipped ${employee.name} -> ${projectName}: ${data.message || 'already assigned or failed'}`);
        }
    }
}

async function warmAnalytics(token) {
    const headers = authHeaders(token);
    console.log('Warming HR analytics endpoints...');
    await apiFetch('/analytics/overview', { headers });
    await apiFetch('/analytics/skills', { headers });
    await apiFetch('/analytics/burnout', { headers });
}

async function seed() {
    console.log('\nSeeding Mapping Nexus HR dashboard demo data...');
    console.log(`API: ${API_BASE}\n`);

    await createCompany();
    const token = await login();
    const employeeMap = await createEmployees(token);
    const projectMap = await createProjects(token);
    await createAssignments(token, employeeMap, projectMap);
    await warmAnalytics(token);

    console.log('\nDemo seed complete.');
    console.log('Login credentials:');
    console.log(`  Email: ${demoCompany.adminEmail}`);
    console.log(`  Password: ${demoCompany.adminPassword}`);
    console.log(`  Company secret: ${demoCompany.companySecret}`);
    console.log('\nOpen the HR dashboard and check Nexus Map, Burnout Radar, Skill Pulse, Projects, and Employees.\n');
}

seed().catch(error => {
    console.error('\nSeed failed:', error.message || error);
    process.exit(1);
});
