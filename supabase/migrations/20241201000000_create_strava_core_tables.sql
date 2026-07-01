-- Migration: Strava Core Tables (production-derived baseline)
--
-- Timestamp is intentionally early (2024-12-01) so the later ALTER migrations
-- run AFTER this file during `supabase db reset`:
--   20250101000000_add_favorite_field.sql
--   20250101000001_add_last_sync_new_activities.sql
--   20250103000000_add_last_sync_at.sql
--
-- Source of truth: production dump (sql/prod/schema.sql). strava_tokens,
-- activities, and sync_state were originally created directly in the Supabase
-- dashboard and never had a migration, so a fresh project could not be
-- reproduced from migrations alone. This file closes that gap and matches the
-- production column types/constraints EXACTLY (including legacy/quirky types).
--
-- Idempotency: CREATE TABLE/INDEX IF NOT EXISTS; DROP POLICY IF EXISTS before
-- CREATE POLICY; ENABLE ROW LEVEL SECURITY is a no-op if already enabled. This
-- is a safe no-op against an existing database (prod/local) that already has
-- these objects, and never drops or alters existing columns/data.
--
-- Columns intentionally OMITTED here because later migrations ADD them. Those
-- later ALTERs are NOT all idempotent (two lack IF NOT EXISTS), so including the
-- columns here would break `db reset`. After the full migration chain runs, the
-- local schema matches production (these columns are appended last, same as prod):
--   - activities.is_favorite              -> 20250101000000_add_favorite_field.sql
--   - sync_state.last_sync_new_activities -> 20250101000001_add_last_sync_new_activities.sql
--   - strava_tokens.last_sync_at          -> 20250103000000_add_last_sync_at.sql
-- The is_favorite index (idx_activities_is_favorite) is likewise created by the
-- favorite-field migration and is intentionally omitted here.

