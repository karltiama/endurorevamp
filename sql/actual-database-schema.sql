-- =====================================================
-- ACTUAL DATABASE SCHEMA REFERENCE
-- =====================================================
-- Generated: 2025-01-XX (Updated)
-- Source: Schema analysis from /api/debug/schema
-- 
-- This file documents the REAL structure of the database
-- as it exists in production, not what migrations suggest.
-- Use this as the definitive reference for all sync code.
-- =====================================================

-- =====================================================
-- ACTIVITIES TABLE - MAIN DATA TABLE
-- =====================================================
-- Records: 16 (as of analysis)
-- Purpose: Stores all Strava activity data with computed fields

CREATE TABLE activities (
  -- Primary identifiers
  id TEXT PRIMARY KEY,                    -- UUID format
  user_id TEXT NOT NULL,                  -- UUID format, references auth.users
  strava_activity_id INTEGER UNIQUE,     -- Strava's activity ID
  
  -- Basic activity info
  name TEXT,                              -- Activity name from Strava
  sport_type TEXT,                        -- "Run", "Ride", etc.
  
  -- Date/time fields
  start_date TEXT,                        -- ISO timestamp with timezone
  start_date_local TEXT,                  -- Local time version
  timezone TEXT,                          -- "(GMT-05:00) America/Detroit"
  created_at TEXT,                        -- Record creation timestamp
  updated_at TEXT,                        -- Record update timestamp
  
  -- Distance and time metrics
  distance NUMERIC,                       -- Meters (e.g., 2525.2)
  moving_time INTEGER,                    -- Seconds (e.g., 1133)
  elapsed_time INTEGER,                   -- Seconds (e.g., 1145)
  
  -- Elevation metrics
  total_elevation_gain NUMERIC,          -- Meters (e.g., 13.8)
  
  -- Speed metrics
  average_speed NUMERIC,                  -- m/s (e.g., 2.229)
  max_speed NUMERIC,                      -- m/s (e.g., 3.1)
  
  -- Heart rate metrics
  average_heartrate INTEGER,             -- BPM (e.g., 157)
  max_heartrate INTEGER,                 -- BPM (e.g., 168)
  has_heartrate BOOLEAN,                 -- true/false
  
  -- Power metrics
  average_watts INTEGER,                 -- Watts (e.g., 210)
  max_watts INTEGER,                     -- Watts (e.g., 376)
  weighted_average_watts INTEGER,        -- Watts (e.g., 206)
  kilojoules INTEGER,                    -- Energy (e.g., 238)
  has_power BOOLEAN,                     -- true/false
  
  -- Activity flags
  trainer BOOLEAN,                       -- Indoor trainer activity
  commute BOOLEAN,                       -- Marked as commute
  manual BOOLEAN,                        -- Manually entered
  
  -- Social metrics
  achievement_count INTEGER,             -- Strava achievements earned
  kudos_count INTEGER,                   -- Kudos received
  comment_count INTEGER,                 -- Comments received
  
  -- Additional data
  description TEXT,                      -- Activity description (Hevy workout data)
  
  -- COMPUTED FIELDS (calculated by our app)
  week_number INTEGER,                   -- Week of year (1-52)
  month_number INTEGER,                  -- Month (1-12)
  year_number INTEGER,                   -- Year (e.g., 2025)
  day_of_week INTEGER,                   -- Day (0-6, Sunday=0)
  average_pace NUMERIC,                  -- Seconds per km (e.g., 7.48)
  elevation_per_km NUMERIC,              -- Elevation gain per km (e.g., 5.46)
  efficiency_score NUMERIC,              -- Performance metric (e.g., 2.23)
  
  -- TRAINING METRICS (manually logged or calculated)
  relative_effort INTEGER,               -- Strava's relative effort score
  perceived_exertion INTEGER,            -- RPE 1-10 scale (manually logged)
  training_load_score DOUBLE PRECISION,  -- Calculated training load
  intensity_score DOUBLE PRECISION,      -- Workout intensity rating
  recovery_time INTEGER,                 -- Hours needed for recovery
  normalized_power DOUBLE PRECISION,     -- Power-based normalized score
  training_stress_score DOUBLE PRECISION, -- TSS (Training Stress Score)
  
  -- ZONE DATA (stored as JSON)
  power_zones JSONB,                     -- Power zone distribution
  heart_rate_zones JSONB,                -- Heart rate zone data
  pace_zones JSONB                       -- Pace zone information
);

