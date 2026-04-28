/**
 * API Client — v2
 * All calls go through the backend. Token stored in localStorage.
 */
import type {
    UserProfile, Session, Employee, Team, MembershipRequest,
    MatchResult, AnalyticsOverview, BurnoutData, SkillPulseData, AuditLogEntry,
    Assignment, Project, EmployeeRequest,
} from '../types';

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const rawApiUrl = viteEnv?.VITE_API_URL || 'http://localhost:3001';
// Ensure the base URL does not double up on /api if included in env config
const normalizedApiUrl = rawApiUrl.replace(/\/api\/?$/, '');
// Ensure the URL always has a protocol so it is treated as an absolute URL.
// If VITE_API_URL is set without "https://" (e.g. "finalmvp-production.up.railway.app")
// the browser would treat it as a relative path and prepend the frontend origin.
const API = /^https?:\/\//i.test(normalizedApiUrl) ? normalizedApiUrl : `https://${normalizedApiUrl}`;
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
const AUTH_REFRESH_EXEMPT_PATHS = new Set([
    '/api/auth/login',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/refresh',
    '/api/auth/onboard-company',
    '/api/auth/invite-status',
]);

// ============ Token Management ============

const TOKEN_KEY = 'nexus_access_token';
const REFRESH_KEY = 'nexus_refresh_token';
const USER_KEY = 'nexus_user';

export function getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
export function getUser(): UserProfile | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}
export function setSession(session: Session, user: UserProfile) {
    localStorage.setItem(TOKEN_KEY, session.access_token);
    localStorage.setItem(REFRESH_KEY, session.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
}

export function getErrorMessage(result: unknown, fallback: string): string {
    if (
        typeof result === 'object' &&
        result !== null &&
        'message' in result &&
        typeof (result as { message?: unknown }).message === 'string'
    ) {
        return (result as { message: string }).message;
    }

    return fallback;
}

function headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
}

function normalizeHeaders(headersInit?: HeadersInit): Record<string, string> {
    if (!headersInit) return {};
    if (headersInit instanceof Headers) {
        return Object.fromEntries(headersInit.entries());
    }
    if (Array.isArray(headersInit)) {
        return Object.fromEntries(headersInit);
    }
    return headersInit;
}

function createFailureResponse<T>(message: string, status = 0): T {
    return { success: false, message, status } as T;
}

function buildRequestInit(options?: RequestInit, signal?: AbortSignal): RequestInit {
    return {
        ...options,
        headers: {
            ...headers(),
            ...normalizeHeaders(options?.headers),
        },
        signal,
    };
}

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutHandle = window.setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);

    try {
        return await fetch(url, buildRequestInit(options, controller.signal));
    } finally {
        window.clearTimeout(timeoutHandle);
    }
}

async function parseResponse<T>(response: Response): Promise<T> {
    const text = await response.text();

    if (!text) {
        return createFailureResponse<T>(
            response.ok
                ? 'Server returned an empty response.'
                : `Request failed with status ${response.status}.`,
            response.status
        );
    }

    try {
        return JSON.parse(text) as T;
    } catch {
        return createFailureResponse<T>(
            response.ok
                ? 'Server returned an invalid response.'
                : `Request failed with status ${response.status}.`,
            response.status
        );
    }
}

// ============ Refresh Queue / Lock Pattern ============
// When multiple requests get 401 at the same time, only ONE refresh
// request is made. All other callers wait on the same promise.

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh tokens. Uses a lock so concurrent calls
 * coalesce into a single network request.
 */
