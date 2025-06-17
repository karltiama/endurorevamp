-- Safe deletion of user_preferences table
-- Run this in your Supabase SQL Editor

-- Drop the table (CASCADE will handle any dependencies)
DROP TABLE IF EXISTS user_preferences CASCADE;

-- Optional: Verify the table is gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_preferences';

-- This should return no rows if deletion was successful 