-- strava_tokens.id defaults to extensions.uuid_generate_v4() in production.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- =============================================================================
-- strava_tokens: OAuth tokens + cached athlete summary (one row per user)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "public"."strava_tokens" (
    "id" uuid DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" uuid NOT NULL,
    "access_token" text NOT NULL,
    "refresh_token" text NOT NULL,
    "token_type" character varying(50) DEFAULT 'Bearer'::character varying,
    "expires_at" timestamp with time zone NOT NULL,
    "expires_in" integer NOT NULL,
    "strava_athlete_id" bigint NOT NULL,
    "athlete_firstname" character varying(100),
    "athlete_lastname" character varying(100),
    "athlete_profile" text,
    "scope" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "strava_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "strava_tokens_user_id_key" UNIQUE ("user_id"),
    CONSTRAINT "strava_tokens_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_strava_tokens_expires_at" ON "public"."strava_tokens" USING btree ("expires_at");
CREATE INDEX IF NOT EXISTS "idx_strava_tokens_strava_athlete_id" ON "public"."strava_tokens" USING btree ("strava_athlete_id");
CREATE INDEX IF NOT EXISTS "idx_strava_tokens_user_id" ON "public"."strava_tokens" USING btree ("user_id");

ALTER TABLE "public"."strava_tokens" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strava_tokens_user_policy" ON "public"."strava_tokens";
CREATE POLICY "strava_tokens_user_policy" ON "public"."strava_tokens"
    USING (("user_id" = ( SELECT auth.uid() AS uid)))
    WITH CHECK (("user_id" = ( SELECT auth.uid() AS uid)));
COMMENT ON POLICY "strava_tokens_user_policy" ON "public"."strava_tokens" IS 'Optimized RLS policy: Users can only access their own Strava tokens. Uses subquery for performance.';

-- =============================================================================
-- activities: synced Strava activities + app-computed training metrics
-- =============================================================================
CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "strava_activity_id" bigint NOT NULL,
    "name" text NOT NULL,
    "sport_type" text NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "start_date_local" timestamp with time zone NOT NULL,
    "timezone" text,
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
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "relative_effort" integer,
    "perceived_exertion" integer,
    "training_load_score" double precision,
    "intensity_score" double precision,
    "recovery_time" integer,
    "normalized_power" double precision,
    "training_stress_score" double precision,
    "power_zones" jsonb,
    "heart_rate_zones" jsonb,
    "pace_zones" jsonb,
    "description" text,
    "summary_polyline" text,
    "polyline" text,
    "start_latlng" text,
    "end_latlng" text,
    "map_id" text,
    CONSTRAINT "activities_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "activities_user_strava_activity_unique" UNIQUE ("user_id", "strava_activity_id"),
    CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

COMMENT ON COLUMN "public"."activities"."summary_polyline" IS 'Strava encoded polyline for route summary';
COMMENT ON COLUMN "public"."activities"."polyline" IS 'Strava encoded polyline for detailed route';
COMMENT ON COLUMN "public"."activities"."start_latlng" IS 'Start coordinates as "lat,lng" string';
COMMENT ON COLUMN "public"."activities"."end_latlng" IS 'End coordinates as "lat,lng" string';
COMMENT ON COLUMN "public"."activities"."map_id" IS 'Strava map ID for the activity';

CREATE INDEX IF NOT EXISTS "idx_activities_description" ON "public"."activities" USING btree ("description") WHERE ("description" IS NOT NULL);
CREATE INDEX IF NOT EXISTS "idx_activities_intensity" ON "public"."activities" USING btree ("user_id", "intensity_score");
CREATE INDEX IF NOT EXISTS "idx_activities_route_data" ON "public"."activities" USING btree ("user_id", "start_latlng", "end_latlng") WHERE ("start_latlng" IS NOT NULL);
CREATE INDEX IF NOT EXISTS "idx_activities_sport_type" ON "public"."activities" USING btree ("user_id", "sport_type", "start_date" DESC);
CREATE INDEX IF NOT EXISTS "idx_activities_sport_type_date" ON "public"."activities" USING btree ("sport_type", "start_date");
CREATE INDEX IF NOT EXISTS "idx_activities_training_load" ON "public"."activities" USING btree ("user_id", "training_load_score");
CREATE INDEX IF NOT EXISTS "idx_activities_user_date" ON "public"."activities" USING btree ("user_id", "start_date" DESC);
CREATE INDEX IF NOT EXISTS "idx_activities_user_strava" ON "public"."activities" USING btree ("user_id", "strava_activity_id");
CREATE INDEX IF NOT EXISTS "idx_activities_week" ON "public"."activities" USING btree ("user_id", "year_number", "week_number");
CREATE INDEX IF NOT EXISTS "idx_activities_year_month" ON "public"."activities" USING btree ("year_number", "month_number");

ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_user_policy" ON "public"."activities";
CREATE POLICY "activities_user_policy" ON "public"."activities"
    USING (("user_id" = ( SELECT auth.uid() AS uid)))
    WITH CHECK (("user_id" = ( SELECT auth.uid() AS uid)));
COMMENT ON POLICY "activities_user_policy" ON "public"."activities" IS 'Optimized RLS policy: Users can only access their own activities. Uses subquery for performance.';

-- =============================================================================
-- sync_state: per-user Strava sync bookkeeping and rate-limit tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS "public"."sync_state" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "last_activity_sync" timestamp with time zone,
    "last_full_sync" timestamp with time zone,
    "earliest_activity_date" date,
    "latest_activity_date" date,
    "total_activities_synced" integer DEFAULT 0,
    "full_sync_completed" boolean DEFAULT false,
    "sync_enabled" boolean DEFAULT true,
    "sync_requests_today" integer DEFAULT 0,
    "last_sync_date" date DEFAULT CURRENT_DATE,
    "consecutive_errors" integer DEFAULT 0,
    "last_error_message" text,
    "last_error_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "last_sync_error" jsonb,
    CONSTRAINT "sync_state_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sync_state_user_id_key" UNIQUE ("user_id"),
    CONSTRAINT "sync_state_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."sync_state" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sync_state_user_policy" ON "public"."sync_state";
CREATE POLICY "sync_state_user_policy" ON "public"."sync_state"
    USING (("user_id" = ( SELECT auth.uid() AS uid)))
    WITH CHECK (("user_id" = ( SELECT auth.uid() AS uid)));
COMMENT ON POLICY "sync_state_user_policy" ON "public"."sync_state" IS 'Optimized RLS policy: Users can only access their own sync state. Uses subquery for performance.';