async function refreshTokenWithLock(): Promise<boolean> {
    if (isRefreshing && refreshPromise) {
        // Another call is already refreshing — piggyback on it
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = _doRefresh();

    try {
        return await refreshPromise;
    } finally {
        isRefreshing = false;
        refreshPromise = null;
    }
}

/**
 * Internal: calls /api/auth/refresh directly via fetch (NOT through
 * the request() wrapper) to avoid triggering the 401 interceptor loop.
 */
async function _doRefresh(): Promise<boolean> {
    const rt = localStorage.getItem(REFRESH_KEY);
    if (!rt) return false;

    try {
        const response = await fetch(`${API}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: rt }),
        });

        if (!response.ok) return false;

        const data = await response.json();
        if (data.success && data.session) {
            localStorage.setItem(TOKEN_KEY, data.session.access_token);
            // Rotation: server sends a NEW refresh token each time
            if (data.session.refresh_token) {
                localStorage.setItem(REFRESH_KEY, data.session.refresh_token);
            }
            return true;
        }
    } catch {
        // Network error during refresh — treat as failure
    }

    return false;
}

async function request<T = any>(path: string, options?: RequestInit): Promise<T> {
    const url = `${API}${path}`;

    try {
        let response = await fetchWithTimeout(url, options);

        // Auto-refresh on 401 for authenticated routes only.
        if (response.status === 401 && !AUTH_REFRESH_EXEMPT_PATHS.has(path)) {
            const refreshed = await refreshTokenWithLock();
            if (refreshed) {
                // Retry the original request with the fresh access token
                response = await fetchWithTimeout(url, options);
            } else {
                clearSession();
                window.location.href = '/login';
                return createFailureResponse<T>('Your session expired. Please sign in again.', 401);
            }
        }

        return await parseResponse<T>(response);
    } catch (err: any) {
        if (err?.name === 'AbortError') {
            return createFailureResponse<T>('The request timed out. Please try again.', 408);
        }

        return createFailureResponse<T>('Unable to reach the server. Please try again.', 0);
    }
}

// ============ Auth ============

export async function login(email: string, password: string) {
    const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    if (data.success && data.session && data.user) {
        setSession(data.session, data.user);
    }
    return data;
}

export async function loginWithGoogle(idToken: string) {
    const data = await request('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
    });
    if (data.success && data.session && data.user) {
        setSession(data.session, data.user);
    }
    return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
    return request('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
    });
}

export async function forgotPassword(email: string) {
    return request('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export async function resetPassword(token: string, newPassword: string) {
    return request('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
    });
}

export async function onboardCompany(data: {
    companyName: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
}) {
    return request('/api/auth/onboard-company', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/** Public wrapper — delegates to the lock-based implementation. */
export async function refreshToken(): Promise<boolean> {
    return refreshTokenWithLock();
}

export async function getMe() {
    return request('/api/auth/me');
}

export async function getInviteStatus() {
    return request<{ success: boolean; configured: boolean; message: string }>('/api/auth/invite-status');
}

export async function logout(): Promise<void> {
    // Best-effort: tell backend to revoke the refresh session before local cleanup.
    const rt = localStorage.getItem(REFRESH_KEY);

    try {
        if (rt) {
            await fetch(`${API}/api/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: rt }),
            });
        }
    } catch {
        // Logout must still complete locally even if the revoke call fails.
    } finally {
        clearSession();
        window.location.href = '/login';
    }
}

// ============ Employees ============

export async function getEmployees(params?: { department?: string; seniority?: string; archived?: boolean; list_all?: boolean }) {
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.seniority) query.set('seniority', params.seniority);
    if (params?.archived) query.set('archived', 'true');
    if (params?.list_all) query.set('list_all', 'true');
    return request<{ success: boolean; employees: Employee[]; total: number }>(
        `/api/employees?${query.toString()}`
    );
}

export async function getEmployee(id: string) {
    return request<{ success: boolean; employee: Employee }>(`/api/employees/${id}`);
}

export async function createEmployee(data: {
    name: string; workEmail: string; department: string;
    seniorityLevel?: string; costPerDay?: number; location?: string;
    travelEligible?: boolean; skills?: { name: string; proficiency: string }[];
    performanceScore?: number; tenureYears?: number; role?: 'employee' | 'manager';
    availabilityWindows?: { windowType: string; startDate: string; endDate: string; note?: string }[];
    requestId?: string;
}) {
    return request('/api/employees', { method: 'POST', body: JSON.stringify(data) });
}

export async function bulkImportEmployees(csv: string, role: 'employee' | 'manager' = 'employee') {
    return request<{
        success: boolean; message: string;
        summary: { total: number; created: number; failed: number };
        results: { row: number; email: string; status: string; onboarding?: string; error?: string }[];
    }>('/api/employees/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ csv, role }),
    });
}

export async function resendInvite(userId: string) {
    return request('/api/employees/resend-invite', {
        method: 'POST',
        body: JSON.stringify({ userId }),
    });
}

export async function updateEmployee(id: string, data: Partial<Employee>) {
    return request(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function archiveEmployee(id: string) {
    return request(`/api/employees/${id}`, { method: 'DELETE' });
}

// ============ Calendar Sync ============

export type CalendarProvider = 'google' | 'outlook';

export async function getCalendarStatus() {
    return request<{
        success: boolean;
        status: Record<CalendarProvider, {
            connected: boolean;
            connectedAt: string | null;
            lastSyncedAt: string | null;
            lastSyncError: string | null;
        }>;
    }>('/api/calendar/status');
}

export async function getCalendarAuthUrl(provider: CalendarProvider) {
    return request<{ success: boolean; authorizationUrl: string; message?: string }>(
        `/api/calendar/${provider}/auth-url`
    );
}

export async function syncCalendar(provider: CalendarProvider) {
    return request<{ success: boolean; syncedWindows: number; message?: string }>(
        `/api/calendar/${provider}/sync`,
        { method: 'POST' }
    );
}

export async function disconnectCalendar(provider: CalendarProvider) {
    return request<{ success: boolean; message?: string }>(
        `/api/calendar/${provider}`,
        { method: 'DELETE' }
    );
}

// ============ Teams ============

export async function getTeams() {
    return request<{ success: boolean; teams: Team[] }>('/api/teams');
}

export async function createTeam(teamName: string, managerId: string) {
    return request('/api/teams', {
        method: 'POST',
        body: JSON.stringify({ teamName, managerId }),
    });
}

export async function getTeamMembers(teamId: string) {
    return request(`/api/teams/${teamId}/members`);
}

export async function requestTeamMember(teamId: string, employeeId: string, reason?: string) {
    return request('/api/teams/membership-request', {
        method: 'POST',
        body: JSON.stringify({ teamId, employeeId, reason }),
    });
}

export async function getPendingRequests() {
    return request<{ success: boolean; requests: MembershipRequest[] }>(
        '/api/teams/pending-requests'
    );
}

export async function approveMembership(id: string, note?: string) {
    return request(`/api/teams/membership-request/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ note }),
    });
}

export async function rejectMembership(id: string, note?: string) {
    return request(`/api/teams/membership-request/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ note }),
    });
}

