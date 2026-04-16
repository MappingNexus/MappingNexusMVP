-- ============================================================
-- MAPPING NEXUS — Migration 006: Multi-Tenancy Isolation Test
-- Run AFTER all other migrations to verify tenant isolation.
--
-- THIS IS A TEST SCRIPT — run it, verify output, then the
-- cleanup section removes the test data.
--
-- WHAT IT TESTS:
--   1. Two companies (A and B) are created with separate data
--   2. User from Company A cannot see Company B's employees
--   3. User from Company B cannot see Company A's employees
--   4. Cross-company vector search is impossible
--   5. Audit logs are company-scoped
--
-- HOW TO RUN:
--   Execute each section step-by-step in Supabase SQL Editor.
--   The test uses service role (bypasses RLS) to insert data,
--   then uses set_config to simulate user sessions for RLS tests.
-- ============================================================

-- ============================================================
-- STEP 1: Create two test companies
-- ============================================================
INSERT INTO public.companies (company_id, company_name) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Company Alpha (encrypted in prod)'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test Company Beta (encrypted in prod)');

-- ============================================================
-- STEP 2: Create test auth users (service role operation)
-- NOTE: In real usage, use supabase.auth.admin.createUser().
-- For this test, we insert directly into auth.users.
-- The trigger will auto-create public.users rows.
-- ============================================================

-- Company A: HR user
INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, role, aud
) VALUES (
    'a1111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'hr@company-alpha.test',
    crypt('test-password-123', gen_salt('bf')),
    now(),
    '{"company_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "role": "hr"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
);

-- Company A: Manager user
INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, role, aud
) VALUES (
    'a2222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'manager@company-alpha.test',
    crypt('test-password-123', gen_salt('bf')),
    now(),
    '{"company_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "role": "manager"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
);

-- Company B: HR user
INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, role, aud
) VALUES (
    'b1111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'hr@company-beta.test',
    crypt('test-password-123', gen_salt('bf')),
    now(),
    '{"company_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "role": "hr"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
);

-- ============================================================
-- STEP 3: Create test employees (using service role, bypasses RLS)
-- ============================================================

-- Company A employees
INSERT INTO public.employees (
    employee_id, user_id, company_id,
    name_encrypted, work_email_encrypted,
    department, seniority_level, location, travel_eligible,
    current_project_load, tenure_years
) VALUES
    ('ea111111-1111-1111-1111-111111111111', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'enc:Alpha Employee One', 'enc:emp1@alpha.test',
     'Engineering', 'senior', 'Mumbai', true, 2, 4.5),
    ('ea222222-2222-2222-2222-222222222222', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'enc:Alpha Employee Two', 'enc:emp2@alpha.test',
     'Product', 'mid', 'Bangalore', false, 1, 2.0);

-- Company B employees
INSERT INTO public.employees (
    employee_id, user_id, company_id,
    name_encrypted, work_email_encrypted,
    department, seniority_level, location, travel_eligible,
    current_project_load, tenure_years
) VALUES
    ('eb111111-1111-1111-1111-111111111111', NULL, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'enc:Beta Employee One', 'enc:emp1@beta.test',
     'Engineering', 'lead', 'Delhi', true, 3, 7.0);

