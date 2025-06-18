-- Fix unique constraint for activities table
-- The current constraint is only on strava_activity_id, but we need a composite constraint
-- to allow proper per-user activity deduplication

-- First, check what constraints currently exist
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE 
    tc.table_name = 'activities' 
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- Drop the existing unique constraint on strava_activity_id alone
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS activities_strava_activity_id_key;

-- Create a composite unique constraint on user_id + strava_activity_id
-- This allows the same strava_activity_id to exist for different users
-- but prevents duplicate activities for the same user
ALTER TABLE public.activities 
ADD CONSTRAINT activities_user_strava_activity_unique 
UNIQUE (user_id, strava_activity_id);

-- Verify the new constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE 
    tc.table_name = 'activities' 
    AND tc.table_schema = 'public'
    AND tc.constraint_name = 'activities_user_strava_activity_unique'
ORDER BY kcu.ordinal_position; 