

const API_BASE = 'http://localhost:3001/api';

async function seed() {
    console.log('Seeding Mapping Nexus DB via API...');

    // 1. Onboard Company
    const onboardRes = await fetch(`${API_BASE}/auth/onboard-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            companyName: 'Acme Global Innovations',
            adminName: 'Jane Smith',
            adminEmail: 'jane.admin@acmeglobal.com',
            adminPassword: 'ChangeMe123!'
        })
    });
    const onboardData = await onboardRes.json();
    if (!onboardData.success && onboardData.message !== 'Email already registered.') {
        console.error('Failed to onboard company:', onboardData);
        process.exit(1);
    }
    
    console.log(onboardData.success ? '✅ Company created!' : '✅ Company already existed. Proceeding.');

    // 2. Login
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'jane.admin@acmeglobal.com',
            password: 'ChangeMe123!'
        })
    });

    const loginData = await loginRes.json();
    if (!loginData.success) {
        console.error('Failed to login:', loginData);
        process.exit(1);
    }
    
    const token = loginData.session.access_token;
    console.log('✅ Logged in successfully!');

    // 3. Create Employees
    const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const employeesToCreate = [
        {
            name: 'John Doe', workEmail: 'john.d@acmeglobal.com', department: 'Engineering',
            seniorityLevel: 'senior', costPerDay: 800, location: 'New York', travelEligible: true,
            skills: [{ name: 'React', proficiency: 'expert' }, { name: 'Node.js', proficiency: 'expert' }],
            performanceScore: 4, tenureYears: 4, role: 'employee'
        },
        {
            name: 'Sarah Connor', workEmail: 'sarah.c@acmeglobal.com', department: 'Engineering',
            seniorityLevel: 'lead', costPerDay: 1200, location: 'San Francisco', travelEligible: true,
            skills: [{ name: 'Python', proficiency: 'expert' }, { name: 'Machine Learning', proficiency: 'expert' }],
            performanceScore: 5, tenureYears: 2, role: 'manager'
        },
        {
            name: 'Mike Ross', workEmail: 'mike.r@acmeglobal.com', department: 'Legal',
            seniorityLevel: 'junior', costPerDay: 500, location: 'Chicago', travelEligible: false,
            skills: [{ name: 'Corporate Law', proficiency: 'intermediate' }],
            performanceScore: 3, tenureYears: 1, role: 'employee'
        },
        {
            name: 'Harvey Specter', workEmail: 'harvey.s@acmeglobal.com', department: 'Legal',
            seniorityLevel: 'principal', costPerDay: 2500, location: 'New York', travelEligible: true,
            skills: [{ name: 'Corporate Law', proficiency: 'expert' }, { name: 'Negotiation', proficiency: 'expert' }],
            performanceScore: 5, tenureYears: 10, role: 'manager'
        },
        {
            name: 'Rachel Zane', workEmail: 'rachel.z@acmeglobal.com', department: 'Paralegal',
            seniorityLevel: 'junior', costPerDay: 300, location: 'New York', travelEligible: false,
            skills: [{ name: 'Research', proficiency: 'expert' }],
            performanceScore: 4, tenureYears: 3, role: 'employee'
        }
    ];

    console.log('Creating Employees...');
    for (const emp of employeesToCreate) {
        const empRes = await fetch(`${API_BASE}/employees`, {
            method: 'POST',
            headers,
            body: JSON.stringify(emp)
        });
        const empData = await empRes.json();
        if (empData.success) {
            console.log(`  + Created ${emp.name}`);
        } else {
            console.error(`  - Failed to create ${emp.name}:`, empData);
        }
    }

    console.log('\n🎉 Database Seed Complete! You have a company, an HR admin, 2 managers, and 3 employees ready for mapping.');
    console.log('\n================================');
    console.log('Use these credentials to log in:');
    console.log('Email: jane.admin@acmeglobal.com');
    console.log('Password: ChangeMe123!');
    console.log('Security: employee PII is encrypted at rest by the server.');
    console.log('================================\n');
}

seed().catch(console.error);
