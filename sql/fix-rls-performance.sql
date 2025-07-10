-- =====================================================
-- RLS POLICY PERFORMANCE OPTIMIZATION
-- =====================================================
-- This script fixes performance issues with Row Level Security policies:
-- 1. Optimizes auth.uid() calls with subqueries  
-- 2. Consolidates duplicate policies
-- 3. Improves query performance at scale
--
-- Run this in your Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: DROP ALL EXISTING PROBLEMATIC POLICIES
-- =====================================================

-- Activities table policies
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can manage own activities" ON public.activities;

-- Strava tokens policies  
DROP POLICY IF EXISTS "Users can access own strava tokens" ON public.strava_tokens;

-- Weekly metrics policies
DROP POLICY IF EXISTS "Users can view own weekly metrics" ON public.weekly_metrics;
DROP POLICY IF EXISTS "Users can manage own weekly metrics" ON public.weekly_metrics;

-- Sync state policies
DROP POLICY IF EXISTS "Users can view own sync state" ON public.sync_state;
DROP POLICY IF EXISTS "Users can manage own sync state" ON public.sync_state;

-- Goals policies
DROP POLICY IF EXISTS "Users can view their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can manage their own goals" ON public.user_goals;

-- Goal progress policies
DROP POLICY IF EXISTS "Users can view their own goal progress" ON public.goal_progress;
DROP POLICY IF EXISTS "Users can manage their own goal progress" ON public.goal_progress;

-- Onboarding policies
DROP POLICY IF EXISTS "Users can manage their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can view their own onboarding" ON public.user_onboarding;

-- =====================================================
-- STEP 2: CREATE OPTIMIZED CONSOLIDATED POLICIES
-- =====================================================

-- ACTIVITIES: Single comprehensive policy
CREATE POLICY "activities_user_policy" ON public.activities
    FOR ALL USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- STRAVA_TOKENS: Single comprehensive policy  
CREATE POLICY "strava_tokens_user_policy" ON public.strava_tokens
    FOR ALL USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- WEEKLY_METRICS: Single comprehensive policy
CREATE POLICY "weekly_metrics_user_policy" ON public.weekly_metrics  
    FOR ALL USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- SYNC_STATE: Single comprehensive policy
CREATE POLICY "sync_state_user_policy" ON public.sync_state
    FOR ALL USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- USER_GOALS: Single comprehensive policy
CREATE POLICY "user_goals_user_policy" ON public.user_goals
    FOR ALL USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- GOAL_PROGRESS: Policy based on user_goals relationship
CREATE POLICY "goal_progress_user_policy" ON public.goal_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_goals 
            WHERE user_goals.id = goal_progress.user_goal_id 
            AND user_goals.user_id = (select auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_goals 
            WHERE user_goals.id = goal_progress.user_goal_id 
            AND user_goals.user_id = (select auth.uid())
        )
    );

-- USER_ONBOARDING: Single comprehensive policy
CREATE POLICY "user_onboarding_user_policy" ON public.user_onboarding
    FOR ALL USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- STEP 3: ENSURE TABLES STILL HAVE RLS ENABLED
-- =====================================================

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant access to authenticated users only (no anonymous access)
GRANT ALL ON public.activities TO authenticated;
GRANT ALL ON public.strava_tokens TO authenticated;
GRANT ALL ON public.weekly_metrics TO authenticated;  
GRANT ALL ON public.sync_state TO authenticated;
GRANT ALL ON public.user_goals TO authenticated;
GRANT ALL ON public.goal_progress TO authenticated;
GRANT ALL ON public.user_onboarding TO authenticated;

-- Also grant to service_role for admin operations
GRANT ALL ON public.activities TO service_role;
GRANT ALL ON public.strava_tokens TO service_role;
GRANT ALL ON public.weekly_metrics TO service_role;
GRANT ALL ON public.sync_state TO service_role;
GRANT ALL ON public.user_goals TO service_role;
GRANT ALL ON public.goal_progress TO service_role;
GRANT ALL ON public.user_onboarding TO service_role;

-- =====================================================
-- STEP 5: ADD HELPFUL COMMENTS
-- =====================================================

COMMENT ON POLICY "activities_user_policy" ON public.activities IS 
'Optimized RLS policy: Users can only access their own activities. Uses subquery for performance.';

COMMENT ON POLICY "strava_tokens_user_policy" ON public.strava_tokens IS 
'Optimized RLS policy: Users can only access their own Strava tokens. Uses subquery for performance.';

COMMENT ON POLICY "weekly_metrics_user_policy" ON public.weekly_metrics IS 
'Optimized RLS policy: Users can only access their own weekly metrics. Uses subquery for performance.';

COMMENT ON POLICY "sync_state_user_policy" ON public.sync_state IS 
'Optimized RLS policy: Users can only access their own sync state. Uses subquery for performance.';

COMMENT ON POLICY "user_goals_user_policy" ON public.user_goals IS 
'Optimized RLS policy: Users can only access their own goals. Uses subquery for performance.';

COMMENT ON POLICY "goal_progress_user_policy" ON public.goal_progress IS 
'Optimized RLS policy: Users can only access progress for their own goals. Uses JOIN for security.';

COMMENT ON POLICY "user_onboarding_user_policy" ON public.user_onboarding IS 
'Optimized RLS policy: Users can only access their own onboarding data. Uses subquery for performance.';

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that policies were created successfully
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('activities', 'strava_tokens', 'weekly_metrics', 'sync_state', 'user_goals', 'goal_progress', 'user_onboarding')
ORDER BY tablename, policyname;

-- Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('activities', 'strava_tokens', 'weekly_metrics', 'sync_state', 'user_goals', 'goal_progress', 'user_onboarding')
ORDER BY tablename; 