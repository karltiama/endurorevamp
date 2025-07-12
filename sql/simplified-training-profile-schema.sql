-- Simplified Training Profile Schema
-- Focus on essential user data and preferences only

-- Core user profile - the essentials
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic athlete info
  age INTEGER,
  weight NUMERIC, -- kg
  sex VARCHAR(1) CHECK (sex IN ('M', 'F')),
  experience_level VARCHAR(20) DEFAULT 'intermediate' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'elite')),
  
  -- Calculated training targets
  weekly_tss_target INTEGER DEFAULT 400,
  
  -- User preferences
  preferred_units VARCHAR(10) DEFAULT 'metric' CHECK (preferred_units IN ('metric', 'imperial')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_age CHECK (age IS NULL OR (age >= 13 AND age <= 100)),
  CONSTRAINT valid_weight CHECK (weight IS NULL OR (weight >= 30 AND weight <= 200))
);

-- Training preferences - how they want to train
CREATE TABLE IF NOT EXISTS training_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Goals and motivation
  primary_goal VARCHAR(50) DEFAULT 'general_fitness' CHECK (primary_goal IN (
    'general_fitness', 'weight_loss', 'endurance_building', 'speed_improvement', 'race_preparation'
  )),
  goal_description TEXT,
  goal_target_date DATE,
  
  -- Weekly schedule
  preferred_training_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- Mon=1, Sun=7
  max_weekly_training_time INTEGER, -- minutes
  preferred_workout_duration INTEGER DEFAULT 60, -- minutes
  
  -- Training philosophy
  training_philosophy VARCHAR(20) DEFAULT 'balanced' CHECK (training_philosophy IN ('volume', 'intensity', 'balanced', 'polarized')),
  
  -- Intensity distribution preferences (varies by experience level)
  -- Defaults will be set by trigger based on experience level
  easy_percentage INTEGER DEFAULT 80,
  moderate_percentage INTEGER DEFAULT 15,
  hard_percentage INTEGER DEFAULT 5,
  
  -- Recovery
  mandatory_rest_days INTEGER DEFAULT 1,
  
  -- Notification preferences (features to be implemented later)
  weekly_progress_emails BOOLEAN DEFAULT true, -- Send weekly training summary emails
  goal_milestone_alerts BOOLEAN DEFAULT true,  -- Notify when approaching/achieving goals
  training_reminders BOOLEAN DEFAULT false,    -- Daily/weekly training reminders
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_intensity_distribution CHECK (
    easy_percentage + moderate_percentage + hard_percentage = 100
  ),
  CONSTRAINT valid_training_days CHECK (
    array_length(preferred_training_days, 1) BETWEEN 1 AND 7
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_training_preferences_user_id ON training_preferences(user_id);

-- RLS Policies for security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own data
CREATE POLICY "Users can manage their own profile" ON user_profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own preferences" ON training_preferences
  FOR ALL USING (user_id = auth.uid());

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for auto-updating timestamps
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_preferences_updated_at 
  BEFORE UPDATE ON training_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate personalized TSS target
CREATE OR REPLACE FUNCTION calculate_personalized_tss_target(
  exp_level VARCHAR(20),
  philosophy VARCHAR(20)
) RETURNS INTEGER AS $$
DECLARE
  base_tss INTEGER := 400;
  experience_multiplier NUMERIC := 1.0;
  philosophy_multiplier NUMERIC := 1.0;
BEGIN
  -- Experience level adjustments
  CASE exp_level
    WHEN 'beginner' THEN experience_multiplier := 0.7;  -- 280 TSS
    WHEN 'intermediate' THEN experience_multiplier := 1.0; -- 400 TSS  
    WHEN 'advanced' THEN experience_multiplier := 1.3;  -- 520 TSS
    WHEN 'elite' THEN experience_multiplier := 1.6;     -- 640 TSS
    ELSE experience_multiplier := 1.0;
  END CASE;
  
  -- Training philosophy adjustments
  CASE philosophy
    WHEN 'volume' THEN philosophy_multiplier := 1.2;     -- +20%
    WHEN 'intensity' THEN philosophy_multiplier := 0.9;  -- -10%
    WHEN 'polarized' THEN philosophy_multiplier := 1.1;  -- +10%
    ELSE philosophy_multiplier := 1.0; -- balanced
  END CASE;
  
  RETURN ROUND(base_tss * experience_multiplier * philosophy_multiplier);
END;
$$ LANGUAGE plpgsql;

-- Function to get default intensity distribution by experience level
CREATE OR REPLACE FUNCTION get_default_intensity_distribution(exp_level VARCHAR(20))
RETURNS TABLE(easy INTEGER, moderate INTEGER, hard INTEGER) AS $$
BEGIN
  CASE exp_level
    WHEN 'beginner' THEN 
      RETURN QUERY SELECT 85, 12, 3; -- More conservative
    WHEN 'intermediate' THEN 
      RETURN QUERY SELECT 80, 15, 5; -- Standard 80/20 rule
    WHEN 'advanced' THEN 
      RETURN QUERY SELECT 75, 20, 5; -- More tempo work
    WHEN 'elite' THEN 
      RETURN QUERY SELECT 70, 25, 5; -- More structured intensity
    ELSE 
      RETURN QUERY SELECT 80, 15, 5; -- Default
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to set default intensity distribution for new preferences
CREATE OR REPLACE FUNCTION set_default_intensity_distribution()
RETURNS TRIGGER AS $$
DECLARE
  user_exp_level VARCHAR(20);
  defaults RECORD;
BEGIN
  -- Get user's experience level
  SELECT experience_level INTO user_exp_level 
  FROM user_profiles 
  WHERE user_id = NEW.user_id;
  
  -- Get default distribution for their experience level
  SELECT * INTO defaults FROM get_default_intensity_distribution(COALESCE(user_exp_level, 'intermediate'));
  
  -- Set defaults if not already specified
  IF NEW.easy_percentage IS NULL THEN
    NEW.easy_percentage := defaults.easy;
  END IF;
  
  IF NEW.moderate_percentage IS NULL THEN
    NEW.moderate_percentage := defaults.moderate;
  END IF;
  
  IF NEW.hard_percentage IS NULL THEN
    NEW.hard_percentage := defaults.hard;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update TSS target when profile changes
CREATE OR REPLACE FUNCTION update_tss_target()
RETURNS TRIGGER AS $$
DECLARE
  user_philosophy VARCHAR(20);
BEGIN
  -- Get training philosophy from preferences
  SELECT training_philosophy INTO user_philosophy
  FROM training_preferences 
  WHERE user_id = NEW.user_id;
  
  -- Calculate new TSS target
  NEW.weekly_tss_target := calculate_personalized_tss_target(
    NEW.experience_level,
    COALESCE(user_philosophy, 'balanced')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tss_on_profile_change
  BEFORE INSERT OR UPDATE OF experience_level ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_tss_target();

-- Trigger to set default intensity distribution when preferences are created
CREATE TRIGGER set_intensity_defaults_on_insert
  BEFORE INSERT ON training_preferences
  FOR EACH ROW EXECUTE FUNCTION set_default_intensity_distribution();

-- Trigger to update intensity distribution when user's experience level changes
CREATE OR REPLACE FUNCTION update_intensity_on_experience_change()
RETURNS TRIGGER AS $$
DECLARE
  defaults RECORD;
BEGIN
  -- Only update if experience level actually changed
  IF OLD.experience_level IS DISTINCT FROM NEW.experience_level THEN
    -- Get new defaults for the updated experience level
    SELECT * INTO defaults FROM get_default_intensity_distribution(NEW.experience_level);
    
    -- Update the user's training preferences with new defaults
    -- (only if they haven't manually customized them)
    UPDATE training_preferences 
    SET 
      easy_percentage = CASE 
        WHEN easy_percentage = (SELECT easy FROM get_default_intensity_distribution(OLD.experience_level)) 
        THEN defaults.easy 
        ELSE easy_percentage 
      END,
      moderate_percentage = CASE 
        WHEN moderate_percentage = (SELECT moderate FROM get_default_intensity_distribution(OLD.experience_level)) 
        THEN defaults.moderate 
        ELSE moderate_percentage 
      END,
      hard_percentage = CASE 
        WHEN hard_percentage = (SELECT hard FROM get_default_intensity_distribution(OLD.experience_level)) 
        THEN defaults.hard 
        ELSE hard_percentage 
      END
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_intensity_on_experience_change
  AFTER UPDATE OF experience_level ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_intensity_on_experience_change(); 