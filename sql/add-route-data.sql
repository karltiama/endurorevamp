-- =====================================================
-- ADD ROUTE DATA TO ACTIVITIES TABLE
-- =====================================================
-- Migration to add Strava route data fields
-- Run this to add route support to existing activities table

-- Add route data fields to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS summary_polyline TEXT,
ADD COLUMN IF NOT EXISTS polyline TEXT,
ADD COLUMN IF NOT EXISTS start_latlng TEXT,
ADD COLUMN IF NOT EXISTS end_latlng TEXT,
ADD COLUMN IF NOT EXISTS map_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN activities.summary_polyline IS 'Strava encoded polyline for route summary';
COMMENT ON COLUMN activities.polyline IS 'Strava encoded polyline for detailed route';
COMMENT ON COLUMN activities.start_latlng IS 'Start coordinates as "lat,lng" string';
COMMENT ON COLUMN activities.end_latlng IS 'End coordinates as "lat,lng" string';
COMMENT ON COLUMN activities.map_id IS 'Strava map ID for the activity';

-- Create index for route data queries
CREATE INDEX IF NOT EXISTS idx_activities_route_data 
ON activities (user_id, start_latlng, end_latlng) 
WHERE start_latlng IS NOT NULL;

-- Update the schema documentation
-- These fields should be added to the main schema file after the existing fields 