-- Migration: Add onboarding completion columns (app-required, additive)
--
-- The app references user_onboarding.profile_completed and .first_sync_completed
-- and the onboarding "complete" gate in app/api/onboarding/route.ts depends on
-- all four flags:
--   goals_completed && strava_connected && profile_completed && first_sync_completed
--
-- Production does not have these two columns yet, so this additive migration
-- introduces them locally (and should be applied to production before testing
-- the onboarding flow there). It only ADDS columns; no existing columns,
-- defaults, RLS policies, or data are modified.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS is a safe no-op if the column exists.

ALTER TABLE "public"."user_onboarding"
    ADD COLUMN IF NOT EXISTS "profile_completed" boolean DEFAULT false;

ALTER TABLE "public"."user_onboarding"
    ADD COLUMN IF NOT EXISTS "first_sync_completed" boolean DEFAULT false;
