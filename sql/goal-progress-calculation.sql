-- Calculates and updates progress for all active goals for a user
-- Updates user_goals.current_progress, is_completed, last_progress_update
-- Returns a summary of updated goals

CREATE OR REPLACE FUNCTION calculate_goal_progress(
  p_user_id UUID
) RETURNS TABLE(
  goal_id UUID,
  goal_type TEXT,
  target_value DECIMAL,
  current_progress DECIMAL,
  progress_percentage DECIMAL,
  is_completed BOOLEAN,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  goal_rec RECORD;
  progress_value DECIMAL := 0;
  pct DECIMAL := 0;
  completed BOOLEAN := false;
BEGIN
  FOR goal_rec IN
    SELECT ug.id, gt.name AS goal_type, ug.target_value
    FROM user_goals ug
    JOIN goal_types gt ON ug.goal_type_id = gt.id
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
    ELSIF goal_rec.goal_type = 'weekly_elevation' THEN
      SELECT COALESCE(SUM(total_elevation_gain),0) INTO progress_value
      FROM activities
      WHERE user_id = p_user_id
        AND sport_type = 'Run'
        AND start_date >= date_trunc('week', now())
        AND start_date < date_trunc('week', now()) + INTERVAL '1 week';
    ELSIF goal_rec.goal_type = 'monthly_elevation' THEN
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
$$ LANGUAGE plpgsql; 