-- ============================================================
-- Migration 015: Session revocation token version
--
-- Adds a monotonic token_version to users. Access tokens include the
-- token_version from login/refresh time; bumping it invalidates all
-- previously issued access tokens immediately.
-- ============================================================

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS token_version integer NOT NULL DEFAULT 0;

DO $$ BEGIN
    ALTER TABLE public.users
        ADD CONSTRAINT users_token_version_nonnegative CHECK (token_version >= 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.users
    VALIDATE CONSTRAINT users_token_version_nonnegative;

COMMENT ON COLUMN public.users.token_version IS 'Bumped when sessions are revoked. JWTs with an older token_version are rejected by auth middleware.';
