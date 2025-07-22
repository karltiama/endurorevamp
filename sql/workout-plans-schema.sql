-- Workout Plans Schema
-- This schema allows users to save and retrieve their custom workout plans

-- Create workout_plans table
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name VARCHAR(255) NOT NULL DEFAULT 'Weekly Plan',
  week_start DATE NOT NULL,
  periodization_phase VARCHAR(50) NOT NULL DEFAULT 'base',
  total_tss INTEGER NOT NULL DEFAULT 0,
  total_distance DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_time INTEGER NOT NULL DEFAULT 0, -- in minutes
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one active plan per user per week
  UNIQUE(user_id, week_start, is_active)
);

-- Create workout_plan_workouts table for individual workouts
CREATE TABLE IF NOT EXISTS workout_plan_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  workout_type VARCHAR(50) NOT NULL,
  sport VARCHAR(50) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
  distance DECIMAL(8,2), -- in km, optional
  difficulty VARCHAR(20) NOT NULL DEFAULT 'intermediate',
  energy_cost INTEGER NOT NULL DEFAULT 5 CHECK (energy_cost >= 1 AND energy_cost <= 10),
  recovery_time INTEGER NOT NULL DEFAULT 24, -- in hours
  reasoning TEXT,
  goal_alignment TEXT,
  weather_consideration TEXT,
  instructions JSONB, -- Array of instruction strings
  tips JSONB, -- Array of tip strings
  modifications JSONB, -- Object with easier, harder, shorter, longer modifications
  alternatives JSONB, -- Array of alternative workout objects
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one workout per day per plan
  UNIQUE(plan_id, day_of_week)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_week_start ON workout_plans(week_start);
CREATE INDEX IF NOT EXISTS idx_workout_plans_active ON workout_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_workout_plan_workouts_plan_id ON workout_plan_workouts(plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_plan_workouts_day ON workout_plan_workouts(day_of_week);

-- Enable Row Level Security
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plan_workouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_plans
CREATE POLICY "Users can view their own workout plans" ON workout_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout plans" ON workout_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout plans" ON workout_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout plans" ON workout_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workout_plan_workouts
CREATE POLICY "Users can view workouts in their plans" ON workout_plan_workouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_plans 
      WHERE workout_plans.id = workout_plan_workouts.plan_id 
      AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workouts in their plans" ON workout_plan_workouts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_plans 
      WHERE workout_plans.id = workout_plan_workouts.plan_id 
      AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update workouts in their plans" ON workout_plan_workouts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_plans 
      WHERE workout_plans.id = workout_plan_workouts.plan_id 
      AND workout_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete workouts in their plans" ON workout_plan_workouts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_plans 
      WHERE workout_plans.id = workout_plan_workouts.plan_id 
      AND workout_plans.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_workout_plans_updated_at 
  BEFORE UPDATE ON workout_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_plan_workouts_updated_at 
  BEFORE UPDATE ON workout_plan_workouts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get current week's plan for a user
CREATE OR REPLACE FUNCTION get_current_week_plan(user_uuid UUID)
RETURNS TABLE (
  plan_id UUID,
  plan_name VARCHAR(255),
  week_start DATE,
  periodization_phase VARCHAR(50),
  total_tss INTEGER,
  total_distance DECIMAL(8,2),
  total_time INTEGER,
  day_of_week INTEGER,
  workout_type VARCHAR(50),
  sport VARCHAR(50),
  duration INTEGER,
  intensity INTEGER,
  distance DECIMAL(8,2),
  difficulty VARCHAR(20),
  energy_cost INTEGER,
  recovery_time INTEGER,
  reasoning TEXT,
  goal_alignment TEXT,
  weather_consideration TEXT,
  instructions JSONB,
  tips JSONB,
  modifications JSONB,
  alternatives JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wp.id as plan_id,
    wp.plan_name,
    wp.week_start,
    wp.periodization_phase,
    wp.total_tss,
    wp.total_distance,
    wp.total_time,
    wpw.day_of_week,
    wpw.workout_type,
    wpw.sport,
    wpw.duration,
    wpw.intensity,
    wpw.distance,
    wpw.difficulty,
    wpw.energy_cost,
    wpw.recovery_time,
    wpw.reasoning,
    wpw.goal_alignment,
    wpw.weather_consideration,
    wpw.instructions,
    wpw.tips,
    wpw.modifications,
    wpw.alternatives
  FROM workout_plans wp
  LEFT JOIN workout_plan_workouts wpw ON wp.id = wpw.plan_id
  WHERE wp.user_id = user_uuid 
    AND wp.is_active = true
    AND wp.week_start = DATE_TRUNC('week', CURRENT_DATE)::DATE
  ORDER BY wpw.day_of_week;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to save a complete workout plan
CREATE OR REPLACE FUNCTION save_workout_plan(
  user_uuid UUID,
  week_start_date DATE,
  plan_data JSONB
)
RETURNS UUID AS $$
DECLARE
  plan_id UUID;
  workout_data JSONB;
  day_of_week INTEGER;
BEGIN
  -- Deactivate any existing plan for this week
  UPDATE workout_plans 
  SET is_active = false 
  WHERE user_id = user_uuid 
    AND week_start = week_start_date
    AND is_active = true;

  -- Insert new plan with ON CONFLICT handling
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
    COALESCE(ROUND((plan_data->>'totalTime')::DECIMAL, 0)::INTEGER, 0),
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
  RETURNING id INTO plan_id;

  -- Delete existing workouts for this plan
  DELETE FROM workout_plan_workouts WHERE plan_id = plan_id;
  
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
        plan_id,
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
        workout_data->>'difficulty',
        (workout_data->>'energyCost')::INTEGER,
        (workout_data->>'recoveryTime')::INTEGER,
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

  RETURN plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 