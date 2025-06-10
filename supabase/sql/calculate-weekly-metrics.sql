-- Function to calculate weekly training metrics
-- This function aggregates activities by week and calculates volume metrics

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
  DELETE FROM weekly_training_metrics 
  WHERE user_id = p_user_id 
    AND week_start_date >= start_calc_date;

  -- Calculate and insert new weekly metrics
  INSERT INTO weekly_training_metrics (
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
    wtm.week_start_date,
    wtm.total_distance,
    wtm.total_moving_time,
    wtm.total_elevation_gain,
    wtm.activity_count,
    wtm.run_distance,
    wtm.ride_distance,
    wtm.swim_distance
  FROM weekly_training_metrics wtm
  WHERE wtm.user_id = p_user_id
    AND wtm.week_start_date >= start_calc_date
  ORDER BY wtm.week_start_date;

END;
$$ LANGUAGE plpgsql; 