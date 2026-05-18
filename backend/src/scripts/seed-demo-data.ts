/**
 * Mapping Nexus demo seed data for Neon/Postgres.
 *
 * Creates a full demo tenant with HR, manager, and employee logins plus
 * realistic workforce data for HR, manager, and employee dashboards.
 *
 * Run:
 *   npm run seed-demo
 */
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import { encrypt } from '../services/encryption.service.js';

const DEMO_COMPANY_NAME = 'Asteria Digital Operations Pvt Ltd';
const DEMO_COMPANY_SECRET = 'AsteriaDemoSecret123';
const DEMO_PASSWORD = 'DemoPass123!';
const SALT_ROUNDS = 12;

type Role = 'hr' | 'manager' | 'employee';
type Seniority = 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
type Proficiency = 'beginner' | 'intermediate' | 'expert';
type ProjectStatus = 'planned' | 'active' | 'completed';
type MembershipStatus = 'pending' | 'approved' | 'rejected';
type RiskTier = 'low' | 'medium' | 'high';
type SignalType = 'task_velocity' | 'no_leave' | 'consecutive_assignments' | 'overtime_proxy' | 'skills_misalignment';

type EmployeeSeed = {
    email: string;
    name: string;
    department: string;
    title: string;
    seniority: Seniority;
    location: string;
    travelEligible: boolean;
    costPerDay: number;
    performanceScore: number;
    tenureYears: number;
    skills: Array<[string, Proficiency, number]>;
    availability?: Array<{ windowType: string; startOffset: number; endOffset: number; note: string }>;
};

type UserSeed = {
    id: string;
    email: string;
    role: Role;
};

function id() {
    return crypto.randomUUID();
}

function date(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
}

function timestamp(offsetDays = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString();
}

const hrUsers: UserSeed[] = [
    { id: id(), email: 'priya.hr@asteriaops.demo', role: 'hr' },
];

const managerUsers: UserSeed[] = [
    { id: id(), email: 'arjun.manager@asteriaops.demo', role: 'manager' },
    { id: id(), email: 'meera.manager@asteriaops.demo', role: 'manager' },
    { id: id(), email: 'vikram.manager@asteriaops.demo', role: 'manager' },
];

