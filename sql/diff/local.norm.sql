CREATE SCHEMA IF NOT EXISTS "public";
COMMENT ON SCHEMA "public" IS 'standard public schema';
CREATE OR REPLACE FUNCTION "public"."create_user_training_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
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
COMMENT ON FUNCTION "public"."create_user_training_profile"() IS 'Automatically creates a user_training_profiles record when a new user signs up';
CREATE OR REPLACE FUNCTION "public"."get_current_week_plan"("user_uuid" "uuid") RETURNS TABLE("plan_id" "uuid", "plan_name" character varying, "week_start" "date", "periodization_phase" character varying, "total_tss" integer, "total_distance" numeric, "total_time" integer, "day_of_week" integer, "workout_type" character varying, "sport" character varying, "duration" integer, "intensity" integer, "distance" numeric, "difficulty" character varying, "energy_cost" integer, "recovery_time" integer, "reasoning" "text", "goal_alignment" "text", "weather_consideration" "text", "instructions" "jsonb", "tips" "jsonb", "modifications" "jsonb", "alternatives" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
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
CREATE OR REPLACE FUNCTION "public"."save_workout_plan"("user_uuid" "uuid", "week_start_date" "date", "plan_data" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  plan_id UUID;
  workout_data JSONB;
  day_of_week INTEGER;
BEGIN
  UPDATE workout_plans
  WHERE user_id = user_uuid
    AND week_start = week_start_date
    AND is_active = true;
  INSERT INTO workout_plans (
    user_id,
    week_start,
    periodization_phase,
    total_tss,
    total_distance,
    total_time
  ) VALUES (
    user_uuid,
    week_start_date,
    COALESCE(NULLIF(plan_data->>'periodizationPhase', ''), 'base'),
    COALESCE((plan_data->>'totalTSS')::INTEGER, 0),
    COALESCE((plan_data->>'totalDistance')::DECIMAL(8,2), 0),
    COALESCE((plan_data->>'totalTime')::INTEGER, 0)
  ) RETURNING id INTO plan_id;
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
        plan_id,
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
        workout_data->>'difficulty',
        (workout_data->>'energyCost')::INTEGER,
        (workout_data->>'recoveryTime')::INTEGER,
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
  RETURN plan_id;
END;
$$;
CREATE OR REPLACE FUNCTION "public"."set_user_id_on_form_submission"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
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
COMMENT ON COLUMN "public"."activities"."summary_polyline" IS 'Strava encoded polyline for route summary';
COMMENT ON COLUMN "public"."activities"."polyline" IS 'Strava encoded polyline for detailed route';
COMMENT ON COLUMN "public"."activities"."start_latlng" IS 'Start coordinates as "lat,lng" string';
COMMENT ON COLUMN "public"."activities"."end_latlng" IS 'End coordinates as "lat,lng" string';
COMMENT ON COLUMN "public"."activities"."map_id" IS 'Strava map ID for the activity';
COMMENT ON COLUMN "public"."activities"."is_favorite" IS 'User can mark activities as favorites for quick access';
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
    "user_id" "uuid",
    CONSTRAINT "form_submissions_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "form_submissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'responded'::"text", 'resolved'::"text", 'archived'::"text"]))),
    CONSTRAINT "form_submissions_type_check" CHECK (("type" = ANY (ARRAY['contact'::"text", 'suggestion'::"text", 'bug_report'::"text", 'general'::"text"])))
);
COMMENT ON TABLE "public"."form_submissions" IS 'Form submissions with RLS enabled. Users can submit, admins can manage all submissions.';
COMMENT ON COLUMN "public"."form_submissions"."user_id" IS 'References the user who submitted this form. Automatically set on insert.';
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
COMMENT ON COLUMN "public"."sync_state"."last_sync_new_activities" IS 'Number of new activities found in the last sync, used for smart cooldown logic';
CREATE TABLE IF NOT EXISTS "public"."threshold_calculation_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "calculation_date" timestamp with time zone DEFAULT "now"(),
    "calculation_method" "text" NOT NULL,
    "max_heart_rate" integer,
    "resting_heart_rate" integer,
    "lactate_threshold_hr" integer,
    "functional_threshold_power" integer,
    "data_points_used" integer DEFAULT 0,
    "confidence_score" numeric DEFAULT 0.5,
    "calculation_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "threshold_calculation_history_calculation_method_check" CHECK (("calculation_method" = ANY (ARRAY['field_test'::"text", 'lab_test'::"text", 'estimated'::"text", 'calculated'::"text", 'manual'::"text"]))),
    CONSTRAINT "threshold_calculation_history_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (1)::numeric)))
);
COMMENT ON TABLE "public"."threshold_calculation_history" IS 'History of threshold calculations for users';
CREATE TABLE IF NOT EXISTS "public"."user_training_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "primary_goal" "text" DEFAULT 'general_fitness'::"text",
    "goal_target_date" "date",
    "goal_description" "text",
    "preferred_training_days" integer[] DEFAULT '{1,2,3,4,5}'::integer[],
    "max_weekly_training_time" integer,
    "preferred_workout_duration" integer DEFAULT 60,
    "easy_percentage" integer DEFAULT 80,
    "moderate_percentage" integer DEFAULT 15,
    "hard_percentage" integer DEFAULT 5,
    "mandatory_rest_days" integer DEFAULT 1,
    "recovery_priority" "text" DEFAULT 'moderate'::"text",
    "daily_training_reminders" boolean DEFAULT false,
    "weekly_progress_summary" boolean DEFAULT true,
    "goal_milestone_alerts" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_training_preferences_check" CHECK (((("easy_percentage" + "moderate_percentage") + "hard_percentage") = 100)),
    CONSTRAINT "user_training_preferences_easy_percentage_check" CHECK ((("easy_percentage" >= 0) AND ("easy_percentage" <= 100))),
    CONSTRAINT "user_training_preferences_hard_percentage_check" CHECK ((("hard_percentage" >= 0) AND ("hard_percentage" <= 100))),
    CONSTRAINT "user_training_preferences_mandatory_rest_days_check" CHECK (("mandatory_rest_days" >= 0)),
    CONSTRAINT "user_training_preferences_moderate_percentage_check" CHECK ((("moderate_percentage" >= 0) AND ("moderate_percentage" <= 100))),
    CONSTRAINT "user_training_preferences_primary_goal_check" CHECK (("primary_goal" = ANY (ARRAY['general_fitness'::"text", 'weight_loss'::"text", 'endurance'::"text", 'speed'::"text", 'strength'::"text", 'recovery'::"text"]))),
    CONSTRAINT "user_training_preferences_recovery_priority_check" CHECK (("recovery_priority" = ANY (ARRAY['low'::"text", 'moderate'::"text", 'high'::"text"])))
);
COMMENT ON TABLE "public"."user_training_preferences" IS 'User training preferences and goals';
CREATE TABLE IF NOT EXISTS "public"."user_training_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "age" integer,
    "weight" numeric,
    "height" numeric,
    "sex" "text",
    "experience_level" "text" DEFAULT 'intermediate'::"text",
    "primary_sport" "text" DEFAULT 'running'::"text",
    "max_heart_rate" integer,
    "resting_heart_rate" integer,
    "lactate_threshold_hr" integer,
    "aerobic_threshold_hr" integer,
    "functional_threshold_power" integer,
    "critical_power" integer,
    "weekly_tss_target" integer DEFAULT 100,
    "monthly_distance_target" numeric,
    "weekly_training_hours_target" numeric,
    "heart_rate_zones" "jsonb" DEFAULT '{}'::"jsonb",
    "power_zones" "jsonb" DEFAULT '{}'::"jsonb",
    "pace_zones" "jsonb" DEFAULT '{}'::"jsonb",
    "max_hr_source" "text" DEFAULT 'estimated'::"text",
    "resting_hr_source" "text" DEFAULT 'estimated'::"text",
    "ftp_source" "text" DEFAULT 'estimated'::"text",
    "tss_target_source" "text" DEFAULT 'estimated'::"text",
    "last_threshold_calculation" timestamp with time zone,
    "calculation_data_points" integer DEFAULT 0,
    "threshold_confidence" numeric DEFAULT 0.5,
    "preferred_units" "text" DEFAULT 'metric'::"text",
    "training_philosophy" "text" DEFAULT 'balanced'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_training_profiles_experience_level_check" CHECK (("experience_level" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text", 'elite'::"text"]))),
    CONSTRAINT "user_training_profiles_ftp_source_check" CHECK (("ftp_source" = ANY (ARRAY['estimated'::"text", 'field_test'::"text", 'lab_test'::"text", 'manual'::"text"]))),
    CONSTRAINT "user_training_profiles_max_hr_source_check" CHECK (("max_hr_source" = ANY (ARRAY['estimated'::"text", 'field_test'::"text", 'lab_test'::"text", 'manual'::"text"]))),
    CONSTRAINT "user_training_profiles_preferred_units_check" CHECK (("preferred_units" = ANY (ARRAY['metric'::"text", 'imperial'::"text"]))),
    CONSTRAINT "user_training_profiles_resting_hr_source_check" CHECK (("resting_hr_source" = ANY (ARRAY['estimated'::"text", 'measured'::"text", 'manual'::"text"]))),
    CONSTRAINT "user_training_profiles_sex_check" CHECK (("sex" = ANY (ARRAY['M'::"text", 'F'::"text"]))),
    CONSTRAINT "user_training_profiles_threshold_confidence_check" CHECK ((("threshold_confidence" >= (0)::numeric) AND ("threshold_confidence" <= (1)::numeric))),
    CONSTRAINT "user_training_profiles_training_philosophy_check" CHECK (("training_philosophy" = ANY (ARRAY['conservative'::"text", 'balanced'::"text", 'aggressive'::"text"]))),
    CONSTRAINT "user_training_profiles_tss_target_source_check" CHECK (("tss_target_source" = ANY (ARRAY['estimated'::"text", 'calculated'::"text", 'manual'::"text"])))
);
COMMENT ON TABLE "public"."user_training_profiles" IS 'User training profiles with thresholds and preferences';
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
ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_user_strava_activity_unique" UNIQUE ("user_id", "strava_activity_id");
ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id");
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
ALTER TABLE ONLY "public"."user_training_preferences"
    ADD CONSTRAINT "user_training_preferences_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."user_training_preferences"
    ADD CONSTRAINT "user_training_preferences_user_id_key" UNIQUE ("user_id");
