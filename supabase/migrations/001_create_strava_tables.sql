-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Athlete profiles table (extends Supabase auth.users)
CREATE TABLE public.athlete_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strava_athlete_id BIGINT UNIQUE NOT NULL,
  
  -- Basic info
  firstname VARCHAR(100),
  lastname VARCHAR(100),
  username VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  sex CHAR(1),
  premium BOOLEAN DEFAULT false,
  
  -- Training data
  ftp INTEGER, -- Functional Threshold Power
  weight FLOAT, -- kg
  
  -- Profile images
  profile_medium TEXT,
  profile_large TEXT,
  
  -- Strava timestamps
  strava_created_at TIMESTAMPTZ,
  strava_updated_at TIMESTAMPTZ,
  
  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strava_activity_id BIGINT UNIQUE NOT NULL,
  
  -- Core activity data
  name VARCHAR(255),
  sport_type VARCHAR(50), -- Use sport_type over deprecated 'type'
  activity_type VARCHAR(50), -- Keep for backwards compatibility
  distance FLOAT, -- meters
  moving_time INTEGER, -- seconds
  elapsed_time INTEGER, -- seconds
  total_elevation_gain FLOAT, -- meters
  
  -- Time data
  start_date TIMESTAMPTZ,
  start_date_local TIMESTAMPTZ,
  timezone VARCHAR(100),
  
  -- Performance metrics
  average_speed FLOAT, -- m/s
  max_speed FLOAT, -- m/s
  average_heartrate INTEGER,
  max_heartrate INTEGER,
  average_watts FLOAT,
  weighted_average_watts FLOAT,
  max_watts FLOAT,
  average_cadence FLOAT,
  kilojoules FLOAT,
  
  -- Location data
  start_latlng POINT,
  end_latlng POINT,
  
  -- Activity characteristics
  trainer BOOLEAN DEFAULT false,
  commute BOOLEAN DEFAULT false,
  manual BOOLEAN DEFAULT false,
  private BOOLEAN DEFAULT false,
  device_name VARCHAR(100),
  device_watts BOOLEAN DEFAULT false,
  has_heartrate BOOLEAN DEFAULT false,
  
  -- Strava social metrics
  kudos_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  athlete_count INTEGER DEFAULT 0,
  photo_count INTEGER DEFAULT 0,
  achievement_count INTEGER DEFAULT 0,
  pr_count INTEGER DEFAULT 0,
  
  -- Additional metrics
  calories FLOAT,
  description TEXT,
  gear_id VARCHAR(50),
  
  -- Tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync state tracking table
CREATE TABLE public.sync_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Activity sync tracking
  last_activity_sync TIMESTAMPTZ,
  last_activity_id BIGINT, -- Last processed activity ID for pagination
  activities_synced_count INTEGER DEFAULT 0,
  
  -- Profile sync tracking
  last_profile_sync TIMESTAMPTZ,
  
  -- Error tracking
  last_sync_error JSONB,
  consecutive_errors INTEGER DEFAULT 0,
  
  -- Rate limiting
  requests_used_today INTEGER DEFAULT 0,
  rate_limit_reset_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_athlete_profiles_user_id ON public.athlete_profiles(user_id);
CREATE INDEX idx_athlete_profiles_strava_id ON public.athlete_profiles(strava_athlete_id);

CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_strava_id ON public.activities(strava_activity_id);
CREATE INDEX idx_activities_start_date ON public.activities(start_date DESC);
CREATE INDEX idx_activities_sport_type ON public.activities(sport_type);
CREATE INDEX idx_activities_user_date ON public.activities(user_id, start_date DESC);

-- Create update trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_athlete_profiles_updated_at 
    BEFORE UPDATE ON public.athlete_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at 
    BEFORE UPDATE ON public.activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_state_updated_at 
    BEFORE UPDATE ON public.sync_state 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own athlete profile" ON public.athlete_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own athlete profile" ON public.athlete_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own athlete profile" ON public.athlete_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activities" ON public.activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON public.activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sync state" ON public.sync_state
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sync state" ON public.sync_state
    FOR ALL USING (auth.uid() = user_id); 