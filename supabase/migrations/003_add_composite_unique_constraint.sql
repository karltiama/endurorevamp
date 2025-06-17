-- Add composite unique constraint for activities
-- This ensures that the same Strava activity can't be duplicated for the same user
-- while allowing different users to have activities with the same Strava ID (in case of group activities)

-- First, remove the existing unique constraint on strava_activity_id alone
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_strava_activity_id_key;

-- Add the composite unique constraint
ALTER TABLE public.activities ADD CONSTRAINT activities_user_strava_unique 
    UNIQUE (user_id, strava_activity_id);

-- Update the index to match the new constraint
DROP INDEX IF EXISTS idx_activities_strava_id;
CREATE INDEX idx_activities_user_strava ON public.activities(user_id, strava_activity_id); 