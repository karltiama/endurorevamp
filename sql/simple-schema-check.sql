-- =========================================
-- SIMPLE DATABASE SCHEMA CHECK
-- =========================================
-- This is guaranteed to work on all PostgreSQL/Supabase versions

-- 1. List all your tables
SELECT 'TABLE: ' || table_name as info
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Get detailed structure for each important table
-- (Run each section separately if needed)

-- ACTIVITIES TABLE
SELECT 
    'ACTIVITIES' as table_name,
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'activities'
ORDER BY ordinal_position;

-- GOAL_TYPES TABLE  
SELECT 
    'GOAL_TYPES' as table_name,
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'goal_types'
ORDER BY ordinal_position;

-- USER_GOALS TABLE
SELECT 
    'USER_GOALS' as table_name,
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_goals'
ORDER BY ordinal_position;

-- GOAL_PROGRESS TABLE
SELECT 
    'GOAL_PROGRESS' as table_name,
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'goal_progress'
ORDER BY ordinal_position;

-- USER_ONBOARDING TABLE
SELECT 
    'USER_ONBOARDING' as table_name,
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_onboarding'
ORDER BY ordinal_position;

-- 3. Check foreign key relationships
SELECT 
    'FK: ' || tc.table_name as info,
    ku.column_name as fk_column,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage ku 
    ON tc.constraint_name = ku.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, ku.column_name; 