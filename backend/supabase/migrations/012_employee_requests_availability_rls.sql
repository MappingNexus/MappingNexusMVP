-- ============================================================
-- MAPPING NEXUS — Migration 012: Employee requests, availability
-- windows, telemetry metadata, and user-scoped write policies
-- ============================================================

ALTER TABLE public.telemetry_events
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.employee_requests (
    request_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id           uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE CASCADE,
    manager_id           uuid NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    requested_role       text NOT NULL,
    skills_required      jsonb NOT NULL DEFAULT '[]'::jsonb,
    priority             text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status               text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Denied')),
    viewed_at            timestamptz,
    reviewed_at          timestamptz,
    reviewed_by          uuid REFERENCES public.users(user_id) ON DELETE SET NULL,
    review_note          text,
    created_employee_id  uuid REFERENCES public.employees(employee_id) ON DELETE SET NULL,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.availability_window (
    availability_window_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id            uuid NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    company_id             uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE CASCADE,
    window_type            text NOT NULL CHECK (window_type IN ('holiday', 'project_commitment', 'personal', 'other')),
    start_date             date NOT NULL,
    end_date               date NOT NULL,
    note                   text,
    created_by             uuid REFERENCES public.users(user_id) ON DELETE SET NULL,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now(),
    CHECK (start_date <= end_date)
);

CREATE INDEX IF NOT EXISTS idx_employee_requests_company_status ON public.employee_requests(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_requests_manager ON public.employee_requests(manager_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_availability_window_employee ON public.availability_window(employee_id, start_date);
CREATE INDEX IF NOT EXISTS idx_availability_window_company ON public.availability_window(company_id, start_date);

ALTER TABLE public.employee_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_window ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employees' AND policyname = 'employees_insert_hr'
    ) THEN
        CREATE POLICY "employees_insert_hr"
            ON public.employees
            FOR INSERT
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employees' AND policyname = 'employees_update_hr'
    ) THEN
        CREATE POLICY "employees_update_hr"
            ON public.employees
            FOR UPDATE
            USING (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            )
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'skills' AND policyname = 'skills_insert_hr'
    ) THEN
        CREATE POLICY "skills_insert_hr"
            ON public.skills
            FOR INSERT
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'skills' AND policyname = 'skills_update_hr'
    ) THEN
        CREATE POLICY "skills_update_hr"
            ON public.skills
            FOR UPDATE
            USING (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            )
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'skills' AND policyname = 'skills_delete_hr'
    ) THEN
        CREATE POLICY "skills_delete_hr"
            ON public.skills
            FOR DELETE
            USING (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'projects_insert_hr'
    ) THEN
        CREATE POLICY "projects_insert_hr"
            ON public.projects
            FOR INSERT
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'projects_update_hr'
    ) THEN
        CREATE POLICY "projects_update_hr"
            ON public.projects
            FOR UPDATE
            USING (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            )
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'projects_delete_hr'
    ) THEN
        CREATE POLICY "projects_delete_hr"
            ON public.projects
            FOR DELETE
            USING (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'teams' AND policyname = 'teams_insert_hr_manager'
    ) THEN
        CREATE POLICY "teams_insert_hr_manager"
            ON public.teams
            FOR INSERT
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND public.get_my_role() IN ('hr', 'manager')
                AND (
                    public.get_my_role() = 'hr'
                    OR manager_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'team_memberships' AND policyname = 'team_memberships_insert_manager'
    ) THEN
        CREATE POLICY "team_memberships_insert_manager"
            ON public.team_memberships
            FOR INSERT
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'manager'
                AND requested_by = auth.uid()
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'team_memberships' AND policyname = 'team_memberships_update_hr'
    ) THEN
        CREATE POLICY "team_memberships_update_hr"
            ON public.team_memberships
            FOR UPDATE
            USING (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            )
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'assignments' AND policyname = 'assignments_insert_hr_manager'
    ) THEN
        CREATE POLICY "assignments_insert_hr_manager"
            ON public.assignments
            FOR INSERT
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND public.get_my_role() IN ('hr', 'manager')
                AND assigned_by = auth.uid()
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'assignments' AND policyname = 'assignments_delete_hr_manager'
    ) THEN
        CREATE POLICY "assignments_delete_hr_manager"
            ON public.assignments
            FOR DELETE
            USING (
                company_id = public.get_my_company_id()
                AND public.get_my_role() IN ('hr', 'manager')
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'burnout_signals' AND policyname = 'burnout_signals_insert_hr_manager'
    ) THEN
        CREATE POLICY "burnout_signals_insert_hr_manager"
            ON public.burnout_signals
            FOR INSERT
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND public.get_my_role() IN ('hr', 'manager')
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = 'audit_logs_insert_authenticated'
    ) THEN
        CREATE POLICY "audit_logs_insert_authenticated"
            ON public.audit_logs
            FOR INSERT
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND actor_id = auth.uid()
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_requests' AND policyname = 'employee_requests_select'
    ) THEN
        CREATE POLICY "employee_requests_select"
            ON public.employee_requests
            FOR SELECT
            USING (
                company_id = public.get_my_company_id()
                AND (
                    public.get_my_role() = 'hr'
                    OR (public.get_my_role() = 'manager' AND manager_id = auth.uid())
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_requests' AND policyname = 'employee_requests_insert_manager'
    ) THEN
        CREATE POLICY "employee_requests_insert_manager"
            ON public.employee_requests
            FOR INSERT
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'manager'
                AND manager_id = auth.uid()
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_requests' AND policyname = 'employee_requests_update_hr'
    ) THEN
        CREATE POLICY "employee_requests_update_hr"
            ON public.employee_requests
            FOR UPDATE
            USING (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            )
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND public.get_my_role() = 'hr'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'availability_window' AND policyname = 'availability_window_select'
    ) THEN
        CREATE POLICY "availability_window_select"
            ON public.availability_window
            FOR SELECT
            USING (
                company_id = public.get_my_company_id()
                AND (
                    public.get_my_role() = 'hr'
                    OR (public.get_my_role() = 'manager' AND public.is_in_my_team(employee_id))
                    OR (public.get_my_role() = 'employee' AND employee_id = public.get_my_employee_id())
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'availability_window' AND policyname = 'availability_window_insert'
    ) THEN
        CREATE POLICY "availability_window_insert"
            ON public.availability_window
            FOR INSERT
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND (
                    public.get_my_role() = 'hr'
                    OR (public.get_my_role() = 'employee' AND employee_id = public.get_my_employee_id())
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'availability_window' AND policyname = 'availability_window_update'
    ) THEN
        CREATE POLICY "availability_window_update"
            ON public.availability_window
            FOR UPDATE
            USING (
                company_id = public.get_my_company_id()
                AND (
                    public.get_my_role() = 'hr'
                    OR (public.get_my_role() = 'employee' AND employee_id = public.get_my_employee_id())
                )
            )
            WITH CHECK (
                company_id = public.get_my_company_id()
                AND (
                    public.get_my_role() = 'hr'
                    OR (public.get_my_role() = 'employee' AND employee_id = public.get_my_employee_id())
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'availability_window' AND policyname = 'availability_window_delete'
    ) THEN
        CREATE POLICY "availability_window_delete"
            ON public.availability_window
            FOR DELETE
            USING (
                company_id = public.get_my_company_id()
                AND (
                    public.get_my_role() = 'hr'
                    OR (public.get_my_role() = 'employee' AND employee_id = public.get_my_employee_id())
                )
            );
    END IF;
END $$;

ALTER TABLE public.employee_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE public.availability_window FORCE ROW LEVEL SECURITY;