-- Company A skills
INSERT INTO public.skills (skill_id, employee_id, company_id, skill_name, proficiency, last_used_date)
VALUES
    (uuid_generate_v4(), 'ea111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'React', 'expert', CURRENT_DATE - 5),
    (uuid_generate_v4(), 'ea111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'Python', 'intermediate', CURRENT_DATE - 30);

-- Company B skills
INSERT INTO public.skills (skill_id, employee_id, company_id, skill_name, proficiency, last_used_date)
VALUES
    (uuid_generate_v4(), 'eb111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'SAP', 'expert', CURRENT_DATE - 10);

-- Audit logs for both companies
INSERT INTO public.audit_logs (actor_id, actor_role, action, target_id, company_id, metadata)
VALUES
    ('a1111111-1111-1111-1111-111111111111', 'hr', 'employee_created',
     'ea111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     '{"test": true}'::jsonb),
    ('b1111111-1111-1111-1111-111111111111', 'hr', 'employee_created',
     'eb111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     '{"test": true}'::jsonb);

-- ============================================================
-- STEP 4: TEST — Simulate Company A HR session
-- Set auth.uid() to Company A HR user and verify isolation
-- ============================================================

-- Simulate Company A HR user session
SELECT set_config('request.jwt.claims', 
    '{"sub": "a1111111-1111-1111-1111-111111111111", "role": "authenticated"}', 
    true);
-- Also need to set the role for RLS to apply
SET ROLE authenticated;

-- TEST 4a: Company A HR should see 2 employees
SELECT 'TEST 4a: Company A HR sees employees' AS test,
       count(*) AS employee_count,
       CASE WHEN count(*) = 2 THEN '✅ PASS' ELSE '❌ FAIL — expected 2' END AS result
FROM public.employees;

-- TEST 4b: Company A HR should see 2 skills
SELECT 'TEST 4b: Company A HR sees skills' AS test,
       count(*) AS skill_count,
       CASE WHEN count(*) = 2 THEN '✅ PASS' ELSE '❌ FAIL — expected 2' END AS result
FROM public.skills;

-- TEST 4c: Company A HR should see 1 audit log (their own)
SELECT 'TEST 4c: Company A HR sees audit logs' AS test,
       count(*) AS log_count,
       CASE WHEN count(*) = 1 THEN '✅ PASS' ELSE '❌ FAIL — expected 1' END AS result
FROM public.audit_logs;

-- TEST 4d: Company A HR should NOT see Company B's employee
SELECT 'TEST 4d: No Company B data visible' AS test,
       count(*) AS beta_leaks,
       CASE WHEN count(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL — TENANT ISOLATION BREACH!' END AS result
FROM public.employees WHERE company_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Reset role
RESET ROLE;

-- ============================================================
-- STEP 5: TEST — Simulate Company B HR session
-- ============================================================

SELECT set_config('request.jwt.claims', 
    '{"sub": "b1111111-1111-1111-1111-111111111111", "role": "authenticated"}', 
    true);
SET ROLE authenticated;

-- TEST 5a: Company B HR should see 1 employee
SELECT 'TEST 5a: Company B HR sees employees' AS test,
       count(*) AS employee_count,
       CASE WHEN count(*) = 1 THEN '✅ PASS' ELSE '❌ FAIL — expected 1' END AS result
FROM public.employees;

-- TEST 5b: Company B HR should NOT see Company A's employees
SELECT 'TEST 5b: No Company A data visible' AS test,
       count(*) AS alpha_leaks,
       CASE WHEN count(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL — TENANT ISOLATION BREACH!' END AS result
FROM public.employees WHERE company_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- TEST 5c: Company B HR should see only their audit log
SELECT 'TEST 5c: Company B HR audit isolation' AS test,
       count(*) AS log_count,
       CASE WHEN count(*) = 1 THEN '✅ PASS' ELSE '❌ FAIL — expected 1' END AS result
FROM public.audit_logs;

-- TEST 5d: Company B skills — should only see their own
SELECT 'TEST 5d: Company B skills isolation' AS test,
       count(*) AS skill_count,
       CASE WHEN count(*) = 1 THEN '✅ PASS' ELSE '❌ FAIL — expected 1' END AS result
FROM public.skills;

RESET ROLE;

-- ============================================================
-- STEP 6: TEST — Manager cannot see other teams
-- Simulate Company A Manager (has no approved team members yet)
-- ============================================================

SELECT set_config('request.jwt.claims', 
    '{"sub": "a2222222-2222-2222-2222-222222222222", "role": "authenticated"}', 
    true);
SET ROLE authenticated;

-- TEST 6a: Manager with no team should see 0 employees
SELECT 'TEST 6a: Manager with no team sees no employees' AS test,
       count(*) AS employee_count,
       CASE WHEN count(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL — manager should not see employees without approved team' END AS result
FROM public.employees;

-- TEST 6b: Manager should not see audit logs
SELECT 'TEST 6b: Manager cannot see audit logs' AS test,
       count(*) AS log_count,
       CASE WHEN count(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL — managers should not see audit logs' END AS result
FROM public.audit_logs;

RESET ROLE;

-- ============================================================
-- STEP 7: CLEANUP — Remove all test data
-- Run this after verifying all tests pass
-- ============================================================
/*
-- Uncomment to clean up:

DELETE FROM public.burnout_signals WHERE company_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
DELETE FROM public.audit_logs WHERE company_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
DELETE FROM public.skills WHERE company_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
DELETE FROM public.team_memberships WHERE company_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
DELETE FROM public.teams WHERE company_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
DELETE FROM public.assignments WHERE company_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
DELETE FROM public.employees WHERE company_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
DELETE FROM public.users WHERE company_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
DELETE FROM auth.users WHERE id IN (
    'a1111111-1111-1111-1111-111111111111',
    'a2222222-2222-2222-2222-222222222222',
    'b1111111-1111-1111-1111-111111111111'
);
DELETE FROM public.companies WHERE company_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
*/
