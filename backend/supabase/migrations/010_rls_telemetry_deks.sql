-- ============================================================
-- MAPPING NEXUS — Migration 010: Telemetry table creation,
--                                RLS Policies for new tables,
--                                + Hardened match_skills RPC
-- Run AFTER 008_match_rpc.sql
-- ============================================================

-- ============================================================
-- CREATE TELEMETRY_EVENTS TABLE (was in 009 but never applied)
-- company_deks table is NOT needed — HMAC-based DEK derivation
-- replaced the old Vault/table approach.
-- ============================================================
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

-- ============================================================
-- TELEMETRY_EVENTS — HR can read; authenticated users can insert
-- ============================================================

-- SELECT: HR only, company-scoped
CREATE POLICY "telemetry_events_select_hr"
    ON public.telemetry_events
    FOR SELECT
    USING (
        company_id = public.get_my_company_id()
        AND public.get_my_role() = 'hr'
    );

-- INSERT: any authenticated user in the same company
CREATE POLICY "telemetry_events_insert"
    ON public.telemetry_events
    FOR INSERT
    WITH CHECK (
        company_id = public.get_my_company_id()
    );

-- No UPDATE or DELETE policies — telemetry is append-only

-- ============================================================
-- FORCE RLS for table owners (defense-in-depth)
-- Ensures even the table owner role respects RLS unless
-- explicitly using the service_role key.
-- ============================================================
ALTER TABLE public.telemetry_events  FORCE ROW LEVEL SECURITY;

-- ============================================================
-- HARDEN match_skills_by_embedding RPC
-- ============================================================
-- The original function was SECURITY DEFINER with no caller check.
-- Anyone with the anon key could call it with any company_id.
-- 
-- Fix: Add explicit tenant isolation check. If the caller is NOT
-- the service_role (i.e. they are an anon/authenticated user),
-- verify their company matches the requested company_id.
-- ============================================================
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
    -- Tenant isolation: if caller is not service_role, enforce company match
    IF current_setting('role', true) IS DISTINCT FROM 'service_role'
       AND match_company_id <> public.get_my_company_id() THEN
        RAISE EXCEPTION 'Tenant isolation violation: cannot query another company''s skills';
    END IF;

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

COMMENT ON FUNCTION public.match_skills_by_embedding IS
    'Semantic similarity search for skills using pgvector cosine distance. Company-scoped with explicit tenant isolation check.';
