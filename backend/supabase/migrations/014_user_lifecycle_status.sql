-- ============================================================
-- Migration 014: User lifecycle status
--
-- Adds account lifecycle states:
--   active      - default, can authenticate
--   suspended   - temporary, can be reactivated
--   deactivated - permanent, cannot log in, data retained
--   offboarded  - account closed, data can be anonymized
-- ============================================================

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deactivated', 'offboarded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_company_status ON public.users(company_id, status);

COMMENT ON COLUMN public.users.status IS 'Lifecycle state. Only active users can authenticate or make authenticated API requests.';
