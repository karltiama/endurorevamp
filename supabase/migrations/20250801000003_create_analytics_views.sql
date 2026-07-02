-- Migration: Analytics views (production-derived)
--
-- Source of truth: production dump (sql/prod/schema.sql). Both views are
-- reproduced verbatim, including their security options.
--
-- Views:
--   activity_type_metrics  -- per-user per-sport aggregates
--   weekly_training_load   -- per-user per-ISO-week training load aggregates
--
-- Both read only from public.activities (already created by the Strava-core
-- baseline), so they recreate cleanly from the migration chain.
--
-- Security options match production exactly:
--   activity_type_metrics: security_barrier=true, security_invoker=on
--   weekly_training_load:  security_barrier=true, security_invoker=true
-- (security_invoker makes the view honor the querying user's RLS on activities.)

CREATE OR REPLACE VIEW "public"."activity_type_metrics"
    WITH ("security_barrier"='true', "security_invoker"='on') AS
 SELECT "activities"."user_id",
    "activities"."sport_type",
    "count"(*) AS "activity_count",
    "avg"("activities"."distance") AS "avg_distance",
    "avg"("activities"."moving_time") AS "avg_duration",
    "avg"("activities"."average_heartrate") AS "avg_hr",
    "avg"("activities"."training_load_score") AS "avg_load"
   FROM "public"."activities"
  GROUP BY "activities"."user_id", "activities"."sport_type";

CREATE OR REPLACE VIEW "public"."weekly_training_load"
    WITH ("security_barrier"='true', "security_invoker"='true') AS
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
