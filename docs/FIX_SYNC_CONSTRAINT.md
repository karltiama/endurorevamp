# Fix for Sync Error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

## Problem

The sync functionality is failing with error code `42P10` because the database constraint doesn't match what the sync code expects.

## Root Cause

- Your database currently has a `UNIQUE` constraint on `strava_activity_id` alone
- But the sync code needs a composite constraint on `(user_id, strava_activity_id)`
- This prevents duplicate activities per user while allowing the same activity ID across different users

## Solution

### Step 1: Run the Database Fix

Execute the SQL script to fix the constraint:

```bash
# If using Supabase CLI locally:
npx supabase db reset

# Or manually run the SQL in your Supabase dashboard:
# Go to SQL Editor and run the contents of fix_unique_constraint.sql
```

### Step 2: Verify the Fix

After running the database fix, test the sync functionality:

1. Go to `/test-sync` in your app
2. Run the "Layer 4: Sync Functionality" tests
3. The "Manual Storage test" should now pass

## Files Updated

- ✅ `components/debug/DetailedSyncDebugger.tsx` - Fixed onConflict
- ✅ `lib/strava/sync-activities.ts` - Fixed onConflict
- ✅ `fix_unique_constraint.sql` - Database fix script

## What This Fixes

- ✅ Manual Storage test in DetailedSyncDebugger
- ✅ Production sync API route
- ✅ All activity upsert operations
- ✅ Prevents your most recent runs from not showing up

## Next Steps

After fixing the constraint, your sync should work properly and your most recent activities should appear in the dashboard.
