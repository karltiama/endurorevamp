-- Comprehensive fix for total_time data type issue
-- This script will completely replace the function and ensure the fix is applied

-- First, let's see the current function definition
SELECT 'Current function definition:' as info;
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'save_workout_plan';

-- Drop the existing function completely
DROP FUNCTION IF EXISTS save_workout_plan(UUID, DATE, JSONB);

-- Create the new function with proper data type handling
CREATE OR REPLACE FUNCTION save_workout_plan(
  user_uuid UUID,
  week_start_date DATE,
  plan_data JSONB
)
RETURNS UUID AS $$
DECLARE
  new_plan_id UUID;
  workout_data JSONB;
  day_of_week INTEGER;
  total_time_value INTEGER;
BEGIN
  -- Debug: Log the incoming totalTime value
  RAISE NOTICE 'Incoming totalTime: %', plan_data->>'totalTime';
  
  -- Convert totalTime to integer with proper handling
  IF plan_data->>'totalTime' IS NULL THEN
    total_time_value := 0;
  ELSE
    -- Handle both string and numeric values, convert to integer
    total_time_value := ROUND((plan_data->>'totalTime')::DECIMAL, 0)::INTEGER;
  END IF;
  
  RAISE NOTICE 'Converted totalTime to integer: %', total_time_value;

  -- First, completely remove ALL existing plans for this user and week
  DELETE FROM workout_plans 
  WHERE user_id = user_uuid 
    AND week_start = week_start_date;

  -- Insert new plan (no conflict possible since we deleted everything)
  INSERT INTO workout_plans (
    user_id, 
    plan_name,
    week_start, 
    periodization_phase, 
    total_tss, 
    total_distance, 
    total_time,
    is_active
  ) VALUES (
    user_uuid,
    'Weekly Plan',
    week_start_date,
    COALESCE(NULLIF(plan_data->>'periodizationPhase', ''), 'base'),
    COALESCE((plan_data->>'totalTSS')::INTEGER, 0),
    COALESCE((plan_data->>'totalDistance')::DECIMAL(8,2), 0),
    total_time_value, -- Use the properly converted integer value
    true
  ) 
  RETURNING id INTO new_plan_id;

  -- Delete existing workouts for this plan (if any)
  DELETE FROM workout_plan_workouts WHERE plan_id = new_plan_id;
  
  -- Insert workouts
  FOR day_of_week IN 0..6 LOOP
    workout_data := plan_data->'workouts'->day_of_week::TEXT;
    
    IF workout_data IS NOT NULL AND workout_data != 'null' THEN
      INSERT INTO workout_plan_workouts (
        plan_id,
        day_of_week,
        workout_type,
        sport,
        duration,
        intensity,
        distance,
        difficulty,
        energy_cost,
        recovery_time,
        reasoning,
        goal_alignment,
        weather_consideration,
        instructions,
        tips,
        modifications,
        alternatives
      ) VALUES (
        new_plan_id,
        day_of_week,
        workout_data->>'type',
        workout_data->>'sport',
        (workout_data->>'duration')::INTEGER,
        (workout_data->>'intensity')::INTEGER,
        CASE 
          WHEN workout_data->>'distance' IS NOT NULL 
          THEN (workout_data->>'distance')::DECIMAL(8,2)
          ELSE NULL
        END,
        COALESCE(workout_data->>'difficulty', 'intermediate'),
        COALESCE((workout_data->>'energyCost')::INTEGER, 5),
        COALESCE((workout_data->>'recoveryTime')::INTEGER, 24),
        workout_data->>'reasoning',
        workout_data->>'goalAlignment',
        workout_data->>'weatherConsideration',
        workout_data->'instructions',
        workout_data->'tips',
        workout_data->'modifications',
        workout_data->'alternatives'
      );
    END IF;
  END LOOP;

  RETURN new_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Show the new function definition
SELECT 'New function definition:' as info;
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'save_workout_plan'; 