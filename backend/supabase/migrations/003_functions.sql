-- ============================================================
-- MAPPING NEXUS — Migration 003: Helper Functions
-- Run AFTER 002_tables.sql (functions reference tables)
-- ============================================================
-- These SECURITY DEFINER functions are used by RLS policies
-- to determine the current user's company and role efficiently.
-- ============================================================

-- ============================================================
-- get_my_company_id()
-- Returns the company_id for the currently authenticated user.
-- Used in every RLS WHERE clause for tenant isolation.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT company_id
    FROM public.users
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_my_company_id() IS
    'Returns company_id for auth.uid(). Used by all RLS policies for tenant isolation.';

-- ============================================================
-- get_my_role()
-- Returns the role (as text) for the currently authenticated user.
-- Used by role-specific RLS policies.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT role::text
    FROM public.users
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_my_role() IS
    'Returns role string for auth.uid(). Used by RLS policies for role-based access.';

-- ============================================================
-- get_my_employee_id()
-- Returns the employee_id for the currently authenticated user.
-- Used by employees to access only their own row.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_employee_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT employee_id
    FROM public.employees
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_my_employee_id() IS
    'Returns employee_id for auth.uid(). Used by employee-role RLS policies.';

-- ============================================================
-- is_in_my_team(employee_id)
-- Returns TRUE if the given employee is in an approved team
-- managed by the currently authenticated user (manager).
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_in_my_team(target_employee_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.team_memberships tm
        JOIN public.teams t ON t.team_id = tm.team_id
        WHERE tm.employee_id = target_employee_id
          AND tm.status = 'approved'
          AND t.manager_id = auth.uid()
          AND t.company_id = public.get_my_company_id()
    );
$$;

COMMENT ON FUNCTION public.is_in_my_team(uuid) IS
    'Checks if employee is in an approved team managed by auth.uid(). Used by manager-role RLS.';

-- ============================================================
-- handle_new_user()
-- Trigger function: auto-creates public.users record when a
-- new auth.users record is inserted via Supabase Auth.
-- Reads company_id and role from raw_user_meta_data.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (user_id, company_id, role)
    VALUES (
        NEW.id,
        (NEW.raw_user_meta_data->>'company_id')::uuid,
        (NEW.raw_user_meta_data->>'role')::user_role
    );
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
    'Trigger: creates public.users row when auth.users row is inserted. Reads company_id and role from user_metadata.';

-- ============================================================
-- handle_updated_at()
-- Trigger function: auto-updates updated_at timestamp on row change.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_updated_at() IS
    'Trigger: sets updated_at = now() on every UPDATE.';
