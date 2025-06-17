-- Run this in Supabase SQL Editor to see your actual database structure

-- 1. Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check sync_state table structure (if it exists)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sync_state' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check activities table structure (if it exists) 
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'activities' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check what other Strava-related tables exist
SELECT table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND (table_name LIKE '%strava%' OR table_name LIKE '%sync%' OR table_name LIKE '%activity%' OR table_name LIKE '%activities%')
ORDER BY table_name, ordinal_position; 