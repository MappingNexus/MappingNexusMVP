-- Require application registration/provisioning flows to provide an explicit role.
-- This prevents missing metadata from silently creating employee accounts.
ALTER TABLE public.users
    ALTER COLUMN role DROP DEFAULT;
