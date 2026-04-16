-- ============================================================
-- MAPPING NEXUS — Neon DB Master Migration
-- Run this ONCE in your Neon SQL Editor (console.neon.tech)
--
-- This replaces all Supabase-specific migrations.
-- Supabase-only items REMOVED:
--   - auth.users table references (replaced with own users table)
--   - auth.uid() RLS functions (security enforced in app layer)
--   - FORCE ROW LEVEL SECURITY (not applicable without Supabase Auth)
--   - REVOKE on anon/authenticated roles (Supabase-specific roles)
--   - handle_new_user() trigger on auth.users
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";   -- pgvector for AI matching

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
-- TABLE: companies
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
    company_id    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name  text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: users
-- NOTE: We manage our own users table. Neon has no auth.users.
-- Passwords are bcrypt-hashed by the application.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    user_id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                 text NOT NULL UNIQUE,
    password_hash         text NOT NULL,
    company_id            uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    role                  user_role NOT NULL DEFAULT 'employee',
    reset_token           text,
    reset_token_expires   timestamptz,
    created_at            timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: employees
-- PII fields encrypted at application layer (AES-256-GCM).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employees (
    employee_id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                  uuid UNIQUE REFERENCES public.users(user_id) ON DELETE SET NULL,
    company_id               uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,

    -- Encrypted PII (format: base64(iv):base64(ciphertext):base64(authTag))
    name_encrypted           text NOT NULL,
    name_key_id              text,
    work_email_encrypted     text NOT NULL,
    cost_per_day_encrypted   text,
    performance_score_encrypted text,

    -- Cleartext operational fields
    department               text NOT NULL,
    seniority_level          seniority_level NOT NULL DEFAULT 'mid',
    location                 text NOT NULL DEFAULT 'Remote',
    travel_eligible          boolean NOT NULL DEFAULT false,
    availability_from        date,
    availability_to          date,
    current_project_load     integer NOT NULL DEFAULT 0,
    capacity_committed_pct   numeric NOT NULL DEFAULT 0,
    last_assignment_date     date,
    tenure_years             numeric NOT NULL DEFAULT 0,

    is_archived              boolean NOT NULL DEFAULT false,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: skills
-- ============================================================
CREATE TABLE IF NOT EXISTS public.skills (
    skill_id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     uuid NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    skill_name      text NOT NULL,
    proficiency     skill_proficiency NOT NULL DEFAULT 'intermediate',
    last_used_date  date,
    embedding       vector(384),   -- all-MiniLM-L6-v2 embeddings
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: projects
-- ============================================================
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

-- ============================================================
-- TABLE: assignments
-- ============================================================
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

-- ============================================================
-- TABLE: teams
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teams (
    team_id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id      uuid NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    team_name       text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: team_memberships
-- ============================================================
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

-- ============================================================
-- TABLE: audit_logs (append-only)
-- ============================================================
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

-- ============================================================
-- TABLE: burnout_signals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.burnout_signals (
    signal_id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     uuid NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    signal_type     burnout_signal_type NOT NULL,
    risk_tier       risk_tier NOT NULL DEFAULT 'low',
    detected_at     timestamptz NOT NULL DEFAULT now(),
    details         jsonb DEFAULT '{}'::jsonb
);

-- ============================================================
-- TABLE: company_deks (encryption key storage)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.company_deks (
    company_id    uuid PRIMARY KEY REFERENCES public.companies(company_id) ON DELETE CASCADE,
    encrypted_dek text NOT NULL,
    created_at    timestamptz DEFAULT now(),
    updated_at    timestamptz DEFAULT now()
);

-- ============================================================
-- TABLE: telemetry_events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.telemetry_events (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE CASCADE,
    event_type    text NOT NULL,
    latency_ms    integer,
    feedback      text CHECK (feedback IN ('thumbs_up', 'thumbs_down')),
    model_version text,
    created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Semantic match function (called via pool.query instead of Supabase RPC)
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
SECURITY DEFINER
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

-- Auto-update updated_at on employees
DROP TRIGGER IF EXISTS employees_updated_at ON public.employees;
CREATE TRIGGER employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Auto-update updated_at on projects
DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_company_id           ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email                ON public.users(email);

CREATE INDEX IF NOT EXISTS idx_employees_company_id        ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id           ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_dept      ON public.employees(company_id, department);
CREATE INDEX IF NOT EXISTS idx_employees_company_seniority ON public.employees(company_id, seniority_level);
CREATE INDEX IF NOT EXISTS idx_employees_company_archived  ON public.employees(company_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_employees_company_location  ON public.employees(company_id, location);

CREATE INDEX IF NOT EXISTS idx_skills_employee_id ON public.skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_skills_company_id  ON public.skills(company_id);
CREATE INDEX IF NOT EXISTS idx_skills_name        ON public.skills(skill_name);

-- pgvector IVFFlat index (run AFTER inserting data, or REINDEX later)
CREATE INDEX IF NOT EXISTS idx_skills_embedding ON public.skills
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_projects_company_id     ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_status ON public.projects(company_id, status);

CREATE INDEX IF NOT EXISTS idx_assignments_employee_id ON public.assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_assignments_project_id  ON public.assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_company_id  ON public.assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_by ON public.assignments(assigned_by);

CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON public.teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_teams_company_id ON public.teams(company_id);

CREATE INDEX IF NOT EXISTS idx_memberships_team_id     ON public.team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_memberships_employee_id ON public.team_memberships(employee_id);
CREATE INDEX IF NOT EXISTS idx_memberships_company_id  ON public.team_memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status      ON public.team_memberships(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_membership
    ON public.team_memberships(team_id, employee_id)
    WHERE status IN ('pending', 'approved');

CREATE INDEX IF NOT EXISTS idx_audit_company_id   ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor_id     ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at   ON public.audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action       ON public.audit_logs(company_id, action);

CREATE INDEX IF NOT EXISTS idx_burnout_employee_id ON public.burnout_signals(employee_id);
CREATE INDEX IF NOT EXISTS idx_burnout_company_id  ON public.burnout_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_burnout_risk_tier   ON public.burnout_signals(company_id, risk_tier);
CREATE INDEX IF NOT EXISTS idx_burnout_detected_at ON public.burnout_signals(company_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_company    ON public.telemetry_events(company_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_event_type ON public.telemetry_events(event_type);

-- ============================================================
-- DONE
-- ============================================================
-- To verify: SELECT table_name FROM information_schema.tables
--            WHERE table_schema = 'public' ORDER BY table_name;
