-- Add missing last_sync_new_activities column to sync_state table
-- This column tracks how many new activities were found in the last sync
-- Used for smart cooldown logic

ALTER TABLE sync_state 
ADD COLUMN last_sync_new_activities INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN sync_state.last_sync_new_activities IS 'Number of new activities found in the last sync, used for smart cooldown logic'; 