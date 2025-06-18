-- Fix the calculate_pace_from_speed function to return numeric seconds
-- instead of formatted string to prevent database type mismatch errors

-- First, drop the existing function with the wrong return type
DROP FUNCTION IF EXISTS calculate_pace_from_speed(NUMERIC);

-- Now create the function with the correct NUMERIC return type
CREATE FUNCTION calculate_pace_from_speed(p_speed_ms NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  pace_seconds_per_km NUMERIC;
BEGIN
  -- Handle zero or negative speed
  IF p_speed_ms IS NULL OR p_speed_ms <= 0 THEN
    RETURN NULL;  -- Return NULL instead of 'N/A' string
  END IF;
  
  -- Calculate pace in seconds per kilometer
  -- Speed is in m/s, so 1000m/s = 1km/s
  pace_seconds_per_km := 1000.0 / p_speed_ms;
  
  -- Return the numeric value (seconds per km) instead of formatted string
  RETURN ROUND(pace_seconds_per_km, 2);
END;
$$;

-- Optional: Create a separate function for formatted display if needed
CREATE OR REPLACE FUNCTION format_pace_from_seconds(p_seconds_per_km NUMERIC)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  minutes INTEGER;
  seconds INTEGER;
BEGIN
  -- Handle null input
  IF p_seconds_per_km IS NULL THEN
    RETURN 'N/A';
  END IF;
  
  -- Convert to minutes and seconds
  minutes := FLOOR(p_seconds_per_km / 60);
  seconds := ROUND(p_seconds_per_km % 60);
  
  -- Format as MM:SS /km
  RETURN LPAD(minutes::TEXT, 2, '0') || ':' || LPAD(seconds::TEXT, 2, '0') || ' /km';
END;
$$; 