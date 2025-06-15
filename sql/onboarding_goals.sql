-- User Goals Schema for Onboarding
-- This schema supports multiple goal types and flexible progress tracking

-- Goal Types: Specific, measurable objectives based on Strava activity data
-- Each goal type corresponds to trackable metrics from running activities

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS goal_progress CASCADE;
DROP TABLE IF EXISTS user_goals CASCADE;
DROP TABLE IF EXISTS user_onboarding CASCADE;
DROP TABLE IF EXISTS goal_types CASCADE;

-- Drop existing function
DROP FUNCTION IF EXISTS update_goal_progress_from_activity();

-- Goal Types: Specific metrics we can track from Strava
CREATE TABLE goal_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(30) NOT NULL, -- 'distance', 'pace', 'frequency', 'duration', 'elevation', 'heart_rate'
  metric_type VARCHAR(30) NOT NULL, -- The specific metric we're tracking
  unit VARCHAR(20), -- km, miles, min/km, min/mile, bpm, m, ft, count, minutes, hours
  target_guidance TEXT, -- Guidance on setting realistic targets
  calculation_method TEXT NOT NULL, -- How we calculate progress from activities
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Goals: Specific targets with clear progress tracking
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_type_id UUID NOT NULL REFERENCES goal_types(id) ON DELETE CASCADE,
  target_value DECIMAL, -- The numeric target (e.g., 50 km, 5:00 min/km, 4 runs)
  target_unit VARCHAR(20), -- Unit for the target
  target_date DATE, -- Optional target date for time-bound goals
  time_period VARCHAR(20) DEFAULT 'weekly', -- 'weekly', 'monthly', 'single_activity', 'ongoing'
  current_progress DECIMAL DEFAULT 0, -- Current progress toward target
  best_result DECIMAL, -- Best single result achieved (for pace, distance PRs, etc.)
  streak_count INTEGER DEFAULT 0, -- For consistency goals
  goal_data JSONB DEFAULT '{}', -- Additional data (pace targets, HR zones, etc.)
  is_active BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 1, -- 1-5, higher = more important
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_progress_update TIMESTAMP WITH TIME ZONE
);

-- Goal Progress: Detailed tracking from each activity
CREATE TABLE goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_goal_id UUID NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
  activity_id VARCHAR(50), -- Strava activity ID
  activity_date DATE NOT NULL,
  value_achieved DECIMAL, -- The value achieved in this activity
  contribution_amount DECIMAL, -- How much this activity contributed to the goal
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Onboarding: Track completion of goal-setting process
CREATE TABLE user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  goals_completed BOOLEAN DEFAULT false,
  strava_connected BOOLEAN DEFAULT false,
  current_step VARCHAR(20) DEFAULT 'goals', -- 'goals', 'strava', 'complete'
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert specific, measurable goal types
INSERT INTO goal_types (name, display_name, description, category, metric_type, unit, target_guidance, calculation_method) VALUES
-- Distance Goals
('weekly_distance', 'Weekly Distance Target', 'Run a specific total distance each week', 'distance', 'total_distance', 'km', 'Beginners: 15-25km, Intermediate: 30-50km, Advanced: 60km+', 'Sum of all run distances in the week'),
('monthly_distance', 'Monthly Distance Goal', 'Achieve a monthly running distance target', 'distance', 'total_distance', 'km', 'Beginners: 60-100km, Intermediate: 120-200km, Advanced: 250km+', 'Sum of all run distances in the month'),
('long_run_distance', 'Long Run Building', 'Progressively increase your longest single run', 'distance', 'max_distance', 'km', 'Increase by 10% weekly. Current long run + 2-5km', 'Track the longest single run distance'),

