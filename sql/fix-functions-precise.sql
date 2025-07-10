-- =====================================================
-- PRECISE FUNCTION SECURITY FIX
-- =====================================================
-- This script handles multiple function signatures properly
-- by dropping each function with its specific argument list
-- =====================================================

-- First, let's see what function signatures currently exist
SELECT 
  routines.routine_name,
  routines.routine_type,
  string_agg(
    COALESCE(parameters.parameter_name, '') || ' ' || 
    COALESCE(parameters.data_type, ''), 
    ', ' ORDER BY parameters.ordinal_position
  ) as parameter_list,
  routines.specific_name
FROM information_schema.routines
LEFT JOIN information_schema.parameters ON routines.specific_name = parameters.specific_name
WHERE routines.routine_schema = 'public'
  AND routines.routine_name IN (
    'extract_time_components',
    'update_goal_progress_from_activity',
    'initialize_default_training_zones'
  )
GROUP BY routines.routine_name, routines.routine_type, routines.specific_name
ORDER BY routines.routine_name;

-- =====================================================
-- DROP FUNCTIONS WITH SPECIFIC SIGNATURES
-- =====================================================

-- Drop extract_time_components with all possible signatures
DROP FUNCTION IF EXISTS public.extract_time_components(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.extract_time_components(total_seconds INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.extract_time_components(p_total_seconds INTEGER) CASCADE;

-- Drop update_goal_progress_from_activity with all possible signatures  
DROP FUNCTION IF EXISTS public.update_goal_progress_from_activity(UUID, NUMERIC, DATE, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_goal_progress_from_activity(UUID, NUMERIC, DATE) CASCADE;
DROP FUNCTION IF EXISTS public.update_goal_progress_from_activity(p_user_id UUID, p_activity_distance NUMERIC, p_activity_date DATE, p_activity_id TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_goal_progress_from_activity(p_user_id UUID, p_activity_distance NUMERIC, p_activity_date DATE) CASCADE;

-- Drop initialize_default_training_zones with all possible signatures
DROP FUNCTION IF EXISTS public.initialize_default_training_zones(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.initialize_default_training_zones(p_user_id UUID) CASCADE;

-- =====================================================
-- RECREATE FUNCTIONS WITH PROPER SECURITY
-- =====================================================

-- 1. Extract time components function
CREATE FUNCTION public.extract_time_components(total_seconds INTEGER)
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

GRANT EXECUTE ON FUNCTION public.extract_time_components(INTEGER) TO authenticated;

-- 2. Goal progress update function
CREATE FUNCTION public.update_goal_progress_from_activity(
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
        progress_value := COALESCE(p_activity_distance / 1000.0, 0);
      WHEN 'run_count' THEN
        progress_value := 1;
      WHEN 'total_time' THEN
        progress_value := 0;
      ELSE
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
      
      -- Update current progress based on time period
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

GRANT EXECUTE ON FUNCTION public.update_goal_progress_from_activity(UUID, NUMERIC, DATE, TEXT) TO authenticated;

-- 3. Training zones initialization function
CREATE FUNCTION public.initialize_default_training_zones(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Placeholder function for training zones initialization
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.initialize_default_training_zones(UUID) TO authenticated;

-- =====================================================
-- VERIFY THE FIX
-- =====================================================

-- Check that functions are now properly secured
SELECT 
  routines.routine_name as function_name,
  routines.security_type,
  CASE 
    WHEN routines.routine_definition LIKE '%SET search_path TO public%' THEN 'FIXED'
    WHEN routines.routine_definition LIKE '%SET search_path = public%' THEN 'FIXED'
    ELSE 'STILL MUTABLE'
  END as search_path_status
FROM information_schema.routines
WHERE routines.routine_schema = 'public'
  AND routines.routine_name IN (
    'extract_time_components',
    'update_goal_progress_from_activity', 
    'initialize_default_training_zones'
  )
ORDER BY routines.routine_name;

-- Final confirmation
SELECT 'All function security issues should now be resolved!' as status; 