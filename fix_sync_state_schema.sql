-- Fix sync_state table schema mismatch
-- Add missing last_sync_error column that the sync code expects

ALTER TABLE sync_state 
ADD COLUMN last_sync_error JSONB;

-- Optional: Migrate existing error data to new format
UPDATE sync_state 
SET last_sync_error = jsonb_build_object(
  'error', last_error_message, 
  'timestamp', last_error_at
)
WHERE last_error_message IS NOT NULL;

-- Verify the fix
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sync_state' 
AND column_name IN ('last_sync_error', 'last_error_message', 'last_error_at')
ORDER BY column_name; 