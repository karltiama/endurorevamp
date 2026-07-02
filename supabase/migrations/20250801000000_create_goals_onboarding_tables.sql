-- Migration: Goals & Onboarding Tables (production-derived)
--
-- Source of truth: production dump (sql/prod/schema.sql). These tables were
-- created directly in the Supabase dashboard and never had a migration, so a
-- fresh project could not reproduce them. This file adds them, matching the
-- production shapes EXACTLY (including legacy/quirky choices).
--
-- Scope: goal_types, user_goals, goal_progress, user_onboarding ONLY.
-- No RPC functions, no analytics views, no app-code changes (separate steps).
--
-- Idempotency: CREATE TABLE/INDEX IF NOT EXISTS; DROP POLICY IF EXISTS before
-- CREATE POLICY; ENABLE ROW LEVEL SECURITY is a no-op if already enabled.
--
-- Creation order matters (FK dependencies):
--   goal_types  ->  user_goals (FK goal_type_id -> goal_types.name)
--   user_goals  ->  goal_progress (FK user_goal_id -> user_goals.id)
--   user_onboarding is independent.
--
-- Notes on fidelity to production:
--   - goal_types PRIMARY KEY is "name" (varchar), NOT a uuid. Prod also keeps a
--     redundant UNIQUE(name); both are reproduced to match the dump.
--   - user_goals.user_id, user_onboarding.user_id, and goal_progress have NO
--     foreign key to auth.users in production; none are added here.
--   - user_onboarding intentionally OMITS profile_completed / first_sync_completed
--     (they do not exist in production). App code references them; that mismatch
--     is reported separately and handled in a later step.

-- =============================================================================
-- goal_types: catalog of goal definitions (PK = name)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "public"."goal_types" (
    "name" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" text NOT NULL,
    "category" character varying(30) NOT NULL,
    "metric_type" character varying(30) NOT NULL,
    "unit" character varying(20),
    "target_guidance" text,
    "calculation_method" text NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "goal_types_pkey" PRIMARY KEY ("name")
);

-- Production keeps a redundant UNIQUE(name) alongside the PK. Postgres dedupes
-- an inline UNIQUE that matches the PK, so it must be added separately. Guarded
-- so this migration stays idempotent against a database that already has it.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'goal_types_name_key'
          AND conrelid = 'public.goal_types'::regclass
    ) THEN
        ALTER TABLE "public"."goal_types" ADD CONSTRAINT "goal_types_name_key" UNIQUE ("name");
    END IF;
END $$;

ALTER TABLE "public"."goal_types" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Goal types are viewable by everyone" ON "public"."goal_types";
CREATE POLICY "Goal types are viewable by everyone" ON "public"."goal_types"
    FOR SELECT USING (true);

-- =============================================================================
-- user_goals: per-user goals (FK goal_type_id -> goal_types.name)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "public"."user_goals" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "target_value" numeric,
    "target_unit" character varying(20),
    "target_date" date,
    "time_period" character varying(20) DEFAULT 'weekly'::character varying,
    "current_progress" numeric DEFAULT 0,
    "best_result" numeric,
    "streak_count" integer DEFAULT 0,
    "goal_data" jsonb DEFAULT '{}'::jsonb,
    "is_active" boolean DEFAULT true,
    "is_completed" boolean DEFAULT false,
    "priority" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "completed_at" timestamp with time zone,
    "last_progress_update" timestamp with time zone,
    "goal_type_id" character varying(50),
    CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_goals_goal_type_id_fkey" FOREIGN KEY ("goal_type_id")
        REFERENCES "public"."goal_types"("name") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_user_goals_active" ON "public"."user_goals" USING btree ("is_active") WHERE ("is_active" = true);
CREATE INDEX IF NOT EXISTS "idx_user_goals_user_id" ON "public"."user_goals" USING btree ("user_id");

ALTER TABLE "public"."user_goals" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_goals_user_policy" ON "public"."user_goals";
CREATE POLICY "user_goals_user_policy" ON "public"."user_goals"
    USING (("user_id" = ( SELECT auth.uid() AS uid)))
    WITH CHECK (("user_id" = ( SELECT auth.uid() AS uid)));
COMMENT ON POLICY "user_goals_user_policy" ON "public"."user_goals" IS 'Optimized RLS policy: Users can only access their own goals. Uses subquery for performance.';

-- =============================================================================
-- goal_progress: per-activity contributions to a goal (FK -> user_goals.id)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "public"."goal_progress" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_goal_id" uuid NOT NULL,
    "activity_id" character varying(50),
    "activity_date" date NOT NULL,
    "value_achieved" numeric,
    "contribution_amount" numeric,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "goal_progress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "goal_progress_unique_goal_activity" UNIQUE ("user_goal_id", "activity_id"),
    CONSTRAINT "goal_progress_user_goal_id_fkey" FOREIGN KEY ("user_goal_id")
        REFERENCES "public"."user_goals"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_goal_progress_date" ON "public"."goal_progress" USING btree ("activity_date");
CREATE INDEX IF NOT EXISTS "idx_goal_progress_goal_id" ON "public"."goal_progress" USING btree ("user_goal_id");

ALTER TABLE "public"."goal_progress" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goal_progress_user_policy" ON "public"."goal_progress";
CREATE POLICY "goal_progress_user_policy" ON "public"."goal_progress"
    USING ((EXISTS ( SELECT 1
        FROM "public"."user_goals"
        WHERE (("user_goals"."id" = "goal_progress"."user_goal_id")
            AND ("user_goals"."user_id" = ( SELECT auth.uid() AS uid))))))
    WITH CHECK ((EXISTS ( SELECT 1
        FROM "public"."user_goals"
        WHERE (("user_goals"."id" = "goal_progress"."user_goal_id")
            AND ("user_goals"."user_id" = ( SELECT auth.uid() AS uid))))));
COMMENT ON POLICY "goal_progress_user_policy" ON "public"."goal_progress" IS 'Optimized RLS policy: Users can only access progress for their own goals. Uses JOIN for security.';

-- =============================================================================
-- user_onboarding: per-user onboarding state (one row per user)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "public"."user_onboarding" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "goals_completed" boolean DEFAULT false,
    "strava_connected" boolean DEFAULT false,
    "current_step" character varying(20) DEFAULT 'goals'::character varying,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "user_onboarding_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_onboarding_user_id_key" UNIQUE ("user_id")
);

CREATE INDEX IF NOT EXISTS "idx_user_onboarding_user_id" ON "public"."user_onboarding" USING btree ("user_id");

ALTER TABLE "public"."user_onboarding" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_onboarding_user_policy" ON "public"."user_onboarding";
CREATE POLICY "user_onboarding_user_policy" ON "public"."user_onboarding"
    USING (("user_id" = ( SELECT auth.uid() AS uid)))
    WITH CHECK (("user_id" = ( SELECT auth.uid() AS uid)));
COMMENT ON POLICY "user_onboarding_user_policy" ON "public"."user_onboarding" IS 'Optimized RLS policy: Users can only access their own onboarding data. Uses subquery for performance.';
