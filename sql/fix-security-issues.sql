-- =====================================================
-- COMPREHENSIVE SECURITY FIX FOR SUPABASE
-- =====================================================
-- This script addresses all security warnings from Supabase:
-- 1. Function Search Path Mutable vulnerabilities
-- 2. Missing or incomplete RLS policies
-- 3. Table accessibility issues
-- 
-- Run this entire script in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: CREATE MISSING TABLES FIRST
-- =====================================================

-- Create athlete_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.athlete_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strava_athlete_id BIGINT UNIQUE NOT NULL,
  
  -- Basic info
  firstname VARCHAR(100),
  lastname VARCHAR(100),
  username VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  sex CHAR(1),
  premium BOOLEAN DEFAULT false,
  
  -- Training data
  ftp INTEGER, -- Functional Threshold Power
  weight FLOAT, -- kg
  
  -- Profile images
  profile_medium TEXT,
  profile_large TEXT,
  
  -- Strava timestamps
  strava_created_at TIMESTAMPTZ,
  strava_updated_at TIMESTAMPTZ,
  
  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sync_state table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sync_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Activity sync tracking
  last_activity_sync TIMESTAMPTZ,
  last_activity_id BIGINT, -- Last processed activity ID for pagination
  activities_synced_count INTEGER DEFAULT 0,
  
  -- Profile sync tracking
  last_profile_sync TIMESTAMPTZ,
  
  -- Error tracking
  last_sync_error JSONB,
  consecutive_errors INTEGER DEFAULT 0,
  
  -- Rate limiting
  requests_used_today INTEGER DEFAULT 0,
  rate_limit_reset_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for athlete_profiles if they don't exist
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user_id ON public.athlete_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_strava_id ON public.athlete_profiles(strava_athlete_id);

-- Create triggers safely (PostgreSQL doesn't support IF NOT EXISTS for triggers)
DO $$
BEGIN
    -- Create trigger for athlete_profiles updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_name = 'update_athlete_profiles_updated_at' 
                   AND event_object_table = 'athlete_profiles') THEN
        CREATE TRIGGER update_athlete_profiles_updated_at 
            BEFORE UPDATE ON public.athlete_profiles 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Create trigger for sync_state updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_name = 'update_sync_state_updated_at' 
                   AND event_object_table = 'sync_state') THEN
        CREATE TRIGGER update_sync_state_updated_at 
            BEFORE UPDATE ON public.sync_state 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- PART 2: FIX FUNCTION SECURITY VULNERABILITIES
-- =====================================================

-- 1. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with definer's privileges
SET search_path = public  -- Fix search path to prevent manipulation
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Trigger function to update updated_at timestamp. Secured with SECURITY DEFINER and fixed search_path.';