const employees: EmployeeSeed[] = [
    {
        email: 'aarav.mehta@asteriaops.demo',
        name: 'Aarav Mehta',
        department: 'Engineering',
        title: 'Frontend Platform Lead',
        seniority: 'lead',
        location: 'Bengaluru',
        travelEligible: true,
        costPerDay: 18500,
        performanceScore: 4.7,
        tenureYears: 5.2,
        skills: [['React', 'expert', 12], ['TypeScript', 'expert', 18], ['Node.js', 'intermediate', 35], ['System Design', 'expert', 21]],
    },
    {
        email: 'nisha.rao@asteriaops.demo',
        name: 'Nisha Rao',
        department: 'Engineering',
        title: 'Backend Engineer',
        seniority: 'senior',
        location: 'Hyderabad',
        travelEligible: true,
        costPerDay: 17200,
        performanceScore: 4.5,
        tenureYears: 3.8,
        skills: [['Python', 'expert', 8], ['PostgreSQL', 'expert', 16], ['Kafka', 'intermediate', 46], ['API Design', 'expert', 25]],
    },
    {
        email: 'ishaan.kapoor@asteriaops.demo',
        name: 'Ishaan Kapoor',
        department: 'Engineering',
        title: 'Frontend Engineer',
        seniority: 'junior',
        location: 'Bengaluru',
        travelEligible: false,
        costPerDay: 7800,
        performanceScore: 3.8,
        tenureYears: 0.7,
        skills: [['React', 'intermediate', 20], ['JavaScript', 'intermediate', 15], ['CSS', 'intermediate', 6]],
    },
    {
        email: 'aditi.menon@asteriaops.demo',
        name: 'Aditi Menon',
        department: 'Engineering',
        title: 'Mobile Engineer',
        seniority: 'mid',
        location: 'Kochi',
        travelEligible: false,
        costPerDay: 11200,
        performanceScore: 4.1,
        tenureYears: 2.4,
        skills: [['React Native', 'expert', 28], ['Mobile QA', 'intermediate', 52], ['TypeScript', 'intermediate', 30]],
    },
    {
        email: 'rohan.malhotra@asteriaops.demo',
        name: 'Rohan Malhotra',
        department: 'DevOps',
        title: 'Principal Site Reliability Engineer',
        seniority: 'principal',
        location: 'Gurugram',
        travelEligible: true,
        costPerDay: 23500,
        performanceScore: 4.9,
        tenureYears: 7.3,
        skills: [['AWS', 'expert', 11], ['Kubernetes', 'expert', 13], ['Terraform', 'expert', 19], ['Incident Response', 'expert', 3]],
        availability: [{ windowType: 'project_commitment', startOffset: 0, endOffset: 21, note: 'Primary incident response rotation for Nimbus launch.' }],
    },
    {
        email: 'parth.sharma@asteriaops.demo',
        name: 'Parth Sharma',
        department: 'DevOps',
        title: 'Cloud Operations Engineer',
        seniority: 'mid',
        location: 'Noida',
        travelEligible: true,
        costPerDay: 12800,
        performanceScore: 4.0,
        tenureYears: 2.1,
        skills: [['Docker', 'expert', 25], ['AWS', 'intermediate', 40], ['CI/CD', 'expert', 18]],
    },
    {
        email: 'maya.iyer@asteriaops.demo',
        name: 'Maya Iyer',
        department: 'Design',
        title: 'Senior Product Designer',
        seniority: 'senior',
        location: 'Chennai',
        travelEligible: true,
        costPerDay: 14800,
        performanceScore: 4.8,
        tenureYears: 4.1,
        skills: [['Figma', 'expert', 7], ['Design Systems', 'expert', 10], ['User Research', 'intermediate', 55]],
        availability: [{ windowType: 'personal', startOffset: 14, endOffset: 18, note: 'Planned leave after design handoff.' }],
    },
    {
        email: 'tanya.gupta@asteriaops.demo',
        name: 'Tanya Gupta',
        department: 'Design',
        title: 'UX Researcher',
        seniority: 'mid',
        location: 'Delhi',
        travelEligible: true,
        costPerDay: 10500,
        performanceScore: 4.2,
        tenureYears: 2.8,
        skills: [['User Research', 'expert', 4], ['Workshop Facilitation', 'expert', 24], ['Journey Mapping', 'intermediate', 43]],
    },
    {
        email: 'dev.patel@asteriaops.demo',
        name: 'Dev Patel',
        department: 'Data',
        title: 'Analytics Engineer',
        seniority: 'senior',
        location: 'Mumbai',
        travelEligible: true,
        costPerDay: 16400,
        performanceScore: 4.4,
        tenureYears: 3.1,
        skills: [['SQL', 'expert', 5], ['dbt', 'intermediate', 34], ['Power BI', 'expert', 16], ['Forecasting', 'intermediate', 61]],
    },
    {
        email: 'omkar.reddy@asteriaops.demo',
        name: 'Omkar Reddy',
        department: 'Data',
        title: 'Machine Learning Analyst',
        seniority: 'mid',
        location: 'Hyderabad',
        travelEligible: false,
        costPerDay: 11800,
        performanceScore: 3.9,
        tenureYears: 1.2,
        skills: [['Python', 'intermediate', 14], ['Machine Learning', 'intermediate', 22], ['Data Quality', 'expert', 9]],
    },
    {
        email: 'sanya.chopra@asteriaops.demo',
        name: 'Sanya Chopra',
        department: 'Data',
        title: 'BI Developer',
        seniority: 'junior',
        location: 'Jaipur',
        travelEligible: false,
        costPerDay: 8200,
        performanceScore: 3.7,
        tenureYears: 0.9,
        skills: [['Power BI', 'intermediate', 18], ['SQL', 'intermediate', 11], ['Excel Modeling', 'expert', 5]],
    },
    {
        email: 'kabir.sen@asteriaops.demo',
        name: 'Kabir Sen',
        department: 'Quality',
        title: 'QA Automation Analyst',
        seniority: 'mid',
        location: 'Kolkata',
        travelEligible: false,
        costPerDay: 9800,
        performanceScore: 4.1,
        tenureYears: 2.4,
        skills: [['Automation Testing', 'expert', 6], ['Playwright', 'intermediate', 22], ['Regression Planning', 'expert', 17]],
    },
    {
        email: 'farah.qureshi@asteriaops.demo',
        name: 'Farah Qureshi',
        department: 'Quality',
        title: 'Quality Lead',
        seniority: 'lead',
        location: 'Pune',
        travelEligible: true,
        costPerDay: 14200,
        performanceScore: 4.3,
        tenureYears: 5.8,
        skills: [['QA Strategy', 'expert', 13], ['Performance Testing', 'expert', 38], ['Test Governance', 'expert', 9]],
    },
    {
        email: 'sara.khan@asteriaops.demo',
        name: 'Sara Khan',
        department: 'Delivery',
        title: 'Delivery Program Lead',
        seniority: 'lead',
        location: 'Pune',
        travelEligible: true,
        costPerDay: 15600,
        performanceScore: 4.6,
        tenureYears: 6.0,
        skills: [['Agile Delivery', 'expert', 6], ['Stakeholder Management', 'expert', 15], ['Risk Management', 'expert', 8]],
    },
    {
        email: 'manav.singh@asteriaops.demo',
        name: 'Manav Singh',
        department: 'Delivery',
        title: 'Scrum Master',
        seniority: 'senior',
        location: 'Chandigarh',
        travelEligible: true,
        costPerDay: 13200,
        performanceScore: 4.2,
        tenureYears: 3.6,
        skills: [['Scrum', 'expert', 12], ['Agile Delivery', 'expert', 18], ['Release Planning', 'intermediate', 46]],
    },
    {
        email: 'ananya.das@asteriaops.demo',
        name: 'Ananya Das',
        department: 'Product',
        title: 'Senior Product Manager',
        seniority: 'senior',
        location: 'Remote',
        travelEligible: false,
        costPerDay: 15400,
        performanceScore: 4.3,
        tenureYears: 2.9,
        skills: [['Product Strategy', 'expert', 9], ['Roadmapping', 'expert', 14], ['Analytics', 'intermediate', 37]],
    },
    {
        email: 'rahul.bose@asteriaops.demo',
        name: 'Rahul Bose',
        department: 'Product',
        title: 'Associate Product Manager',
        seniority: 'mid',
        location: 'Mumbai',
        travelEligible: true,
        costPerDay: 10200,
        performanceScore: 3.9,
        tenureYears: 1.6,
        skills: [['Backlog Management', 'intermediate', 10], ['Customer Discovery', 'intermediate', 33], ['Analytics', 'intermediate', 25]],
    },
    {
        email: 'vikram.joshi@asteriaops.demo',
        name: 'Vikram Joshi',
        department: 'Security',
        title: 'Security Engineering Lead',
        seniority: 'lead',
        location: 'Noida',
        travelEligible: true,
        costPerDay: 19600,
        performanceScore: 4.2,
        tenureYears: 4.7,
        skills: [['Cloud Security', 'expert', 5], ['Threat Modeling', 'expert', 7], ['Compliance', 'intermediate', 42]],
    },
    {
        email: 'pooja.naik@asteriaops.demo',
        name: 'Pooja Naik',
        department: 'Security',
        title: 'GRC Analyst',
        seniority: 'mid',
        location: 'Mumbai',
        travelEligible: true,
        costPerDay: 11200,
        performanceScore: 4.0,
        tenureYears: 2.2,
        skills: [['Compliance', 'expert', 4], ['Audit Readiness', 'expert', 19], ['Risk Register', 'intermediate', 50]],
    },
    {
        email: 'meera.nair@asteriaops.demo',
        name: 'Meera Nair',
        department: 'Customer Success',
        title: 'Customer Success Manager',
        seniority: 'mid',
        location: 'Kochi',
        travelEligible: true,
        costPerDay: 9200,
        performanceScore: 4.0,
        tenureYears: 1.8,
        skills: [['Customer Onboarding', 'expert', 3], ['SLA Management', 'intermediate', 41], ['Product Training', 'expert', 16]],
    },
    {
        email: 'karan.arora@asteriaops.demo',
        name: 'Karan Arora',
        department: 'Customer Success',
        title: 'Enterprise Support Specialist',
        seniority: 'senior',
        location: 'Gurugram',
        travelEligible: true,
        costPerDay: 11600,
        performanceScore: 4.4,
        tenureYears: 3.3,
        skills: [['SLA Management', 'expert', 9], ['Escalation Handling', 'expert', 18], ['Product Training', 'intermediate', 39]],
    },
    {
        email: 'tara.bhat@asteriaops.demo',
        name: 'Tara Bhat',
        department: 'Operations',
        title: 'Operations Analyst',
        seniority: 'mid',
        location: 'Ahmedabad',
        travelEligible: true,
        costPerDay: 8700,
        performanceScore: 3.9,
        tenureYears: 2.1,
        skills: [['Process Optimization', 'expert', 15], ['Vendor Management', 'intermediate', 60], ['Excel Modeling', 'expert', 6]],
    },
    {
        email: 'gaurav.sethi@asteriaops.demo',
        name: 'Gaurav Sethi',
        department: 'Operations',
        title: 'Business Operations Lead',
        seniority: 'lead',
        location: 'Delhi',
        travelEligible: true,
        costPerDay: 13800,
        performanceScore: 4.3,
        tenureYears: 4.9,
        skills: [['Process Optimization', 'expert', 8], ['Operating Rhythm', 'expert', 21], ['Vendor Management', 'expert', 35]],
    },
    {
        email: 'neha.trivedi@asteriaops.demo',
        name: 'Neha Trivedi',
        department: 'People Ops',
        title: 'People Operations Partner',
        seniority: 'senior',
        location: 'Delhi',
        travelEligible: true,
        costPerDay: 12400,
        performanceScore: 4.4,
        tenureYears: 4.4,
        skills: [['Workforce Planning', 'expert', 7], ['Employee Relations', 'expert', 12], ['HR Analytics', 'intermediate', 48]],
    },
    {
        email: 'aruna.pillai@asteriaops.demo',
        name: 'Aruna Pillai',
        department: 'People Ops',
        title: 'Talent Programs Specialist',
        seniority: 'mid',
        location: 'Kochi',
        travelEligible: false,
        costPerDay: 8600,
        performanceScore: 4.0,
        tenureYears: 1.9,
        skills: [['Talent Programs', 'expert', 14], ['Employee Engagement', 'intermediate', 26], ['HR Analytics', 'intermediate', 31]],
    },
    {
        email: 'leena.mukherjee@asteriaops.demo',
        name: 'Leena Mukherjee',
        department: 'Finance',
        title: 'Finance Business Partner',
        seniority: 'lead',
        location: 'Mumbai',
        travelEligible: true,
        costPerDay: 14600,
        performanceScore: 4.6,
        tenureYears: 5.5,
        skills: [['Budgeting', 'expert', 4], ['ROI Modeling', 'expert', 11], ['Procurement', 'intermediate', 45]],
    },
    {
        email: 'siddharth.jain@asteriaops.demo',
        name: 'Siddharth Jain',
        department: 'Finance',
        title: 'Commercial Analyst',
        seniority: 'mid',
        location: 'Jaipur',
        travelEligible: true,
        costPerDay: 9900,
        performanceScore: 3.8,
        tenureYears: 2.0,
        skills: [['Revenue Analysis', 'expert', 17], ['Excel Modeling', 'expert', 13], ['Procurement', 'intermediate', 51]],
    },
];

