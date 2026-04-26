-- ============================================================
-- Migration 013: Refresh Token Sessions
--
-- Creates a dedicated table for refresh tokens, supporting:
--   - Per-session token storage (hashed with SHA-256)
--   - Token rotation (old tokens invalidated on use)
--   - Replay attack detection (reuse of revoked token → revoke all)
--   - Individual session revocation
-- ============================================================

CREATE TABLE IF NOT EXISTS public.refresh_token_sessions (
    session_id      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         uuid NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    token_hash      text NOT NULL,
    expires_at      timestamptz NOT NULL,
    revoked         boolean NOT NULL DEFAULT false,
    replaced_by     uuid,                            -- points to the session that replaced this one
    user_agent      text,                            -- browser/device info for session management
    ip_address      inet,
    created_at      timestamptz NOT NULL DEFAULT now(),
    last_used_at    timestamptz NOT NULL DEFAULT now()
);

-- Fast lookups by token hash (primary query path for refresh)
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_token_hash
    ON public.refresh_token_sessions(token_hash)
    WHERE revoked = false;

-- Fast lookups for all sessions by user (session management + mass revocation)
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user_id
    ON public.refresh_token_sessions(user_id);

-- Cleanup: find expired sessions for periodic purge
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_expires
    ON public.refresh_token_sessions(expires_at)
    WHERE revoked = false;

-- ============================================================
-- DONE — Run against Neon DB via SQL Editor
-- ============================================================