-- Pace/Speed Goals  
('target_pace_5k', '5K Pace Target', 'Improve your average pace over 5K distance', 'pace', 'average_pace', 'min/km', 'Aim to improve by 15-30 seconds per km over 3 months', 'Average pace of runs between 4.5-5.5km distance'),
('target_pace_10k', '10K Pace Target', 'Improve your average pace over 10K distance', 'pace', 'average_pace', 'min/km', 'Typically 20-30 seconds slower than 5K pace', 'Average pace of runs between 9.5-10.5km distance'),
('general_pace_improvement', 'Overall Pace Improvement', 'Improve your general running pace across all distances', 'pace', 'average_pace', 'min/km', 'Aim to improve by 10-20 seconds per km over 2-3 months', 'Average pace across all runs weighted by distance'),

-- Frequency/Consistency Goals
('weekly_run_frequency', 'Weekly Running Consistency', 'Run a specific number of times per week', 'frequency', 'run_count', 'runs', 'Beginners: 3 runs, Intermediate: 4-5 runs, Advanced: 6+ runs', 'Count of running activities per week'),
('monthly_run_frequency', 'Monthly Running Consistency', 'Maintain a monthly running frequency target', 'frequency', 'run_count', 'runs', 'Aim for 12-20 runs per month depending on experience', 'Count of running activities per month'),

-- Duration Goals
('weekly_time_target', 'Weekly Time on Feet', 'Spend a target amount of time running each week', 'duration', 'total_time', 'hours', 'Beginners: 2-4 hours, Intermediate: 5-8 hours, Advanced: 10+ hours', 'Sum of all running activity durations in the week'),
('long_run_duration', 'Long Run Duration', 'Build endurance with longer time-based runs', 'duration', 'max_duration', 'minutes', 'Increase by 10-15 minutes weekly. Current max + 15-30 min', 'Longest single run duration'),

-- Elevation Goals
('weekly_elevation_gain', 'Weekly Elevation Challenge', 'Climb a target amount of elevation each week', 'elevation', 'total_elevation', 'm', 'Varies by location: 200-1000m per week', 'Sum of elevation gain from all runs in the week'),
('climbing_endurance', 'Hill Running Endurance', 'Build strength with elevation-focused training', 'elevation', 'elevation_per_km', 'm/km', 'Track average elevation gain per kilometer', 'Average elevation gain per kilometer across all runs'),

-- Heart Rate Goals (if HR data available)
('aerobic_base_building', 'Aerobic Base Development', 'Spend more time in aerobic heart rate zones', 'heart_rate', 'zone_2_time', 'minutes', 'Aim for 80% of training time in Zone 1-2', 'Time spent in heart rate zones 1-2 per week'),
('threshold_training', 'Lactate Threshold Improvement', 'Improve fitness with threshold heart rate training', 'heart_rate', 'zone_4_time', 'minutes', '10-20 minutes of Zone 4 work per week', 'Time spent in heart rate zone 4 per week');

-- Create indexes for performance
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_active ON user_goals(is_active) WHERE is_active = true;
CREATE INDEX idx_goal_progress_goal_id ON goal_progress(user_goal_id);
CREATE INDEX idx_goal_progress_date ON goal_progress(activity_date);
CREATE INDEX idx_user_onboarding_user_id ON user_onboarding(user_id);

-- Function to update goal progress from activity data
CREATE OR REPLACE FUNCTION update_goal_progress_from_activity(
  p_user_id UUID,
  p_activity_id VARCHAR(50),
  p_activity_date DATE,
  p_distance DECIMAL,
  p_duration INTEGER, -- in seconds
  p_elevation_gain DECIMAL,
  p_average_pace DECIMAL, -- in seconds per km
  p_heart_rate_zones JSONB DEFAULT NULL -- time in each zone
) RETURNS void AS $$
DECLARE
  goal_record RECORD;
  progress_value DECIMAL;
  contribution DECIMAL;
