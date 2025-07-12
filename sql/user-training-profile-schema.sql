-- User Training Profile Schema
-- This extends the basic athlete_profiles with training-specific data

-- Enhanced athlete profiles with training thresholds
CREATE TABLE IF NOT EXISTS user_training_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic athlete info (from Strava or user input)
  age INTEGER,
  weight NUMERIC, -- kg
  height NUMERIC, -- cm
  sex VARCHAR(1) CHECK (sex IN ('M', 'F')),
  experience_level VARCHAR(20) DEFAULT 'intermediate' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'elite')),
  primary_sport VARCHAR(50) DEFAULT 'Run',
  
  -- Heart Rate Thresholds
  max_heart_rate INTEGER,
  resting_heart_rate INTEGER,
  lactate_threshold_hr INTEGER,
  aerobic_threshold_hr INTEGER,
  
  -- Power Thresholds (for cycling)
  functional_threshold_power INTEGER, -- FTP in watts
  critical_power INTEGER,
  
  -- Training Load Targets
  weekly_tss_target INTEGER DEFAULT 400,
  monthly_distance_target NUMERIC, -- km
  weekly_training_hours_target NUMERIC,
  
  -- Training Zones (stored as JSONB for flexibility)
  heart_rate_zones JSONB DEFAULT '{}',
  power_zones JSONB DEFAULT '{}',
  pace_zones JSONB DEFAULT '{}',
  
  -- System vs User Preferences
  -- These fields track whether user has manually overridden system estimates
  max_hr_source VARCHAR(20) DEFAULT 'estimated' CHECK (max_hr_source IN ('estimated', 'user_set', 'lab_tested')),
  resting_hr_source VARCHAR(20) DEFAULT 'estimated' CHECK (resting_hr_source IN ('estimated', 'user_set', 'measured')),
  ftp_source VARCHAR(20) DEFAULT 'estimated' CHECK (ftp_source IN ('estimated', 'user_set', 'lab_tested', 'field_tested')),
  tss_target_source VARCHAR(20) DEFAULT 'estimated' CHECK (tss_target_source IN ('estimated', 'user_set', 'coach_set')),
  
  -- Calculation metadata
  last_threshold_calculation TIMESTAMP WITH TIME ZONE,
  calculation_data_points INTEGER, -- How many activities used for estimation
  threshold_confidence NUMERIC, -- 0.0-1.0 confidence score
  
  -- User preferences
  preferred_units VARCHAR(10) DEFAULT 'metric' CHECK (preferred_units IN ('metric', 'imperial')),
  training_philosophy VARCHAR(20) DEFAULT 'balanced' CHECK (training_philosophy IN ('volume', 'intensity', 'balanced', 'polarized')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_heart_rates CHECK (
    max_heart_rate IS NULL OR (max_heart_rate >= 120 AND max_heart_rate <= 220)
  ),
  CONSTRAINT valid_resting_hr CHECK (
    resting_heart_rate IS NULL OR (resting_heart_rate >= 30 AND resting_heart_rate <= 100)
  ),
  CONSTRAINT valid_ftp CHECK (
    functional_threshold_power IS NULL OR (functional_threshold_power >= 50 AND functional_threshold_power <= 600)
  )
);

-- Training preferences table for more detailed settings
CREATE TABLE IF NOT EXISTS user_training_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Training goals
  primary_goal VARCHAR(50) DEFAULT 'general_fitness' CHECK (primary_goal IN (
    'general_fitness', 'weight_loss', 'endurance_building', 'speed_improvement', 
    'race_preparation', 'strength_building', 'recovery', 'maintenance'
  )),
  goal_target_date DATE,
  goal_description TEXT,
  
  -- Weekly structure preferences
  preferred_training_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- Mon=1, Sun=7
  max_weekly_training_time INTEGER, -- minutes
  preferred_workout_duration INTEGER DEFAULT 60, -- minutes
  
  -- Intensity distribution preferences
  easy_percentage INTEGER DEFAULT 80, -- % of training in easy zones
  moderate_percentage INTEGER DEFAULT 15,
  hard_percentage INTEGER DEFAULT 5,
  
  -- Recovery preferences
  mandatory_rest_days INTEGER DEFAULT 1,
  recovery_priority VARCHAR(20) DEFAULT 'moderate' CHECK (recovery_priority IN ('low', 'moderate', 'high')),
  
  -- Notifications
  daily_training_reminders BOOLEAN DEFAULT false,
  weekly_progress_summary BOOLEAN DEFAULT true,
  goal_milestone_alerts BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training profile calculation history
CREATE TABLE IF NOT EXISTS threshold_calculation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activities_analyzed INTEGER,
  date_range_start DATE,
  date_range_end DATE,
  
  -- Calculated values
  estimated_max_hr INTEGER,
  estimated_resting_hr INTEGER,
  estimated_ftp INTEGER,
  estimated_lthr INTEGER,
  confidence_score NUMERIC,
  
  -- Calculation method metadata
  calculation_method VARCHAR(50),
  algorithm_version VARCHAR(20),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_training_profiles_user_id ON user_training_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_training_preferences_user_id ON user_training_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_threshold_history_user_id ON threshold_calculation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_threshold_history_date ON threshold_calculation_history(calculation_date);

-- RLS Policies for security
ALTER TABLE user_training_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE threshold_calculation_history ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own data
CREATE POLICY "Users can manage their own training profile" ON user_training_profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own training preferences" ON user_training_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their own calculation history" ON threshold_calculation_history
  FOR SELECT USING (user_id = auth.uid());

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for auto-updating timestamps
CREATE TRIGGER update_user_training_profiles_updated_at 
  BEFORE UPDATE ON user_training_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_training_preferences_updated_at 
  BEFORE UPDATE ON user_training_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 