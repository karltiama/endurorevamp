# Hook Consolidation Plan

## Current Status: SAFE TO PROCEED ✅

### Phase 1: Remove Unused Hooks (SAFE - No imports found) ✅ COMPLETED
- [x] `hooks/use-athlete-activities.ts` - No active imports - REMOVED
- [x] `hooks/use-athlete-data.ts` - No active imports - REMOVED
- [x] `hooks/use-zone-analysis-optimized.ts` - Migration never completed - REMOVED

### Phase 2: Fix Duplicate Sync Hooks ✅ COMPLETED  
- [x] Consolidated `hooks/strava/useStravaSync.ts` and `hooks/use-strava-sync.ts`
- [x] Updated StravaIntegration to use API-based hook instead of class-based
- [x] Removed duplicate class-based hook `hooks/strava/useStravaSync.ts`

### Phase 3: Standardize Naming (SAFE RENAMES)
- [ ] Keep consistent naming patterns
- [ ] Update import paths if needed

## HOOKS TO KEEP (All actively used):
✅ hooks/use-strava-sync.ts (3+ usages)
✅ hooks/strava/useStravaConnection.ts (3+ usages)  
✅ hooks/strava/useStravaToken.ts (6+ usages)
✅ hooks/use-strava-auth.ts (2+ usages)
✅ hooks/use-user-activities.ts (10+ usages)
✅ hooks/useAthleteProfile.ts (1+ usage)
✅ hooks/useGoals.ts (8+ usages)
✅ hooks/useUnitPreferences.ts (8+ usages)
✅ hooks/use-zone-analysis.ts (1+ usage)
✅ hooks/useTrainingLoad.ts (1+ usage)
✅ hooks/auth/useRequireAuth.ts (active)
✅ hooks/use-mobile.ts (1+ usage)

## Safety Checklist:
- ✅ Created branch: feature/consolidate-hooks
- ✅ Identified all active imports
- ✅ No breaking changes in Phase 1
- ⏳ Ready to start cleanup 