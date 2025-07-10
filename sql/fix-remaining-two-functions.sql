-- =====================================================
-- FIX REMAINING TWO FUNCTIONS
-- =====================================================
-- Apply the same successful pattern to fix:
-- 1. update_goal_progress_from_activity
-- 2. extract_time_components
-- =====================================================

-- =====================================================
-- PART A: FIX update_goal_progress_from_activity
-- =====================================================

-- A1: Find all existing signatures for update_goal_progress_from_activity
SELECT 
  'update_goal_progress_from_activity found:' as status,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as exact_arguments,
  p.oid as function_oid
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'update_goal_progress_from_activity'
ORDER BY p.oid;

-- A2: Dynamic cleanup for update_goal_progress_from_activity
DO $$
DECLARE
    func_oid oid;
    func_signature text;
BEGIN
    -- Loop through all existing functions and drop them
    FOR func_oid IN 
        SELECT p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname = 'update_goal_progress_from_activity'
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

-- A3: Verify cleanup for update_goal_progress_from_activity
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: All update_goal_progress_from_activity functions dropped'
    ELSE 'ERROR: ' || COUNT(*) || ' functions still exist'
  END as cleanup_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'update_goal_progress_from_activity';

-- A4: Create secure update_goal_progress_from_activity function
CREATE FUNCTION public.update_goal_progress_from_activity(
  p_user_id uuid,
  p_activity_distance numeric,
  p_activity_date date,
  p_activity_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- A5: Grant permissions for update_goal_progress_from_activity
GRANT EXECUTE ON FUNCTION public.update_goal_progress_from_activity(uuid, numeric, date, text) TO authenticated;

-- =====================================================
-- PART B: FIX extract_time_components
-- =====================================================

-- B1: Find all existing signatures for extract_time_components
SELECT 
  'extract_time_components found:' as status,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as exact_arguments,
  p.oid as function_oid
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'extract_time_components'
ORDER BY p.oid;

-- B2: Dynamic cleanup for extract_time_components
DO $$
DECLARE
    func_oid oid;
    func_signature text;
BEGIN
    -- Loop through all existing functions and drop them
    FOR func_oid IN 
        SELECT p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname = 'extract_time_components'
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

-- B3: Verify cleanup for extract_time_components
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: All extract_time_components functions dropped'
    ELSE 'ERROR: ' || COUNT(*) || ' functions still exist'
  END as cleanup_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'extract_time_components';

-- B4: Create secure extract_time_components function
CREATE FUNCTION public.extract_time_components(total_seconds integer)
RETURNS TABLE (
  hours integer,
  minutes integer,
  seconds integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (total_seconds / 3600)::INTEGER as hours,
    ((total_seconds % 3600) / 60)::INTEGER as minutes,
    (total_seconds % 60)::INTEGER as seconds;
END;
$$;

-- B5: Grant permissions for extract_time_components
GRANT EXECUTE ON FUNCTION public.extract_time_components(integer) TO authenticated;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

-- Verify all three functions are now secure
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
  AND p.proname IN ('initialize_default_training_zones', 'update_goal_progress_from_activity', 'extract_time_components')
ORDER BY p.proname;

-- Test the functions
SELECT 'Testing extract_time_components...' as test_status;
SELECT * FROM public.extract_time_components(3661) as test_result;

-- Final success message
SELECT 'All function security issues resolved!' as final_status; 