-- Step 1: Drop the existing function
DROP FUNCTION IF EXISTS calculate_pace_from_speed(NUMERIC);

-- Step 2: Create new function that returns numeric seconds
CREATE FUNCTION calculate_pace_from_speed(p_speed_ms NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  pace_seconds_per_km NUMERIC;
BEGIN
  IF p_speed_ms IS NULL OR p_speed_ms <= 0 THEN
    RETURN NULL;
  END IF;
  
  pace_seconds_per_km := 1000.0 / p_speed_ms;
  
  RETURN ROUND(pace_seconds_per_km, 2);
END;
$$; 