-- ============================================================
-- MAPPING NEXUS — Migration 008: Semantic match RPC function
-- Run AFTER 007_vector_384.sql
-- ============================================================
-- Supabase RPC function for pgvector cosine similarity search.
-- Called from the matching engine as: supabaseAdmin.rpc('match_skills_by_embedding', {...})
-- ALWAYS company-scoped for tenant isolation.
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
    RETURN QUERY
    SELECT
        s.skill_id,
        s.employee_id,
        s.skill_name,
        s.proficiency::text,
        s.last_used_date,
        1 - (s.embedding <=> query_embedding) AS similarity
    FROM public.skills s
    WHERE s.company_id = match_company_id         -- HARD TENANT ISOLATION
      AND s.embedding IS NOT NULL                 -- only embedded skills
      AND 1 - (s.embedding <=> query_embedding) > match_threshold
    ORDER BY s.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_skills_by_embedding IS
    'Semantic similarity search for skills using pgvector cosine distance. Company-scoped for tenant isolation.';
