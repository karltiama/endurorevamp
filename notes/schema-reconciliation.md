# Schema Reconciliation Note

Living record of how the local migration chain (`supabase/migrations/`) was reconciled
against the production database (captured in `sql/prod/schema.sql`). Production is the
source of truth for **shape**, but not every prod-only object belongs in the modern
chain — legacy/unused/orphaned artifacts are intentionally left out to keep the schema
clean and understandable.

Last updated: 2026-07-02 (after Step 4A audit).

---

## 1. What the modern migration chain now supports

The migration chain reproduces, from scratch, everything the current app depends on:

| Area | Objects | Migration(s) |
|---|---|---|
| Strava activities / tokens / sync state | `activities`, `strava_tokens`, `sync_state` (+ RLS, indexes, prod constraints) | `20241201000000_create_strava_core_tables.sql` (prod-derived) + existing ALTERs (`is_favorite`, `last_sync_new_activities`, `last_sync_at`) |
| Goals / onboarding tables | `goal_types` (PK `name`), `user_goals` (FK → `goal_types.name`), `goal_progress`, `user_onboarding` (+ RLS, indexes) | `20250801000000_create_goals_onboarding_tables.sql` |
| Onboarding completion columns | `user_onboarding.profile_completed`, `user_onboarding.first_sync_completed` (app-required) | `20250801000001_add_onboarding_completion_columns.sql` |
| Goal RPC functions | `calculate_goal_progress`, `update_all_goal_progress`, `update_goal_progress_from_activity`, `update_goal_progress_since_last_sync` (with confirmed `gt.id` → `gt.name` fix) | `20250801000002_create_goal_rpc_functions.sql` |
| Analytics views (parity) | `activity_type_metrics`, `weekly_training_load` (read-only over `activities`) | `20250801000003_create_analytics_views.sql` |
| Training/profile tables (pre-existing) | `user_training_profiles`, `user_training_preferences`, `threshold_calculation_history`, workout plans, form submissions | earlier migrations (`20250121`, `20250721`, form-submission chain, etc.) |

---

## 2. What was intentionally NOT migrated

These prod-only objects were audited (Step 4A) and deliberately excluded from the chain:

**Legacy duplicate tables**
- `training_preferences`  — superseded by `user_training_preferences`
- `user_profiles`         — superseded by `user_training_profiles`

**Unused analytics artifact**
- `weekly_metrics`            (table)
- `calculate_weekly_metrics()` (function; pairs with `weekly_metrics`)

**Orphaned trigger functions** (defined in prod but NO `CREATE TRIGGER` exists in the prod public schema, so wired to nothing)
- `set_default_intensity_distribution()`
- `update_analysis_parameters_updated_at()` (references a non-existent `analysis_parameters` table)
- `update_intensity_on_experience_change()` (writes to legacy `training_preferences`)
- `update_tss_target()`

**Unused legacy training/profile helper functions** (no caller anywhere)
- `calculate_pace_from_speed(numeric)`
- `calculate_personalized_tss_target(uuid, text)`
- `calculate_personalized_tss_target(varchar, varchar)` (overload)
- `extract_time_components(integer)`
- `get_default_intensity_distribution(varchar)`
- `initialize_default_training_zones(uuid)`

---

## 3. Why they were not migrated

For every object above, all of the following held true:
- **No app references** — repo-wide search (excluding `sql/`) found zero usages in app code.
- **No test references** — no usages in `__tests__/`.
- **Superseded by newer tables** — `training_preferences`/`user_profiles` are older shapes the app abandoned in favor of `user_training_preferences`/`user_training_profiles`.
- **Would add schema confusion** — reproducing two "preferences"/"profile" tables (or empty analytics tables and dead functions) invites ambiguity about the source of truth.
- **Not needed for app parity** — the chain already reproduces everything the running app queries or calls.

Guiding principle: production is evidence, not a mandate. A clean, understandable schema
is preferred over blindly preserving unused artifacts.

---

## 4. Remaining known follow-ups (not started)

- **`update_goal_progress_from_activity` CASE-vs-`metric_type` review** — its CASE switches on `gt.name` against metric-type-like literals (`'total_distance'`, `'run_count'`, `'total_time'`); likely should switch on `gt.metric_type` (as `update_all_goal_progress` does). Preserved as-is for now (valid column, out of scope of the confirmed `gt.id` fix).
- **Possible future production cleanup** of the legacy tables/functions listed in §2 — DESTRUCTIVE against prod; only with explicit approval.
- **Policy naming alignment** (low priority) — prod uses single "manage own" policies on `user_training_*`/`threshold_calculation_history`; local uses 4 explicit CRUD policies (functionally fine/stricter). Optional cosmetic diff reduction only.
- **Landing page honesty cleanup** — continue removing any remaining overstated claims.
- **Debug/test scaffold cleanup** — prune `app/test/*` and `app/dashboard/test-*` scaffolding before shipping.
- **Future: AI Weekly Training Debrief** — planned feature, not yet designed.

---

## 5. Current status

- `npx supabase db reset` — **passes** (full chain applies cleanly from scratch).
- `npm run ci` — **passes** (type-check, lint, 899 tests, build).
- The migration chain is **functionally complete for the current app**. Remaining
  `sql/diff/schema.diff` delta is intentional divergence (legacy prod cruft the app
  no longer uses), not a gap.
