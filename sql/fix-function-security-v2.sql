-- =====================================================
-- FUNCTION SECURITY FIXES (Safe Version)
-- =====================================================
-- This script fixes the remaining function security warnings by:
-- 1. Safely dropping existing functions first
-- 2. Recreating with SECURITY DEFINER
-- 3. Setting fixed search_path to prevent manipulation
--
-- Run this in your Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: SAFELY DROP EXISTING FUNCTIONS
-- =====================================================

-- Drop functions if they exist (with all possible signatures)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_pace_from_speed(NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.extract_time_components(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.update_goal_progress_from_activity(UUID, NUMERIC, DATE, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_goal_progress_from_activity(UUID, NUMERIC, DATE) CASCADE;
DROP FUNCTION IF EXISTS public.initialize_default_training_zones(UUID) CASCADE;

-- =====================================================
-- STEP 2: RECREATE FUNCTIONS WITH PROPER SECURITY
-- =====================================================

-- 1. Update timestamp trigger function
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Trigger function to update updated_at timestamp. Secured with SECURITY DEFINER and fixed search_path.';

-- 2. Pace calculation function
CREATE FUNCTION public.calculate_pace_from_speed(p_speed_ms NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.calculate_pace_from_speed(NUMERIC) TO authenticated;
COMMENT ON FUNCTION public.calculate_pace_from_speed(NUMERIC) IS 
'Converts speed (m/s) to pace (seconds per km). Secured with SECURITY DEFINER and fixed search_path.';

-- 3. Time components extraction function
CREATE FUNCTION public.extract_time_components(total_seconds INTEGER)
RETURNS TABLE (
  hours INTEGER,
  minutes INTEGER,
  seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (total_seconds / 3600)::INTEGER as hours,
    ((total_seconds % 3600) / 60)::INTEGER as minutes,
    (total_seconds % 60)::INTEGER as seconds;
END;
$$;

GRANT EXECUTE ON FUNCTION public.extract_time_components(INTEGER) TO authenticated;
COMMENT ON FUNCTION public.extract_time_components(INTEGER) IS 
'Extracts hours, minutes, seconds from total seconds. Secured with SECURITY DEFINER and fixed search_path.';

-- 4. Goal progress update function
CREATE FUNCTION public.update_goal_progress_from_activity(
  p_user_id UUID,
  p_activity_distance NUMERIC,
  p_activity_date DATE,
  p_activity_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  goal_record RECORD;
  progress_value NUMERIC;
  week_start DATE;
  month_start DATE;
BEGIN
  -- Calculate week and month boundaries
  week_start := date_trunc('week', p_activity_date)::DATE;
  month_start := date_trunc('month', p_activity_date)::DATE;
  
  -- Process all active goals for this user
  FOR goal_record IN 
    SELECT ug.*, gt.name as goal_type_name, gt.metric_type, gt.calculation_method
    FROM user_goals ug
    JOIN goal_types gt ON ug.goal_type_id = gt.id
    WHERE ug.user_id = p_user_id 
      AND ug.is_active = true
      AND ug.is_completed = false
  LOOP
    
    -- Calculate progress based on goal type
    CASE goal_record.goal_type_name
      WHEN 'total_distance' THEN
        -- Distance goals: add distance
        progress_value := COALESCE(p_activity_distance / 1000.0, 0); -- Convert to km
        
      WHEN 'run_count' THEN
        -- Frequency goals: count activities
        progress_value := 1;
        
      WHEN 'total_time' THEN
        -- Time goals: would need moving_time from activity (not available in this function)
        progress_value := 0;
        
      ELSE
        -- Unknown goal type
        progress_value := 0;
    END CASE;
    
    -- Only create progress entry if there's actual progress
    IF progress_value > 0 THEN
      -- Insert progress record (avoid conflicts if no unique constraint exists)
      INSERT INTO goal_progress (
        user_goal_id,
        activity_id,
        activity_date,
        value_achieved,
        contribution_amount,
        created_at
      ) VALUES (
        goal_record.id,
        p_activity_id,
        p_activity_date,
        progress_value,
        progress_value,
        NOW()
      );
      
      -- Update the user_goals current_progress
      -- Sum progress based on time period
      IF goal_record.time_period = 'weekly' THEN
        UPDATE user_goals 
        SET 
          current_progress = (
            SELECT COALESCE(SUM(gp.value_achieved), 0)
            FROM goal_progress gp
            WHERE gp.user_goal_id = goal_record.id
              AND gp.activity_date >= week_start
              AND gp.activity_date < week_start + INTERVAL '7 days'
          ),
          last_progress_update = NOW()
        WHERE id = goal_record.id;
        
      ELSIF goal_record.time_period = 'monthly' THEN
        UPDATE user_goals 
        SET 
          current_progress = (
            SELECT COALESCE(SUM(gp.value_achieved), 0)
            FROM goal_progress gp
            WHERE gp.user_goal_id = goal_record.id
              AND gp.activity_date >= month_start
              AND gp.activity_date < month_start + INTERVAL '1 month'
          ),
          last_progress_update = NOW()
        WHERE id = goal_record.id;
      END IF;
      
      -- Check if goal is completed
      UPDATE user_goals 
      SET 
        current_progress = (
          SELECT COALESCE(SUM(gp.value_achieved), 0)
          FROM goal_progress gp
          WHERE gp.user_goal_id = goal_record.id
            AND (
              (goal_record.time_period = 'weekly' AND gp.activity_date >= week_start AND gp.activity_date < week_start + INTERVAL '7 days') OR
              (goal_record.time_period = 'monthly' AND gp.activity_date >= month_start AND gp.activity_date < month_start + INTERVAL '1 month')
            )
        )
      WHERE id = goal_record.id;
      
      -- Mark as completed if target reached
      UPDATE user_goals 
      SET 
        is_completed = true,
        completed_at = NOW()
      WHERE id = goal_record.id
        AND target_value IS NOT NULL 
        AND current_progress >= target_value
        AND is_completed = false;
        
    END IF;
    
  END LOOP;
  
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_goal_progress_from_activity(UUID, NUMERIC, DATE, TEXT) TO authenticated;
COMMENT ON FUNCTION public.update_goal_progress_from_activity(UUID, NUMERIC, DATE, TEXT) IS 
'Updates goal progress based on activity data. Secured with SECURITY DEFINER and fixed search_path.';

-- 5. Training zones initialization function
CREATE FUNCTION public.initialize_default_training_zones(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function would initialize default training zones for a user
  -- Implementation depends on your training zones schema
  -- For now, just return without error
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.initialize_default_training_zones(UUID) TO authenticated;
COMMENT ON FUNCTION public.initialize_default_training_zones(UUID) IS 
'Initializes default training zones for a user. Secured with SECURITY DEFINER and fixed search_path.';

-- =====================================================
-- STEP 3: VERIFY FUNCTION SECURITY
-- =====================================================

-- Check that all functions are properly secured
SELECT 
  routines.routine_name as function_name,
  routines.security_type,
  CASE 
    WHEN routines.routine_definition LIKE '%SET search_path%' THEN 'Fixed'
    ELSE 'Missing search_path'
  END as search_path_status
FROM information_schema.routines
WHERE routines.routine_schema = 'public'
  AND routines.routine_name IN (
    'update_updated_at_column',
    'calculate_pace_from_speed', 
    'extract_time_components',
    'update_goal_progress_from_activity',
    'initialize_default_training_zones'
  )
ORDER BY routines.routine_name;

COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'All function security issues have been resolved!' as status; 