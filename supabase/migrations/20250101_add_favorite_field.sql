-- Add is_favorite field to activities table
ALTER TABLE activities ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;

-- Create index for better query performance on favorite filtering
CREATE INDEX idx_activities_is_favorite ON activities(user_id, is_favorite);

-- Add comment to document the field
COMMENT ON COLUMN activities.is_favorite IS 'User can mark activities as favorites for quick access'; 