const projects = [
    {
        id: id(),
        name: 'Atlas Workforce Intelligence',
        status: 'active' as ProjectStatus,
        start: date(-32),
        end: date(78),
        skills: [
            { skill_name: 'React', proficiency: 'expert', count: 2 },
            { skill_name: 'Python', proficiency: 'expert', count: 1 },
            { skill_name: 'SQL', proficiency: 'expert', count: 2 },
            { skill_name: 'Design Systems', proficiency: 'expert', count: 1 },
        ],
    },
    {
        id: id(),
        name: 'Nimbus Cloud Reliability Sprint',
        status: 'active' as ProjectStatus,
        start: date(-20),
        end: date(46),
        skills: [
            { skill_name: 'AWS', proficiency: 'expert', count: 2 },
            { skill_name: 'Kubernetes', proficiency: 'expert', count: 1 },
            { skill_name: 'Incident Response', proficiency: 'expert', count: 1 },
            { skill_name: 'Cloud Security', proficiency: 'intermediate', count: 1 },
        ],
    },
    {
        id: id(),
        name: 'Pulse Enterprise Migration',
        status: 'active' as ProjectStatus,
        start: date(-9),
        end: date(64),
        skills: [
            { skill_name: 'Customer Onboarding', proficiency: 'expert', count: 1 },
            { skill_name: 'Agile Delivery', proficiency: 'expert', count: 1 },
            { skill_name: 'Product Training', proficiency: 'intermediate', count: 1 },
            { skill_name: 'SLA Management', proficiency: 'expert', count: 1 },
        ],
    },
    {
        id: id(),
        name: 'Helios Security Compliance Review',
        status: 'planned' as ProjectStatus,
        start: date(15),
        end: date(90),
        skills: [
            { skill_name: 'Threat Modeling', proficiency: 'expert', count: 1 },
            { skill_name: 'Compliance', proficiency: 'expert', count: 2 },
            { skill_name: 'Audit Readiness', proficiency: 'expert', count: 1 },
        ],
    },
    {
        id: id(),
        name: 'Quartz Analytics Modernization',
        status: 'planned' as ProjectStatus,
        start: date(30),
        end: date(122),
        skills: [
            { skill_name: 'dbt', proficiency: 'intermediate', count: 1 },
            { skill_name: 'Power BI', proficiency: 'expert', count: 2 },
            { skill_name: 'Forecasting', proficiency: 'intermediate', count: 1 },
            { skill_name: 'ROI Modeling', proficiency: 'intermediate', count: 1 },
        ],
    },
    {
        id: id(),
        name: 'Legacy Portal Stabilization',
        status: 'completed' as ProjectStatus,
        start: date(-115),
        end: date(-18),
        skills: [
            { skill_name: 'Regression Planning', proficiency: 'expert', count: 1 },
            { skill_name: 'JavaScript', proficiency: 'intermediate', count: 1 },
            { skill_name: 'Process Optimization', proficiency: 'intermediate', count: 1 },
        ],
    },
    {
        id: id(),
        name: 'Sutra Mobile Partner Launch',
        status: 'active' as ProjectStatus,
        start: date(-4),
        end: date(70),
        skills: [
            { skill_name: 'React Native', proficiency: 'expert', count: 1 },
            { skill_name: 'Mobile QA', proficiency: 'intermediate', count: 1 },
            { skill_name: 'Customer Discovery', proficiency: 'intermediate', count: 1 },
        ],
    },
    {
        id: id(),
        name: 'Kaveri Operating Model Reset',
        status: 'planned' as ProjectStatus,
        start: date(22),
        end: date(104),
        skills: [
            { skill_name: 'Workforce Planning', proficiency: 'expert', count: 1 },
            { skill_name: 'Operating Rhythm', proficiency: 'expert', count: 1 },
            { skill_name: 'Budgeting', proficiency: 'expert', count: 1 },
        ],
    },
];

