-- Run this in Supabase SQL Editor to check your table structures
-- This will help us ensure our function matches your actual database schema

-- Check weekly_metrics table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'weekly_metrics' 
ORDER BY ordinal_position;

-- Check activities table structure  
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'activities' 
ORDER BY ordinal_position;

-- Check sync_state table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sync_state' 
ORDER BY ordinal_position; 