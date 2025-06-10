-- Secure version of calculate_weekly_metrics function
-- This fixes the "Function Search Path Mutable" security issue
-- Run this in Supabase SQL Editor

-- First, drop the existing function
DROP FUNCTION IF EXISTS public.calculate_weekly_metrics(uuid, date);

-- Create the secure version with proper security settings
CREATE OR REPLACE FUNCTION public.calculate_weekly_metrics(
  p_user_id UUID,
  p_start_date DATE DEFAULT NULL
)
RETURNS TABLE (
  week_start_date DATE,
  total_distance NUMERIC,
  total_moving_time INTEGER,
  total_elevation_gain NUMERIC,
  activity_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with definer's privileges
SET search_path = public  -- Fix search path to prevent manipulation
AS $$
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
    COALESCE(SUM(a.moving_time), 0)::INTEGER as total_moving_time,
    COALESCE(SUM(a.total_elevation_gain), 0) as total_elevation_gain,
    COUNT(*)::INTEGER as activity_count
  FROM public.activities a  -- Explicitly reference public schema
  WHERE a.user_id = p_user_id
    AND a.start_date_local::date >= start_calc_date
  GROUP BY date_trunc('week', a.start_date_local::date)::date
  HAVING COUNT(*) > 0
  ORDER BY date_trunc('week', a.start_date_local::date)::date;

END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.calculate_weekly_metrics(UUID, DATE) TO authenticated;

-- Add function comment for documentation
COMMENT ON FUNCTION public.calculate_weekly_metrics(UUID, DATE) IS 
'Calculates weekly training metrics for a user. Secured with SECURITY DEFINER and fixed search_path.'; 