const assignments: Array<[string, string, number, number]> = [
    ['aarav.mehta@asteriaops.demo', 'Atlas Workforce Intelligence', -30, 78],
    ['nisha.rao@asteriaops.demo', 'Atlas Workforce Intelligence', -30, 78],
    ['maya.iyer@asteriaops.demo', 'Atlas Workforce Intelligence', -28, 58],
    ['dev.patel@asteriaops.demo', 'Atlas Workforce Intelligence', -22, 72],
    ['sanya.chopra@asteriaops.demo', 'Atlas Workforce Intelligence', -17, 55],
    ['sara.khan@asteriaops.demo', 'Atlas Workforce Intelligence', -12, 38],
    ['rohan.malhotra@asteriaops.demo', 'Nimbus Cloud Reliability Sprint', -20, 46],
    ['parth.sharma@asteriaops.demo', 'Nimbus Cloud Reliability Sprint', -18, 46],
    ['vikram.joshi@asteriaops.demo', 'Nimbus Cloud Reliability Sprint', -18, 46],
    ['nisha.rao@asteriaops.demo', 'Nimbus Cloud Reliability Sprint', -8, 32],
    ['sara.khan@asteriaops.demo', 'Pulse Enterprise Migration', -9, 64],
    ['meera.nair@asteriaops.demo', 'Pulse Enterprise Migration', -9, 64],
    ['karan.arora@asteriaops.demo', 'Pulse Enterprise Migration', -7, 64],
    ['ananya.das@asteriaops.demo', 'Pulse Enterprise Migration', -5, 52],
    ['aditi.menon@asteriaops.demo', 'Sutra Mobile Partner Launch', -4, 70],
    ['kabir.sen@asteriaops.demo', 'Sutra Mobile Partner Launch', -4, 70],
    ['rahul.bose@asteriaops.demo', 'Sutra Mobile Partner Launch', -2, 62],
    ['kabir.sen@asteriaops.demo', 'Legacy Portal Stabilization', -92, -18],
    ['tara.bhat@asteriaops.demo', 'Legacy Portal Stabilization', -78, -18],
    ['ishaan.kapoor@asteriaops.demo', 'Legacy Portal Stabilization', -72, -18],
    ['vikram.joshi@asteriaops.demo', 'Helios Security Compliance Review', -3, 52],
    ['pooja.naik@asteriaops.demo', 'Helios Security Compliance Review', -2, 52],
    ['omkar.reddy@asteriaops.demo', 'Quartz Analytics Modernization', -1, 92],
    ['leena.mukherjee@asteriaops.demo', 'Quartz Analytics Modernization', -1, 92],
    ['neha.trivedi@asteriaops.demo', 'Kaveri Operating Model Reset', -1, 78],
    ['gaurav.sethi@asteriaops.demo', 'Kaveri Operating Model Reset', -1, 78],
    ['aarav.mehta@asteriaops.demo', 'Nimbus Cloud Reliability Sprint', -8, 28],
    ['sara.khan@asteriaops.demo', 'Kaveri Operating Model Reset', -4, 46],
    ['rohan.malhotra@asteriaops.demo', 'Helios Security Compliance Review', -2, 35],
];

