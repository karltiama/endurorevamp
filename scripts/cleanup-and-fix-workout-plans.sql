-- Clean up and fix workout plans database
-- This script will clean up existing problematic data and fix the function

-- First, let's see what's in the database
SELECT 'Current workout_plans data:' as info;
SELECT id, user_id, plan_name, week_start, is_active, created_at 
FROM workout_plans 
ORDER BY week_start DESC, is_active DESC;

-- Clean up any duplicate or problematic records
-- Delete all workout plans for the current week to start fresh
DELETE FROM workout_plans 
WHERE week_start = CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE) * INTERVAL '1 day';

-- Also delete any plans that might have conflicting is_active values
DELETE FROM workout_plans 
WHERE user_id IN (
  SELECT user_id 
  FROM workout_plans 
  GROUP BY user_id, week_start 
  HAVING COUNT(*) > 1
);

-- Now fix the save_workout_plan function with a more robust approach
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
BEGIN
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
    COALESCE((plan_data->>'totalTime')::INTEGER, 0),
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

-- Show the cleaned up data
SELECT 'After cleanup workout_plans data:' as info;
SELECT id, user_id, plan_name, week_start, is_active, created_at 
FROM workout_plans 
ORDER BY week_start DESC, is_active DESC; 