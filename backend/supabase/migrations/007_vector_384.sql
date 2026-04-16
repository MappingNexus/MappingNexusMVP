-- ============================================================
-- MAPPING NEXUS — Migration 007: Vector dimension change (1536 → 384)
-- Run AFTER 006_isolation_test.sql
-- ============================================================
-- Switching from OpenAI-sized vectors (1536) to local MiniLM (384).
-- Uses @xenova/transformers with all-MiniLM-L6-v2 for free local embeddings.
-- ============================================================

-- 1. Drop the old IVFFlat index
DROP INDEX IF EXISTS idx_skills_embedding;

-- 2. Drop the old column and recreate with correct dimensions
ALTER TABLE public.skills DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.skills ADD COLUMN embedding vector(384);

-- 3. Recreate the IVFFlat index for 384-dim vectors
-- Note: IVFFlat requires rows to exist for training. If table is empty,
-- this index will be created but won't be trained until REINDEX.
CREATE INDEX idx_skills_embedding ON public.skills
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

COMMENT ON COLUMN public.skills.embedding IS 'vector(384) — generated locally via all-MiniLM-L6-v2. Used by AI matching engine for semantic similarity search.';