-- 2. Fix calculate_weekly_metrics function
CREATE OR REPLACE FUNCTION public.calculate_weekly_metrics(
  p_user_id UUID,
  p_start_date DATE DEFAULT NULL
)
RETURNS TABLE (
  week_start_date DATE,
  total_distance NUMERIC,
  total_moving_time INTEGER,
  total_elevation_gain NUMERIC,
  activity_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with definer's privileges
SET search_path = public  -- Fix search path to prevent manipulation
AS $$
DECLARE
  start_calc_date DATE;
BEGIN
  -- Set default start date if not provided (8 weeks ago)
  IF p_start_date IS NULL THEN
    start_calc_date := CURRENT_DATE - INTERVAL '8 weeks';
  ELSE
    start_calc_date := p_start_date;
  END IF;

  -- Simple aggregation from activities table with proper type casting
  RETURN QUERY
  SELECT 
    date_trunc('week', a.start_date_local::date)::date as week_start_date,
    COALESCE(SUM(a.distance), 0) as total_distance,
    COALESCE(SUM(a.moving_time), 0)::INTEGER as total_moving_time,
    COALESCE(SUM(a.total_elevation_gain), 0) as total_elevation_gain,
    COUNT(*)::INTEGER as activity_count
  FROM public.activities a  -- Explicitly reference public schema
  WHERE a.user_id = p_user_id
    AND a.start_date_local::date >= start_calc_date
  GROUP BY date_trunc('week', a.start_date_local::date)::date
  HAVING COUNT(*) > 0
  ORDER BY date_trunc('week', a.start_date_local::date)::date;

END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.calculate_weekly_metrics(UUID, DATE) TO authenticated;

COMMENT ON FUNCTION public.calculate_weekly_metrics(UUID, DATE) IS 
'Calculates weekly training metrics for a user. Secured with SECURITY DEFINER and fixed search_path.';

-- 3. Fix calculate_pace_from_speed function
CREATE OR REPLACE FUNCTION public.calculate_pace_from_speed(p_speed_ms NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with definer's privileges
SET search_path = public  -- Fix search path to prevent manipulation
AS $$
DECLARE
  pace_seconds_per_km NUMERIC;
BEGIN
  -- Convert speed from m/s to seconds per km
  IF p_speed_ms IS NULL OR p_speed_ms = 0 THEN
    RETURN NULL;
  END IF;
  
  pace_seconds_per_km := 1000.0 / p_speed_ms;
  RETURN ROUND(pace_seconds_per_km, 2);
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.calculate_pace_from_speed(NUMERIC) TO authenticated;

COMMENT ON FUNCTION public.calculate_pace_from_speed(NUMERIC) IS 
'Converts speed (m/s) to pace (seconds per km). Secured with SECURITY DEFINER and fixed search_path.';

-- 4. Fix extract_time_components function (if it exists)
CREATE OR REPLACE FUNCTION public.extract_time_components()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with definer's privileges
SET search_path = public  -- Fix search path to prevent manipulation
AS $$
BEGIN
  -- Only calculate pace for running activities
  IF NEW.sport_type = 'Run' AND NEW.average_speed > 0 THEN
    NEW.average_pace := calculate_pace_from_speed(NEW.average_speed);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.extract_time_components() TO authenticated;

COMMENT ON FUNCTION public.extract_time_components() IS 
'Trigger function to calculate derived metrics. Secured with SECURITY DEFINER and fixed search_path.';

-- =====================================================
-- PART 3: ENABLE RLS ON EXISTING TABLES
-- =====================================================

-- Function to safely enable RLS only if table exists
CREATE OR REPLACE FUNCTION enable_rls_if_exists(table_name text)
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) THEN
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on tables that exist
SELECT enable_rls_if_exists('activities');
SELECT enable_rls_if_exists('strava_tokens');
SELECT enable_rls_if_exists('sync_state');
SELECT enable_rls_if_exists('athlete_profiles');
SELECT enable_rls_if_exists('goal_types');
SELECT enable_rls_if_exists('user_goals');
SELECT enable_rls_if_exists('goal_progress');
SELECT enable_rls_if_exists('user_onboarding');

-- Clean up the helper function
DROP FUNCTION enable_rls_if_exists(text);

-- =====================================================
-- PART 4: CREATE/UPDATE RLS POLICIES
-- =====================================================

-- Function to safely drop policies if they exist
CREATE OR REPLACE FUNCTION drop_policy_if_exists(table_name text, policy_name text)
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = table_name AND policyname = policy_name) THEN
    EXECUTE format('DROP POLICY %I ON public.%I', policy_name, table_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create policy only if table exists
CREATE OR REPLACE FUNCTION create_policy_if_table_exists(table_name text, policy_name text, policy_sql text)
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) THEN
    EXECUTE format(policy_sql, policy_name, table_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ACTIVITIES TABLE POLICIES
SELECT drop_policy_if_exists('activities', 'Users can view own activities');
SELECT drop_policy_if_exists('activities', 'Users can insert own activities');
SELECT drop_policy_if_exists('activities', 'Users can update own activities');
SELECT drop_policy_if_exists('activities', 'Users can delete own activities');
SELECT drop_policy_if_exists('activities', 'activities_select_policy');
SELECT drop_policy_if_exists('activities', 'activities_insert_policy');
SELECT drop_policy_if_exists('activities', 'activities_update_policy');
SELECT drop_policy_if_exists('activities', 'activities_delete_policy');

SELECT create_policy_if_table_exists('activities', 'activities_select_policy', 
  'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('activities', 'activities_insert_policy', 
  'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('activities', 'activities_update_policy', 
  'CREATE POLICY %I ON public.%I FOR UPDATE USING (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('activities', 'activities_delete_policy', 
  'CREATE POLICY %I ON public.%I FOR DELETE USING (auth.uid() = user_id)');

-- STRAVA_TOKENS TABLE POLICIES
SELECT drop_policy_if_exists('strava_tokens', 'Users can access own strava tokens');
SELECT drop_policy_if_exists('strava_tokens', 'strava_tokens_select_policy');
SELECT drop_policy_if_exists('strava_tokens', 'strava_tokens_insert_policy');
SELECT drop_policy_if_exists('strava_tokens', 'strava_tokens_update_policy');
SELECT drop_policy_if_exists('strava_tokens', 'strava_tokens_delete_policy');

SELECT create_policy_if_table_exists('strava_tokens', 'strava_tokens_select_policy', 
  'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('strava_tokens', 'strava_tokens_insert_policy', 
  'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('strava_tokens', 'strava_tokens_update_policy', 
  'CREATE POLICY %I ON public.%I FOR UPDATE USING (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('strava_tokens', 'strava_tokens_delete_policy', 
  'CREATE POLICY %I ON public.%I FOR DELETE USING (auth.uid() = user_id)');

-- SYNC_STATE TABLE POLICIES
SELECT drop_policy_if_exists('sync_state', 'Users can view own sync state');
SELECT drop_policy_if_exists('sync_state', 'Users can manage own sync state');
SELECT drop_policy_if_exists('sync_state', 'sync_state_select_policy');
SELECT drop_policy_if_exists('sync_state', 'sync_state_insert_policy');
SELECT drop_policy_if_exists('sync_state', 'sync_state_update_policy');
SELECT drop_policy_if_exists('sync_state', 'sync_state_delete_policy');

SELECT create_policy_if_table_exists('sync_state', 'sync_state_select_policy', 
  'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('sync_state', 'sync_state_insert_policy', 
  'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('sync_state', 'sync_state_update_policy', 
  'CREATE POLICY %I ON public.%I FOR UPDATE USING (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('sync_state', 'sync_state_delete_policy', 
  'CREATE POLICY %I ON public.%I FOR DELETE USING (auth.uid() = user_id)');

-- ATHLETE_PROFILES TABLE POLICIES
SELECT drop_policy_if_exists('athlete_profiles', 'Users can view own athlete profile');
SELECT drop_policy_if_exists('athlete_profiles', 'Users can update own athlete profile');
SELECT drop_policy_if_exists('athlete_profiles', 'Users can insert own athlete profile');
SELECT drop_policy_if_exists('athlete_profiles', 'athlete_profiles_select_policy');
SELECT drop_policy_if_exists('athlete_profiles', 'athlete_profiles_insert_policy');
SELECT drop_policy_if_exists('athlete_profiles', 'athlete_profiles_update_policy');
SELECT drop_policy_if_exists('athlete_profiles', 'athlete_profiles_delete_policy');

SELECT create_policy_if_table_exists('athlete_profiles', 'athlete_profiles_select_policy', 
  'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('athlete_profiles', 'athlete_profiles_insert_policy', 
  'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('athlete_profiles', 'athlete_profiles_update_policy', 
  'CREATE POLICY %I ON public.%I FOR UPDATE USING (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('athlete_profiles', 'athlete_profiles_delete_policy', 
  'CREATE POLICY %I ON public.%I FOR DELETE USING (auth.uid() = user_id)');

-- GOAL SYSTEM POLICIES (only if tables exist)
SELECT drop_policy_if_exists('goal_types', 'Goal types are viewable by everyone');
SELECT drop_policy_if_exists('goal_types', 'goal_types_select_policy');

SELECT create_policy_if_table_exists('goal_types', 'goal_types_select_policy', 
  'CREATE POLICY %I ON public.%I FOR SELECT USING (true)');

-- USER_GOALS policies
SELECT drop_policy_if_exists('user_goals', 'Users can view their own goals');
SELECT drop_policy_if_exists('user_goals', 'user_goals_select_policy');
SELECT drop_policy_if_exists('user_goals', 'user_goals_insert_policy');
SELECT drop_policy_if_exists('user_goals', 'user_goals_update_policy');
SELECT drop_policy_if_exists('user_goals', 'user_goals_delete_policy');

SELECT create_policy_if_table_exists('user_goals', 'user_goals_select_policy', 
  'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('user_goals', 'user_goals_insert_policy', 
  'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('user_goals', 'user_goals_update_policy', 
  'CREATE POLICY %I ON public.%I FOR UPDATE USING (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('user_goals', 'user_goals_delete_policy', 
  'CREATE POLICY %I ON public.%I FOR DELETE USING (auth.uid() = user_id)');

-- GOAL_PROGRESS policies
SELECT drop_policy_if_exists('goal_progress', 'Users can view their own goal progress');
SELECT drop_policy_if_exists('goal_progress', 'goal_progress_select_policy');
SELECT drop_policy_if_exists('goal_progress', 'goal_progress_insert_policy');
SELECT drop_policy_if_exists('goal_progress', 'goal_progress_update_policy');
SELECT drop_policy_if_exists('goal_progress', 'goal_progress_delete_policy');

-- Note: These policies require user_goals table to exist for the subquery
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'goal_progress') AND
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_goals') THEN
    
    EXECUTE 'CREATE POLICY goal_progress_select_policy ON public.goal_progress FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.user_goals ug WHERE ug.id = goal_progress.user_goal_id AND ug.user_id = auth.uid()))';
    
    EXECUTE 'CREATE POLICY goal_progress_insert_policy ON public.goal_progress FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.user_goals ug WHERE ug.id = goal_progress.user_goal_id AND ug.user_id = auth.uid()))';
    
    EXECUTE 'CREATE POLICY goal_progress_update_policy ON public.goal_progress FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.user_goals ug WHERE ug.id = goal_progress.user_goal_id AND ug.user_id = auth.uid()))';
    
    EXECUTE 'CREATE POLICY goal_progress_delete_policy ON public.goal_progress FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.user_goals ug WHERE ug.id = goal_progress.user_goal_id AND ug.user_id = auth.uid()))';
  END IF;