-- Sample data from actual database:
-- {
--   "id": "0f2b5661-0328-4f20-8a39-8a90223eb614",
--   "user_id": "1d177286-1e2d-4652-b768-e0dd4c8614df",
--   "strava_activity_id": 14207166819,
--   "name": "Afternoon Run",
--   "sport_type": "Run",
--   "start_date": "2025-04-17T20:30:58+00:00",
--   "start_date_local": "2025-04-17T16:30:58+00:00",
--   "timezone": "(GMT-05:00) America/Detroit",
--   "distance": 2525.2,
--   "moving_time": 1133,
--   "elapsed_time": 1145,
--   "total_elevation_gain": 13.8,
--   "average_speed": 2.229,
--   "max_speed": 3.1,
--   "average_heartrate": 157,
--   "max_heartrate": 168,
--   "has_heartrate": true,
--   "average_watts": 210,
--   "max_watts": 376,
--   "weighted_average_watts": 206,
--   "kilojoules": 238,
--   "has_power": true,
--   "trainer": false,
--   "commute": false,
--   "manual": false,
--   "achievement_count": 0,
--   "kudos_count": 0,
--   "comment_count": 0,
--   "week_number": 16,
--   "month_number": 4,
--   "year_number": 2025,
--   "day_of_week": 4,
--   "average_pace": 7.48,
--   "elevation_per_km": 5.46,
--   "efficiency_score": 2.23,
--   "created_at": "2025-06-09T21:12:54.246297+00:00",
--   "updated_at": "2025-06-09T21:12:54.246297+00:00"
-- }

-- =====================================================
-- SYNC_STATE TABLE - SYNC TRACKING
-- =====================================================
-- Records: 1 (as of analysis)
-- Purpose: Track sync status and history per user

CREATE TABLE sync_state (
  -- Primary identifiers
  id TEXT PRIMARY KEY,                    -- UUID format
  user_id TEXT NOT NULL,                  -- UUID format, references auth.users
  
  -- Sync timestamps
  last_activity_sync TEXT,               -- Last successful activity sync
  last_full_sync TEXT,                   -- Last full sync completion (nullable)
  last_sync_date TEXT,                   -- Date of last sync attempt
  created_at TEXT,                       -- Record creation
  updated_at TEXT,                       -- Record update
  
  -- Activity date tracking
  earliest_activity_date TEXT,           -- Oldest activity date (nullable)
  latest_activity_date TEXT,             -- Newest activity date (nullable)
  
  -- Sync statistics
  total_activities_synced INTEGER,       -- Count of synced activities
  sync_requests_today INTEGER,           -- Daily sync request count
  consecutive_errors INTEGER,            -- Error tracking
  
  -- Sync state flags
  full_sync_completed BOOLEAN,           -- Has full sync been done
  sync_enabled BOOLEAN,                  -- Is sync enabled for user
  
  -- Error tracking
  last_error_message TEXT,               -- Last error (nullable)
  last_error_at TEXT                     -- When last error occurred (nullable)
);

-- =====================================================
-- STRAVA_TOKENS TABLE - OAUTH TOKENS
-- =====================================================
-- Records: 1 (as of analysis)
-- Purpose: Store Strava OAuth tokens and athlete info

CREATE TABLE strava_tokens (
  -- Primary identifiers
  id TEXT PRIMARY KEY,                    -- UUID format
  user_id TEXT NOT NULL,                  -- UUID format, references auth.users
  
  -- OAuth tokens
  access_token TEXT NOT NULL,             -- Current access token
  refresh_token TEXT NOT NULL,            -- Refresh token
  token_type TEXT,                        -- "Bearer"
  expires_at TEXT,                        -- Token expiration timestamp
  expires_in INTEGER,                     -- Seconds until expiration
  scope TEXT,                             -- OAuth scope (nullable)
  
  -- Strava athlete info
  strava_athlete_id INTEGER,              -- Strava's athlete ID
  athlete_firstname TEXT,                 -- Athlete first name
  athlete_lastname TEXT,                  -- Athlete last name
  athlete_profile TEXT,                   -- Profile image URL
  
  -- Timestamps
  created_at TEXT,                        -- Record creation
  updated_at TEXT                         -- Record update
);

-- =====================================================
-- TABLES WITH ACCESS ISSUES (exist but not accessible)
-- =====================================================

-- athlete_profiles - Error: "relation \"public.athlete_profiles\" does not exist"
-- Status: Table exists in count but not accessible for queries
-- Records: 0

