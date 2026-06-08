-- ============================================================
-- MAPPING NEXUS - Fresh Neon Database Setup
-- Run this ONCE in a fresh empty Neon database.
--
-- Neon-only setup:
--   - No Supabase auth.users dependency
--   - No Supabase auth.uid() RLS policies
--   - App-layer authentication and tenant isolation are handled by backend code
--
-- If your Neon project does not support pgvector, enable the pgvector
-- extension from the Neon dashboard first, then rerun this script.
-- ============================================================

BEGIN;

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- ENUM TYPES
-- ============================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('hr', 'manager', 'employee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE seniority_level AS ENUM ('junior', 'mid', 'senior', 'lead', 'principal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE skill_proficiency AS ENUM ('beginner', 'intermediate', 'expert');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('planned', 'active', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE burnout_signal_type AS ENUM (
        'task_velocity',
        'no_leave',
        'consecutive_assignments',
        'overtime_proxy',
        'skills_misalignment'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE risk_tier AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- CORE TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
    company_id    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name  text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
    user_id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                 text NOT NULL UNIQUE,
    password_hash         text NOT NULL,
    company_id            uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    role                  user_role NOT NULL,
    reset_token           text,
    reset_token_expires   timestamptz,
    created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employees (
    employee_id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     uuid UNIQUE REFERENCES public.users(user_id) ON DELETE SET NULL,
    company_id                  uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    name_encrypted              text NOT NULL,
    name_key_id                 text,
    work_email_encrypted        text NOT NULL,
    cost_per_day_encrypted      text,
    performance_score_encrypted text,
    department                  text NOT NULL,
    seniority_level             seniority_level NOT NULL DEFAULT 'mid',
    location                    text NOT NULL DEFAULT 'Remote',
    travel_eligible             boolean NOT NULL DEFAULT false,
    availability_from           date,
    availability_to             date,
    current_project_load        integer NOT NULL DEFAULT 0,
    capacity_committed_pct      numeric NOT NULL DEFAULT 0,
    last_assignment_date        date,
    tenure_years                numeric NOT NULL DEFAULT 0,
    is_archived                 boolean NOT NULL DEFAULT false,
    created_at                  timestamptz NOT NULL DEFAULT now(),
    updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skills (
    skill_id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     uuid NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    skill_name      text NOT NULL,
    proficiency     skill_proficiency NOT NULL DEFAULT 'intermediate',
    last_used_date  date,
    embedding       vector(384),
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
    project_id      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    project_name    text NOT NULL,
    required_skills jsonb DEFAULT '[]'::jsonb,
    start_date      date,
    end_date        date,
    status          project_status NOT NULL DEFAULT 'planned',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assignments (
    assignment_id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     uuid NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    project_id      uuid NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    assigned_by     uuid NOT NULL REFERENCES public.users(user_id),
    start_date      date NOT NULL,
    end_date        date,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teams (
    team_id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id      uuid NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    team_name       text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_memberships (
    membership_id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id         uuid NOT NULL REFERENCES public.teams(team_id) ON DELETE CASCADE,
    employee_id     uuid NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    status          membership_status NOT NULL DEFAULT 'pending',
    requested_by    uuid NOT NULL REFERENCES public.users(user_id),
    reviewed_by     uuid REFERENCES public.users(user_id),
    request_reason  text,
    review_note     text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    reviewed_at     timestamptz
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    log_id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id        uuid NOT NULL,
    actor_role      text NOT NULL,
    action          text NOT NULL,
    target_id       uuid,
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    metadata        jsonb DEFAULT '{}'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.burnout_signals (
    signal_id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     uuid NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    signal_type     burnout_signal_type NOT NULL,
    risk_tier       risk_tier NOT NULL DEFAULT 'low',
    detected_at     timestamptz NOT NULL DEFAULT now(),
    details         jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.company_deks (
    company_id    uuid PRIMARY KEY REFERENCES public.companies(company_id) ON DELETE CASCADE,
    encrypted_dek text NOT NULL,
    created_at    timestamptz DEFAULT now(),
    updated_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.telemetry_events (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE CASCADE,
    event_type    text NOT NULL,
    latency_ms    integer,
    feedback      text CHECK (feedback IN ('thumbs_up', 'thumbs_down')),
    model_version text,
    metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at    timestamptz DEFAULT now()
);

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

-- ============================================================
-- FUNCTIONS
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

CREATE OR REPLACE FUNCTION public.handle_assignment_created()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.employees
    SET current_project_load = current_project_load + 1,
        capacity_committed_pct = LEAST(capacity_committed_pct + 25, 100),
        last_assignment_date = CURRENT_DATE
    WHERE employee_id = NEW.employee_id;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_assignment_deleted()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.employees
    SET current_project_load = GREATEST(current_project_load - 1, 0),
        capacity_committed_pct = GREATEST(capacity_committed_pct - 25, 0)
    WHERE employee_id = OLD.employee_id;

    RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_capacity()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    expired_count integer;
BEGIN
    SELECT COUNT(*) INTO expired_count
    FROM public.assignments
    WHERE end_date IS NOT NULL
      AND end_date <= CURRENT_DATE;

    WITH expired AS (
        DELETE FROM public.assignments
        WHERE end_date IS NOT NULL
          AND end_date <= CURRENT_DATE
        RETURNING employee_id
    ),
    affected AS (
        SELECT DISTINCT employee_id FROM expired
    )
    UPDATE public.employees e
    SET current_project_load = (
            SELECT COUNT(*)
            FROM public.assignments a
            WHERE a.employee_id = e.employee_id
        ),
        capacity_committed_pct = LEAST((
            SELECT COUNT(*)
            FROM public.assignments a
            WHERE a.employee_id = e.employee_id
        ) * 25, 100)
    WHERE e.employee_id IN (SELECT employee_id FROM affected);

    RETURN expired_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_skills_by_embedding(
    query_embedding vector(384),
    match_company_id uuid,
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 50
)
RETURNS TABLE (
    skill_id uuid,
    employee_id uuid,
    skill_name text,
    proficiency text,
    last_used_date date,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.skill_id,
        s.employee_id,
        s.skill_name,
        s.proficiency::text,
        s.last_used_date,
        1 - (s.embedding <=> query_embedding) AS similarity
    FROM public.skills s
    WHERE s.company_id = match_company_id
      AND s.embedding IS NOT NULL
      AND 1 - (s.embedding <=> query_embedding) > match_threshold
    ORDER BY s.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS employees_updated_at ON public.employees;
CREATE TRIGGER employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS company_deks_updated_at ON public.company_deks;
CREATE TRIGGER company_deks_updated_at
    BEFORE UPDATE ON public.company_deks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS employee_requests_updated_at ON public.employee_requests;
CREATE TRIGGER employee_requests_updated_at
    BEFORE UPDATE ON public.employee_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS availability_window_updated_at ON public.availability_window;
CREATE TRIGGER availability_window_updated_at
    BEFORE UPDATE ON public.availability_window
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_assignment_created ON public.assignments;
CREATE TRIGGER on_assignment_created
    AFTER INSERT ON public.assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_assignment_created();

DROP TRIGGER IF EXISTS on_assignment_deleted ON public.assignments;
CREATE TRIGGER on_assignment_deleted
    AFTER DELETE ON public.assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_assignment_deleted();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_dept ON public.employees(company_id, department);
CREATE INDEX IF NOT EXISTS idx_employees_company_seniority ON public.employees(company_id, seniority_level);
CREATE INDEX IF NOT EXISTS idx_employees_company_archived ON public.employees(company_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_employees_company_location ON public.employees(company_id, location);

CREATE INDEX IF NOT EXISTS idx_skills_employee_id ON public.skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_skills_company_id ON public.skills(company_id);
CREATE INDEX IF NOT EXISTS idx_skills_name ON public.skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_skills_embedding ON public.skills
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_status ON public.projects(company_id, status);

CREATE INDEX IF NOT EXISTS idx_assignments_employee_id ON public.assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_assignments_project_id ON public.assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_company_id ON public.assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_by ON public.assignments(assigned_by);

CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON public.teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_teams_company_id ON public.teams(company_id);

CREATE INDEX IF NOT EXISTS idx_memberships_team_id ON public.team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_memberships_employee_id ON public.team_memberships(employee_id);
CREATE INDEX IF NOT EXISTS idx_memberships_company_id ON public.team_memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.team_memberships(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_membership
    ON public.team_memberships(team_id, employee_id)
    WHERE status IN ('pending', 'approved');

CREATE INDEX IF NOT EXISTS idx_audit_company_id ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(company_id, action);

CREATE INDEX IF NOT EXISTS idx_burnout_employee_id ON public.burnout_signals(employee_id);
CREATE INDEX IF NOT EXISTS idx_burnout_company_id ON public.burnout_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_burnout_risk_tier ON public.burnout_signals(company_id, risk_tier);
CREATE INDEX IF NOT EXISTS idx_burnout_detected_at ON public.burnout_signals(company_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_company ON public.telemetry_events(company_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_event_type ON public.telemetry_events(event_type);

CREATE INDEX IF NOT EXISTS idx_employee_requests_company_status ON public.employee_requests(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_requests_manager ON public.employee_requests(manager_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_availability_window_employee ON public.availability_window(employee_id, start_date);
CREATE INDEX IF NOT EXISTS idx_availability_window_company ON public.availability_window(company_id, start_date);

COMMIT;

-- Verification:
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