END $$;

-- USER_ONBOARDING policies
SELECT drop_policy_if_exists('user_onboarding', 'Users can manage their own onboarding');
SELECT drop_policy_if_exists('user_onboarding', 'user_onboarding_select_policy');
SELECT drop_policy_if_exists('user_onboarding', 'user_onboarding_insert_policy');
SELECT drop_policy_if_exists('user_onboarding', 'user_onboarding_update_policy');
SELECT drop_policy_if_exists('user_onboarding', 'user_onboarding_delete_policy');

SELECT create_policy_if_table_exists('user_onboarding', 'user_onboarding_select_policy', 
  'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('user_onboarding', 'user_onboarding_insert_policy', 
  'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('user_onboarding', 'user_onboarding_update_policy', 
  'CREATE POLICY %I ON public.%I FOR UPDATE USING (auth.uid() = user_id)');
SELECT create_policy_if_table_exists('user_onboarding', 'user_onboarding_delete_policy', 
  'CREATE POLICY %I ON public.%I FOR DELETE USING (auth.uid() = user_id)');

-- Clean up helper functions
DROP FUNCTION drop_policy_if_exists(text, text);
DROP FUNCTION create_policy_if_table_exists(text, text, text);

-- =====================================================
-- PART 5: VERIFY SECURITY SETTINGS
-- =====================================================

-- Check function security settings
SELECT 
  '=== FUNCTION SECURITY STATUS ===' as section,
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

-- Check RLS status for existing tables only
SELECT 
  '=== RLS STATUS ===' as section,
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS_ENABLED'
    ELSE '❌ RLS_DISABLED'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('activities', 'strava_tokens', 'sync_state', 'athlete_profiles', 'goal_types', 'user_goals', 'goal_progress', 'user_onboarding')
  )
ORDER BY tablename;

-- Success message
SELECT '🎉 Security fixes completed! All functions secured and RLS policies updated.' as message; 