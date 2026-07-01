

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."calculate_goal_progress"("p_user_id" "uuid") RETURNS TABLE("goal_id" "uuid", "goal_type" "text", "target_value" numeric, "current_progress" numeric, "progress_percentage" numeric, "is_completed" boolean, "last_updated" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  goal_rec RECORD;
  progress_value DECIMAL := 0;
  pct DECIMAL := 0;
  completed BOOLEAN := false;
BEGIN
  FOR goal_rec IN
    SELECT ug.id, gt.name AS goal_type, ug.target_value
    FROM user_goals ug
    JOIN goal_types gt ON ug.goal_type_id = gt.name
    WHERE ug.user_id = p_user_id AND ug.is_active = true
  LOOP
    -- Calculate progress based on goal type
    IF goal_rec.goal_type = 'weekly_distance' THEN
      SELECT COALESCE(SUM(distance)/1000,0) INTO progress_value
      FROM activities
      WHERE user_id = p_user_id
        AND sport_type = 'Run'
        AND start_date >= date_trunc('week', now())
        AND start_date < date_trunc('week', now()) + INTERVAL '1 week';
    ELSIF goal_rec.goal_type = 'monthly_distance' THEN
      SELECT COALESCE(SUM(distance)/1000,0) INTO progress_value
      FROM activities
      WHERE user_id = p_user_id
        AND sport_type = 'Run'
        AND start_date >= date_trunc('month', now())
        AND start_date < date_trunc('month', now()) + INTERVAL '1 month';
    ELSIF goal_rec.goal_type = 'long_run_distance' THEN
      SELECT COALESCE(MAX(distance)/1000,0) INTO progress_value
      FROM activities
      WHERE user_id = p_user_id
        AND sport_type = 'Run'
        AND start_date >= date_trunc('month', now())
        AND start_date < date_trunc('month', now()) + INTERVAL '1 month';
    ELSIF goal_rec.goal_type = 'weekly_run_frequency' THEN
      SELECT COUNT(*)::DECIMAL INTO progress_value
      FROM activities
      WHERE user_id = p_user_id
        AND sport_type = 'Run'
        AND start_date >= date_trunc('week', now())
        AND start_date < date_trunc('week', now()) + INTERVAL '1 week';
    ELSIF goal_rec.goal_type = 'monthly_run_frequency' THEN
      SELECT COUNT(*)::DECIMAL INTO progress_value
      FROM activities
      WHERE user_id = p_user_id
        AND sport_type = 'Run'
        AND start_date >= date_trunc('month', now())
        AND start_date < date_trunc('month', now()) + INTERVAL '1 month';
    ELSIF goal_rec.goal_type = 'weekly_time_target' THEN
      SELECT COALESCE(SUM(moving_time)/3600,0) INTO progress_value
      FROM activities
      WHERE user_id = p_user_id
        AND sport_type = 'Run'
        AND start_date >= date_trunc('week', now())
        AND start_date < date_trunc('week', now()) + INTERVAL '1 week';
    ELSIF goal_rec.goal_type = 'monthly_time_target' THEN
      SELECT COALESCE(SUM(moving_time)/3600,0) INTO progress_value
      FROM activities
      WHERE user_id = p_user_id
        AND sport_type = 'Run'
        AND start_date >= date_trunc('month', now())
        AND start_date < date_trunc('month', now()) + INTERVAL '1 month';
    ELSIF goal_rec.goal_type = 'weekly_elevation_gain' THEN
      SELECT COALESCE(SUM(total_elevation_gain),0) INTO progress_value
      FROM activities
      WHERE user_id = p_user_id
        AND sport_type = 'Run'
        AND start_date >= date_trunc('week', now())
        AND start_date < date_trunc('week', now()) + INTERVAL '1 week';
    ELSIF goal_rec.goal_type = 'monthly_elevation_gain' THEN
      SELECT COALESCE(SUM(total_elevation_gain),0) INTO progress_value
      FROM activities
      WHERE user_id = p_user_id
        AND sport_type = 'Run'
        AND start_date >= date_trunc('month', now())
        AND start_date < date_trunc('month', now()) + INTERVAL '1 month';
    ELSIF goal_rec.goal_type = 'target_pace_5k' THEN
      SELECT COALESCE(AVG(moving_time/NULLIF(distance,0)),0) INTO progress_value
      FROM activities
      WHERE user_id = p_user_id
        AND sport_type = 'Run'
        AND distance BETWEEN 4800 AND 5200
        AND start_date >= now() - INTERVAL '30 days'
        AND distance > 0 AND moving_time > 0;
    ELSIF goal_rec.goal_type = 'target_pace_10k' THEN
      SELECT COALESCE(AVG(moving_time/NULLIF(distance,0)),0) INTO progress_value
      FROM activities
      WHERE user_id = p_user_id
        AND sport_type = 'Run'
        AND distance BETWEEN 9500 AND 15000
        AND start_date >= now() - INTERVAL '30 days'
        AND distance > 0 AND moving_time > 0;
    ELSIF goal_rec.goal_type = 'general_pace_improvement' THEN
      SELECT COALESCE(AVG(moving_time/NULLIF(distance,0)),0) INTO progress_value
      FROM activities
      WHERE user_id = p_user_id
        AND sport_type = 'Run'
        AND start_date >= now() - INTERVAL '30 days'
        AND distance > 0 AND moving_time > 0;
    ELSE
      progress_value := 0;
    END IF;

    -- Calculate completion and percentage
    IF goal_rec.goal_type IN ('target_pace_5k', 'target_pace_10k', 'general_pace_improvement') THEN
      completed := (progress_value > 0 AND progress_value <= goal_rec.target_value);
      IF progress_value > 0 THEN
        pct := LEAST(100 * (goal_rec.target_value / progress_value), 100);
      ELSE
        pct := 0;
      END IF;
    ELSE
      completed := (progress_value >= goal_rec.target_value);
      IF goal_rec.target_value > 0 THEN
        pct := LEAST(100 * (progress_value / goal_rec.target_value), 100);
      ELSE
        pct := 0;
      END IF;
    END IF;

    -- Update user_goals
    UPDATE user_goals
    SET current_progress = progress_value,
        is_completed = completed,
        last_progress_update = now()
    WHERE id = goal_rec.id;

    -- Assign output variables and RETURN NEXT
    goal_id := goal_rec.id;
    goal_type := goal_rec.goal_type;
    target_value := goal_rec.target_value;
    current_progress := progress_value;
    progress_percentage := pct;
    is_completed := completed;
    last_updated := now();
    RETURN NEXT;
  END LOOP;
  RETURN;
END;
$$;


ALTER FUNCTION "public"."calculate_goal_progress"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_pace_from_speed"("p_speed_ms" numeric) RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  pace_seconds_per_km NUMERIC;
BEGIN
  -- Convert speed from m/s to seconds per km
  IF p_speed_ms IS NULL OR p_speed_ms = 0 THEN
    RETURN NULL;
  END IF;
  
  pace_seconds_per_km := 1000.0 / p_speed_ms;
  RETURN ROUND(pace_seconds_per_km, 2);
END;
$$;


ALTER FUNCTION "public"."calculate_pace_from_speed"("p_speed_ms" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_pace_from_speed"("p_speed_ms" numeric) IS 'Converts speed (m/s) to pace (seconds per km). Secured with SECURITY DEFINER and fixed search_path.';



CREATE OR REPLACE FUNCTION "public"."calculate_personalized_tss_target"("user_id" "uuid", "experience_level" "text" DEFAULT 'intermediate'::"text") RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    base_target INTEGER;
    experience_multiplier NUMERIC;
BEGIN
    -- Set base targets by experience level
    CASE experience_level
        WHEN 'beginner' THEN base_target := 50;
        WHEN 'intermediate' THEN base_target := 80;
        WHEN 'advanced' THEN base_target := 120;
        ELSE base_target := 80;
    END CASE;
    
    -- Apply experience multiplier
    CASE experience_level
        WHEN 'beginner' THEN experience_multiplier := 0.8;
        WHEN 'intermediate' THEN experience_multiplier := 1.0;
        WHEN 'advanced' THEN experience_multiplier := 1.3;
        ELSE experience_multiplier := 1.0;
    END CASE;
    
    RETURN ROUND(base_target * experience_multiplier);
END;
$$;


ALTER FUNCTION "public"."calculate_personalized_tss_target"("user_id" "uuid", "experience_level" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_personalized_tss_target"("exp_level" character varying, "philosophy" character varying) RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  base_tss INTEGER := 400;
  experience_multiplier NUMERIC := 1.0;
  philosophy_multiplier NUMERIC := 1.0;
BEGIN
  -- Experience level adjustments
  CASE exp_level
    WHEN 'beginner' THEN experience_multiplier := 0.7;  -- 280 TSS
    WHEN 'intermediate' THEN experience_multiplier := 1.0; -- 400 TSS  
    WHEN 'advanced' THEN experience_multiplier := 1.3;  -- 520 TSS
    WHEN 'elite' THEN experience_multiplier := 1.6;     -- 640 TSS
    ELSE experience_multiplier := 1.0;
  END CASE;
  
  -- Training philosophy adjustments
  CASE philosophy
    WHEN 'volume' THEN philosophy_multiplier := 1.2;     -- +20%
    WHEN 'intensity' THEN philosophy_multiplier := 0.9;  -- -10%
    WHEN 'polarized' THEN philosophy_multiplier := 1.1;  -- +10%
    ELSE philosophy_multiplier := 1.0; -- balanced
  END CASE;
  
  RETURN ROUND(base_tss * experience_multiplier * philosophy_multiplier);
END;
$$;


ALTER FUNCTION "public"."calculate_personalized_tss_target"("exp_level" character varying, "philosophy" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_weekly_metrics"("p_user_id" "uuid", "p_start_date" "date" DEFAULT NULL::"date") RETURNS TABLE("week_start_date" "date", "total_distance" numeric, "total_moving_time" integer, "total_elevation_gain" numeric, "activity_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."calculate_weekly_metrics"("p_user_id" "uuid", "p_start_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_weekly_metrics"("p_user_id" "uuid", "p_start_date" "date") IS 'Calculates weekly training metrics for a user. Secured with SECURITY DEFINER and fixed search_path.';



CREATE OR REPLACE FUNCTION "public"."create_user_training_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Create a training profile with sensible defaults
  INSERT INTO user_training_profiles (
    user_id,
    experience_level,
    primary_sport,
    weekly_tss_target,
    preferred_units,
    training_philosophy,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'intermediate',
    'running',
    400,
    'metric',
    'balanced',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_user_training_profile"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_user_training_profile"() IS 'Automatically creates a user_training_profiles record when a new user signs up';



CREATE OR REPLACE FUNCTION "public"."extract_time_components"("total_seconds" integer) RETURNS TABLE("hours" integer, "minutes" integer, "seconds" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (total_seconds / 3600)::INTEGER as hours,
    ((total_seconds % 3600) / 60)::INTEGER as minutes,
    (total_seconds % 60)::INTEGER as seconds;
END;
$$;


ALTER FUNCTION "public"."extract_time_components"("total_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_week_plan"("user_uuid" "uuid") RETURNS TABLE("plan_id" "uuid", "plan_name" character varying, "week_start" "date", "periodization_phase" character varying, "total_tss" integer, "total_distance" numeric, "total_time" integer, "day_of_week" integer, "workout_type" character varying, "sport" character varying, "duration" integer, "intensity" integer, "distance" numeric, "difficulty" character varying, "energy_cost" integer, "recovery_time" integer, "reasoning" "text", "goal_alignment" "text", "weather_consideration" "text", "instructions" "jsonb", "tips" "jsonb", "modifications" "jsonb", "alternatives" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wp.id as plan_id,
    wp.plan_name,
    wp.week_start,
    wp.periodization_phase,
    wp.total_tss,
    wp.total_distance,
    wp.total_time,
    wpw.day_of_week,
    wpw.workout_type,
    wpw.sport,
    wpw.duration,
    wpw.intensity,
    wpw.distance,
    wpw.difficulty,
    wpw.energy_cost,
    wpw.recovery_time,
    wpw.reasoning,
    wpw.goal_alignment,
    wpw.weather_consideration,
    wpw.instructions,
    wpw.tips,
    wpw.modifications,
    wpw.alternatives
  FROM workout_plans wp
  LEFT JOIN workout_plan_workouts wpw ON wp.id = wpw.plan_id
  WHERE wp.user_id = user_uuid 
    AND wp.is_active = true
    AND wp.week_start = DATE_TRUNC('week', CURRENT_DATE)::DATE
  ORDER BY wpw.day_of_week;
END;
$$;


ALTER FUNCTION "public"."get_current_week_plan"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_default_intensity_distribution"("exp_level" character varying) RETURNS TABLE("easy" integer, "moderate" integer, "hard" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  CASE exp_level
    WHEN 'beginner' THEN 
      RETURN QUERY SELECT 85, 12, 3; -- More conservative
    WHEN 'intermediate' THEN 
      RETURN QUERY SELECT 80, 15, 5; -- Standard 80/20 rule
    WHEN 'advanced' THEN 
      RETURN QUERY SELECT 75, 20, 5; -- More tempo work
    WHEN 'elite' THEN 
      RETURN QUERY SELECT 70, 25, 5; -- More structured intensity
    ELSE 
      RETURN QUERY SELECT 80, 15, 5; -- Default
  END CASE;
END;
$$;


ALTER FUNCTION "public"."get_default_intensity_distribution"("exp_level" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_default_training_zones"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Simple placeholder function for training zones initialization
  RAISE NOTICE 'Training zones initialized for user: %', p_user_id;
  RETURN;
END;
$$;


ALTER FUNCTION "public"."initialize_default_training_zones"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_workout_plan"("user_uuid" "uuid", "week_start_date" "date", "plan_data" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  new_plan_id UUID;
  workout_data JSONB;
  day_of_week INTEGER;
  total_time_value INTEGER;
BEGIN
  -- Debug: Log the incoming totalTime value
  RAISE NOTICE 'Incoming totalTime: %', plan_data->>'totalTime';
  
  -- Convert totalTime to integer with proper handling
  IF plan_data->>'totalTime' IS NULL THEN
    total_time_value := 0;
  ELSE
    -- Handle both string and numeric values, convert to integer
    total_time_value := ROUND((plan_data->>'totalTime')::DECIMAL, 0)::INTEGER;
  END IF;
  
  RAISE NOTICE 'Converted totalTime to integer: %', total_time_value;

  -- First, completely remove ALL existing plans for this user and week
  DELETE FROM workout_plans 
  WHERE user_id = user_uuid 
    AND week_start = week_start_date;

  -- Insert new plan (no conflict possible since we deleted everything)
  INSERT INTO workout_plans (
    user_id, 
    plan_name,
    week_start, 
    periodization_phase, 
    total_tss, 
    total_distance, 
    total_time,
    is_active
  ) VALUES (
    user_uuid,
    'Weekly Plan',
    week_start_date,
    COALESCE(NULLIF(plan_data->>'periodizationPhase', ''), 'base'),
    COALESCE((plan_data->>'totalTSS')::INTEGER, 0),
    COALESCE((plan_data->>'totalDistance')::DECIMAL(8,2), 0),
    total_time_value, -- Use the properly converted integer value
    true
  ) 
  RETURNING id INTO new_plan_id;

  -- Delete existing workouts for this plan (if any)
  DELETE FROM workout_plan_workouts WHERE plan_id = new_plan_id;
  
  -- Insert workouts
  FOR day_of_week IN 0..6 LOOP
    workout_data := plan_data->'workouts'->day_of_week::TEXT;
    
    IF workout_data IS NOT NULL AND workout_data != 'null' THEN
      INSERT INTO workout_plan_workouts (
        plan_id,
        day_of_week,
        workout_type,
        sport,
        duration,
        intensity,
        distance,
        difficulty,
        energy_cost,
        recovery_time,
        reasoning,
        goal_alignment,
        weather_consideration,
        instructions,
        tips,
        modifications,
        alternatives
      ) VALUES (
        new_plan_id,
        day_of_week,
        workout_data->>'type',
        workout_data->>'sport',
        (workout_data->>'duration')::INTEGER,
        (workout_data->>'intensity')::INTEGER,
        CASE 
          WHEN workout_data->>'distance' IS NOT NULL 
          THEN (workout_data->>'distance')::DECIMAL(8,2)
          ELSE NULL
        END,
        COALESCE(workout_data->>'difficulty', 'intermediate'),
        COALESCE((workout_data->>'energyCost')::INTEGER, 5),
        COALESCE((workout_data->>'recoveryTime')::INTEGER, 24),
        workout_data->>'reasoning',
        workout_data->>'goalAlignment',
        workout_data->>'weatherConsideration',
        workout_data->'instructions',
        workout_data->'tips',
        workout_data->'modifications',
        workout_data->'alternatives'
      );
    END IF;
  END LOOP;

  RETURN new_plan_id;
END;
$$;


ALTER FUNCTION "public"."save_workout_plan"("user_uuid" "uuid", "week_start_date" "date", "plan_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_default_intensity_distribution"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_exp_level VARCHAR(20);
  defaults RECORD;
BEGIN
  -- Get user's experience level
  SELECT experience_level INTO user_exp_level 
  FROM user_profiles 
  WHERE user_id = NEW.user_id;
  
  -- Get default distribution for their experience level
  SELECT * INTO defaults FROM get_default_intensity_distribution(COALESCE(user_exp_level, 'intermediate'));
  
  -- Set defaults if not already specified
  IF NEW.easy_percentage IS NULL THEN
    NEW.easy_percentage := defaults.easy;
  END IF;
  
  IF NEW.moderate_percentage IS NULL THEN
    NEW.moderate_percentage := defaults.moderate;
  END IF;
  
  IF NEW.hard_percentage IS NULL THEN
    NEW.hard_percentage := defaults.hard;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_default_intensity_distribution"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_all_goal_progress"("p_user_id" "uuid", "p_since_date" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("goals_updated" integer, "activities_processed" integer, "errors" "text"[])
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  activity_record RECORD;
  goal_record RECORD;
  progress_value DECIMAL;
  contribution DECIMAL;
  goals_updated_count INTEGER := 0;
  activities_processed_count INTEGER := 0;
  error_messages TEXT[] := ARRAY[]::TEXT[];
  last_progress_update_time TIMESTAMP WITH TIME ZONE; -- Renamed variable
BEGIN
  -- Get the last progress update time for this user
  SELECT MAX(last_progress_update) INTO last_progress_update_time
  FROM user_goals 
  WHERE user_id = p_user_id;
  
  -- If no since_date provided, use last progress update time
  IF p_since_date IS NULL THEN
    p_since_date := COALESCE(last_progress_update_time, '1970-01-01'::TIMESTAMP WITH TIME ZONE);
  END IF;
  
  -- Loop through all activities for this user since the given date
  FOR activity_record IN 
    SELECT 
      a.id as activity_id,
      a.strava_activity_id,
      a.name,
      a.sport_type,
      a.distance,
      a.moving_time,
      a.elapsed_time,
      a.total_elevation_gain,
      a.average_pace,
      a.average_heartrate,
      a.start_date,
      a.start_date_local,
      a.timezone
    FROM activities a
    WHERE a.user_id = p_user_id
      AND a.start_date >= p_since_date
    ORDER BY a.start_date
  LOOP
    activities_processed_count := activities_processed_count + 1;
    
    -- Loop through all active goals for this user
    FOR goal_record IN 
      SELECT 
        ug.id as goal_id,
        ug.target_value,
        ug.current_progress,
        ug.best_result,
        ug.time_period,
        gt.metric_type,
        gt.calculation_method,
        gt.unit
      FROM user_goals ug
      JOIN goal_types gt ON ug.goal_type_id = gt.id
      WHERE ug.user_id = p_user_id 
        AND ug.is_active = true 
        AND NOT ug.is_completed
    LOOP
      progress_value := 0;
      contribution := 0;
      
      -- Calculate progress based on metric type
      CASE goal_record.metric_type
        WHEN 'total_distance' THEN
          contribution := activity_record.distance / 1000.0; -- Convert to km
          
        WHEN 'max_distance' THEN
          IF activity_record.distance / 1000.0 > COALESCE(goal_record.best_result, 0) THEN
            progress_value := activity_record.distance / 1000.0;
            contribution := (activity_record.distance / 1000.0) - COALESCE(goal_record.best_result, 0);
          END IF;
          
        WHEN 'average_pace' THEN
          -- For pace goals, track the best (fastest) pace achieved
          IF activity_record.average_pace > 0 AND 
             (goal_record.best_result IS NULL OR activity_record.average_pace < goal_record.best_result) THEN
            progress_value := activity_record.average_pace;
            contribution := COALESCE(goal_record.best_result, 999) - activity_record.average_pace;
          END IF;
          
        WHEN 'run_count' THEN
          IF LOWER(activity_record.sport_type) = 'run' THEN
            contribution := 1; -- Each run counts as 1
          END IF;
          
        WHEN 'total_time' THEN
          contribution := activity_record.moving_time / 3600.0; -- Convert seconds to hours
          
        WHEN 'max_duration' THEN
          IF activity_record.moving_time / 60.0 > COALESCE(goal_record.best_result, 0) THEN
            progress_value := activity_record.moving_time / 60.0; -- Convert to minutes
            contribution := (activity_record.moving_time / 60.0) - COALESCE(goal_record.best_result, 0);
          END IF;
          
        WHEN 'total_elevation' THEN
          contribution := COALESCE(activity_record.total_elevation_gain, 0);
          
        WHEN 'elevation_per_km' THEN
          IF activity_record.distance > 0 THEN
            progress_value := COALESCE(activity_record.total_elevation_gain, 0) / (activity_record.distance / 1000.0);
          END IF;
          
        ELSE
          -- Skip unknown metric types
          CONTINUE;
      END CASE;
      
      -- Only proceed if there was a contribution or progress value
      IF contribution > 0 OR progress_value > 0 THEN
        -- Insert progress record (will fail if already exists due to unique constraint)
        BEGIN
          INSERT INTO goal_progress (
            user_goal_id, 
            activity_id, 
            activity_date, 
            value_achieved, 
            contribution_amount
          ) VALUES (
            goal_record.goal_id, 
            activity_record.strava_activity_id::TEXT, 
            activity_record.start_date::DATE, 
            COALESCE(progress_value, contribution), 
            contribution
          );
          
          -- Update the goal's current progress and best result
          IF goal_record.metric_type IN ('max_distance', 'max_duration', 'average_pace') THEN
            -- For max/best goals, update the best result
            UPDATE user_goals 
            SET 
              best_result = GREATEST(COALESCE(best_result, 0), progress_value),
              last_progress_update = now()
            WHERE id = goal_record.goal_id AND progress_value > 0;
          ELSE
            -- For cumulative goals, add to current progress
            UPDATE user_goals 
            SET 
              current_progress = current_progress + contribution,
              last_progress_update = now()
            WHERE id = goal_record.goal_id;
          END IF;
          
          goals_updated_count := goals_updated_count + 1;
          
        EXCEPTION 
          WHEN unique_violation THEN
            -- Activity already contributed to this goal, skip silently
            CONTINUE;
          WHEN OTHERS THEN
            -- Log the error but continue processing
            error_messages := array_append(error_messages, 
              format('Error updating goal %s for activity %s: %s', 
                     goal_record.goal_id, activity_record.strava_activity_id, SQLERRM));
        END;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Check for goal completions
  UPDATE user_goals 
  SET is_completed = true, completed_at = now()
  WHERE user_id = p_user_id 
    AND NOT is_completed
    AND target_value IS NOT NULL
    AND (
      (current_progress >= target_value) OR
      (best_result IS NOT NULL AND best_result >= target_value)
    );
  
  RETURN QUERY SELECT 
    goals_updated_count,
    activities_processed_count,
    error_messages;
END;
$$;


ALTER FUNCTION "public"."update_all_goal_progress"("p_user_id" "uuid", "p_since_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_analysis_parameters_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_analysis_parameters_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_goal_progress_from_activity"("p_user_id" "uuid", "p_activity_distance" numeric, "p_activity_date" "date", "p_activity_id" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  goal_record RECORD;
  progress_value NUMERIC;
  week_start DATE;
  month_start DATE;
BEGIN
  -- Calculate week and month boundaries
  week_start := date_trunc('week', p_activity_date)::DATE;
  month_start := date_trunc('month', p_activity_date)::DATE;
  
  -- Process all active goals for this user
  FOR goal_record IN 
    SELECT ug.*, gt.name as goal_type_name, gt.metric_type, gt.calculation_method
    FROM user_goals ug
    JOIN goal_types gt ON ug.goal_type_id = gt.id
    WHERE ug.user_id = p_user_id 
      AND ug.is_active = true
      AND ug.is_completed = false
  LOOP
    
    -- Calculate progress based on goal type
    CASE goal_record.goal_type_name
      WHEN 'total_distance' THEN
        progress_value := COALESCE(p_activity_distance / 1000.0, 0);
      WHEN 'run_count' THEN
        progress_value := 1;
      WHEN 'total_time' THEN
        progress_value := 0;
      ELSE
        progress_value := 0;
    END CASE;
    
    -- Only create progress entry if there's actual progress
    IF progress_value > 0 THEN
      -- Insert progress record
      INSERT INTO goal_progress (
        user_goal_id,
        activity_id,
        activity_date,
        value_achieved,
        contribution_amount,
        created_at
      ) VALUES (
        goal_record.id,
        p_activity_id,
        p_activity_date,
        progress_value,
        progress_value,
        NOW()
      );
      
      -- Update current progress based on time period
      IF goal_record.time_period = 'weekly' THEN
        UPDATE user_goals 
        SET 
          current_progress = (
            SELECT COALESCE(SUM(gp.value_achieved), 0)
            FROM goal_progress gp
            WHERE gp.user_goal_id = goal_record.id
              AND gp.activity_date >= week_start
              AND gp.activity_date < week_start + INTERVAL '7 days'
          ),
          last_progress_update = NOW()
        WHERE id = goal_record.id;
        
      ELSIF goal_record.time_period = 'monthly' THEN
        UPDATE user_goals 
        SET 
          current_progress = (
            SELECT COALESCE(SUM(gp.value_achieved), 0)
            FROM goal_progress gp
            WHERE gp.user_goal_id = goal_record.id
              AND gp.activity_date >= month_start
              AND gp.activity_date < month_start + INTERVAL '1 month'
          ),
          last_progress_update = NOW()
        WHERE id = goal_record.id;
      END IF;
      
      -- Check if goal is completed
      UPDATE user_goals 
      SET 
        is_completed = true,
        completed_at = NOW()
      WHERE id = goal_record.id
        AND target_value IS NOT NULL 
        AND current_progress >= target_value
        AND is_completed = false;
        
    END IF;
    
  END LOOP;
  
END;
$$;


ALTER FUNCTION "public"."update_goal_progress_from_activity"("p_user_id" "uuid", "p_activity_distance" numeric, "p_activity_date" "date", "p_activity_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_goal_progress_since_last_sync"("p_user_id" "uuid") RETURNS TABLE("goals_updated" integer, "activities_processed" integer, "errors" "text"[])
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  last_sync_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the last sync time for this user
  SELECT last_activity_sync INTO last_sync_time
  FROM sync_state 
  WHERE user_id = p_user_id;
  
  -- If no sync time found, use a default (e.g., 30 days ago)
  IF last_sync_time IS NULL THEN
    last_sync_time := now() - INTERVAL '30 days';
  END IF;
  
  RETURN QUERY SELECT * FROM update_all_goal_progress(p_user_id, last_sync_time);
END;
$$;


ALTER FUNCTION "public"."update_goal_progress_since_last_sync"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_intensity_on_experience_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  defaults RECORD;
BEGIN
  -- Only update if experience level actually changed
  IF OLD.experience_level IS DISTINCT FROM NEW.experience_level THEN
    -- Get new defaults for the updated experience level
    SELECT * INTO defaults FROM get_default_intensity_distribution(NEW.experience_level);
    
    -- Update the user's training preferences with new defaults
    -- (only if they haven't manually customized them)
    UPDATE training_preferences 
    SET 
      easy_percentage = CASE 
        WHEN easy_percentage = (SELECT easy FROM get_default_intensity_distribution(OLD.experience_level)) 
        THEN defaults.easy 
        ELSE easy_percentage 
      END,
      moderate_percentage = CASE 
        WHEN moderate_percentage = (SELECT moderate FROM get_default_intensity_distribution(OLD.experience_level)) 
        THEN defaults.moderate 
        ELSE moderate_percentage 
      END,
      hard_percentage = CASE 
        WHEN hard_percentage = (SELECT hard FROM get_default_intensity_distribution(OLD.experience_level)) 
        THEN defaults.hard 
        ELSE hard_percentage 
      END
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_intensity_on_experience_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_tss_target"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_philosophy VARCHAR(20);
BEGIN
  -- Get training philosophy from preferences
  SELECT training_philosophy INTO user_philosophy
  FROM training_preferences 
  WHERE user_id = NEW.user_id;
  
  -- Calculate new TSS target
  NEW.weekly_tss_target := calculate_personalized_tss_target(
    NEW.experience_level,
    COALESCE(user_philosophy, 'balanced')
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_tss_target"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_updated_at_column"() IS 'Trigger function to update updated_at timestamp. Secured with SECURITY DEFINER and fixed search_path.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "strava_activity_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "sport_type" "text" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "start_date_local" timestamp with time zone NOT NULL,
    "timezone" "text",
    "distance" numeric(10,2),
    "moving_time" integer,
    "elapsed_time" integer,
    "total_elevation_gain" numeric(8,2),
    "average_speed" numeric(8,4),
    "max_speed" numeric(8,4),
    "average_heartrate" integer,
    "max_heartrate" integer,
    "has_heartrate" boolean DEFAULT false,
    "average_watts" integer,
    "max_watts" integer,
    "weighted_average_watts" integer,
    "kilojoules" numeric(8,2),
    "has_power" boolean DEFAULT false,
    "trainer" boolean DEFAULT false,
    "commute" boolean DEFAULT false,
    "manual" boolean DEFAULT false,
    "achievement_count" integer DEFAULT 0,
    "kudos_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "week_number" integer,
    "month_number" integer,
    "year_number" integer,
    "day_of_week" integer,
    "average_pace" numeric(6,2),
    "elevation_per_km" numeric(6,2),
    "efficiency_score" numeric(6,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "relative_effort" integer,
    "perceived_exertion" integer,
    "training_load_score" double precision,
    "intensity_score" double precision,
    "recovery_time" integer,
    "normalized_power" double precision,
    "training_stress_score" double precision,
    "power_zones" "jsonb",
    "heart_rate_zones" "jsonb",
    "pace_zones" "jsonb",
    "description" "text",
    "summary_polyline" "text",
    "polyline" "text",
    "start_latlng" "text",
    "end_latlng" "text",
    "map_id" "text",
    "is_favorite" boolean DEFAULT false
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


COMMENT ON COLUMN "public"."activities"."summary_polyline" IS 'Strava encoded polyline for route summary';



COMMENT ON COLUMN "public"."activities"."polyline" IS 'Strava encoded polyline for detailed route';



COMMENT ON COLUMN "public"."activities"."start_latlng" IS 'Start coordinates as "lat,lng" string';



COMMENT ON COLUMN "public"."activities"."end_latlng" IS 'End coordinates as "lat,lng" string';



COMMENT ON COLUMN "public"."activities"."map_id" IS 'Strava map ID for the activity';



CREATE OR REPLACE VIEW "public"."activity_type_metrics" WITH ("security_barrier"='true', "security_invoker"='on') AS
 SELECT "activities"."user_id",
    "activities"."sport_type",
    "count"(*) AS "activity_count",
    "avg"("activities"."distance") AS "avg_distance",
    "avg"("activities"."moving_time") AS "avg_duration",
    "avg"("activities"."average_heartrate") AS "avg_hr",
    "avg"("activities"."training_load_score") AS "avg_load"
   FROM "public"."activities"
  GROUP BY "activities"."user_id", "activities"."sport_type";


ALTER TABLE "public"."activity_type_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "title" "text",
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "message" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "category" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "responded_at" timestamp without time zone,
    "admin_notes" "text",
    CONSTRAINT "form_submissions_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "form_submissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'responded'::"text", 'resolved'::"text", 'archived'::"text"]))),
    CONSTRAINT "form_submissions_type_check" CHECK (("type" = ANY (ARRAY['contact'::"text", 'suggestion'::"text", 'bug_report'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."form_submissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."form_submissions" IS 'Form submissions with RLS enabled. Users can submit, admins can manage all submissions.';



CREATE TABLE IF NOT EXISTS "public"."goal_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_goal_id" "uuid" NOT NULL,
    "activity_id" character varying(50),
    "activity_date" "date" NOT NULL,
    "value_achieved" numeric,
    "contribution_amount" numeric,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."goal_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_types" (
    "name" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text" NOT NULL,
    "category" character varying(30) NOT NULL,
    "metric_type" character varying(30) NOT NULL,
    "unit" character varying(20),
    "target_guidance" "text",
    "calculation_method" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."goal_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."strava_tokens" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text" NOT NULL,
    "token_type" character varying(50) DEFAULT 'Bearer'::character varying,
    "expires_at" timestamp with time zone NOT NULL,
    "expires_in" integer NOT NULL,
    "strava_athlete_id" bigint NOT NULL,
    "athlete_firstname" character varying(100),
    "athlete_lastname" character varying(100),
    "athlete_profile" "text",
    "scope" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_sync_at" timestamp with time zone
);


ALTER TABLE "public"."strava_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sync_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "last_activity_sync" timestamp with time zone,
    "last_full_sync" timestamp with time zone,
    "earliest_activity_date" "date",
    "latest_activity_date" "date",
    "total_activities_synced" integer DEFAULT 0,
    "full_sync_completed" boolean DEFAULT false,
    "sync_enabled" boolean DEFAULT true,
    "sync_requests_today" integer DEFAULT 0,
    "last_sync_date" "date" DEFAULT CURRENT_DATE,
    "consecutive_errors" integer DEFAULT 0,
    "last_error_message" "text",
    "last_error_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_sync_error" "jsonb",
    "last_sync_new_activities" integer DEFAULT 0
);


ALTER TABLE "public"."sync_state" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sync_state"."last_sync_new_activities" IS 'Number of new activities found in the last sync, used for smart cooldown logic';



CREATE TABLE IF NOT EXISTS "public"."threshold_calculation_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "calculation_date" timestamp with time zone DEFAULT "now"(),
    "activities_analyzed" integer,
    "date_range_start" "date",
    "date_range_end" "date",
    "estimated_max_hr" integer,
    "estimated_resting_hr" integer,
    "estimated_ftp" integer,
    "estimated_lthr" integer,
    "confidence_score" numeric,
    "calculation_method" character varying(50),
    "algorithm_version" character varying(20),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."threshold_calculation_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."threshold_calculation_history" IS 'History of threshold calculations for users';



CREATE TABLE IF NOT EXISTS "public"."training_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "primary_goal" character varying(50) DEFAULT 'general_fitness'::character varying,
    "goal_description" "text",
    "goal_target_date" "date",
    "preferred_training_days" integer[] DEFAULT ARRAY[1, 2, 3, 4, 5],
    "max_weekly_training_time" integer,
    "preferred_workout_duration" integer DEFAULT 60,
    "training_philosophy" character varying(20) DEFAULT 'balanced'::character varying,
    "easy_percentage" integer DEFAULT 80,
    "moderate_percentage" integer DEFAULT 15,
    "hard_percentage" integer DEFAULT 5,
    "mandatory_rest_days" integer DEFAULT 1,
    "weekly_progress_emails" boolean DEFAULT true,
    "goal_milestone_alerts" boolean DEFAULT true,
    "training_reminders" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "training_preferences_primary_goal_check" CHECK ((("primary_goal")::"text" = ANY ((ARRAY['general_fitness'::character varying, 'weight_loss'::character varying, 'endurance_building'::character varying, 'speed_improvement'::character varying, 'race_preparation'::character varying])::"text"[]))),
    CONSTRAINT "training_preferences_training_philosophy_check" CHECK ((("training_philosophy")::"text" = ANY ((ARRAY['volume'::character varying, 'intensity'::character varying, 'balanced'::character varying, 'polarized'::character varying])::"text"[]))),
    CONSTRAINT "valid_intensity_distribution" CHECK (((("easy_percentage" + "moderate_percentage") + "hard_percentage") = 100)),
    CONSTRAINT "valid_training_days" CHECK ((("array_length"("preferred_training_days", 1) >= 1) AND ("array_length"("preferred_training_days", 1) <= 7)))
);


ALTER TABLE "public"."training_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "target_value" numeric,
    "target_unit" character varying(20),
    "target_date" "date",
    "time_period" character varying(20) DEFAULT 'weekly'::character varying,
    "current_progress" numeric DEFAULT 0,
    "best_result" numeric,
    "streak_count" integer DEFAULT 0,
    "goal_data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "is_completed" boolean DEFAULT false,
    "priority" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "last_progress_update" timestamp with time zone,
    "goal_type_id" character varying(50)
);


ALTER TABLE "public"."user_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_onboarding" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "goals_completed" boolean DEFAULT false,
    "strava_connected" boolean DEFAULT false,
    "current_step" character varying(20) DEFAULT 'goals'::character varying,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_onboarding" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "age" integer,
    "weight" numeric,
    "sex" character varying(1),
    "experience_level" character varying(20) DEFAULT 'intermediate'::character varying,
    "weekly_tss_target" integer DEFAULT 400,
    "preferred_units" character varying(10) DEFAULT 'metric'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_profiles_experience_level_check" CHECK ((("experience_level")::"text" = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'elite'::character varying])::"text"[]))),
    CONSTRAINT "user_profiles_preferred_units_check" CHECK ((("preferred_units")::"text" = ANY ((ARRAY['metric'::character varying, 'imperial'::character varying])::"text"[]))),
    CONSTRAINT "user_profiles_sex_check" CHECK ((("sex")::"text" = ANY ((ARRAY['M'::character varying, 'F'::character varying])::"text"[]))),
    CONSTRAINT "valid_age" CHECK ((("age" IS NULL) OR (("age" >= 13) AND ("age" <= 100)))),
    CONSTRAINT "valid_weight" CHECK ((("weight" IS NULL) OR (("weight" >= (30)::numeric) AND ("weight" <= (200)::numeric))))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_training_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "primary_goal" character varying(50) DEFAULT 'general_fitness'::character varying,
    "goal_target_date" "date",
    "goal_description" "text",
    "preferred_training_days" integer[] DEFAULT ARRAY[1, 2, 3, 4, 5],
    "max_weekly_training_time" integer,
    "preferred_workout_duration" integer DEFAULT 60,
    "easy_percentage" integer DEFAULT 80,
    "moderate_percentage" integer DEFAULT 15,
    "hard_percentage" integer DEFAULT 5,
    "mandatory_rest_days" integer DEFAULT 1,
    "recovery_priority" character varying(20) DEFAULT 'moderate'::character varying,
    "daily_training_reminders" boolean DEFAULT false,
    "weekly_progress_summary" boolean DEFAULT true,
    "goal_milestone_alerts" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_training_preferences_primary_goal_check" CHECK ((("primary_goal")::"text" = ANY ((ARRAY['general_fitness'::character varying, 'weight_loss'::character varying, 'endurance_building'::character varying, 'speed_improvement'::character varying, 'race_preparation'::character varying, 'strength_building'::character varying, 'recovery'::character varying, 'maintenance'::character varying])::"text"[]))),
    CONSTRAINT "user_training_preferences_recovery_priority_check" CHECK ((("recovery_priority")::"text" = ANY ((ARRAY['low'::character varying, 'moderate'::character varying, 'high'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_training_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_training_preferences" IS 'User training preferences and goals';



CREATE TABLE IF NOT EXISTS "public"."user_training_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "age" integer,
    "weight" numeric,
    "height" numeric,
    "sex" character varying(1),
    "experience_level" character varying(20) DEFAULT 'intermediate'::character varying,
    "primary_sport" character varying(50) DEFAULT 'Run'::character varying,
    "max_heart_rate" integer,
    "resting_heart_rate" integer,
    "lactate_threshold_hr" integer,
    "aerobic_threshold_hr" integer,
    "functional_threshold_power" integer,
    "critical_power" integer,
    "weekly_tss_target" integer DEFAULT 400,
    "monthly_distance_target" numeric,
    "weekly_training_hours_target" numeric,
    "heart_rate_zones" "jsonb" DEFAULT '{}'::"jsonb",
    "power_zones" "jsonb" DEFAULT '{}'::"jsonb",
    "pace_zones" "jsonb" DEFAULT '{}'::"jsonb",
    "max_hr_source" character varying(20) DEFAULT 'estimated'::character varying,
    "resting_hr_source" character varying(20) DEFAULT 'estimated'::character varying,
    "ftp_source" character varying(20) DEFAULT 'estimated'::character varying,
    "tss_target_source" character varying(20) DEFAULT 'estimated'::character varying,
    "last_threshold_calculation" timestamp with time zone,
    "calculation_data_points" integer,
    "threshold_confidence" numeric,
    "preferred_units" character varying(10) DEFAULT 'metric'::character varying,
    "training_philosophy" character varying(20) DEFAULT 'balanced'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_admin" boolean DEFAULT false,
    CONSTRAINT "user_training_profiles_experience_level_check" CHECK ((("experience_level")::"text" = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'elite'::character varying])::"text"[]))),
    CONSTRAINT "user_training_profiles_ftp_source_check" CHECK ((("ftp_source")::"text" = ANY ((ARRAY['estimated'::character varying, 'user_set'::character varying, 'lab_tested'::character varying, 'field_tested'::character varying])::"text"[]))),
    CONSTRAINT "user_training_profiles_max_hr_source_check" CHECK ((("max_hr_source")::"text" = ANY ((ARRAY['estimated'::character varying, 'user_set'::character varying, 'lab_tested'::character varying])::"text"[]))),
    CONSTRAINT "user_training_profiles_preferred_units_check" CHECK ((("preferred_units")::"text" = ANY ((ARRAY['metric'::character varying, 'imperial'::character varying])::"text"[]))),
    CONSTRAINT "user_training_profiles_resting_hr_source_check" CHECK ((("resting_hr_source")::"text" = ANY ((ARRAY['estimated'::character varying, 'user_set'::character varying, 'measured'::character varying])::"text"[]))),
    CONSTRAINT "user_training_profiles_sex_check" CHECK ((("sex")::"text" = ANY ((ARRAY['M'::character varying, 'F'::character varying])::"text"[]))),
    CONSTRAINT "user_training_profiles_training_philosophy_check" CHECK ((("training_philosophy")::"text" = ANY ((ARRAY['volume'::character varying, 'intensity'::character varying, 'balanced'::character varying, 'polarized'::character varying])::"text"[]))),
    CONSTRAINT "user_training_profiles_tss_target_source_check" CHECK ((("tss_target_source")::"text" = ANY ((ARRAY['estimated'::character varying, 'user_set'::character varying, 'coach_set'::character varying])::"text"[]))),
    CONSTRAINT "valid_ftp" CHECK ((("functional_threshold_power" IS NULL) OR (("functional_threshold_power" >= 50) AND ("functional_threshold_power" <= 600)))),
    CONSTRAINT "valid_heart_rates" CHECK ((("max_heart_rate" IS NULL) OR (("max_heart_rate" >= 120) AND ("max_heart_rate" <= 220)))),
    CONSTRAINT "valid_resting_hr" CHECK ((("resting_heart_rate" IS NULL) OR (("resting_heart_rate" >= 30) AND ("resting_heart_rate" <= 100))))
);


ALTER TABLE "public"."user_training_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_training_profiles" IS 'User training profiles with thresholds and preferences';



CREATE TABLE IF NOT EXISTS "public"."weekly_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "week_start_date" "date" NOT NULL,
    "year_number" integer NOT NULL,
    "week_number" integer NOT NULL,
    "total_distance" numeric(10,2) DEFAULT 0,
    "total_moving_time" integer DEFAULT 0,
    "total_elevation_gain" numeric(8,2) DEFAULT 0,
    "activity_count" integer DEFAULT 0,
    "run_distance" numeric(10,2) DEFAULT 0,
    "run_time" integer DEFAULT 0,
    "run_count" integer DEFAULT 0,
    "bike_distance" numeric(10,2) DEFAULT 0,
    "bike_time" integer DEFAULT 0,
    "bike_count" integer DEFAULT 0,
    "swim_distance" numeric(10,2) DEFAULT 0,
    "swim_time" integer DEFAULT 0,
    "swim_count" integer DEFAULT 0,
    "other_time" integer DEFAULT 0,
    "other_count" integer DEFAULT 0,
    "avg_heartrate" numeric(5,2),
    "avg_power" integer,
    "avg_pace" numeric(6,2),
    "longest_distance" numeric(10,2),
    "fastest_pace" numeric(6,2),
    "highest_power" integer,
    "activities_with_hr" integer DEFAULT 0,
    "activities_with_power" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."weekly_metrics" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."weekly_training_load" WITH ("security_barrier"='true', "security_invoker"='true') AS
 SELECT "activities"."user_id",
    "activities"."year_number",
    "activities"."week_number",
    "count"(*) AS "activity_count",
    "sum"("activities"."training_load_score") AS "total_load",
    "avg"("activities"."intensity_score") AS "avg_intensity",
    "sum"("activities"."moving_time") AS "total_time",
    "sum"("activities"."distance") AS "total_distance"
   FROM "public"."activities"
  GROUP BY "activities"."user_id", "activities"."year_number", "activities"."week_number";


ALTER TABLE "public"."weekly_training_load" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_plan_workouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "day_of_week" integer NOT NULL,
    "workout_type" character varying(50) NOT NULL,
    "sport" character varying(50) NOT NULL,
    "duration" integer NOT NULL,
    "intensity" integer NOT NULL,
    "distance" numeric(8,2),
    "difficulty" character varying(20) DEFAULT 'intermediate'::character varying NOT NULL,
    "energy_cost" integer DEFAULT 5 NOT NULL,
    "recovery_time" integer DEFAULT 24 NOT NULL,
    "reasoning" "text",
    "goal_alignment" "text",
    "weather_consideration" "text",
    "instructions" "jsonb",
    "tips" "jsonb",
    "modifications" "jsonb",
    "alternatives" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "workout_plan_workouts_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6))),
    CONSTRAINT "workout_plan_workouts_energy_cost_check" CHECK ((("energy_cost" >= 1) AND ("energy_cost" <= 10))),
    CONSTRAINT "workout_plan_workouts_intensity_check" CHECK ((("intensity" >= 1) AND ("intensity" <= 10)))
);


ALTER TABLE "public"."workout_plan_workouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_name" character varying(255) DEFAULT 'Weekly Plan'::character varying NOT NULL,
    "week_start" "date" NOT NULL,
    "periodization_phase" character varying(50) DEFAULT 'base'::character varying NOT NULL,
    "total_tss" integer DEFAULT 0 NOT NULL,
    "total_distance" numeric(8,2) DEFAULT 0 NOT NULL,
    "total_time" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workout_plans" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_user_strava_activity_unique" UNIQUE ("user_id", "strava_activity_id");



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_progress"
    ADD CONSTRAINT "goal_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_progress"
    ADD CONSTRAINT "goal_progress_unique_goal_activity" UNIQUE ("user_goal_id", "activity_id");



ALTER TABLE ONLY "public"."goal_types"
    ADD CONSTRAINT "goal_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."goal_types"
    ADD CONSTRAINT "goal_types_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."strava_tokens"
    ADD CONSTRAINT "strava_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."strava_tokens"
    ADD CONSTRAINT "strava_tokens_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."sync_state"
    ADD CONSTRAINT "sync_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sync_state"
    ADD CONSTRAINT "sync_state_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."threshold_calculation_history"
    ADD CONSTRAINT "threshold_calculation_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_preferences"
    ADD CONSTRAINT "training_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_preferences"
    ADD CONSTRAINT "training_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_goals"
    ADD CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_onboarding"
    ADD CONSTRAINT "user_onboarding_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_onboarding"
    ADD CONSTRAINT "user_onboarding_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_training_preferences"
    ADD CONSTRAINT "user_training_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_training_profiles"
    ADD CONSTRAINT "user_training_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_training_profiles"
    ADD CONSTRAINT "user_training_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."weekly_metrics"
    ADD CONSTRAINT "weekly_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_metrics"
    ADD CONSTRAINT "weekly_metrics_user_id_week_start_date_key" UNIQUE ("user_id", "week_start_date");



ALTER TABLE ONLY "public"."workout_plan_workouts"
    ADD CONSTRAINT "workout_plan_workouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_plan_workouts"
    ADD CONSTRAINT "workout_plan_workouts_plan_id_day_of_week_key" UNIQUE ("plan_id", "day_of_week");



ALTER TABLE ONLY "public"."workout_plans"
    ADD CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_plans"
    ADD CONSTRAINT "workout_plans_user_id_week_start_is_active_key" UNIQUE ("user_id", "week_start", "is_active");



CREATE INDEX "idx_activities_description" ON "public"."activities" USING "btree" ("description") WHERE ("description" IS NOT NULL);



CREATE INDEX "idx_activities_intensity" ON "public"."activities" USING "btree" ("user_id", "intensity_score");



CREATE INDEX "idx_activities_is_favorite" ON "public"."activities" USING "btree" ("user_id", "is_favorite");



CREATE INDEX "idx_activities_route_data" ON "public"."activities" USING "btree" ("user_id", "start_latlng", "end_latlng") WHERE ("start_latlng" IS NOT NULL);



CREATE INDEX "idx_activities_sport_type" ON "public"."activities" USING "btree" ("user_id", "sport_type", "start_date" DESC);



CREATE INDEX "idx_activities_sport_type_date" ON "public"."activities" USING "btree" ("sport_type", "start_date");



CREATE INDEX "idx_activities_training_load" ON "public"."activities" USING "btree" ("user_id", "training_load_score");



CREATE INDEX "idx_activities_user_date" ON "public"."activities" USING "btree" ("user_id", "start_date" DESC);



CREATE INDEX "idx_activities_user_strava" ON "public"."activities" USING "btree" ("user_id", "strava_activity_id");



CREATE INDEX "idx_activities_week" ON "public"."activities" USING "btree" ("user_id", "year_number", "week_number");



CREATE INDEX "idx_activities_year_month" ON "public"."activities" USING "btree" ("year_number", "month_number");



CREATE INDEX "idx_form_submissions_created_at" ON "public"."form_submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_form_submissions_status" ON "public"."form_submissions" USING "btree" ("status");



CREATE INDEX "idx_form_submissions_type" ON "public"."form_submissions" USING "btree" ("type");



CREATE INDEX "idx_goal_progress_date" ON "public"."goal_progress" USING "btree" ("activity_date");



CREATE INDEX "idx_goal_progress_goal_id" ON "public"."goal_progress" USING "btree" ("user_goal_id");



CREATE INDEX "idx_strava_tokens_expires_at" ON "public"."strava_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_strava_tokens_strava_athlete_id" ON "public"."strava_tokens" USING "btree" ("strava_athlete_id");



CREATE INDEX "idx_strava_tokens_user_id" ON "public"."strava_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_threshold_calculation_history_date" ON "public"."threshold_calculation_history" USING "btree" ("calculation_date" DESC);



CREATE INDEX "idx_threshold_calculation_history_user_id" ON "public"."threshold_calculation_history" USING "btree" ("user_id");



CREATE INDEX "idx_threshold_history_date" ON "public"."threshold_calculation_history" USING "btree" ("calculation_date");



CREATE INDEX "idx_threshold_history_user_id" ON "public"."threshold_calculation_history" USING "btree" ("user_id");



CREATE INDEX "idx_training_preferences_user_id" ON "public"."training_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_user_goals_active" ON "public"."user_goals" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_user_goals_user_id" ON "public"."user_goals" USING "btree" ("user_id");



CREATE INDEX "idx_user_onboarding_user_id" ON "public"."user_onboarding" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_user_id" ON "public"."user_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_user_training_preferences_user_id" ON "public"."user_training_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_user_training_profiles_user_id" ON "public"."user_training_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_weekly_metrics_user_date" ON "public"."weekly_metrics" USING "btree" ("user_id", "week_start_date" DESC);



CREATE INDEX "idx_workout_plan_workouts_day" ON "public"."workout_plan_workouts" USING "btree" ("day_of_week");



CREATE INDEX "idx_workout_plan_workouts_plan_id" ON "public"."workout_plan_workouts" USING "btree" ("plan_id");



CREATE INDEX "idx_workout_plans_active" ON "public"."workout_plans" USING "btree" ("is_active");



CREATE INDEX "idx_workout_plans_user_id" ON "public"."workout_plans" USING "btree" ("user_id");



CREATE INDEX "idx_workout_plans_week_start" ON "public"."workout_plans" USING "btree" ("week_start");



CREATE OR REPLACE TRIGGER "set_intensity_defaults_on_insert" BEFORE INSERT ON "public"."training_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."set_default_intensity_distribution"();



CREATE OR REPLACE TRIGGER "update_form_submissions_updated_at" BEFORE UPDATE ON "public"."form_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_intensity_on_experience_change" AFTER UPDATE OF "experience_level" ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_intensity_on_experience_change"();



CREATE OR REPLACE TRIGGER "update_training_preferences_updated_at" BEFORE UPDATE ON "public"."training_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tss_on_profile_change" BEFORE INSERT OR UPDATE OF "experience_level" ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_tss_target"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_training_preferences_updated_at" BEFORE UPDATE ON "public"."user_training_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_training_profiles_updated_at" BEFORE UPDATE ON "public"."user_training_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workout_plan_workouts_updated_at" BEFORE UPDATE ON "public"."workout_plan_workouts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workout_plans_updated_at" BEFORE UPDATE ON "public"."workout_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_progress"
    ADD CONSTRAINT "goal_progress_user_goal_id_fkey" FOREIGN KEY ("user_goal_id") REFERENCES "public"."user_goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."strava_tokens"
    ADD CONSTRAINT "strava_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sync_state"
    ADD CONSTRAINT "sync_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."threshold_calculation_history"
    ADD CONSTRAINT "threshold_calculation_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_preferences"
    ADD CONSTRAINT "training_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_goals"
    ADD CONSTRAINT "user_goals_goal_type_id_fkey" FOREIGN KEY ("goal_type_id") REFERENCES "public"."goal_types"("name") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_training_preferences"
    ADD CONSTRAINT "user_training_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_training_profiles"
    ADD CONSTRAINT "user_training_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_metrics"
    ADD CONSTRAINT "weekly_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_plan_workouts"
    ADD CONSTRAINT "workout_plan_workouts_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_plans"
    ADD CONSTRAINT "workout_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Goal types are viewable by everyone" ON "public"."goal_types" FOR SELECT USING (true);



CREATE POLICY "Only admins can delete submissions" ON "public"."form_submissions" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Only admins can update submissions" ON "public"."form_submissions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Users can delete own threshold history" ON "public"."threshold_calculation_history" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own training preferences" ON "public"."user_training_preferences" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own training profile" ON "public"."user_training_profiles" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own workout plans" ON "public"."workout_plans" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete workouts in their plans" ON "public"."workout_plan_workouts" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."workout_plans"
  WHERE (("workout_plans"."id" = "workout_plan_workouts"."plan_id") AND ("workout_plans"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own threshold history" ON "public"."threshold_calculation_history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own training preferences" ON "public"."user_training_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own training profile" ON "public"."user_training_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own workout plans" ON "public"."workout_plans" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert workouts in their plans" ON "public"."workout_plan_workouts" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workout_plans"
  WHERE (("workout_plans"."id" = "workout_plan_workouts"."plan_id") AND ("workout_plans"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own preferences" ON "public"."training_preferences" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own profile" ON "public"."user_profiles" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own training preferences" ON "public"."user_training_preferences" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own training profile" ON "public"."user_training_profiles" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can submit form submissions" ON "public"."form_submissions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can update own threshold history" ON "public"."threshold_calculation_history" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own training preferences" ON "public"."user_training_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own training profile" ON "public"."user_training_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own workout plans" ON "public"."workout_plans" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update workouts in their plans" ON "public"."workout_plan_workouts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."workout_plans"
  WHERE (("workout_plans"."id" = "workout_plan_workouts"."plan_id") AND ("workout_plans"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own threshold history" ON "public"."threshold_calculation_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own training preferences" ON "public"."user_training_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own training profile" ON "public"."user_training_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own calculation history" ON "public"."threshold_calculation_history" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own submissions" ON "public"."form_submissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view their own workout plans" ON "public"."workout_plans" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view workouts in their plans" ON "public"."workout_plan_workouts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workout_plans"
  WHERE (("workout_plans"."id" = "workout_plan_workouts"."plan_id") AND ("workout_plans"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activities_user_policy" ON "public"."activities" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



COMMENT ON POLICY "activities_user_policy" ON "public"."activities" IS 'Optimized RLS policy: Users can only access their own activities. Uses subquery for performance.';



ALTER TABLE "public"."form_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goal_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "goal_progress_user_policy" ON "public"."goal_progress" USING ((EXISTS ( SELECT 1
   FROM "public"."user_goals"
  WHERE (("user_goals"."id" = "goal_progress"."user_goal_id") AND ("user_goals"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_goals"
  WHERE (("user_goals"."id" = "goal_progress"."user_goal_id") AND ("user_goals"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



COMMENT ON POLICY "goal_progress_user_policy" ON "public"."goal_progress" IS 'Optimized RLS policy: Users can only access progress for their own goals. Uses JOIN for security.';



ALTER TABLE "public"."goal_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."strava_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "strava_tokens_user_policy" ON "public"."strava_tokens" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



COMMENT ON POLICY "strava_tokens_user_policy" ON "public"."strava_tokens" IS 'Optimized RLS policy: Users can only access their own Strava tokens. Uses subquery for performance.';



ALTER TABLE "public"."sync_state" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sync_state_user_policy" ON "public"."sync_state" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



COMMENT ON POLICY "sync_state_user_policy" ON "public"."sync_state" IS 'Optimized RLS policy: Users can only access their own sync state. Uses subquery for performance.';



ALTER TABLE "public"."threshold_calculation_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_goals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_goals_user_policy" ON "public"."user_goals" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



COMMENT ON POLICY "user_goals_user_policy" ON "public"."user_goals" IS 'Optimized RLS policy: Users can only access their own goals. Uses subquery for performance.';



ALTER TABLE "public"."user_onboarding" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_onboarding_user_policy" ON "public"."user_onboarding" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



COMMENT ON POLICY "user_onboarding_user_policy" ON "public"."user_onboarding" IS 'Optimized RLS policy: Users can only access their own onboarding data. Uses subquery for performance.';



ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_training_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_training_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weekly_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "weekly_metrics_user_policy" ON "public"."weekly_metrics" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



COMMENT ON POLICY "weekly_metrics_user_policy" ON "public"."weekly_metrics" IS 'Optimized RLS policy: Users can only access their own weekly metrics. Uses subquery for performance.';



ALTER TABLE "public"."workout_plan_workouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_plans" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_goal_progress"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_goal_progress"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_goal_progress"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_pace_from_speed"("p_speed_ms" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_pace_from_speed"("p_speed_ms" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_pace_from_speed"("p_speed_ms" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_personalized_tss_target"("user_id" "uuid", "experience_level" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_personalized_tss_target"("user_id" "uuid", "experience_level" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_personalized_tss_target"("user_id" "uuid", "experience_level" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_personalized_tss_target"("exp_level" character varying, "philosophy" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_personalized_tss_target"("exp_level" character varying, "philosophy" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_personalized_tss_target"("exp_level" character varying, "philosophy" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_weekly_metrics"("p_user_id" "uuid", "p_start_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_weekly_metrics"("p_user_id" "uuid", "p_start_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_weekly_metrics"("p_user_id" "uuid", "p_start_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_training_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_training_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_training_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."extract_time_components"("total_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."extract_time_components"("total_seconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."extract_time_components"("total_seconds" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_week_plan"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_week_plan"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_week_plan"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_default_intensity_distribution"("exp_level" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_default_intensity_distribution"("exp_level" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_default_intensity_distribution"("exp_level" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_default_training_zones"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_default_training_zones"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_default_training_zones"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_workout_plan"("user_uuid" "uuid", "week_start_date" "date", "plan_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."save_workout_plan"("user_uuid" "uuid", "week_start_date" "date", "plan_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_workout_plan"("user_uuid" "uuid", "week_start_date" "date", "plan_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_default_intensity_distribution"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_default_intensity_distribution"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_default_intensity_distribution"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_all_goal_progress"("p_user_id" "uuid", "p_since_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."update_all_goal_progress"("p_user_id" "uuid", "p_since_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_all_goal_progress"("p_user_id" "uuid", "p_since_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_analysis_parameters_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_analysis_parameters_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_analysis_parameters_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_goal_progress_from_activity"("p_user_id" "uuid", "p_activity_distance" numeric, "p_activity_date" "date", "p_activity_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_goal_progress_from_activity"("p_user_id" "uuid", "p_activity_distance" numeric, "p_activity_date" "date", "p_activity_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_goal_progress_from_activity"("p_user_id" "uuid", "p_activity_distance" numeric, "p_activity_date" "date", "p_activity_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_goal_progress_since_last_sync"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_goal_progress_since_last_sync"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_goal_progress_since_last_sync"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_intensity_on_experience_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_intensity_on_experience_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_intensity_on_experience_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_tss_target"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_tss_target"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_tss_target"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."activity_type_metrics" TO "anon";
GRANT ALL ON TABLE "public"."activity_type_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_type_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."form_submissions" TO "anon";
GRANT ALL ON TABLE "public"."form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."form_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."goal_progress" TO "anon";
GRANT ALL ON TABLE "public"."goal_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_progress" TO "service_role";



GRANT ALL ON TABLE "public"."goal_types" TO "anon";
GRANT ALL ON TABLE "public"."goal_types" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_types" TO "service_role";



GRANT ALL ON TABLE "public"."strava_tokens" TO "anon";
GRANT ALL ON TABLE "public"."strava_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."strava_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."sync_state" TO "anon";
GRANT ALL ON TABLE "public"."sync_state" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_state" TO "service_role";



GRANT ALL ON TABLE "public"."threshold_calculation_history" TO "anon";
GRANT ALL ON TABLE "public"."threshold_calculation_history" TO "authenticated";
GRANT ALL ON TABLE "public"."threshold_calculation_history" TO "service_role";



GRANT ALL ON TABLE "public"."training_preferences" TO "anon";
GRANT ALL ON TABLE "public"."training_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."training_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_goals" TO "anon";
GRANT ALL ON TABLE "public"."user_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."user_goals" TO "service_role";



GRANT ALL ON TABLE "public"."user_onboarding" TO "anon";
GRANT ALL ON TABLE "public"."user_onboarding" TO "authenticated";
GRANT ALL ON TABLE "public"."user_onboarding" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_training_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_training_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_training_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_training_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_training_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_training_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_metrics" TO "anon";
GRANT ALL ON TABLE "public"."weekly_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_training_load" TO "anon";
GRANT ALL ON TABLE "public"."weekly_training_load" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_training_load" TO "service_role";



GRANT ALL ON TABLE "public"."workout_plan_workouts" TO "anon";
GRANT ALL ON TABLE "public"."workout_plan_workouts" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_plan_workouts" TO "service_role";



GRANT ALL ON TABLE "public"."workout_plans" TO "anon";
GRANT ALL ON TABLE "public"."workout_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_plans" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






