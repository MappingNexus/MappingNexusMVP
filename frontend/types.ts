// ============================================================
// Mapping Nexus — TypeScript Interfaces (v2)
// ============================================================

export interface UserProfile {
    id: string;
    email: string;
    role: 'hr' | 'manager' | 'employee';
    companyId: string;
    companyName?: string;
    employeeId?: string;
}

export interface Session {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
}

export interface Skill {
    skill_id?: string;
    skill_name: string;
    proficiency: 'beginner' | 'intermediate' | 'expert';
    last_used_date?: string;
    name?: string; // alias
}

export interface AvailabilityWindow {
    availabilityWindowId?: string;
    windowType: 'holiday' | 'project_commitment' | 'personal' | 'other';
    startDate: string;
    endDate: string;
    note?: string;
    source?: 'manual' | 'calendar';
    sourceProvider?: 'google' | 'outlook' | null;
}

export interface Employee {
    employeeId: string;
    displayId: string;
    name: string;
    workEmail?: string;
    department: string;
    seniorityLevel: string;
    location: string;
    travelEligible: boolean;
    availabilityFrom?: string;
    availabilityTo?: string;
    availabilityWindows?: AvailabilityWindow[];
    currentProjectLoad: number;
    capacityCommittedPct?: number;
    lastAssignmentDate?: string;
    performanceScore?: number;
    costPerDay?: number;
    costRange?: 'below average' | 'near average' | 'above average' | null;
    tenureYears: number;
    isArchived: boolean;
    skills: Skill[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Team {
    teamId: string;
    teamName: string;
    managerId: string;
    companyId: string;
    createdAt: string;
}

export interface TeamMembership {
    membershipId: string;
    teamId: string;
    employeeId: string;
    status: 'pending' | 'approved' | 'rejected';
    requestReason?: string;
    reviewNote?: string;
    createdAt: string;
    reviewedAt?: string;
}

export interface MembershipRequest {
    membershipId: string;
    teamName: string;
    teamId: string;
    employeeId: string;
    employeeName: string;
    department: string;
    seniorityLevel: string;
    requestReason?: string;
    requestedBy: string;
    createdAt: string;
}

export interface ROIEstimate {
    costBand?: 'below average' | 'near average' | 'above average' | null;
    candidateCostPerDay?: number;
    companyAvgCostPerDay?: number;
    savingsPerDay?: number;
    savingsPercent?: number;
    projected90DaySavings?: number;
}

export interface MatchResult {
    rank: number;
    employee: {
        employeeId: string;
        name: string;
        department: string;
        seniorityLevel: string;
        location: string;
        travelEligible: boolean;
        currentProjectLoad: number;
        tenureYears: number;
        skills: Skill[];
        costPerDay?: number;
    };
    confidenceScore: number;
    skillMatchScore: number;
    availabilityScore: number;
    costFitScore: number;
    seniorityMatchScore: number;
    aiExplanation?: string;
    aiFlags?: string[];
    aiAction?: string;
    roiEstimate?: ROIEstimate | null;
    semanticScore?: number;
}

export interface Assignment {
    assignment_id: string;
    employee_id: string;
    project_id: string;
    company_id: string;
    assigned_by: string;
    start_date: string;
    end_date?: string;
    created_at: string;
    project?: {
        project_name: string;
        status: string;
        start_date?: string;
        end_date?: string;
    };
    employee?: {
        employee_id: string;
        department: string;
        seniority_level: string;
    };
}

export interface Project {
    project_id: string;
    company_id: string;
    project_name: string;
    required_skills: { skill_name: string; proficiency: string; count: number }[];
    start_date?: string;
    end_date?: string;
    status: 'planned' | 'active' | 'completed';
    created_at: string;
    updated_at: string;
}

export interface EmployeeRequest {
    requestId: string;
    managerId: string;
    requestedRole: string;
    skillsRequired: { skill_name: string; proficiency: string; count: number }[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'Pending' | 'Approved' | 'Denied';
    viewedAt?: string | null;
    reviewNote?: string | null;
    createdAt: string;
    reviewedAt?: string | null;
    createdEmployeeId?: string | null;
}

export interface InviteStatus {
    configured: boolean;
    message: string;
}

export interface AnalyticsOverview {
    totalEmployees: number;
    activeCount: number;
    benchCount: number;
    burnoutRiskCount: number;
    skillGapCount: number;
    healthScore: number;
    mobilityRate: number;
    departmentBreakdown: DepartmentBreakdown[];
    utilizationHeatmap: UtilizationEntry[];
    projectReadiness: ProjectReadinessSummary;
}

export interface ProjectReadinessSummary {
    status: 'ready' | 'watch' | 'gap';
    upcomingProjects: number;
    readyProjects: number;
    projectsAtRisk: number;
    requiredSkillSlots: number;
    coveredSkillSlots: number;
    coveragePct: number;
    availablePeople: number;
    blockedPeople: number;
    biggestGaps: {
        projectName: string;
        skillName: string;
        demand: number;
        available: number;
        gap: number;
        startDate: string | null;
    }[];
}

export interface DepartmentBreakdown {
    name: string;
    count: number;
    avgLoad: number;
    burnoutRisk: number;
}

export interface UtilizationEntry {
    employeeId: string;
    name: string;
    department: string;
    utilization: number;
    projectLoad: number;
    tier: 'green' | 'yellow' | 'red';
}

export interface BurnoutData {
    globalFatigueIndex: number;
    fatigueChange: number | null;
    departmentFatigue: { name: string; value: number; tier: string }[];
    highRiskEmployees: {
        id: string;
        name: string;
        department: string;
        riskScore: number;
        riskTier: string;
        signals: string[];
        recommendation: string;
    }[];
    costPreventionROI: string;
}

export interface SkillPulseData {
    topSkills: { name: string; employeeCount: number; demandScore: number }[];
    dormantSkills: { name: string; employeeCount: number; avgDaysSinceUsed: number }[];
    trendingSkills: { name: string; growthPercent: string }[];
    skillGaps: { name: string; total: number; available: number; gap: number }[];
}

export interface AuditLogEntry {
    log_id: string;
    actor_id: string;
    actor_role: string;
    action: string;
    target_id?: string;
    company_id: string;
    metadata: Record<string, any>;
    created_at: string;
}
