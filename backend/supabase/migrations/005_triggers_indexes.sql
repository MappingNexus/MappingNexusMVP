-- ============================================================
-- MAPPING NEXUS — Migration 005: Triggers & Indexes
-- Run AFTER 004_rls_policies.sql
-- ============================================================

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create public.users when Supabase Auth creates a user
-- HR provisions accounts via supabase.auth.admin.createUser()
-- with user_metadata: { company_id, role }
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on employees
CREATE TRIGGER employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Auto-update updated_at on projects
CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- INDEXES — Performance-critical for multi-tenant queries
-- ============================================================

-- USERS: lookup by company
CREATE INDEX idx_users_company_id ON public.users(company_id);

-- EMPLOYEES: critical indexes for all query patterns
CREATE INDEX idx_employees_company_id        ON public.employees(company_id);
CREATE INDEX idx_employees_user_id           ON public.employees(user_id);
CREATE INDEX idx_employees_company_dept      ON public.employees(company_id, department);
CREATE INDEX idx_employees_company_seniority ON public.employees(company_id, seniority_level);
CREATE INDEX idx_employees_company_archived  ON public.employees(company_id, is_archived);
CREATE INDEX idx_employees_company_location  ON public.employees(company_id, location);

-- SKILLS: for matching engine queries
CREATE INDEX idx_skills_employee_id ON public.skills(employee_id);
CREATE INDEX idx_skills_company_id  ON public.skills(company_id);
CREATE INDEX idx_skills_name        ON public.skills(skill_name);
-- pgvector index for similarity search (IVFFlat)
-- Using ivfflat with 100 lists — good for up to ~100k rows
-- For larger datasets, switch to HNSW: CREATE INDEX ... USING hnsw
CREATE INDEX idx_skills_embedding ON public.skills
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- PROJECTS: company-scoped queries
CREATE INDEX idx_projects_company_id     ON public.projects(company_id);
CREATE INDEX idx_projects_company_status ON public.projects(company_id, status);

-- ASSIGNMENTS: employee and project lookups
CREATE INDEX idx_assignments_employee_id ON public.assignments(employee_id);
CREATE INDEX idx_assignments_project_id  ON public.assignments(project_id);
CREATE INDEX idx_assignments_company_id  ON public.assignments(company_id);
CREATE INDEX idx_assignments_assigned_by ON public.assignments(assigned_by);

-- TEAMS: manager and company lookups
CREATE INDEX idx_teams_manager_id ON public.teams(manager_id);
CREATE INDEX idx_teams_company_id ON public.teams(company_id);

-- TEAM MEMBERSHIPS: the critical join for manager visibility
CREATE INDEX idx_memberships_team_id     ON public.team_memberships(team_id);
CREATE INDEX idx_memberships_employee_id ON public.team_memberships(employee_id);
CREATE INDEX idx_memberships_company_id  ON public.team_memberships(company_id);
CREATE INDEX idx_memberships_status      ON public.team_memberships(status);
-- Composite: the exact query is_in_my_team() runs
CREATE INDEX idx_memberships_approved_team ON public.team_memberships(employee_id, status)
    WHERE status = 'approved';

-- AUDIT LOGS: company-scoped chronological queries
CREATE INDEX idx_audit_company_id   ON public.audit_logs(company_id);
CREATE INDEX idx_audit_actor_id     ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_created_at   ON public.audit_logs(company_id, created_at DESC);
CREATE INDEX idx_audit_action       ON public.audit_logs(company_id, action);

-- BURNOUT SIGNALS: company-scoped by employee
CREATE INDEX idx_burnout_employee_id ON public.burnout_signals(employee_id);
CREATE INDEX idx_burnout_company_id  ON public.burnout_signals(company_id);
CREATE INDEX idx_burnout_risk_tier   ON public.burnout_signals(company_id, risk_tier);
CREATE INDEX idx_burnout_detected_at ON public.burnout_signals(company_id, detected_at DESC);

-- ============================================================
-- CONSTRAINTS: Prevent audit log mutation
-- ============================================================
-- Revoke UPDATE and DELETE on audit_logs from all roles
-- Only INSERT is permitted (append-only)
REVOKE UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;

-- ============================================================
-- UNIQUE CONSTRAINTS
-- ============================================================
-- An employee can only be in a pending/approved state once per team
-- (prevent duplicate requests)
CREATE UNIQUE INDEX idx_unique_active_membership
    ON public.team_memberships(team_id, employee_id)
    WHERE status IN ('pending', 'approved');
