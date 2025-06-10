-- Run this in Supabase SQL Editor to create the calculate_weekly_metrics function

CREATE OR REPLACE FUNCTION calculate_weekly_metrics(
  p_user_id UUID,
  p_start_date DATE DEFAULT NULL
)
RETURNS TABLE (
  week_start_date DATE,
  total_distance NUMERIC,
  total_moving_time INTEGER,
  total_elevation_gain NUMERIC,
  activity_count INTEGER,
  run_distance NUMERIC,
  ride_distance NUMERIC,
  swim_distance NUMERIC
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

  -- Delete existing weekly metrics for this user from the calculation period
  DELETE FROM weekly_metrics 
  WHERE user_id = p_user_id 
    AND week_start_date >= start_calc_date;

  -- Calculate and insert new weekly metrics
  INSERT INTO weekly_metrics (
    user_id,
    week_start_date,
    total_distance,
    total_moving_time,
    total_elevation_gain,
    activity_count,
    run_distance,
    ride_distance,
    swim_distance
  )
  SELECT 
    p_user_id,
    date_trunc('week', start_date_local::date)::date as week_start,
    COALESCE(SUM(distance), 0) as total_distance,
    COALESCE(SUM(moving_time), 0) as total_moving_time,
    COALESCE(SUM(total_elevation_gain), 0) as total_elevation_gain,
    COUNT(*) as activity_count,
    COALESCE(SUM(CASE WHEN sport_type ILIKE '%run%' THEN distance ELSE 0 END), 0) as run_distance,
    COALESCE(SUM(CASE WHEN sport_type ILIKE '%ride%' OR sport_type ILIKE '%bike%' THEN distance ELSE 0 END), 0) as ride_distance,
    COALESCE(SUM(CASE WHEN sport_type ILIKE '%swim%' THEN distance ELSE 0 END), 0) as swim_distance
  FROM activities 
  WHERE user_id = p_user_id
    AND start_date_local::date >= start_calc_date
  GROUP BY date_trunc('week', start_date_local::date)::date
  HAVING COUNT(*) > 0;

  -- Return the calculated metrics
  RETURN QUERY
  SELECT 
    wm.week_start_date,
    wm.total_distance,
    wm.total_moving_time,
    wm.total_elevation_gain,
    wm.activity_count,
    wm.run_distance,
    wm.ride_distance,
    wm.swim_distance
  FROM weekly_metrics wm
  WHERE wm.user_id = p_user_id
    AND wm.week_start_date >= start_calc_date
  ORDER BY wm.week_start_date;

END;
$$ LANGUAGE plpgsql; 