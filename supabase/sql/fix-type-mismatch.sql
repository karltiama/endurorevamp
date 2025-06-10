-- Fix for the type mismatch error in calculate_weekly_metrics
-- Run this in Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS calculate_weekly_metrics(uuid, date);

-- Create the corrected version with proper type casting
CREATE OR REPLACE FUNCTION calculate_weekly_metrics(
  p_user_id UUID,
  p_start_date DATE DEFAULT NULL
)
RETURNS TABLE (
  week_start_date DATE,
  total_distance NUMERIC,
  total_moving_time INTEGER,
  total_elevation_gain NUMERIC,
  activity_count INTEGER
) AS $$
DECLARE
  start_calc_date DATE;
BEGIN
  -- Set default start date if not provided (8 weeks ago)
  IF p_start_date IS NULL THEN
    start_calc_date := CURRENT_DATE - INTERVAL '8 weeks';
  ELSE
    start_calc_date := p_start_date;
  END IF;

  -- Simple aggregation from activities table with proper type casting
  RETURN QUERY
  SELECT 
    date_trunc('week', a.start_date_local::date)::date as week_start_date,
    COALESCE(SUM(a.distance), 0) as total_distance,
    COALESCE(SUM(a.moving_time), 0)::INTEGER as total_moving_time,  -- Cast to INTEGER
    COALESCE(SUM(a.total_elevation_gain), 0) as total_elevation_gain,
    COUNT(*)::INTEGER as activity_count
  FROM activities a
  WHERE a.user_id = p_user_id
    AND a.start_date_local::date >= start_calc_date
  GROUP BY date_trunc('week', a.start_date_local::date)::date
  HAVING COUNT(*) > 0
  ORDER BY date_trunc('week', a.start_date_local::date)::date;

END;
$$ LANGUAGE plpgsql; 