-- goals - Error: "relation \"public.goals\" does not exist"  
-- Status: Table exists in count but not accessible for queries
-- Records: 0

-- users - Error: "relation \"public.users\" does not exist"
-- Status: Table exists in count but not accessible for queries (likely auth.users)
-- Records: 0

-- =====================================================
-- IMPORTANT NOTES FOR DEVELOPMENT
-- =====================================================

-- 1. FIELD MAPPING CORRECTIONS:
--    ❌ athlete_count - Does NOT exist in activities table
--    ❌ pr_count - Does NOT exist in activities table  
--    ❌ photo_count - Does NOT exist in activities table
--    ❌ elev_high - Does NOT exist in activities table
--    ❌ elev_low - Does NOT exist in activities table
--    ❌ private - Does NOT exist in activities table
--    ❌ flagged - Does NOT exist in activities table
--    ❌ gear_id - Does NOT exist in activities table
--    ❌ from_accepted_tag - Does NOT exist in activities table
--    ❌ average_cadence - Does NOT exist in activities table
--    ❌ device_watts - Does NOT exist in activities table
--    ❌ has_kudoed - Does NOT exist in activities table
--    ❌ suffer_score - Does NOT exist in activities table

-- 2. UUID REQUIREMENTS:
--    - user_id fields MUST be valid UUID format
--    - Cannot use strings like "test-user-123"

-- 3. UNIQUE CONSTRAINTS:
--    - activities.strava_activity_id has UNIQUE constraint
--    - Use for upsert: onConflict: 'strava_activity_id'

-- 4. COMPUTED FIELDS:
--    - week_number, month_number, year_number, day_of_week
--    - average_pace (seconds per km), elevation_per_km, efficiency_score
--    - These are calculated by our application, not from Strava API

-- 5. DATA TYPE NOTES:
--    - Timestamps are stored as TEXT in ISO format
--    - IDs are TEXT (UUID format)
--    - Distances in meters, times in seconds
--    - Speeds in m/s, power in watts, heart rate in BPM

-- =====================================================
-- SYNC CODE FIELD MAPPING REFERENCE
-- =====================================================

-- Use ONLY these fields when syncing from Strava API to database:
-- 
-- Database Field              | Strava API Field           | Processing
-- ---------------------------- | -------------------------- | --------------------
-- user_id                     | (provided by app)          | UUID from auth
-- strava_activity_id          | activity.id                | Direct mapping
-- name                        | activity.name              | Direct mapping
-- sport_type                  | activity.sport_type        | Direct mapping
-- start_date                  | activity.start_date        | Direct mapping
-- start_date_local            | activity.start_date_local  | Direct mapping
-- timezone                    | activity.timezone          | Direct mapping
-- distance                    | activity.distance          | safeNumber()
-- moving_time                 | activity.moving_time       | safeNumber()
-- elapsed_time                | activity.elapsed_time      | safeNumber()
-- total_elevation_gain        | activity.total_elevation_gain | safeNumber()
-- average_speed               | activity.average_speed     | safeNumber()
-- max_speed                   | activity.max_speed         | safeNumber()
-- average_heartrate           | activity.average_heartrate | safeNumber()
-- max_heartrate               | activity.max_heartrate     | safeNumber()
-- has_heartrate               | activity.has_heartrate     | Boolean()
-- average_watts               | activity.average_watts     | safeNumber()
-- max_watts                   | activity.max_watts         | safeNumber()
-- weighted_average_watts      | activity.weighted_average_watts | safeNumber()
-- kilojoules                  | activity.kilojoules        | safeNumber()
-- has_power                   | activity.device_watts      | Boolean()
-- trainer                     | activity.trainer           | Boolean()
-- commute                     | activity.commute           | Boolean()
-- manual                      | activity.manual            | Boolean()
-- achievement_count           | activity.achievement_count | safeNumber()
-- kudos_count                 | activity.kudos_count       | safeNumber()
-- comment_count               | activity.comment_count     | safeNumber()
-- week_number                 | (computed)                 | calculateWeekNumber()
-- month_number                | (computed)                 | startDate.getMonth() + 1
-- year_number                 | (computed)                 | startDate.getFullYear()
-- day_of_week                 | (computed)                 | startDate.getDay()
-- average_pace                | (computed)                 | moving_time / (distance/1000)
-- elevation_per_km            | (computed)                 | total_elevation_gain / (distance/1000)
-- efficiency_score            | (computed)                 | average_speed 