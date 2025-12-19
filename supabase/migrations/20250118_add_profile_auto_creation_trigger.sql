-- Migration: Add Profile Auto-Creation Trigger
-- Date: 2025-01-18
-- Purpose: Automatically create user_training_profiles record when a new user signs up

-- Function to auto-create training profile
CREATE OR REPLACE FUNCTION create_user_training_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a training profile with sensible defaults
  INSERT INTO user_training_profiles (
    user_id,
    experience_level,
    primary_sport,
    weekly_tss_target,
    preferred_units,
    training_philosophy,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'intermediate',
    'running',
    400,
    'metric',
    'balanced',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_training_profile();

-- Comment for documentation
COMMENT ON FUNCTION create_user_training_profile() IS 'Automatically creates a user_training_profiles record when a new user signs up';
