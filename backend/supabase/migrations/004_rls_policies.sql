-- ============================================================
-- MAPPING NEXUS — Migration 004: Row-Level Security Policies
-- Run AFTER 003_functions.sql (policies use helper functions)
-- ============================================================
-- ARCHITECTURE:
--   • RLS is the PRIMARY security layer (spec requirement)
--   • Backend middleware is the SECONDARY check
--   • Service role (backend) bypasses RLS for writes
--   • Anon key + user JWT is fully constrained by these policies
--
-- TENANT ISOLATION RULE:
--   Every SELECT policy includes: company_id = get_my_company_id()
--   This is NON-NEGOTIABLE. A breach here is catastrophic.
--
-- WRITE OPERATIONS:
--   All INSERT/UPDATE/DELETE go through the backend (service role).
--   We still define restrictive write policies as defense-in-depth
--   in case the anon key is used directly.
-- ============================================================

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.companies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.burnout_signals   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- COMPANIES — Users can only see their own company
-- ============================================================
CREATE POLICY "companies_select_own"
    ON public.companies
    FOR SELECT
    USING (company_id = public.get_my_company_id());

-- No direct INSERT/UPDATE/DELETE for users — service role only

-- ============================================================
-- USERS — See own record; HR sees all users in company
-- ============================================================
CREATE POLICY "users_select"
    ON public.users
    FOR SELECT
    USING (
        company_id = public.get_my_company_id()
        AND (
            -- Everyone can see their own record
            user_id = auth.uid()
            OR
            -- HR can see all users in their company
            public.get_my_role() = 'hr'
        )
    );

-- ============================================================
-- EMPLOYEES — Role-based visibility within same company
-- ============================================================

-- SELECT: tenant-isolated + role-scoped
CREATE POLICY "employees_select"
    ON public.employees
    FOR SELECT
    USING (
        -- Hard tenant isolation — always applied first
        company_id = public.get_my_company_id()
        AND
        -- Exclude archived employees from non-HR views
        (
            -- HR: sees all employees in their company (including archived)
            public.get_my_role() = 'hr'
            OR
            -- Manager: sees approved team members only (non-archived)
            (
                public.get_my_role() = 'manager'
                AND is_archived = false
                AND public.is_in_my_team(employee_id)
            )
            OR
            -- Employee: sees only their own row
            (
                public.get_my_role() = 'employee'
                AND user_id = auth.uid()
                AND is_archived = false
            )
        )
    );

-- UPDATE: employees can update limited fields on their own row
CREATE POLICY "employees_update_self"
    ON public.employees
    FOR UPDATE
    USING (
        company_id = public.get_my_company_id()
        AND user_id = auth.uid()
        AND public.get_my_role() = 'employee'
    )
    WITH CHECK (
        company_id = public.get_my_company_id()
        AND user_id = auth.uid()
    );

-- ============================================================
-- SKILLS — Follows same visibility as employees
-- ============================================================
CREATE POLICY "skills_select"
    ON public.skills
    FOR SELECT
    USING (
        company_id = public.get_my_company_id()
        AND (
            -- HR: all skills in company
            public.get_my_role() = 'hr'
            OR
            -- Manager: skills of approved team members
            (
                public.get_my_role() = 'manager'
                AND public.is_in_my_team(employee_id)
            )
            OR
            -- Employee: only their own skills
            (
                public.get_my_role() = 'employee'
                AND employee_id = public.get_my_employee_id()
            )
        )
    );

-- UPDATE: employees can update their own skills
CREATE POLICY "skills_update_self"
    ON public.skills
    FOR UPDATE
    USING (
        company_id = public.get_my_company_id()
        AND public.get_my_role() = 'employee'
        AND employee_id = public.get_my_employee_id()
    )
    WITH CHECK (
        company_id = public.get_my_company_id()
        AND employee_id = public.get_my_employee_id()
    );

-- INSERT: employees can add skills to their own profile
CREATE POLICY "skills_insert_self"
    ON public.skills
    FOR INSERT
    WITH CHECK (
        company_id = public.get_my_company_id()
        AND public.get_my_role() = 'employee'
        AND employee_id = public.get_my_employee_id()
    );

