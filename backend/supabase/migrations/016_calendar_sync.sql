-- ============================================================
-- MAPPING NEXUS - Migration 016: Calendar OAuth + availability sync
-- ============================================================

ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS google_refresh_token_encrypted text,
    ADD COLUMN IF NOT EXISTS outlook_refresh_token_encrypted text,
    ADD COLUMN IF NOT EXISTS google_calendar_connected_at timestamptz,
    ADD COLUMN IF NOT EXISTS outlook_calendar_connected_at timestamptz,
    ADD COLUMN IF NOT EXISTS google_calendar_last_synced_at timestamptz,
    ADD COLUMN IF NOT EXISTS outlook_calendar_last_synced_at timestamptz,
    ADD COLUMN IF NOT EXISTS google_calendar_last_sync_error text,
    ADD COLUMN IF NOT EXISTS outlook_calendar_last_sync_error text;

COMMENT ON COLUMN public.employees.google_refresh_token_encrypted IS
    'Encrypted Google Calendar OAuth refresh token. Never store or log plaintext tokens.';
COMMENT ON COLUMN public.employees.outlook_refresh_token_encrypted IS
    'Encrypted Microsoft Outlook OAuth refresh token. Never store or log plaintext tokens.';

ALTER TABLE public.availability_window
    ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'calendar')),
    ADD COLUMN IF NOT EXISTS source_provider text
        CHECK (source_provider IN ('google', 'outlook') OR source_provider IS NULL),
    ADD COLUMN IF NOT EXISTS source_event_id text,
    ADD COLUMN IF NOT EXISTS sync_run_id uuid;

CREATE INDEX IF NOT EXISTS idx_availability_window_calendar_sync
    ON public.availability_window(employee_id, company_id, source, source_provider, end_date);

CREATE UNIQUE INDEX IF NOT EXISTS ux_availability_window_calendar_event
    ON public.availability_window(employee_id, source_provider, source_event_id)
    WHERE source = 'calendar' AND source_provider IS NOT NULL AND source_event_id IS NOT NULL;
