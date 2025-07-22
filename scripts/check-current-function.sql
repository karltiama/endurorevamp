-- Check the current save_workout_plan function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'save_workout_plan'; 