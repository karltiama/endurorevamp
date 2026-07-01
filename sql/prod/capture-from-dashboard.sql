-- =============================================================================
-- Capture production schema from Supabase SQL Editor (read-only)
-- =============================================================================
-- HOW TO USE:
-- 1. Supabase Dashboard → your project → SQL Editor → New query
-- 2. Run ONE section at a time (each section is labeled below)
-- 3. Copy/save each result to the file named in the section header
-- 4. Do NOT run against local — this is for production inspection only
--
-- This replaces `supabase db dump` when you don't have the CLI linked.
-- Output is not identical to pg_dump, but contains what we need for reconciliation.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECTION A → save as: sql/prod/tables-columns.txt
-- All columns for the 7 core tables
-- -----------------------------------------------------------------------------
SELECT
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'activities',
    'strava_tokens',
    'sync_state',
    'goal_types',
    'user_goals',
    'goal_progress',
    'user_onboarding'
  )
ORDER BY table_name, ordinal_position;


-- -----------------------------------------------------------------------------
-- SECTION B → save as: sql/prod/constraints.txt
-- Primary keys, foreign keys, unique constraints, checks
-- -----------------------------------------------------------------------------
SELECT
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  contype AS type,  -- p=PK, f=FK, u=unique, c=check
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conrelid::regclass::text IN (
    'activities',
    'strava_tokens',
    'sync_state',
    'goal_types',
    'user_goals',
    'goal_progress',
    'user_onboarding'
  )
ORDER BY table_name, type, constraint_name;


-- -----------------------------------------------------------------------------
-- SECTION C → save as: sql/prod/indexes.txt
-- -----------------------------------------------------------------------------
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'activities',
    'strava_tokens',
    'sync_state',
    'goal_types',
    'user_goals',
    'goal_progress',
    'user_onboarding'
  )
ORDER BY tablename, indexname;


-- -----------------------------------------------------------------------------
-- SECTION D → save as: sql/prod/rls.txt
-- RLS enabled + policies
-- -----------------------------------------------------------------------------
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'activities',
    'strava_tokens',
    'sync_state',
    'goal_types',
    'user_goals',
    'goal_progress',
    'user_onboarding'
  )
ORDER BY c.relname;

SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'activities',
    'strava_tokens',
    'sync_state',
    'goal_types',
    'user_goals',
    'goal_progress',
    'user_onboarding'
  )
ORDER BY tablename, policyname;


-- -----------------------------------------------------------------------------
-- SECTION E → save as: sql/prod/triggers.txt
-- -----------------------------------------------------------------------------
SELECT
  event_object_table AS table_name,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'activities',
    'strava_tokens',
    'sync_state',
    'goal_types',
    'user_goals',
    'goal_progress',
    'user_onboarding'
  )
ORDER BY table_name, trigger_name;


-- -----------------------------------------------------------------------------
-- SECTION F → save as: sql/prod/functions.sql
-- Function signatures + full bodies (goal RPCs + workout plan RPCs)
-- Run both queries; save combined output.
-- -----------------------------------------------------------------------------
SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS returns
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'update_goal_progress_from_activity',
    'calculate_goal_progress',
    'save_workout_plan',
    'get_current_week_plan',
    'update_updated_at_column'
  )
ORDER BY p.proname;

SELECT pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'update_goal_progress_from_activity',
    'calculate_goal_progress',
    'save_workout_plan',
    'get_current_week_plan',
    'update_updated_at_column'
  )
ORDER BY p.proname;


-- -----------------------------------------------------------------------------
-- SECTION G → save as: sql/prod/goal_types.seed.sql (optional)
-- Static catalog rows only — safe to commit if no user data mixed in
-- -----------------------------------------------------------------------------
SELECT *
FROM goal_types
ORDER BY name;


-- -----------------------------------------------------------------------------
-- SECTION H → save as: sql/prod/all-public-tables.txt
-- Sanity check: every public table (catch anything we missed)
-- -----------------------------------------------------------------------------
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
