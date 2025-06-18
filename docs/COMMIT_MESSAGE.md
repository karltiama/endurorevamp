fix(oauth): resolve Strava OAuth race condition causing first-connection failures

## Problem
- Strava OAuth connections would fail on first attempt but succeed on refresh
- Race condition caused by dual OAuth processing systems competing for the same authorization code

## Solution
- ❌ Removed `/app/callback/page.tsx` to eliminate dual processing
- ✅ Centralized OAuth handling in `StravaIntegration.tsx` component
- 🔄 Migrated to React Query for better cache management and invalidation
- ⚡ Implemented immediate URL cleanup to prevent re-processing
- 🎯 Added instant cache invalidation for immediate UI updates

## Changes
- Delete: `app/callback/page.tsx` (race condition source)
- Update: `hooks/strava/useStravaConnection.ts` (React Query integration)
- Update: `hooks/strava/useStravaToken.ts` (React Query integration)
- Update: `components/strava/StravaIntegration.tsx` (improved OAuth handling)
- Add: `__tests__/components/strava/StravaIntegration.test.tsx` (comprehensive test coverage)
- Add: `STRAVA_OAUTH_RACE_CONDITION_FIX.md` (detailed documentation)

## Result
- ✅ Single-attempt OAuth connections work consistently
- ⚡ Instant connection status updates (no refresh required)
- 🛡️ Better error handling and user feedback
- 🧪 Full test coverage for OAuth scenarios

Fixes: First-time Strava connection failures requiring page refresh 