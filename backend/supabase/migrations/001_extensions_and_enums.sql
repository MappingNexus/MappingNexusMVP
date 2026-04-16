-- ============================================================
-- MAPPING NEXUS — Migration 001: Extensions & Enums
-- Run this FIRST in Supabase SQL Editor
-- ============================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "vector";         -- pgvector for similarity search

-- ============================================================
-- ENUM TYPES
-- ============================================================

-- User roles (3 distinct roles — no role switching after creation)
CREATE TYPE user_role AS ENUM ('hr', 'manager', 'employee');

-- Employee seniority levels
CREATE TYPE seniority_level AS ENUM ('junior', 'mid', 'senior', 'lead', 'principal');

-- Skill proficiency levels
CREATE TYPE skill_proficiency AS ENUM ('beginner', 'intermediate', 'expert');

-- Project lifecycle status
CREATE TYPE project_status AS ENUM ('planned', 'active', 'completed');

-- Team membership request status
CREATE TYPE membership_status AS ENUM ('pending', 'approved', 'rejected');

-- Burnout signal types (5 detection signals per spec)
CREATE TYPE burnout_signal_type AS ENUM (
    'task_velocity',            -- tasks assigned > 30% above 90-day average
    'no_leave',                 -- no leave in 60+ days with high load
    'consecutive_assignments',  -- 3+ back-to-back projects with <5 days between
    'overtime_proxy',           -- tasks/day exceeds assigned capacity
    'skills_misalignment'       -- consistently assigned outside primary skill set
);

-- Burnout risk tiers
CREATE TYPE risk_tier AS ENUM ('low', 'medium', 'high');
