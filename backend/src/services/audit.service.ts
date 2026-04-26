/**
 * Audit Logging Service — Neon DB
 *
 * Append-only audit trail for all sensitive actions.
 * Uses direct pool query instead of Supabase client.
 *
 * ZERO PII POLICY: Never log employee names, costs, or raw data.
 */
import { pool } from '../config/db.js';

export interface AuditEntry {
    actorId: string;
    actorRole: string;
    action: string;
    targetId?: string;
    companyId: string;
    metadata?: Record<string, any>;
}

export const AuditActions = {
    // Employee lifecycle
    EMPLOYEE_CREATED: 'employee_created',
    EMPLOYEE_EDITED: 'employee_edited',
    EMPLOYEE_ARCHIVED: 'employee_archived',

    // Team management
    TEAM_CREATED: 'team_created',
    TEAM_REQUEST_CREATED: 'team_request_created',
    TEAM_REQUEST_APPROVED: 'team_request_approved',
    TEAM_REQUEST_REJECTED: 'team_request_rejected',
    EMPLOYEE_REQUEST_CREATED: 'employee_request_created',
    EMPLOYEE_REQUEST_APPROVED: 'employee_request_approved',
    EMPLOYEE_REQUEST_DENIED: 'employee_request_denied',

    // Assignments
    ASSIGNMENT_CREATED: 'assignment_created',
    ASSIGNMENT_REMOVED: 'assignment_removed',
    CAPACITY_RECALCULATED: 'capacity_recalculated',

    // Matching
    MATCH_QUERY_EXECUTED: 'match_query_executed',

    // Auth
    USER_LOGIN: 'user_login',
    USER_CREATED: 'user_created',
    USER_SUSPENDED: 'user_suspended',
    USER_DEACTIVATED: 'user_deactivated',
    USER_OFFBOARDED: 'user_offboarded',
    USER_REACTIVATED: 'user_reactivated',
    PASSWORD_CHANGED: 'password_changed',
    INVITE_RESENT: 'invite_resent',

    // Security
    UNAUTHORIZED_ACCESS: 'unauthorized_access_attempt',
    CROSS_TENANT_BLOCKED: 'cross_tenant_access_blocked',

    // Data access
    DATA_ACCESSED: 'data_accessed',
    DATA_EXPORTED: 'data_exported',
} as const;

/**
 * Log an action to the audit trail. Fire-and-forget.
 */
export async function logAction(entry: AuditEntry): Promise<void> {
    try {
        const sanitizedMetadata = entry.metadata ? sanitizeMetadata(entry.metadata) : {};

        await pool.query(
            `INSERT INTO public.audit_logs
             (actor_id, actor_role, action, target_id, company_id, metadata)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                entry.actorId,
                entry.actorRole,
                entry.action,
                entry.targetId || null,
                entry.companyId,
                JSON.stringify(sanitizedMetadata),
            ]
        );
    } catch (err: any) {
        console.error('Audit log error:', err.message);
    }
}

/**
 * Batch log multiple actions.
 */
export async function logActions(entries: AuditEntry[]): Promise<void> {
    if (entries.length === 0) return;

    try {
        const sanitized = entries.map(e => ({
            ...e,
            metadata: e.metadata ? sanitizeMetadata(e.metadata) : {},
        }));

        const values = sanitized.map((e, i) => {
            const base = i * 6;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
        });

        const params = sanitized.flatMap(e => [
            e.actorId, e.actorRole, e.action,
            e.targetId || null, e.companyId, JSON.stringify(e.metadata),
        ]);

        await pool.query(
            `INSERT INTO public.audit_logs
             (actor_id, actor_role, action, target_id, company_id, metadata)
             VALUES ${values.join(', ')}`,
            params
        );
    } catch (err: any) {
        console.error('Batch audit log error:', err.message);
    }
}

/**
 * Get audit logs for a company (HR only).
 */
export async function getAuditLogs(
    companyId: string,
    options: { limit?: number; offset?: number; action?: string } = {}
) {
    const { limit = 50, offset = 0, action } = options;

    const params: any[] = [companyId, limit, offset];
    let actionClause = '';
    if (action) {
        params.push(action);
        actionClause = `AND action = $${params.length}`;
    }

    return pool.query(
        `SELECT *, COUNT(*) OVER() AS total_count
         FROM public.audit_logs
         WHERE company_id = $1 ${actionClause}
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        params
    );
}

function sanitizeMetadata(meta: Record<string, any>): Record<string, any> {
    const ALLOWED_KEYS = new Set([
        'department', 'seniorityLevel', 'seniority_level',
        'teamId', 'team_id', 'teamName', 'team_name',
        'role', 'action', 'count', 'filename',
        'managerId', 'manager_id',
        'status', 'previousStatus', 'reason', 'note',
        'revokedSessions',
        'skillsRequested', 'matchCount', 'filtersApplied',
        'assignmentId', 'projectId',
        'candidatesScanned', 'topMatchScore', 'aiEnhanced', 'searchMethod',
        'endpoint', 'severity', 'method', 'requiredRoles', 'attemptedEndpoint',
        'attemptedCompanyId',
        'priority', 'requestedRole', 'fieldsUpdated',
    ]);

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(meta)) {
        sanitized[key] = ALLOWED_KEYS.has(key) ? value : '[REDACTED]';
    }
    return sanitized;
}
