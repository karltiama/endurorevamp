-- =====================================================
-- SECURITY FIXES VERIFICATION TEST
-- =====================================================
-- Run this script after applying the security fixes to verify
-- that all RLS policies and function security are working correctly
-- =====================================================

-- =====================================================
-- PART 1: TEST FUNCTION SECURITY
-- =====================================================

-- Test 1: Check all functions have SECURITY DEFINER
SELECT 
  '=== FUNCTION SECURITY STATUS ===' as test_section,
  proname as function_name,
  CASE 
    WHEN prosecdef THEN '✅ SECURED' 
    ELSE '❌ VULNERABLE' 
  END as security_status,
  CASE 
    WHEN 'search_path=public' = ANY(proconfig) THEN '✅ SEARCH_PATH_FIXED'
    ELSE '⚠️ SEARCH_PATH_MUTABLE'
  END as search_path_status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'update_updated_at_column',
    'calculate_weekly_metrics',
    'calculate_pace_from_speed',
    'extract_time_components'
  )
ORDER BY proname;

-- =====================================================
-- PART 2: TEST RLS POLICIES
-- =====================================================

-- Test 2: Check RLS is enabled on all tables
SELECT 
  '=== RLS STATUS ===' as test_section,
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS_ENABLED'
    ELSE '❌ RLS_DISABLED'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'activities',
    'strava_tokens',
    'sync_state',
    'athlete_profiles',
    'goal_types',
    'user_goals',
    'goal_progress',
    'user_onboarding'
  )
ORDER BY tablename;

-- Test 3: Check policy counts for each table
SELECT 
  '=== POLICY COUNT ===' as test_section,
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'activities',
    'strava_tokens',
    'sync_state',
    'athlete_profiles',
    'goal_types',
    'user_goals',
    'goal_progress',
    'user_onboarding'
  )
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Test 4: List all policies for verification
SELECT 
  '=== ALL POLICIES ===' as test_section,
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'READ'
    WHEN cmd = 'INSERT' THEN 'create'
    WHEN cmd = 'UPDATE' THEN 'update'
    WHEN cmd = 'DELETE' THEN 'delete'
    WHEN cmd = 'ALL' THEN 'all_operations'
    ELSE cmd
  END as operation_type
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'activities',
    'strava_tokens',
    'sync_state',
    'athlete_profiles',
    'goal_types',
    'user_goals',
    'goal_progress',
    'user_onboarding'
  )
ORDER BY tablename, cmd;

-- =====================================================
-- PART 3: TEST TABLE ACCESSIBILITY
-- =====================================================

-- Test 5: Check table record counts (should work for authenticated users)
SELECT 
  '=== TABLE ACCESSIBILITY ===' as test_section,
  'activities' as table_name,
  COUNT(*) as record_count
FROM public.activities
UNION ALL
SELECT 
  'strava_tokens' as table_name,
  COUNT(*) as record_count
FROM public.strava_tokens
UNION ALL
SELECT 
  'sync_state' as table_name,
  COUNT(*) as record_count
FROM public.sync_state
UNION ALL
SELECT 
  'athlete_profiles' as table_name,
  COUNT(*) as record_count
FROM public.athlete_profiles
UNION ALL
SELECT 
  'goal_types' as table_name,
  COUNT(*) as record_count
FROM public.goal_types
UNION ALL
SELECT 
  'user_goals' as table_name,
  COUNT(*) as record_count
FROM public.user_goals
UNION ALL
SELECT 
  'goal_progress' as table_name,
  COUNT(*) as record_count
FROM public.goal_progress
UNION ALL
SELECT 
  'user_onboarding' as table_name,
  COUNT(*) as record_count
FROM public.user_onboarding
ORDER BY table_name;

-- =====================================================
-- PART 4: TEST SPECIFIC SECURITY SCENARIOS
-- =====================================================

-- Test 6: Verify user can only see their own data
-- (This will only work if you're logged in as a user)
SELECT 
  '=== USER-SPECIFIC DATA ACCESS ===' as test_section,
  'Current user ID: ' || COALESCE(auth.uid()::text, 'NOT_AUTHENTICATED') as current_user,
  'Activities visible: ' || COUNT(*)::text as activities_count
FROM public.activities
WHERE auth.uid() IS NOT NULL;

-- Test 7: Test function execution
SELECT 
  '=== FUNCTION EXECUTION TEST ===' as test_section,
  'pace_calculation' as test_type,
  public.calculate_pace_from_speed(3.5) as result_seconds_per_km,
  '(Should be around 285.71 seconds/km for 3.5 m/s)' as expected;

-- =====================================================
-- PART 5: SUMMARY AND RECOMMENDATIONS
-- =====================================================

-- Test 8: Overall security summary
SELECT 
  '=== SECURITY SUMMARY ===' as test_section,
  'Functions secured: ' || 
  COUNT(CASE WHEN prosecdef THEN 1 END)::text || 
  ' / ' || COUNT(*)::text as functions_secured
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'update_updated_at_column',
    'calculate_weekly_metrics',
    'calculate_pace_from_speed',
    'extract_time_components'
  );

-- Test 9: Check for any remaining security warnings
SELECT 
  '=== REMAINING VULNERABILITIES ===' as test_section,
  proname as vulnerable_function,
  'Function lacks SECURITY DEFINER' as issue
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'update_updated_at_column',
    'calculate_weekly_metrics',
    'calculate_pace_from_speed',
    'extract_time_components'
  )
  AND NOT prosecdef
UNION ALL
SELECT 
  'Search path mutable functions' as test_section,
  proname as vulnerable_function,
  'Function has mutable search path' as issue
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'update_updated_at_column',
    'calculate_weekly_metrics',
    'calculate_pace_from_speed',
    'extract_time_components'
  )
  AND NOT ('search_path=public' = ANY(proconfig));

-- Success message
SELECT 
  '🎉 SECURITY TEST COMPLETED! 🎉' as message,
  'Review the results above to ensure all security measures are in place.' as instructions; 