BEGIN
  -- Loop through all active goals for this user
  FOR goal_record IN 
    SELECT ug.*, gt.metric_type, gt.calculation_method, gt.time_period
    FROM user_goals ug
    JOIN goal_types gt ON ug.goal_type_id = gt.id
    WHERE ug.user_id = p_user_id 
    AND ug.is_active = true 
    AND NOT ug.is_completed
  LOOP
    progress_value := 0;
    contribution := 0;
    
    -- Calculate progress based on metric type
    CASE goal_record.metric_type
      WHEN 'total_distance' THEN
        contribution := p_distance;
        
      WHEN 'max_distance' THEN
        IF p_distance > COALESCE(goal_record.best_result, 0) THEN
          progress_value := p_distance;
          contribution := p_distance - COALESCE(goal_record.best_result, 0);
        END IF;
        
      WHEN 'average_pace' THEN
        -- For pace goals, we track the best (fastest) pace achieved
        IF p_average_pace > 0 AND (goal_record.best_result IS NULL OR p_average_pace < goal_record.best_result) THEN
          progress_value := p_average_pace;
          contribution := COALESCE(goal_record.best_result, 999) - p_average_pace;
        END IF;
        
      WHEN 'run_count' THEN
        contribution := 1; -- Each activity counts as 1 run
        
      WHEN 'total_time' THEN
        contribution := p_duration / 3600.0; -- Convert seconds to hours
        
      WHEN 'max_duration' THEN
        IF p_duration > COALESCE(goal_record.best_result, 0) * 60 THEN -- best_result in minutes, duration in seconds
          progress_value := p_duration / 60.0; -- Convert to minutes
          contribution := (p_duration / 60.0) - COALESCE(goal_record.best_result, 0);
        END IF;
        
      WHEN 'total_elevation' THEN
        contribution := COALESCE(p_elevation_gain, 0);
        
      WHEN 'elevation_per_km' THEN
        IF p_distance > 0 THEN
          progress_value := COALESCE(p_elevation_gain, 0) / p_distance;
        END IF;
        
      WHEN 'zone_2_time', 'zone_4_time' THEN
        IF p_heart_rate_zones IS NOT NULL THEN
          CASE goal_record.metric_type
            WHEN 'zone_2_time' THEN
              contribution := COALESCE((p_heart_rate_zones->>'zone_1')::DECIMAL, 0) + 
                             COALESCE((p_heart_rate_zones->>'zone_2')::DECIMAL, 0);
            WHEN 'zone_4_time' THEN  
              contribution := COALESCE((p_heart_rate_zones->>'zone_4')::DECIMAL, 0);
          END CASE;
        END IF;
        
      ELSE
        CONTINUE; -- Skip unknown metric types
    END CASE;
    
    -- Insert progress record if there was a contribution
    IF contribution > 0 OR progress_value > 0 THEN
      INSERT INTO goal_progress (user_goal_id, activity_id, activity_date, value_achieved, contribution_amount)
      VALUES (goal_record.id, p_activity_id, p_activity_date, 
              COALESCE(progress_value, contribution), contribution);
      
      -- Update the goal's current progress and best result
      IF goal_record.metric_type IN ('max_distance', 'max_duration', 'average_pace') THEN
        -- For max/best goals, update the best result
        UPDATE user_goals 
        SET best_result = GREATEST(COALESCE(best_result, 0), progress_value),
            last_progress_update = now()
        WHERE id = goal_record.id AND progress_value > 0;
      ELSE
        -- For cumulative goals, add to current progress
        UPDATE user_goals 
        SET current_progress = current_progress + contribution,
            last_progress_update = now()
        WHERE id = goal_record.id;
      END IF;
      
      -- Check if goal is completed
      UPDATE user_goals 
      SET is_completed = true, completed_at = now()
      WHERE id = goal_record.id 
      AND NOT is_completed
      AND (
        (target_value IS NOT NULL AND 
         ((metric_type IN ('max_distance', 'max_duration') AND best_result >= target_value) OR
          (metric_type = 'average_pace' AND best_result <= target_value) OR
          (metric_type NOT IN ('max_distance', 'max_duration', 'average_pace') AND current_progress >= target_value)))
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE goal_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Goal types are viewable by everyone" ON goal_types FOR SELECT USING (true);
CREATE POLICY "Users can view their own goals" ON user_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own goal progress" ON goal_progress FOR ALL USING (
  EXISTS (SELECT 1 FROM user_goals WHERE id = goal_progress.user_goal_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their own onboarding" ON user_onboarding FOR ALL USING (auth.uid() = user_id); 