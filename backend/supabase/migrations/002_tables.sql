-- ============================================================
-- MAPPING NEXUS — Migration 002: All Tables
-- Run AFTER 001_extensions_and_enums.sql
-- ============================================================
-- CRITICAL: Every table has company_id for multi-tenant isolation.
-- No cross-company joins are ever permitted.
-- ============================================================

-- Drop existing tables (reverse dependency order) for clean re-creation
DROP TABLE IF EXISTS public.burnout_signals CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.team_memberships CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- ============================================================
-- 1. COMPANIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
    company_id    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name  text NOT NULL,  -- Encrypted at application layer (AES-256-GCM)
    created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.companies IS 'Multi-tenant root table. Each company is a fully isolated tenant.';
COMMENT ON COLUMN public.companies.company_name IS 'Stored encrypted. Decrypted only in application layer.';

-- ============================================================
-- 2. USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id    uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    role          user_role NOT NULL DEFAULT 'employee',
    created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS 'Maps Supabase auth.users to company + role. One record per auth user. Sensitive role changes must revoke sessions.';

-- ============================================================
-- 3. EMPLOYEES
-- ============================================================
-- PII fields are encrypted at the application layer using AES-256-GCM.
-- Encrypted fields store: base64(iv):base64(ciphertext):base64(authTag)
-- Non-PII operational fields remain in cleartext for queries/analytics.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employees (
    employee_id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                  uuid UNIQUE REFERENCES public.users(user_id) ON DELETE SET NULL,
    company_id               uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,

    -- Encrypted PII fields (application-layer AES-256-GCM)
    name_encrypted           text NOT NULL,          -- Employee full name, encrypted
    name_key_id              text,                   -- Supabase Vault secret ID for the DEK
    work_email_encrypted     text NOT NULL,          -- Work email, encrypted
    cost_per_day_encrypted   text,                   -- ₹/day cost, encrypted
    performance_score_encrypted text,                -- Score 0.0-5.0, encrypted

    -- Cleartext operational fields (needed for queries/matching/analytics)
    department               text NOT NULL,
    seniority_level          seniority_level NOT NULL DEFAULT 'mid',
    location                 text NOT NULL DEFAULT 'Remote',
    travel_eligible          boolean NOT NULL DEFAULT false,
    availability_from        date,
    availability_to          date,
    current_project_load     integer NOT NULL DEFAULT 0,
    capacity_committed_pct   numeric NOT NULL DEFAULT 0,      -- 0-100%
    last_assignment_date     date,
    tenure_years             numeric NOT NULL DEFAULT 0,

    -- Soft delete (never hard delete — audit trail)
    is_archived              boolean NOT NULL DEFAULT false,

    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.employees IS 'Core employee profiles. PII encrypted, operational data in cleartext. Soft-deleted via is_archived, never hard-deleted.';
COMMENT ON COLUMN public.employees.name_encrypted IS 'Format: base64(iv):base64(ciphertext):base64(authTag). DEK identified by name_key_id.';

-- ============================================================
-- 4. SKILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.skills (
    skill_id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     uuid NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    skill_name      text NOT NULL,
    proficiency     skill_proficiency NOT NULL DEFAULT 'intermediate',
    last_used_date  date,
    embedding       vector(384),   -- pgvector: generated from skill_name + proficiency
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.skills IS 'Per-employee skills with proficiency and pgvector embedding for semantic matching.';
COMMENT ON COLUMN public.skills.embedding IS 'vector(384) — generated from skill_name + proficiency context. Used by AI matching engine.';
COMMENT ON COLUMN public.skills.company_id IS 'Denormalized from employees for RLS performance. MUST match employees.company_id.';

-- ============================================================
-- 5. PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
    project_id      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    project_name    text NOT NULL,
    required_skills jsonb DEFAULT '[]'::jsonb,   -- Array of {skill_name, proficiency, count}
    start_date      date,
    end_date        date,
    status          project_status NOT NULL DEFAULT 'planned',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.projects IS 'Company projects with required skills. Used for Skill Gap vs Pipeline analysis.';

-- ============================================================
-- 6. ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assignments (
    assignment_id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     uuid NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    project_id      uuid NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    assigned_by     uuid NOT NULL REFERENCES public.users(user_id),  -- Manager user_id
    start_date      date NOT NULL,
    end_date        date,
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.assignments IS 'Employee-to-project assignments. assigned_by is the manager who made the assignment.';

-- ============================================================
-- 7. TEAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teams (
    team_id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id      uuid NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    team_name       text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.teams IS 'Teams owned by managers. A manager can have multiple teams within their company.';

-- ============================================================
-- 8. TEAM MEMBERSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_memberships (
    membership_id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id         uuid NOT NULL REFERENCES public.teams(team_id) ON DELETE CASCADE,
    employee_id     uuid NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    status          membership_status NOT NULL DEFAULT 'pending',
    requested_by    uuid NOT NULL REFERENCES public.users(user_id),   -- Manager who requested
    reviewed_by     uuid REFERENCES public.users(user_id),            -- HR who approved/rejected
    request_reason  text,
    review_note     text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    reviewed_at     timestamptz
);

COMMENT ON TABLE public.team_memberships IS 'Manager requests employee → HR approves/rejects. Status controls visibility.';

-- ============================================================
-- 9. AUDIT LOGS (Append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    log_id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id        uuid NOT NULL,             -- user_id of whoever performed the action
    actor_role      text NOT NULL,             -- 'hr', 'manager', 'employee', 'system'
    action          text NOT NULL,             -- e.g. 'employee_created', 'team_request_approved'
    target_id       uuid,                      -- employee, team, or resource affected
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    metadata        jsonb DEFAULT '{}'::jsonb,  -- Additional context (changes, request details, etc.)
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail. Append-only: no UPDATE or DELETE permitted. Company-scoped.';

-- ============================================================
-- 10. BURNOUT SIGNALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.burnout_signals (
    signal_id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     uuid NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    company_id      uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    signal_type     burnout_signal_type NOT NULL,
    risk_tier       risk_tier NOT NULL DEFAULT 'low',
    detected_at     timestamptz NOT NULL DEFAULT now(),
    details         jsonb DEFAULT '{}'::jsonb   -- Signal-specific data (scores, thresholds, etc.)
);

COMMENT ON TABLE public.burnout_signals IS 'Persisted burnout detection signals. Generated by analytics engine, displayed on Burnout Radar.';