const teamDefinitions = [
    {
        managerEmail: 'arjun.manager@asteriaops.demo',
        name: 'Platform Delivery Pod',
        approved: [
            'aarav.mehta@asteriaops.demo',
            'nisha.rao@asteriaops.demo',
            'ishaan.kapoor@asteriaops.demo',
            'aditi.menon@asteriaops.demo',
            'kabir.sen@asteriaops.demo',
            'farah.qureshi@asteriaops.demo',
            'rohan.malhotra@asteriaops.demo',
            'parth.sharma@asteriaops.demo',
        ],
        pending: ['sanya.chopra@asteriaops.demo', 'pooja.naik@asteriaops.demo'],
    },
    {
        managerEmail: 'meera.manager@asteriaops.demo',
        name: 'Customer Growth Pod',
        approved: [
            'sara.khan@asteriaops.demo',
            'manav.singh@asteriaops.demo',
            'ananya.das@asteriaops.demo',
            'rahul.bose@asteriaops.demo',
            'meera.nair@asteriaops.demo',
            'karan.arora@asteriaops.demo',
            'maya.iyer@asteriaops.demo',
            'tanya.gupta@asteriaops.demo',
        ],
        pending: ['tara.bhat@asteriaops.demo', 'gaurav.sethi@asteriaops.demo'],
    },
    {
        managerEmail: 'vikram.manager@asteriaops.demo',
        name: 'Business Intelligence Pod',
        approved: [
            'dev.patel@asteriaops.demo',
            'omkar.reddy@asteriaops.demo',
            'sanya.chopra@asteriaops.demo',
            'leena.mukherjee@asteriaops.demo',
            'siddharth.jain@asteriaops.demo',
            'neha.trivedi@asteriaops.demo',
            'aruna.pillai@asteriaops.demo',
            'vikram.joshi@asteriaops.demo',
            'pooja.naik@asteriaops.demo',
        ],
        pending: ['manav.singh@asteriaops.demo', 'aditi.menon@asteriaops.demo'],
    },
];

