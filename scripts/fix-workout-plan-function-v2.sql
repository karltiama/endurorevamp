-- Fix the save_workout_plan function to properly handle the unique constraint
CREATE OR REPLACE FUNCTION save_workout_plan(
  user_uuid UUID,
  week_start_date DATE,
  plan_data JSONB
)
RETURNS UUID AS $$
DECLARE
  new_plan_id UUID; -- Renamed variable to avoid ambiguity
  workout_data JSONB;
  day_of_week INTEGER;
BEGIN
  -- First, deactivate any existing active plan for this user and week
  UPDATE workout_plans 
  SET is_active = false 
  WHERE user_id = user_uuid 
    AND week_start = week_start_date
    AND is_active = true;

  -- Insert new plan with ON CONFLICT handling
  INSERT INTO workout_plans (
    user_id, 
    plan_name, -- Added plan_name as per schema
    week_start, 
    periodization_phase, 
    total_tss, 
    total_distance, 
    total_time,
    is_active -- Explicitly set to true
  ) VALUES (
    user_uuid,
    'Weekly Plan', -- Default value for plan_name
    week_start_date,
    COALESCE(NULLIF(plan_data->>'periodizationPhase', ''), 'base'),
    COALESCE((plan_data->>'totalTSS')::INTEGER, 0),
    COALESCE((plan_data->>'totalDistance')::DECIMAL(8,2), 0),
    COALESCE((plan_data->>'totalTime')::INTEGER, 0),
    true
  ) 
  ON CONFLICT (user_id, week_start, is_active) 
  DO UPDATE SET
    plan_name = EXCLUDED.plan_name,
    periodization_phase = EXCLUDED.periodization_phase,
    total_tss = EXCLUDED.total_tss,
    total_distance = EXCLUDED.total_distance,
    total_time = EXCLUDED.total_time,
    updated_at = NOW()
  RETURNING id INTO new_plan_id; -- Use new_plan_id

  -- Delete existing workouts for this plan (if any)
  DELETE FROM workout_plan_workouts WHERE plan_id = new_plan_id; -- Use new_plan_id
  
  -- Insert workouts (loop remains similar, but uses new_plan_id)
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
        new_plan_id, -- Use new_plan_id
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