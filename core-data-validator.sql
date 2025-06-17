-- =====================================================
-- PHASE 1 CORE DATA VALIDATION
-- =====================================================
-- Run this in Supabase SQL Editor to validate your core data

-- 1. CHECK BASIC DATA INTEGRITY
SELECT 
  'Data Overview' as check_type,
  COUNT(*) as total_activities,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT strava_activity_id) as unique_strava_ids,
  MIN(start_date) as earliest_activity,
  MAX(start_date) as latest_activity
FROM activities;

-- 2. CHECK REQUIRED CORE FIELDS (Should never be NULL)
SELECT 
  'Required Fields Check' as check_type,
  COUNT(*) as total_records,
  COUNT(user_id) as has_user_id,
  COUNT(strava_activity_id) as has_strava_id,
  COUNT(name) as has_name,
  COUNT(sport_type) as has_sport_type,
  COUNT(start_date) as has_start_date
FROM activities;

-- 3. CHECK ESSENTIAL METRICS (Should be valid numbers)
SELECT 
  'Essential Metrics Check' as check_type,
  COUNT(*) as total_records,
  COUNT(distance) as has_distance,
  COUNT(moving_time) as has_moving_time,
  COUNT(elapsed_time) as has_elapsed_time,
  AVG(distance) as avg_distance_meters,
  AVG(moving_time/60.0) as avg_moving_time_minutes
FROM activities
WHERE distance > 0 AND moving_time > 0;

-- 4. CHECK PERFORMANCE FIELDS (Can be NULL but should be valid when present)
SELECT 
  'Performance Fields Check' as check_type,
  COUNT(*) as total_records,
  COUNT(average_speed) as has_avg_speed,
  COUNT(average_heartrate) as has_avg_hr,
  COUNT(total_elevation_gain) as has_elevation,
  AVG(average_speed) as avg_speed_ms,
  AVG(average_heartrate) as avg_hr_bpm,
  AVG(total_elevation_gain) as avg_elevation_m
FROM activities;

-- 5. CHECK POWER DATA (Cycling activities should have this)
SELECT 
  'Power Data Check' as check_type,
  sport_type,
  COUNT(*) as activity_count,
  COUNT(average_watts) as has_avg_watts,
  COUNT(max_watts) as has_max_watts,
  AVG(average_watts) as avg_watts,
  AVG(max_watts) as avg_max_watts
FROM activities
GROUP BY sport_type
ORDER BY activity_count DESC;

-- 6. CHECK DATA TYPE CONSISTENCY
SELECT 
  'Data Type Issues' as check_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN distance < 0 THEN 1 END) as negative_distance,
  COUNT(CASE WHEN moving_time < 0 THEN 1 END) as negative_time,
  COUNT(CASE WHEN average_speed < 0 THEN 1 END) as negative_speed,
  COUNT(CASE WHEN average_heartrate > 220 OR average_heartrate < 30 THEN 1 END) as invalid_hr,
  COUNT(CASE WHEN total_elevation_gain < 0 THEN 1 END) as negative_elevation
FROM activities;

-- 7. CHECK COMPUTED FIELDS (Your app calculations)
SELECT 
  'Computed Fields Check' as check_type,
  COUNT(*) as total_records,
  COUNT(week_number) as has_week_number,
  COUNT(month_number) as has_month_number,
  COUNT(average_pace) as has_avg_pace,
  COUNT(elevation_per_km) as has_elevation_per_km,
  AVG(average_pace) as avg_pace_sec_per_km
FROM activities;

-- 8. SAMPLE CORE DATA (First 3 activities)
SELECT 
  'Sample Data' as check_type,
  name,
  sport_type,
  distance,
  moving_time,
  average_speed,
  total_elevation_gain,
  average_watts,
  start_date
FROM activities
ORDER BY start_date DESC
LIMIT 3; 