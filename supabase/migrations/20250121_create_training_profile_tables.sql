-- Migration: Create Training Profile Tables
-- Date: 2025-01-21
-- Purpose: Add missing tables for user training profiles and preferences

-- Create user_training_profiles table
CREATE TABLE IF NOT EXISTS user_training_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic athlete info
  age INTEGER,
  weight NUMERIC, -- kg
  height NUMERIC, -- cm
  sex TEXT CHECK (sex IN ('M', 'F')),
  experience_level TEXT DEFAULT 'intermediate' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'elite')),
  primary_sport TEXT DEFAULT 'running',
  
  -- Heart Rate Thresholds
  max_heart_rate INTEGER,
  resting_heart_rate INTEGER,
  lactate_threshold_hr INTEGER,
  aerobic_threshold_hr INTEGER,
  
  -- Power Thresholds
  functional_threshold_power INTEGER, -- FTP in watts
  critical_power INTEGER,
  
  -- Training Load Targets
  weekly_tss_target INTEGER DEFAULT 100,
  monthly_distance_target NUMERIC, -- km
  weekly_training_hours_target NUMERIC, -- hours
  
  -- Training Zones (JSONB)
  heart_rate_zones JSONB DEFAULT '{}',
  power_zones JSONB DEFAULT '{}',
  pace_zones JSONB DEFAULT '{}',
  
  -- Source tracking
  max_hr_source TEXT DEFAULT 'estimated' CHECK (max_hr_source IN ('estimated', 'field_test', 'lab_test', 'manual')),
  resting_hr_source TEXT DEFAULT 'estimated' CHECK (resting_hr_source IN ('estimated', 'measured', 'manual')),
  ftp_source TEXT DEFAULT 'estimated' CHECK (ftp_source IN ('estimated', 'field_test', 'lab_test', 'manual')),
  tss_target_source TEXT DEFAULT 'estimated' CHECK (tss_target_source IN ('estimated', 'calculated', 'manual')),
  
  -- Calculation metadata
  last_threshold_calculation TIMESTAMP WITH TIME ZONE,
  calculation_data_points INTEGER DEFAULT 0,
  threshold_confidence NUMERIC DEFAULT 0.5 CHECK (threshold_confidence >= 0 AND threshold_confidence <= 1),
  
  -- User preferences
  preferred_units TEXT DEFAULT 'metric' CHECK (preferred_units IN ('metric', 'imperial')),
  training_philosophy TEXT DEFAULT 'balanced' CHECK (training_philosophy IN ('conservative', 'balanced', 'aggressive')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- Create user_training_preferences table
CREATE TABLE IF NOT EXISTS user_training_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Training goals
  primary_goal TEXT DEFAULT 'general_fitness' CHECK (primary_goal IN ('general_fitness', 'weight_loss', 'endurance', 'speed', 'strength', 'recovery')),
  goal_target_date DATE,
  goal_description TEXT,
  
  -- Weekly structure
  preferred_training_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- 1-7, Mon=1
  max_weekly_training_time INTEGER, -- minutes
  preferred_workout_duration INTEGER DEFAULT 60, -- minutes
  
  -- Intensity distribution
  easy_percentage INTEGER DEFAULT 80 CHECK (easy_percentage >= 0 AND easy_percentage <= 100),
  moderate_percentage INTEGER DEFAULT 15 CHECK (moderate_percentage >= 0 AND moderate_percentage <= 100),
  hard_percentage INTEGER DEFAULT 5 CHECK (hard_percentage >= 0 AND hard_percentage <= 100),
  
  -- Recovery preferences
  mandatory_rest_days INTEGER DEFAULT 1 CHECK (mandatory_rest_days >= 0),
  recovery_priority TEXT DEFAULT 'moderate' CHECK (recovery_priority IN ('low', 'moderate', 'high')),
  
  -- Notifications
  daily_training_reminders BOOLEAN DEFAULT FALSE,
  weekly_progress_summary BOOLEAN DEFAULT TRUE,
  goal_milestone_alerts BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id),
  CHECK (easy_percentage + moderate_percentage + hard_percentage = 100)
);

-- Create threshold_calculation_history table
CREATE TABLE IF NOT EXISTS threshold_calculation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Calculation details
  calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculation_method TEXT NOT NULL CHECK (calculation_method IN ('field_test', 'lab_test', 'estimated', 'calculated', 'manual')),
  
  -- Threshold values
  max_heart_rate INTEGER,
  resting_heart_rate INTEGER,
  lactate_threshold_hr INTEGER,
  functional_threshold_power INTEGER,
  
  -- Calculation metadata
  data_points_used INTEGER DEFAULT 0,
  confidence_score NUMERIC DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  calculation_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_training_profiles_user_id ON user_training_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_training_preferences_user_id ON user_training_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_threshold_calculation_history_user_id ON threshold_calculation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_threshold_calculation_history_date ON threshold_calculation_history(calculation_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_training_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE threshold_calculation_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (using proper UUID comparison)
CREATE POLICY "Users can view own training profile" ON user_training_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training profile" ON user_training_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training profile" ON user_training_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training profile" ON user_training_profiles
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own training preferences" ON user_training_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training preferences" ON user_training_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training preferences" ON user_training_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training preferences" ON user_training_preferences
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own threshold history" ON threshold_calculation_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own threshold history" ON threshold_calculation_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own threshold history" ON threshold_calculation_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own threshold history" ON threshold_calculation_history
  FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE user_training_profiles IS 'User training profiles with thresholds and preferences';
COMMENT ON TABLE user_training_preferences IS 'User training preferences and goals';
COMMENT ON TABLE threshold_calculation_history IS 'History of threshold calculations for users';