-- DELETE: employees can remove their own skills
CREATE POLICY "skills_delete_self"
    ON public.skills
    FOR DELETE
    USING (
        company_id = public.get_my_company_id()
        AND public.get_my_role() = 'employee'
        AND employee_id = public.get_my_employee_id()
    );

-- ============================================================
-- PROJECTS — HR and Managers see company projects
-- ============================================================
CREATE POLICY "projects_select"
    ON public.projects
    FOR SELECT
    USING (
        company_id = public.get_my_company_id()
        AND (
            public.get_my_role() = 'hr'
            OR public.get_my_role() = 'manager'
        )
    );

-- ============================================================
-- ASSIGNMENTS — Role-based visibility
-- ============================================================
CREATE POLICY "assignments_select"
    ON public.assignments
    FOR SELECT
    USING (
        company_id = public.get_my_company_id()
        AND (
            -- HR: all assignments in company
            public.get_my_role() = 'hr'
            OR
            -- Manager: assignments of their team members
            (
                public.get_my_role() = 'manager'
                AND public.is_in_my_team(employee_id)
            )
            OR
            -- Employee: only their own assignments
            (
                public.get_my_role() = 'employee'
                AND employee_id = public.get_my_employee_id()
            )
        )
    );

-- ============================================================
-- TEAMS — Managers see their teams; HR sees all
-- ============================================================
CREATE POLICY "teams_select"
    ON public.teams
    FOR SELECT
    USING (
        company_id = public.get_my_company_id()
        AND (
            -- HR: all teams in company
            public.get_my_role() = 'hr'
            OR
            -- Manager: only their own teams
            (
                public.get_my_role() = 'manager'
                AND manager_id = auth.uid()
            )
        )
    );

-- ============================================================
-- TEAM MEMBERSHIPS — Manager sees their requests; HR sees all
-- ============================================================
CREATE POLICY "team_memberships_select"
    ON public.team_memberships
    FOR SELECT
    USING (
        company_id = public.get_my_company_id()
        AND (
            -- HR: all memberships in company (for approval workflow)
            public.get_my_role() = 'hr'
            OR
            -- Manager: memberships of their teams only
            (
                public.get_my_role() = 'manager'
                AND team_id IN (
                    SELECT team_id FROM public.teams
                    WHERE manager_id = auth.uid()
                      AND company_id = public.get_my_company_id()
                )
            )
        )
    );

-- ============================================================
-- AUDIT LOGS — HR only, company-scoped, APPEND-ONLY
-- ============================================================

-- SELECT: only HR can read audit logs for their company
CREATE POLICY "audit_logs_select_hr"
    ON public.audit_logs
    FOR SELECT
    USING (
        company_id = public.get_my_company_id()
        AND public.get_my_role() = 'hr'
    );

-- INSERT: service role only (backend writes logs)
-- No UPDATE or DELETE policies — append-only by design
-- Even service role should never UPDATE/DELETE audit logs

-- ============================================================
-- BURNOUT SIGNALS — HR sees all; Manager sees team only
-- ============================================================
CREATE POLICY "burnout_signals_select"
    ON public.burnout_signals
    FOR SELECT
    USING (
        company_id = public.get_my_company_id()
        AND (
            -- HR: all signals in company
            public.get_my_role() = 'hr'
            OR
            -- Manager: signals for their team members
            (
                public.get_my_role() = 'manager'
                AND public.is_in_my_team(employee_id)
            )
        )
    );

-- ============================================================
-- FORCE RLS FOR TABLE OWNERS
-- By default, table owners bypass RLS. This ensures even the
-- postgres role is subject to RLS (defense-in-depth).
-- Service role still bypasses because Supabase configures it
-- with the 'service_role' setting that explicitly bypasses RLS.
-- ============================================================
ALTER TABLE public.companies         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.users             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employees         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.skills            FORCE ROW LEVEL SECURITY;
ALTER TABLE public.projects          FORCE ROW LEVEL SECURITY;
ALTER TABLE public.assignments       FORCE ROW LEVEL SECURITY;
ALTER TABLE public.teams             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships  FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        FORCE ROW LEVEL SECURITY;
ALTER TABLE public.burnout_signals   FORCE ROW LEVEL SECURITY;