async function deleteExistingDemoCompany(client: any) {
    const existing = await client.query(
        'SELECT company_id FROM public.companies WHERE company_name = $1',
        [DEMO_COMPANY_NAME]
    );

    for (const row of existing.rows) {
        const companyId = row.company_id;
        await client.query('DELETE FROM public.telemetry_events WHERE company_id = $1', [companyId]);
        await client.query('DELETE FROM public.audit_logs WHERE company_id = $1', [companyId]);
        await client.query('DELETE FROM public.burnout_signals WHERE company_id = $1', [companyId]);
        await client.query('DELETE FROM public.employee_requests WHERE company_id = $1', [companyId]);
        await client.query('DELETE FROM public.availability_window WHERE company_id = $1', [companyId]);
        await client.query('DELETE FROM public.team_memberships WHERE company_id = $1', [companyId]);
        await client.query('DELETE FROM public.assignments WHERE company_id = $1', [companyId]);
        await client.query('DELETE FROM public.teams WHERE company_id = $1', [companyId]);
        await client.query('DELETE FROM public.skills WHERE company_id = $1', [companyId]);
        await client.query('DELETE FROM public.employees WHERE company_id = $1', [companyId]);
        await client.query('DELETE FROM public.projects WHERE company_id = $1', [companyId]);
        await client.query('DELETE FROM public.company_deks WHERE company_id = $1', [companyId]);
        await client.query('DELETE FROM public.users WHERE company_id = $1', [companyId]);
        await client.query('DELETE FROM public.companies WHERE company_id = $1', [companyId]);
    }
}

