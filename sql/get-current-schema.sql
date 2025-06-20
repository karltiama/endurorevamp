-- =========================================
-- GET COMPLETE DATABASE SCHEMA
-- =========================================
-- Run this in Supabase SQL Editor to get your complete schema
-- Copy the results and paste them back to compare with our documentation

-- 1. Get all tables and their columns
SELECT 
    '-- TABLE: ' || t.table_name as info,
    t.table_name,
    c.column_name,
    c.data_type,
    CASE WHEN c.is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable,
    c.column_default,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FK → ' || fk.foreign_table_name || '(' || fk.foreign_column_name || ')'
        ELSE ''
    END as constraints
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN (
    -- Get primary keys
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
LEFT JOIN (
    -- Get foreign keys
    SELECT 
        ku.table_name, ku.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND c.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- 2. Get table record counts
SELECT 
    'RECORD COUNT: ' || schemaname||'.'||relname as table_info,
    n_live_tup as record_count
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY relname;

-- 3. Get all constraints summary
SELECT 
    'CONSTRAINT: ' || tc.table_name as table_info,
    tc.constraint_name,
    tc.constraint_type,
    ku.column_name,
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN 
            ' → ' || ccu.table_name || '(' || ccu.column_name || ')'
        ELSE ''
    END as reference_info
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage ku 
    ON tc.constraint_name = ku.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- 4. Get indexes
SELECT 
    'INDEX: ' || tablename as table_info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname; 