ALTER TABLE ONLY "public"."user_training_profiles"
    ADD CONSTRAINT "user_training_profiles_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."user_training_profiles"
    ADD CONSTRAINT "user_training_profiles_user_id_key" UNIQUE ("user_id");
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
CREATE INDEX "idx_form_submissions_user_id" ON "public"."form_submissions" USING "btree" ("user_id");
CREATE INDEX "idx_strava_tokens_expires_at" ON "public"."strava_tokens" USING "btree" ("expires_at");
CREATE INDEX "idx_strava_tokens_strava_athlete_id" ON "public"."strava_tokens" USING "btree" ("strava_athlete_id");
CREATE INDEX "idx_strava_tokens_user_id" ON "public"."strava_tokens" USING "btree" ("user_id");
CREATE INDEX "idx_threshold_calculation_history_date" ON "public"."threshold_calculation_history" USING "btree" ("calculation_date" DESC);
CREATE INDEX "idx_threshold_calculation_history_user_id" ON "public"."threshold_calculation_history" USING "btree" ("user_id");
CREATE INDEX "idx_user_training_preferences_user_id" ON "public"."user_training_preferences" USING "btree" ("user_id");
CREATE INDEX "idx_user_training_profiles_user_id" ON "public"."user_training_profiles" USING "btree" ("user_id");
CREATE INDEX "idx_workout_plan_workouts_day" ON "public"."workout_plan_workouts" USING "btree" ("day_of_week");
CREATE INDEX "idx_workout_plan_workouts_plan_id" ON "public"."workout_plan_workouts" USING "btree" ("plan_id");
CREATE INDEX "idx_workout_plans_active" ON "public"."workout_plans" USING "btree" ("is_active");
CREATE INDEX "idx_workout_plans_user_id" ON "public"."workout_plans" USING "btree" ("user_id");
CREATE INDEX "idx_workout_plans_week_start" ON "public"."workout_plans" USING "btree" ("week_start");
CREATE OR REPLACE TRIGGER "set_user_id_on_form_submission_trigger" BEFORE INSERT ON "public"."form_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."set_user_id_on_form_submission"();
CREATE OR REPLACE TRIGGER "update_form_submissions_updated_at" BEFORE UPDATE ON "public"."form_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE OR REPLACE TRIGGER "update_workout_plan_workouts_updated_at" BEFORE UPDATE ON "public"."workout_plan_workouts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
CREATE OR REPLACE TRIGGER "update_workout_plans_updated_at" BEFORE UPDATE ON "public"."workout_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."strava_tokens"
    ADD CONSTRAINT "strava_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."sync_state"
    ADD CONSTRAINT "sync_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."threshold_calculation_history"
    ADD CONSTRAINT "threshold_calculation_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."user_training_preferences"
    ADD CONSTRAINT "user_training_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."user_training_profiles"
    ADD CONSTRAINT "user_training_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."workout_plan_workouts"
    ADD CONSTRAINT "workout_plan_workouts_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."workout_plans"
    ADD CONSTRAINT "workout_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
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
CREATE POLICY "Users can submit form submissions" ON "public"."form_submissions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
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
CREATE POLICY "Users can view their own submissions" ON "public"."form_submissions" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))))));
CREATE POLICY "Users can view their own workout plans" ON "public"."workout_plans" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can view workouts in their plans" ON "public"."workout_plan_workouts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workout_plans"
  WHERE (("workout_plans"."id" = "workout_plan_workouts"."plan_id") AND ("workout_plans"."user_id" = "auth"."uid"())))));
ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_user_policy" ON "public"."activities" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));
COMMENT ON POLICY "activities_user_policy" ON "public"."activities" IS 'Optimized RLS policy: Users can only access their own activities. Uses subquery for performance.';
ALTER TABLE "public"."form_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."strava_tokens" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "strava_tokens_user_policy" ON "public"."strava_tokens" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));
COMMENT ON POLICY "strava_tokens_user_policy" ON "public"."strava_tokens" IS 'Optimized RLS policy: Users can only access their own Strava tokens. Uses subquery for performance.';
ALTER TABLE "public"."sync_state" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_state_user_policy" ON "public"."sync_state" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));
COMMENT ON POLICY "sync_state_user_policy" ON "public"."sync_state" IS 'Optimized RLS policy: Users can only access their own sync state. Uses subquery for performance.';
ALTER TABLE "public"."threshold_calculation_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_training_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_training_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."workout_plan_workouts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."workout_plans" ENABLE ROW LEVEL SECURITY;
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES  TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLES  TO "service_role";