export async function createEmployeeRequest(data: {
    requestedRole: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    skillsRequired: { skill_name: string; proficiency: 'beginner' | 'intermediate' | 'expert'; count: number }[];
}) {
    return request<{ success: boolean; request: EmployeeRequest }>('/api/requests', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getEmployeeRequests() {
    return request<{ success: boolean; requests: EmployeeRequest[] }>('/api/requests');
}

export async function getEmployeeRequest(id: string) {
    return request<{ success: boolean; request: EmployeeRequest }>(`/api/requests/${id}`);
}

export async function approveEmployeeRequest(id: string, note?: string) {
    return request<{ success: boolean; request: EmployeeRequest }>(`/api/requests/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ note }),
    });
}

export async function denyEmployeeRequest(id: string, note?: string) {
    return request<{ success: boolean; request: EmployeeRequest }>(`/api/requests/${id}/deny`, {
        method: 'PUT',
        body: JSON.stringify({ note }),
    });
}

// ============ Matching Engine ============

export async function runMatch(requirements: {
    skills: { name: string; priority: 'Essential' | 'Preferred' }[];
    seniorityLevel?: string; budgetCeiling?: number;
    travelRequired?: boolean;
    startDate?: string; endDate?: string;
}, brief?: string) {
    return request<{
        success: boolean; matches: MatchResult[];
        totalCandidatesScanned: number; aiEnhanced: boolean;
        searchMethod: 'semantic' | 'keyword';
        companyAvgCostPerDay?: number | null;
        filtersApplied: string[];
    }>('/api/match', {
        method: 'POST',
        body: JSON.stringify({ requirements, brief }),
    });
}

// ============ Analytics ============

export async function getAnalyticsOverview() {
    return request<{ success: boolean; data: AnalyticsOverview }>('/api/analytics/overview');
}

export async function getBurnoutData() {
    return request<{ success: boolean; data: BurnoutData }>('/api/analytics/burnout');
}

export async function getSkillPulse() {
    return request<{ success: boolean; data: SkillPulseData }>('/api/analytics/skills');
}

export async function getRiskData() {
    return request('/api/analytics/risk');
}

// ============ Audit Logs ============

export async function getAuditLogs(params?: { limit?: number; offset?: number; action?: string }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.action) query.set('action', params.action);
    return request<{ success: boolean; logs: AuditLogEntry[]; total: number }>(
        `/api/audit-logs?${query.toString()}`
    );
}

// ============ Telemetry ============

export async function sendTelemetry(data: {
    eventType: string; latencyMs?: number;
    feedback?: 'thumbs_up' | 'thumbs_down'; modelVersion?: string;
    metadata?: Record<string, any>;
}) {
    return request('/api/telemetry', { method: 'POST', body: JSON.stringify(data) });
}

// ============ Projects ============

export async function getProjects() {
    return request<{ success: boolean; projects: Project[] }>('/api/projects');
}

export async function createProject(data: {
    projectName: string;
    requiredSkills?: { skill_name: string; proficiency: string; count: number }[];
    startDate?: string; endDate?: string;
    status?: 'planned' | 'active' | 'completed';
}) {
    return request('/api/projects', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateProject(id: string, data: {
    projectName: string;
    requiredSkills?: { skill_name: string; proficiency: string; count: number }[];
    startDate?: string;
    endDate?: string;
    status?: 'planned' | 'active' | 'completed';
}) {
    return request<{ success: boolean; project: Project }>(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// ============ Assignments ============

export async function createAssignment(data: {
    employeeId: string;
    projectId: string;
    startDate: string;
    endDate?: string;
}) {
    return request<{ success: boolean; assignment: Assignment }>('/api/assignments', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getAssignments(params?: { employeeId?: string; projectId?: string }) {
    const query = new URLSearchParams();
    if (params?.employeeId) query.set('employeeId', params.employeeId);
    if (params?.projectId) query.set('projectId', params.projectId);
    return request<{ success: boolean; assignments: Assignment[] }>(
        `/api/assignments?${query.toString()}`
    );
}

export async function removeAssignment(id: string) {
    return request<{ success: boolean; message: string }>(`/api/assignments/${id}`, {
        method: 'DELETE',
    });
}

export async function recalculateCapacity() {
    return request<{
        success: boolean;
        message: string;
        expiredCount: number;
        affectedEmployees: string[];
    }>('/api/assignments/recalculate', { method: 'POST' });
}
