-- ============================================================
-- MAPPING NEXUS — Migration 011: Assignment Triggers & Capacity Recalculation
-- Run AFTER 010_rls_telemetry_deks.sql
-- ============================================================
-- PURPOSE:
--   1. Auto-increment current_project_load + set last_assignment_date on assignment INSERT
--   2. Auto-decrement current_project_load on assignment DELETE
--   3. Provide a recalculate_capacity() function that completes expired assignments
--      and recalculates current_project_load from active assignments
-- ============================================================

-- ============================================================
-- TRIGGER FUNCTION: handle_assignment_created
-- Called AFTER INSERT on assignments
-- Increments the employee's current_project_load by 1
-- and sets last_assignment_date to today.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_assignment_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.employees
    SET current_project_load = current_project_load + 1,
        last_assignment_date = CURRENT_DATE
    WHERE employee_id = NEW.employee_id;

    RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGER FUNCTION: handle_assignment_deleted
-- Called AFTER DELETE on assignments
-- Decrements the employee's current_project_load by 1 (floor 0).
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_assignment_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.employees
    SET current_project_load = GREATEST(current_project_load - 1, 0)
    WHERE employee_id = OLD.employee_id;

    RETURN OLD;
END;
$$;

-- ============================================================
-- TRIGGERS on assignments table
-- ============================================================
CREATE TRIGGER on_assignment_created
    AFTER INSERT ON public.assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_assignment_created();

CREATE TRIGGER on_assignment_deleted
    AFTER DELETE ON public.assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_assignment_deleted();

-- ============================================================
-- FUNCTION: recalculate_capacity
-- Finds all assignments whose end_date <= today (expired),
-- deletes them (which fires handle_assignment_deleted trigger),
-- then recalculates current_project_load from remaining active
-- assignments for each affected employee.
--
-- Returns the number of expired assignments that were cleaned up.
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalculate_capacity()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_count integer;
BEGIN
    -- Step 1: Count expired assignments
    SELECT COUNT(*) INTO expired_count
    FROM public.assignments
    WHERE end_date IS NOT NULL
      AND end_date <= CURRENT_DATE;

-- Step 2: Delete expired assignments and recalculate in one go
-- using CTEs to avoid temp tables and race conditions
    WITH expired AS (
        DELETE FROM public.assignments
        WHERE end_date IS NOT NULL
          AND end_date <= CURRENT_DATE
        RETURNING employee_id
    ),
    affected AS (
        SELECT DISTINCT employee_id FROM expired
    )
    UPDATE public.employees e
    SET current_project_load = (
        SELECT COUNT(*)
        FROM public.assignments a
        WHERE a.employee_id = e.employee_id
    )
    WHERE e.employee_id IN (SELECT employee_id FROM affected);

    RETURN expired_count;
END;
$$;
