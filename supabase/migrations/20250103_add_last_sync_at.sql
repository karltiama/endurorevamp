-- Add last_sync_at field to strava_tokens table for tracking background sync
-- This helps the background sync service know when each user was last synced

ALTER TABLE strava_tokens 
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;
