-- ============================================================
-- Mapping Nexus - Minimal Neon/Postgres Auth Setup
-- Creates only the tables required for app login/onboarding.
--
-- No Supabase dependencies:
--   - no auth.users
--   - no auth.uid()
--   - no Supabase RLS roles/policies
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('hr', 'manager', 'employee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.companies (
    company_id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name text NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
    user_id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                text NOT NULL UNIQUE,
    password_hash        text NOT NULL,
    company_id           uuid NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
    role                 user_role NOT NULL,
    reset_token          text,
    reset_token_expires  timestamptz,
    created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
