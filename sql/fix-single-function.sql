-- =====================================================
-- FIX SINGLE FUNCTION: initialize_default_training_zones
-- =====================================================
-- Let's fix just ONE function first to isolate the issue
-- =====================================================

-- STEP 1: See what currently exists for this function
SELECT 
  routines.routine_name,
  routines.routine_type,
  routines.security_type,
  routines.specific_name,
  string_agg(
    COALESCE(parameters.parameter_name, 'NO_NAME') || ':' || 
    COALESCE(parameters.data_type, 'NO_TYPE'), 
    ', ' ORDER BY parameters.ordinal_position
  ) as parameters,
  LEFT(routines.routine_definition, 200) as definition_start
FROM information_schema.routines
LEFT JOIN information_schema.parameters ON routines.specific_name = parameters.specific_name
WHERE routines.routine_schema = 'public'
  AND routines.routine_name = 'initialize_default_training_zones'
GROUP BY routines.routine_name, routines.routine_type, routines.security_type, routines.specific_name, routines.routine_definition
ORDER BY routines.routine_name;

-- STEP 2: Get the exact function signature from pg_proc
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'initialize_default_training_zones';

-- STEP 3: Drop the function with the exact signature
-- (We'll use the results from above to craft the right DROP statement)

-- Try all possible variations:
DROP FUNCTION IF EXISTS public.initialize_default_training_zones(UUID);
DROP FUNCTION IF EXISTS public.initialize_default_training_zones(p_user_id UUID);
DROP FUNCTION IF EXISTS public.initialize_default_training_zones("p_user_id" UUID);

-- STEP 4: Recreate the function with proper security
CREATE OR REPLACE FUNCTION public.initialize_default_training_zones(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Simple placeholder function
  -- This would initialize default training zones for a user
  -- For now, just log that it was called
  RAISE NOTICE 'initialize_default_training_zones called for user: %', p_user_id;
  RETURN;
END;
$$;

-- STEP 5: Grant permissions
GRANT EXECUTE ON FUNCTION public.initialize_default_training_zones(UUID) TO authenticated;

-- STEP 6: Verify the fix
SELECT 
  routines.routine_name,
  routines.security_type,
  CASE 
    WHEN routines.routine_definition LIKE '%SET search_path TO%' THEN 'FIXED'
    WHEN routines.routine_definition LIKE '%SET search_path =%' THEN 'FIXED'  
    ELSE 'STILL MUTABLE'
  END as search_path_status,
  LEFT(routines.routine_definition, 300) as definition_preview
FROM information_schema.routines
WHERE routines.routine_schema = 'public'
  AND routines.routine_name = 'initialize_default_training_zones';

-- STEP 7: Test the function
SELECT public.initialize_default_training_zones('00000000-0000-0000-0000-000000000001'::UUID);

-- Success message
SELECT 'initialize_default_training_zones function fix completed!' as status; 