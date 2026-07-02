-- Migration: Goal RPC functions (production-derived)
--
-- Source of truth: production function bodies (sql/prod/schema.sql), reproduced
-- verbatim EXCEPT for one confirmed broken reference (see "Deviations" below).
--
-- Functions (defined in dependency order):
--   1. calculate_goal_progress(p_user_id uuid)
--   2. update_all_goal_progress(p_user_id uuid, p_since_date timestamptz)
--   3. update_goal_progress_from_activity(p_user_id, p_activity_distance, p_activity_date, p_activity_id)
--   4. update_goal_progress_since_last_sync(p_user_id uuid)   -- calls #2
--
-- Idempotent via CREATE OR REPLACE FUNCTION.
--
-- Deviations from the production body (only confirmed nonexistent-column fixes):
--   - update_all_goal_progress and update_goal_progress_from_activity join
--     `goal_types gt ON ug.goal_type_id = gt.id`. Production `goal_types` has NO
--     `id` column (its PRIMARY KEY is `name`), so those functions currently error
--     at runtime. Corrected to `= gt.name` to match the real schema and the FK
--     `user_goals.goal_type_id -> goal_types(name)`.
--   Nothing else is changed. In particular, the CASE in
--   update_goal_progress_from_activity still switches on `gt.name` against
--   metric-type-like literals ('total_distance', 'run_count', 'total_time'); this
--   preserves production behavior and is out of scope for this step (name is a
--   valid column). Flagged separately as a follow-up.

-- =============================================================================
-- 1. calculate_goal_progress  (production body unchanged; already uses gt.name)
-- =============================================================================
CREATE OR REPLACE FUNCTION "public"."calculate_goal_progress"("p_user_id" "uuid")
RETURNS TABLE("goal_id" "uuid", "goal_type" "text", "target_value" numeric, "current_progress" numeric, "progress_percentage" numeric, "is_completed" boolean, "last_updated" timestamp with time zone)
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

-- =============================================================================
-- 2. update_all_goal_progress  (FIX: gt.id -> gt.name)
-- =============================================================================
CREATE OR REPLACE FUNCTION "public"."update_all_goal_progress"("p_user_id" "uuid", "p_since_date" timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS TABLE("goals_updated" integer, "activities_processed" integer, "errors" "text"[])
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
      JOIN goal_types gt ON ug.goal_type_id = gt.name
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

-- =============================================================================
-- 3. update_goal_progress_from_activity  (FIX: gt.id -> gt.name)
-- =============================================================================
CREATE OR REPLACE FUNCTION "public"."update_goal_progress_from_activity"("p_user_id" "uuid", "p_activity_distance" numeric, "p_activity_date" "date", "p_activity_id" "text" DEFAULT NULL::"text")
RETURNS "void"
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
    JOIN goal_types gt ON ug.goal_type_id = gt.name
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

-- =============================================================================
-- 4. update_goal_progress_since_last_sync  (production body unchanged)
-- =============================================================================
CREATE OR REPLACE FUNCTION "public"."update_goal_progress_since_last_sync"("p_user_id" "uuid")
RETURNS TABLE("goals_updated" integer, "activities_processed" integer, "errors" "text"[])
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
