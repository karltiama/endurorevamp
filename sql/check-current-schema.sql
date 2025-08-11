-- =====================================================
-- Database Schema Verification Queries
-- =====================================================
-- Run these in your Supabase SQL Editor to check current schema
-- Compare results with your actual-database-schema.sql file

-- 1. List all tables in your database
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Get detailed table structure for each table
-- Replace 'table_name' with actual table names from step 1
-- Example: SELECT * FROM information_schema.columns WHERE table_name = 'activities';

-- 3. Check specific tables mentioned in your schema file
-- Activities table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'activities' 
ORDER BY ordinal_position;

-- Sync state table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'sync_state' 
ORDER BY ordinal_position;

-- Strava tokens table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'strava_tokens' 
ORDER BY ordinal_position;

-- 4. Check if training profile tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN (
    'user_training_profiles',
    'user_training_preferences', 
    'threshold_calculation_history',
    'user_profiles',
    'training_preferences'
)
AND table_schema = 'public';

-- 5. Check table row counts (if tables exist)
-- Activities
SELECT 'activities' as table_name, COUNT(*) as row_count FROM activities
UNION ALL
SELECT 'sync_state' as table_name, COUNT(*) as row_count FROM sync_state
UNION ALL
SELECT 'strava_tokens' as table_name, COUNT(*) as row_count FROM strava_tokens;

-- 6. Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 7. Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 8. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 9. Quick summary of what should exist vs what actually exists
-- Run this after the migration to verify all tables are created
SELECT 
    'Expected Tables' as category,
    'activities' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'Expected Tables' as category,
    'sync_state' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sync_state') THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'Expected Tables' as category,
    'strava_tokens' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'strava_tokens') THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'Training Tables' as category,
    'user_training_profiles' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_training_profiles') THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'Training Tables' as category,
    'user_training_preferences' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_training_preferences') THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'Training Tables' as category,
    'threshold_calculation_history' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'threshold_calculation_history') THEN 'EXISTS' ELSE 'MISSING' END as status
ORDER BY category, table_name;