async function insertUser(client: any, user: UserSeed, companyId: string, passwordHash: string) {
    await client.query(
        `INSERT INTO public.users (user_id, email, password_hash, company_id, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, user.email, passwordHash, companyId, user.role]
    );
}

async function main() {
    const client = await pool.connect();
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
    const allEmployeeUsers = employees.map(employee => ({
        id: id(),
        email: employee.email,
        role: 'employee' as Role,
    }));
    const employeeUsersByEmail = new Map(allEmployeeUsers.map(user => [user.email, user]));

    try {
        await client.query('BEGIN');
        await deleteExistingDemoCompany(client);

        const companyResult = await client.query(
            `INSERT INTO public.companies (company_name)
             VALUES ($1)
             RETURNING company_id`,
            [DEMO_COMPANY_NAME]
        );
        const companyId = companyResult.rows[0].company_id;

        for (const user of [...hrUsers, ...managerUsers, ...allEmployeeUsers]) {
            await insertUser(client, user, companyId, passwordHash);
        }

        const employeeIdsByEmail = new Map<string, string>();
        for (const employee of employees) {
            const employeeId = id();
            const user = employeeUsersByEmail.get(employee.email);
            const encryptedName = await encrypt(employee.name, companyId, DEMO_COMPANY_SECRET);
            const encryptedEmail = await encrypt(employee.email, companyId, DEMO_COMPANY_SECRET);
            const encryptedCost = await encrypt(String(employee.costPerDay), companyId, DEMO_COMPANY_SECRET);
            const encryptedPerformance = await encrypt(String(employee.performanceScore), companyId, DEMO_COMPANY_SECRET);

            await client.query(
                `INSERT INTO public.employees (
                    employee_id, user_id, company_id, name_encrypted, work_email_encrypted,
                    cost_per_day_encrypted, performance_score_encrypted, department, seniority_level,
                    location, travel_eligible, availability_from, availability_to,
                    current_project_load, capacity_committed_pct, last_assignment_date,
                    tenure_years, is_archived
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, 0, NULL, $14, false)`,
                [
                    employeeId,
                    user?.id || null,
                    companyId,
                    encryptedName,
                    encryptedEmail,
                    encryptedCost,
                    encryptedPerformance,
                    employee.department,
                    employee.seniority,
                    employee.location,
                    employee.travelEligible,
                    date(0),
                    date(45),
                    employee.tenureYears,
                ]
            );
            employeeIdsByEmail.set(employee.email, employeeId);

            for (const [skillName, proficiency, daysSinceUsed] of employee.skills) {
                await client.query(
                    `INSERT INTO public.skills (employee_id, company_id, skill_name, proficiency, last_used_date)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [employeeId, companyId, skillName, proficiency, date(-daysSinceUsed)]
                );
            }

            for (const window of employee.availability || []) {
                await client.query(
                    `INSERT INTO public.availability_window (
                        employee_id, company_id, window_type, start_date, end_date, note, created_by
                     )
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        employeeId,
                        companyId,
                        window.windowType,
                        date(window.startOffset),
                        date(window.endOffset),
                        window.note,
                        hrUsers[0].id,
                    ]
                );
            }
        }

        const projectsByName = new Map<string, string>();
        for (const project of projects) {
            await client.query(
                `INSERT INTO public.projects (
                    project_id, company_id, project_name, required_skills, start_date, end_date, status
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    project.id,
                    companyId,
                    project.name,
                    JSON.stringify(project.skills),
                    project.start,
                    project.end,
                    project.status,
                ]
            );
            projectsByName.set(project.name, project.id);
        }

        for (const definition of teamDefinitions) {
            const teamId = id();
            const manager = managerUsers.find(user => user.email === definition.managerEmail);
            if (!manager) continue;

            await client.query(
                `INSERT INTO public.teams (team_id, manager_id, company_id, team_name)
                 VALUES ($1, $2, $3, $4)`,
                [teamId, manager.id, companyId, definition.name]
            );

            const insertMembership = async (email: string, status: MembershipStatus) => {
                const employeeId = employeeIdsByEmail.get(email);
                if (!employeeId) return;
                await client.query(
                    `INSERT INTO public.team_memberships (
                        membership_id, team_id, employee_id, company_id, status,
                        requested_by, reviewed_by, request_reason, review_note, reviewed_at
                     )
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [
                        id(),
                        teamId,
                        employeeId,
                        companyId,
                        status,
                        manager.id,
                        status === 'approved' ? hrUsers[0].id : null,
                        status === 'pending' ? 'Needed for upcoming cross-functional delivery wave.' : null,
                        status === 'approved' ? 'Approved for demo staffing model.' : null,
                        status === 'approved' ? timestamp(-3) : null,
                    ]
                );
            };

            for (const email of definition.approved) await insertMembership(email, 'approved');
            for (const email of definition.pending) await insertMembership(email, 'pending');
        }

        for (const [email, projectName, startOffset, endOffset] of assignments) {
            const employeeId = employeeIdsByEmail.get(email);
            const projectId = projectsByName.get(projectName);
            if (!employeeId || !projectId) continue;
            await client.query(
                `INSERT INTO public.assignments (
                    assignment_id, employee_id, project_id, company_id, assigned_by, start_date, end_date
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [id(), employeeId, projectId, companyId, hrUsers[0].id, date(startOffset), date(endOffset)]
            );
        }

        const loadResult = await client.query(
            `SELECT employee_id, COUNT(*)::int AS load
             FROM public.assignments
             WHERE company_id = $1
               AND start_date <= CURRENT_DATE
               AND (end_date IS NULL OR end_date >= CURRENT_DATE)
             GROUP BY employee_id`,
            [companyId]
        );

        for (const row of loadResult.rows) {
            const load = Number(row.load);
            const capacity = Math.min(100, load * 25 + (load >= 3 ? 10 : 0));
            await client.query(
                `UPDATE public.employees
                 SET current_project_load = $1,
                     capacity_committed_pct = $2,
                     last_assignment_date = CURRENT_DATE - INTERVAL '7 days'
                 WHERE employee_id = $3 AND company_id = $4`,
                [load, capacity, row.employee_id, companyId]
            );
        }

        const burnoutSeeds: Array<[string, SignalType, RiskTier, number, string]> = [
            ['aarav.mehta@asteriaops.demo', 'consecutive_assignments', 'high', 91, 'Three overlapping critical delivery streams.'],
            ['nisha.rao@asteriaops.demo', 'task_velocity', 'medium', 72, 'Recent increase in backend ownership and incident work.'],
            ['rohan.malhotra@asteriaops.demo', 'overtime_proxy', 'high', 88, 'Primary incident response rotation plus security review.'],
            ['sara.khan@asteriaops.demo', 'consecutive_assignments', 'high', 84, 'Delivery lead across two active programs.'],
            ['vikram.joshi@asteriaops.demo', 'skills_misalignment', 'medium', 68, 'Security lead is covering compliance and reliability asks.'],
            ['ishaan.kapoor@asteriaops.demo', 'no_leave', 'medium', 61, 'Low tenure employee assigned to stabilization and platform work.'],
            ['omkar.reddy@asteriaops.demo', 'task_velocity', 'medium', 59, 'Data modernization ramp started before capacity stabilised.'],
        ];

        for (const [email, signalType, riskTier, score, note] of burnoutSeeds) {
            const employeeId = employeeIdsByEmail.get(email);
            if (!employeeId) continue;
            await client.query(
                `INSERT INTO public.burnout_signals (
                    signal_id, employee_id, company_id, signal_type, risk_tier, detected_at, details
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    id(),
                    employeeId,
                    companyId,
                    signalType,
                    riskTier,
                    timestamp(-1),
                    JSON.stringify({ source: 'demo_seed', score, note }),
                ]
            );
        }

        const employeeRequestRows = [
            ['Senior Data Engineer', 'critical', [{ skill_name: 'dbt', proficiency: 'expert', count: 1 }, { skill_name: 'Forecasting', proficiency: 'intermediate', count: 1 }], managerUsers[2].id],
            ['Security Compliance Specialist', 'high', [{ skill_name: 'Compliance', proficiency: 'expert', count: 1 }, { skill_name: 'Audit Readiness', proficiency: 'expert', count: 1 }], managerUsers[0].id],
            ['Customer Migration Coordinator', 'medium', [{ skill_name: 'Customer Onboarding', proficiency: 'expert', count: 1 }, { skill_name: 'SLA Management', proficiency: 'intermediate', count: 1 }], managerUsers[1].id],
        ] as const;

        for (const [role, priority, skills, managerId] of employeeRequestRows) {
            await client.query(
                `INSERT INTO public.employee_requests (
                    request_id, company_id, manager_id, requested_role, skills_required, priority, status, created_at
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, 'Pending', $7)`,
                [id(), companyId, managerId, role, JSON.stringify(skills), priority, timestamp(-2)]
            );
        }

        const auditActions = [
            ['employee_created', 'Initial workforce seed created for 28 employees.'],
            ['project_created', 'Eight project records seeded for demo dashboards.'],
            ['team_request_approved', 'Manager team memberships approved for demo pods.'],
            ['assignment_created', 'Active assignments populated for utilization analytics.'],
            ['burnout_signal_created', 'Burnout radar demo signals inserted.'],
        ];

        for (const [action, note] of auditActions) {
            await client.query(
                `INSERT INTO public.audit_logs (log_id, actor_id, actor_role, action, company_id, metadata, created_at)
                 VALUES ($1, $2, 'hr', $3, $4, $5, $6)`,
                [id(), hrUsers[0].id, action, companyId, JSON.stringify({ note, source: 'demo_seed' }), timestamp(-1)]
            );
        }

        await client.query(
            `INSERT INTO public.telemetry_events (id, company_id, event_type, latency_ms, feedback, model_version, metadata)
             VALUES
                ($1, $4, 'match_run', 824, 'thumbs_up', 'demo-v1', $5),
                ($2, $4, 'dashboard_view', 132, NULL, 'demo-v1', $6),
                ($3, $4, 'burnout_review', 241, 'thumbs_up', 'demo-v1', $7)`,
            [
                id(),
                id(),
                id(),
                companyId,
                JSON.stringify({ route: '/manager/match', source: 'demo_seed' }),
                JSON.stringify({ route: '/hr/dashboard', source: 'demo_seed' }),
                JSON.stringify({ route: '/hr/burnout', source: 'demo_seed' }),
            ]
        );

        await client.query('COMMIT');

        console.log('\nDemo seed complete.');
        console.log(`Company: ${DEMO_COMPANY_NAME}`);
        console.log(`Company secret: ${DEMO_COMPANY_SECRET}`);
        console.log(`Password for all demo accounts: ${DEMO_PASSWORD}`);
        console.log('\nDemo logins:');
        console.log('  HR:       priya.hr@asteriaops.demo');
        console.log('  Manager:  arjun.manager@asteriaops.demo');
        console.log('  Manager:  meera.manager@asteriaops.demo');
        console.log('  Manager:  vikram.manager@asteriaops.demo');
        console.log('  Employee: aarav.mehta@asteriaops.demo');
        console.log('  Employee: maya.iyer@asteriaops.demo');
        console.log('\nSeeded 28 employees, 11 departments, 8 projects, 29 assignments, 3 teams, pending requests, availability windows, audit events, telemetry, and burnout signals.\n');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(err => {
    console.error('Demo seed failed:', err);
    process.exit(1);
});
