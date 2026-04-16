-- ============================================================
-- MAPPING NEXUS — Migration 009: Company DEK Storage
-- Replaces unreliable Vault RPCs with a dedicated table.
-- DEKs are encrypted with the KEK before storage.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.company_deks (
    company_id  uuid PRIMARY KEY REFERENCES public.companies(company_id) ON DELETE CASCADE,
    encrypted_dek text NOT NULL,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

-- Only service_role can read/write DEKs (no RLS bypass needed since we use supabaseAdmin)
ALTER TABLE public.company_deks ENABLE ROW LEVEL SECURITY;

-- Telemetry events table (for Step 10)
CREATE TABLE IF NOT EXISTS public.telemetry_events (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE CASCADE,
    event_type  text NOT NULL,
    latency_ms  integer,
    feedback    text CHECK (feedback IN ('thumbs_up', 'thumbs_down')),
    model_version text,
    created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_telemetry_company ON public.telemetry_events(company_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_event_type ON public.telemetry_events(event_type);
