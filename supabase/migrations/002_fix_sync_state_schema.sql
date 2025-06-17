-- Fix sync_state table schema to match code expectations
-- Run this in Supabase SQL Editor

-- Add missing columns to sync_state table
ALTER TABLE public.sync_state 
ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sync_requests_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sync_date TEXT,
ADD COLUMN IF NOT EXISTS total_activities_synced INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error_message TEXT,
ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ;

-- Add missing column to activities table
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS has_power BOOLEAN DEFAULT false;

-- Update existing records to have default values
-- Note: Set default values for newly added columns only where they're NULL
UPDATE public.sync_state 
SET 
  sync_enabled = true,
  sync_requests_today = 0,
  last_sync_date = CASE 
    WHEN last_activity_sync IS NOT NULL 
    THEN to_char(last_activity_sync, 'Mon DD YYYY')
    ELSE to_char(NOW(), 'Mon DD YYYY')
  END,
  total_activities_synced = 0
WHERE sync_enabled IS NULL;

-- Update activities to set has_power based on existing data
UPDATE public.activities 
SET has_power = (average_watts IS NOT NULL AND average_watts > 0)
WHERE has_power IS NULL;

-- Create index for performance on new columns
CREATE INDEX IF NOT EXISTS idx_sync_state_sync_enabled ON public.sync_state(sync_enabled);
CREATE INDEX IF NOT EXISTS idx_sync_state_last_sync_date ON public.sync_state(last_sync_date);
CREATE INDEX IF NOT EXISTS idx_activities_has_power ON public.activities(has_power);

-- Add comment explaining the schema
COMMENT ON TABLE public.sync_state IS 'Tracks sync status and rate limiting for Strava data synchronization';
COMMENT ON COLUMN public.sync_state.sync_enabled IS 'Whether sync is enabled for this user';
COMMENT ON COLUMN public.sync_state.sync_requests_today IS 'Number of sync requests made today (max 5)';
COMMENT ON COLUMN public.sync_state.last_sync_date IS 'Date string of last sync for daily reset logic';
COMMENT ON COLUMN public.sync_state.total_activities_synced IS 'Total number of activities synced for this user';
COMMENT ON COLUMN public.sync_state.last_error_message IS 'Last sync error message if any';
COMMENT ON COLUMN public.sync_state.last_error_at IS 'Timestamp of last sync error';
COMMENT ON COLUMN public.activities.has_power IS 'Whether this activity has power meter data'; 