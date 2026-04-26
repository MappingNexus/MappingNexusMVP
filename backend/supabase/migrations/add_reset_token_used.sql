-- ============================================================
-- Migration: Secure password reset tokens
--
-- Changes:
--   1. Add reset_token_used boolean to track single-use enforcement
--   2. Existing reset_token column will now store SHA-256 hashed tokens
--      (application layer change — no schema change needed for that)
-- ============================================================

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS reset_token_used boolean NOT NULL DEFAULT false;

-- Index for fast token lookup during reset validation
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON public.users(reset_token)
    WHERE reset_token IS NOT NULL;
