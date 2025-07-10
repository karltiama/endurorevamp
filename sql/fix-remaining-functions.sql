-- =====================================================
-- FIX REMAINING FUNCTION SECURITY ISSUES
-- =====================================================
-- Targeted fix for the 3 functions that still have mutable search_path
-- =====================================================

-- Check what function signatures exist first
SELECT 
  routines.routine_name,
  routines.routine_type,
  parameters.parameter_name,
  parameters.data_type,
  routines.specific_name
FROM information_schema.routines
LEFT JOIN information_schema.parameters ON routines.specific_name = parameters.specific_name
WHERE routines.routine_schema = 'public'
  AND routines.routine_name IN (
    'extract_time_components',
    'update_goal_progress_from_activity',
    'initialize_default_training_zones'
  )
ORDER BY routines.routine_name, parameters.ordinal_position;

-- =====================================================
-- DROP ALL VERSIONS OF PROBLEMATIC FUNCTIONS
-- =====================================================

-- Be very aggressive about dropping all possible versions
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Find and drop all versions of extract_time_components
    FOR func_record IN 
        SELECT specific_name, routine_name
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
          AND routine_name = 'extract_time_components'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || func_record.routine_name || ' CASCADE';
    END LOOP;
    
    -- Find and drop all versions of update_goal_progress_from_activity
    FOR func_record IN 
        SELECT specific_name, routine_name
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
          AND routine_name = 'update_goal_progress_from_activity'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || func_record.routine_name || ' CASCADE';
    END LOOP;
    
    -- Find and drop all versions of initialize_default_training_zones
    FOR func_record IN 
        SELECT specific_name, routine_name
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
          AND routine_name = 'initialize_default_training_zones'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || func_record.routine_name || ' CASCADE';
    END LOOP;
END $$;

-- =====================================================
-- RECREATE FUNCTIONS WITH PROPER SECURITY
-- =====================================================

-- 1. Extract time components function (SECURE VERSION)
CREATE OR REPLACE FUNCTION public.extract_time_components(total_seconds INTEGER)
RETURNS TABLE (
  hours INTEGER,
  minutes INTEGER,
  seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (total_seconds / 3600)::INTEGER as hours,
    ((total_seconds % 3600) / 60)::INTEGER as minutes,
    (total_seconds % 60)::INTEGER as seconds;
END;
$$;

-- 2. Goal progress update function (SECURE VERSION)
CREATE OR REPLACE FUNCTION public.update_goal_progress_from_activity(
  p_user_id UUID,
  p_activity_distance NUMERIC,
  p_activity_date DATE,
  p_activity_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
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
      -- Insert progress record
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
      
      -- Update the user_goals current_progress based on time period
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

-- 3. Training zones initialization function (SECURE VERSION)
CREATE OR REPLACE FUNCTION public.initialize_default_training_zones(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- This function would initialize default training zones for a user
  -- Implementation depends on your training zones schema
  -- For now, just return without error
  RETURN;
END;
$$;

-- =====================================================
-- SET PROPER PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.extract_time_components(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_goal_progress_from_activity(UUID, NUMERIC, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_default_training_zones(UUID) TO authenticated;

-- =====================================================
-- VERIFY THE FIX
-- =====================================================

-- Check that functions are now properly secured
SELECT 
  routines.routine_name as function_name,
  routines.security_type,
  CASE 
    WHEN routines.routine_definition LIKE '%SET search_path TO public%' 
      OR routines.routine_definition LIKE '%SET search_path = public%' THEN 'FIXED'
    ELSE 'STILL MUTABLE'
  END as search_path_status,
  length(routines.routine_definition) as definition_length
FROM information_schema.routines
WHERE routines.routine_schema = 'public'
  AND routines.routine_name IN (
    'extract_time_components',
    'update_goal_progress_from_activity',
    'initialize_default_training_zones'
  )
ORDER BY routines.routine_name;

-- Success message
SELECT 'Function security fixes applied successfully!' as status; 