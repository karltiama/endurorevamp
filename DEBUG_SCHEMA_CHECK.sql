-- Check exact column types for activities table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'activities' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for any triggers on the activities table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'activities'
AND event_object_schema = 'public';

-- Check for any functions that might process activity data
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND (routine_name LIKE '%activity%' OR routine_name LIKE '%pace%');

-- Check if there are any CHECK constraints that might be causing issues
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'activities'
AND tc.table_schema = 'public'; 