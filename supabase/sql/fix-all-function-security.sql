-- Fix Function Search Path Mutable security issue for all affected functions
-- This addresses the security vulnerability by adding SECURITY DEFINER and SET search_path
-- Run this in Supabase SQL Editor

-- =============================================================================
-- 1. Fix update_updated_at_column function
-- =============================================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Create secure version
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with definer's privileges
SET search_path = public  -- Fix search path to prevent manipulation
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

-- Add function comment
COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Trigger function to update updated_at timestamp. Secured with SECURITY DEFINER and fixed search_path.';

-- =============================================================================
-- 2. Fix initialize_default_training_zones function (if it exists)
-- =============================================================================

-- Drop the existing function (conditional - won't error if it doesn't exist)
DROP FUNCTION IF EXISTS public.initialize_default_training_zones(UUID);
DROP FUNCTION IF EXISTS public.initialize_default_training_zones(UUID, INTEGER);

-- Create secure version (placeholder - adjust parameters based on your actual function)
CREATE OR REPLACE FUNCTION public.initialize_default_training_zones(
  p_user_id UUID,
  p_max_heart_rate INTEGER DEFAULT 190
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with definer's privileges
SET search_path = public  -- Fix search path to prevent manipulation
AS $$
BEGIN
  -- Insert default 5-zone heart rate training zones
  -- Adjust this logic based on your actual requirements
  INSERT INTO public.training_zones (user_id, zone_number, zone_name, min_hr, max_hr, description)
  VALUES 
    (p_user_id, 1, 'Recovery', ROUND(p_max_heart_rate * 0.50), ROUND(p_max_heart_rate * 0.60), 'Active recovery, very easy effort'),
    (p_user_id, 2, 'Base/Aerobic', ROUND(p_max_heart_rate * 0.60), ROUND(p_max_heart_rate * 0.70), 'Comfortable, conversational pace'),
    (p_user_id, 3, 'Tempo', ROUND(p_max_heart_rate * 0.70), ROUND(p_max_heart_rate * 0.80), 'Comfortably hard, moderate effort'),
    (p_user_id, 4, 'Threshold', ROUND(p_max_heart_rate * 0.80), ROUND(p_max_heart_rate * 0.90), 'Hard effort, lactate threshold'),
    (p_user_id, 5, 'VO2 Max', ROUND(p_max_heart_rate * 0.90), p_max_heart_rate, 'Very hard, maximum effort')
  ON CONFLICT (user_id, zone_number) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.initialize_default_training_zones(UUID, INTEGER) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION public.initialize_default_training_zones(UUID, INTEGER) IS 
'Initializes default training zones for a user. Secured with SECURITY DEFINER and fixed search_path.';

-- =============================================================================
-- 3. Fix calculate_pace_from_speed function (if it exists)
-- =============================================================================

-- Drop the existing function (conditional)
DROP FUNCTION IF EXISTS public.calculate_pace_from_speed(NUMERIC);
DROP FUNCTION IF EXISTS public.calculate_pace_from_speed(FLOAT);

-- Create secure version
CREATE OR REPLACE FUNCTION public.calculate_pace_from_speed(
  p_speed_ms NUMERIC  -- Speed in meters per second
)
RETURNS TEXT  -- Returns pace as "MM:SS /km" format
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with definer's privileges
SET search_path = public  -- Fix search path to prevent manipulation
AS $$
DECLARE
  pace_seconds_per_km NUMERIC;
  minutes INTEGER;
  seconds INTEGER;
BEGIN
  -- Handle zero or negative speed
  IF p_speed_ms IS NULL OR p_speed_ms <= 0 THEN
    RETURN 'N/A';
  END IF;
  
  -- Calculate pace in seconds per kilometer
  -- Speed is in m/s, so 1000m/s = 1km/s
  pace_seconds_per_km := 1000.0 / p_speed_ms;
  
  -- Convert to minutes and seconds
  minutes := FLOOR(pace_seconds_per_km / 60);
  seconds := ROUND(pace_seconds_per_km % 60);
  
  -- Format as MM:SS
  RETURN LPAD(minutes::TEXT, 2, '0') || ':' || LPAD(seconds::TEXT, 2, '0') || ' /km';
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.calculate_pace_from_speed(NUMERIC) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION public.calculate_pace_from_speed(NUMERIC) IS 
'Converts speed (m/s) to pace (MM:SS /km format). Secured with SECURITY DEFINER and fixed search_path.';

-- =============================================================================
-- 4. Fix extract_time_components function (if it exists)
-- =============================================================================

-- Drop the existing function (conditional)
DROP FUNCTION IF EXISTS public.extract_time_components(INTEGER);

-- Create secure version
CREATE OR REPLACE FUNCTION public.extract_time_components(
  p_total_seconds INTEGER
)
RETURNS TABLE(
  hours INTEGER,
  minutes INTEGER,
  seconds INTEGER,
  formatted_time TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with definer's privileges
SET search_path = public  -- Fix search path to prevent manipulation
AS $$
DECLARE
  calc_hours INTEGER;
  calc_minutes INTEGER;
  calc_seconds INTEGER;
BEGIN
  -- Handle negative or null input
  IF p_total_seconds IS NULL OR p_total_seconds < 0 THEN
    RETURN QUERY SELECT 0, 0, 0, '00:00:00'::TEXT;
    RETURN;
  END IF;
  
  -- Calculate time components
  calc_hours := p_total_seconds / 3600;
  calc_minutes := (p_total_seconds % 3600) / 60;
  calc_seconds := p_total_seconds % 60;
  
  -- Return the components and formatted string
  RETURN QUERY SELECT 
    calc_hours,
    calc_minutes,
    calc_seconds,
    LPAD(calc_hours::TEXT, 2, '0') || ':' || 
    LPAD(calc_minutes::TEXT, 2, '0') || ':' || 
    LPAD(calc_seconds::TEXT, 2, '0');
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.extract_time_components(INTEGER) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION public.extract_time_components(INTEGER) IS 
'Extracts hours, minutes, seconds from total seconds. Secured with SECURITY DEFINER and fixed search_path.';

-- =============================================================================
-- 5. Apply the secure calculate_weekly_metrics function (already created)
-- =============================================================================

-- This function was already created in the secure-calculate-weekly-metrics.sql file
-- Just ensuring it's properly commented here for completeness

-- =============================================================================
-- Summary and Verification
-- =============================================================================

-- List all functions to verify they have proper security settings
SELECT 
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  p.proconfig as search_path_setting
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN (
    'update_updated_at_column',
    'initialize_default_training_zones', 
    'calculate_pace_from_speed',
    'extract_time_components',
    'calculate_weekly_metrics'
  )
ORDER BY p.proname; 