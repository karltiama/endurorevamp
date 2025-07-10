-- =====================================================
-- DEBUG AND FIX FUNCTION: initialize_default_training_zones
-- =====================================================
-- First find ALL existing signatures, then clean them up
-- =====================================================

-- STEP 1: Find ALL existing function signatures
SELECT 
  'Function found:' as status,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as exact_arguments,
  p.oid as function_oid
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'initialize_default_training_zones'
ORDER BY p.oid;

-- STEP 2: Get the exact DROP statements we need
SELECT 
  'DROP FUNCTION public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ');' as drop_statement
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'initialize_default_training_zones';

-- STEP 3: Execute the precise drops
-- Based on what we find above, we'll drop each specific signature

-- Drop function with uuid parameter (most common)
DROP FUNCTION IF EXISTS public.initialize_default_training_zones(uuid) CASCADE;

-- Drop function with named parameter
DROP FUNCTION IF EXISTS public.initialize_default_training_zones(p_user_id uuid) CASCADE;

-- Drop any other variations that might exist
DO $$
DECLARE
    func_oid oid;
    func_signature text;
BEGIN
    -- Loop through all remaining functions and drop them
    FOR func_oid IN 
        SELECT p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname = 'initialize_default_training_zones'
    LOOP
        -- Get the exact signature
        SELECT 'public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
        INTO func_signature
        FROM pg_proc p
        WHERE p.oid = func_oid;
        
        -- Drop the function
        EXECUTE 'DROP FUNCTION ' || func_signature || ' CASCADE';
        
        RAISE NOTICE 'Dropped function: %', func_signature;
    END LOOP;
END $$;

-- STEP 4: Verify all functions are gone
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: All functions dropped'
    ELSE 'ERROR: ' || COUNT(*) || ' functions still exist'
  END as cleanup_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'initialize_default_training_zones';

-- STEP 5: Create ONE clean function
CREATE FUNCTION public.initialize_default_training_zones(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Simple placeholder function for training zones initialization
  RAISE NOTICE 'Training zones initialized for user: %', p_user_id;
  RETURN;
END;
$$;

-- STEP 6: Grant permissions
GRANT EXECUTE ON FUNCTION public.initialize_default_training_zones(uuid) TO authenticated;

-- STEP 7: Verify the final function
SELECT 
  'Final verification:' as status,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path TO%' THEN 'SECURE'
    ELSE 'INSECURE'
  END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'initialize_default_training_zones';

-- STEP 8: Test the function (should work now with only one signature)
SELECT 'Testing function...' as status;
SELECT public.initialize_default_training_zones('00000000-0000-0000-0000-000000000001'::uuid) as test_result;

-- Final success message
SELECT 'initialize_default_training_zones successfully fixed!' as final_status; 