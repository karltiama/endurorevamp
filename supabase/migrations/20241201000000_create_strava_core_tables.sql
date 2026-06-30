-- Migration: Create Strava Core Tables (baseline)
-- Date: 2024-12-01 (intentionally ordered BEFORE the existing ALTER migrations
--   20250101_add_favorite_field.sql, 20250101_add_last_sync_new_activities.sql,
--   and 20250103_add_last_sync_at.sql so that a fresh project builds the base
--   tables first and those ALTERs can then add their columns cleanly).
--
-- Purpose: These three tables (strava_tokens, activities, sync_state) were
--   originally created directly in Supabase and never had a migration file, so a
--   fresh project could not be reproduced from migrations alone. This migration
--   closes that gap.
--
-- Safety: Fully idempotent. Uses CREATE TABLE/INDEX IF NOT EXISTS and
--   DROP POLICY IF EXISTS before CREATE POLICY, so it is a no-op against an
--   existing database (production/local) that already has these objects, and it
--   does NOT drop or alter any existing columns or data.
--
-- Note: Columns added by later migrations are intentionally omitted here:
--   - activities.is_favorite           (added by 20250101_add_favorite_field.sql)
--   - sync_state.last_sync_new_activities (added by 20250101_add_last_sync_new_activities.sql)
--   - strava_tokens.last_sync_at        (added by 20250103_add_last_sync_at.sql)

-- =============================================================================
-- strava_tokens: OAuth tokens + cached athlete summary (one row per user)
-- =============================================================================
CREATE TABLE IF NOT EXISTS strava_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT,
  expires_at TIMESTAMP WITH TIME ZONE, -- stored as ISO timestamp
  expires_in INTEGER,

  strava_athlete_id BIGINT,
  athlete_firstname TEXT,
  athlete_lastname TEXT,
  athlete_profile TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_strava_tokens_user_id ON strava_tokens(user_id);

ALTER TABLE strava_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own strava tokens" ON strava_tokens;
CREATE POLICY "Users can view own strava tokens" ON strava_tokens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own strava tokens" ON strava_tokens;
CREATE POLICY "Users can insert own strava tokens" ON strava_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own strava tokens" ON strava_tokens;
CREATE POLICY "Users can update own strava tokens" ON strava_tokens
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own strava tokens" ON strava_tokens;
CREATE POLICY "Users can delete own strava tokens" ON strava_tokens
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE strava_tokens IS 'Per-user Strava OAuth tokens and cached athlete summary';

-- =============================================================================
-- activities: synced Strava activities + app-computed training metrics
-- =============================================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strava_activity_id BIGINT NOT NULL,

  -- Core
  name TEXT,
  sport_type TEXT,
  activity_type TEXT,
  distance DOUBLE PRECISION DEFAULT 0,        -- meters
  moving_time INTEGER DEFAULT 0,              -- seconds
  elapsed_time INTEGER DEFAULT 0,             -- seconds
  total_elevation_gain DOUBLE PRECISION DEFAULT 0, -- meters
  start_date TIMESTAMP WITH TIME ZONE,
  start_date_local TIMESTAMP WITH TIME ZONE,
  timezone TEXT,

  -- Performance metrics
  average_speed DOUBLE PRECISION,            -- m/s
  max_speed DOUBLE PRECISION,                -- m/s
  has_heartrate BOOLEAN DEFAULT FALSE,
  average_heartrate INTEGER,
  max_heartrate INTEGER,
  average_watts INTEGER,
  max_watts INTEGER,
  weighted_average_watts INTEGER,
  average_cadence DOUBLE PRECISION,
  kilojoules INTEGER,
  calories INTEGER,

  -- Location (stored as text, e.g. "lat,lng")
  start_latlng TEXT,
  end_latlng TEXT,

  -- Characteristics
  trainer BOOLEAN DEFAULT FALSE,
  commute BOOLEAN DEFAULT FALSE,
  manual BOOLEAN DEFAULT FALSE,
  private BOOLEAN DEFAULT FALSE,
  device_name TEXT,
  device_watts BOOLEAN,
  gear_id TEXT,

  -- Social
  kudos_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  athlete_count INTEGER DEFAULT 0,
  photo_count INTEGER DEFAULT 0,
  achievement_count INTEGER DEFAULT 0,
  pr_count INTEGER DEFAULT 0,

  -- Free text (e.g. imported workout notes)
  description TEXT,

  -- Computed (by the app during sync)
  week_number INTEGER,
  month_number INTEGER,
  year_number INTEGER,
  day_of_week INTEGER,
  average_pace DOUBLE PRECISION,             -- seconds per km
  elevation_per_km DOUBLE PRECISION,
  efficiency_score DOUBLE PRECISION,

  -- Training metrics
  relative_effort INTEGER,
  perceived_exertion INTEGER,                -- user-entered RPE (1-10)
  training_load_score DOUBLE PRECISION,
  intensity_score DOUBLE PRECISION,
  recovery_time INTEGER,
  normalized_power INTEGER,
  training_stress_score INTEGER DEFAULT 0,

  -- Zone data
  power_zones JSONB,
  heart_rate_zones JSONB,
  pace_zones JSONB,

  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One row per Strava activity per user (matches sync upsert logic)
  UNIQUE(user_id, strava_activity_id)
);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_strava_activity_id ON activities(strava_activity_id);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activities" ON activities;
CREATE POLICY "Users can view own activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activities" ON activities;
CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own activities" ON activities;
CREATE POLICY "Users can update own activities" ON activities
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own activities" ON activities;
CREATE POLICY "Users can delete own activities" ON activities
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE activities IS 'Strava activities synced per user, plus app-computed training metrics';

-- =============================================================================
-- sync_state: per-user sync bookkeeping / rate-limit tracking (one row per user)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  last_activity_sync TIMESTAMP WITH TIME ZONE,
  last_activity_id BIGINT,
  last_sync_date DATE,
  last_profile_sync TIMESTAMP WITH TIME ZONE,

  sync_requests_today INTEGER DEFAULT 0,
  requests_used_today INTEGER DEFAULT 0,
  total_activities_synced INTEGER DEFAULT 0,
  activities_synced_count INTEGER DEFAULT 0,

  sync_enabled BOOLEAN DEFAULT TRUE,
  consecutive_errors INTEGER DEFAULT 0,
  last_error_message TEXT,
  last_error_at TIMESTAMP WITH TIME ZONE,
  last_sync_error JSONB,
  rate_limit_reset_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_state_user_id ON sync_state(user_id);

ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sync state" ON sync_state;
CREATE POLICY "Users can view own sync state" ON sync_state
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sync state" ON sync_state;
CREATE POLICY "Users can insert own sync state" ON sync_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sync state" ON sync_state;
CREATE POLICY "Users can update own sync state" ON sync_state
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sync state" ON sync_state;
CREATE POLICY "Users can delete own sync state" ON sync_state
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE sync_state IS 'Per-user Strava sync bookkeeping and rate-limit tracking';
