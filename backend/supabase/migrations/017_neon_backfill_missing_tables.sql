-- ============================================================
-- MAPPING NEXUS — Migration 017: Neon DB Backfill
-- Run this in your Neon SQL Editor (console.neon.tech)
--
-- Adds tables and columns that were omitted from the original
-- neon_master_migration.sql (migrations 012 and 016).
-- All statements are idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- ============================================================

-- ============================================================
-- TABLE: employee_requests  (from migration 012)
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_employee_requests_company_status
    ON public.employee_requests(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_requests_manager
    ON public.employee_requests(manager_id, created_at DESC);

-- ============================================================
-- TABLE: availability_window  (from migration 012)
-- ============================================================
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
    -- Calendar sync columns (from migration 016)
    source                 text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'calendar')),
    source_provider        text CHECK (source_provider IN ('google', 'outlook') OR source_provider IS NULL),
    source_event_id        text,
    sync_run_id            uuid,
    CHECK (start_date <= end_date)
);

CREATE INDEX IF NOT EXISTS idx_availability_window_employee
    ON public.availability_window(employee_id, start_date);
CREATE INDEX IF NOT EXISTS idx_availability_window_company
    ON public.availability_window(company_id, start_date);
CREATE INDEX IF NOT EXISTS idx_availability_window_calendar_sync
    ON public.availability_window(employee_id, company_id, source, source_provider, end_date);
CREATE UNIQUE INDEX IF NOT EXISTS ux_availability_window_calendar_event
    ON public.availability_window(employee_id, source_provider, source_event_id)
    WHERE source = 'calendar' AND source_provider IS NOT NULL AND source_event_id IS NOT NULL;

-- ============================================================
-- Calendar sync columns on employees  (from migration 016)
-- ============================================================
ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS google_refresh_token_encrypted  text,
    ADD COLUMN IF NOT EXISTS outlook_refresh_token_encrypted text,
    ADD COLUMN IF NOT EXISTS google_calendar_connected_at    timestamptz,
    ADD COLUMN IF NOT EXISTS outlook_calendar_connected_at   timestamptz,
    ADD COLUMN IF NOT EXISTS google_calendar_last_synced_at  timestamptz,
    ADD COLUMN IF NOT EXISTS outlook_calendar_last_synced_at timestamptz,
    ADD COLUMN IF NOT EXISTS google_calendar_last_sync_error text,
    ADD COLUMN IF NOT EXISTS outlook_calendar_last_sync_error text;

-- Patch any existing availability_window rows that may be missing the source column
-- (safe no-op if the table was just created above)
UPDATE public.availability_window
SET source = 'manual'
WHERE source IS NULL;

-- ============================================================
-- DONE — verify with:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'employees'
--     AND column_name LIKE '%calendar%'
--   ORDER BY column_name;
--
-- SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'availability_window'
--   ORDER BY column_name;
-- ============================================================
