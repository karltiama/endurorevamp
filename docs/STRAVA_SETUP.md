# Strava Integration Setup Guide

## Overview

This guide will help you set up the foundation for Strava data ingestion with smart duplicate prevention and efficient syncing.

## 1. Database Setup

### Step 1: Run the Migration in Supabase

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Create a new query and paste the contents of `supabase/migrations/001_create_strava_tables.sql`
4. Run the migration

This creates:
- `athlete_profiles` table for Strava user data
- `activities` table for workout data
- `sync_state` table for tracking sync status
- Proper indexes and security policies

### Step 2: Verify Tables

Check that these tables were created:
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('athlete_profiles', 'activities', 'sync_state');
```

## 2. Smart Sync Features

### Duplicate Prevention
- **Unique Constraints**: Activities are stored with `strava_activity_id` as unique key
- **Upsert Logic**: Updates only when data has actually changed
- **Time-based Updates**: Only updates activities older than 24 hours (for social metrics)
- **Profile Diffing**: Compares profile fields to avoid unnecessary writes

### Rate Limit Management
- **Intelligent Timing**: Won't sync more than once per hour unless forced
- **Incremental Sync**: Uses timestamps to only fetch new/updated data
- **Error Tracking**: Records sync failures and implements backoff

### Data Integrity
- **Conflict Resolution**: Handles Strava ID conflicts gracefully
- **Rollback Support**: Database transactions ensure consistency
- **User Isolation**: RLS policies ensure users only see their own data

## 3. Usage Examples

### Basic Sync
```typescript
import { useStravaSync } from '@/hooks/strava/useStravaSync';

function MyComponent() {
  const { syncData, isLoading, error } = useStravaSync();
  
  const handleSync = async () => {
    const result = await syncData({
      maxActivities: 30,  // Limit API calls
      sinceDays: 7        // Only last week
    });
    
    console.log('Synced:', result.activitiesProcessed, 'activities');
  };
  
  return (
    <button onClick={handleSync} disabled={isLoading}>
      {isLoading ? 'Syncing...' : 'Sync Strava'}
    </button>
  );
}
```

### Force Refresh
```typescript
// Force a complete refresh (ignores time limits)
await syncData({ 
  forceRefresh: true,
  maxActivities: 100,
  sinceDays: 30 
});
```

### Server-side Sync (for background jobs)
```typescript
import { StravaSync } from '@/lib/strava/sync';

// In an API route or background job
const stravaSync = new StravaSync(accessToken, true); // true = server mode
const result = await stravaSync.syncAll(userId, {
  maxActivities: 200,
  sinceDays: 90
});
```

## 4. Data Access Patterns

### Querying Activities
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Get recent activities
const { data: activities } = await supabase
  .from('activities')
  .select('*')
  .eq('user_id', userId)
  .order('start_date', { ascending: false })
  .limit(20);

// Get activities by sport
const { data: runs } = await supabase
  .from('activities')
  .select('*')
  .eq('user_id', userId)
  .eq('sport_type', 'Run')
  .gte('start_date', '2024-01-01');

// Performance analytics
const { data: stats } = await supabase
  .from('activities')
  .select('distance, moving_time, average_heartrate')
  .eq('user_id', userId)
  .eq('sport_type', 'Run')
  .not('average_heartrate', 'is', null);
```

### Athlete Profile
```typescript
// Get athlete profile
const { data: profile } = await supabase
  .from('athlete_profiles')
  .select('*')
  .eq('user_id', userId)
  .single();
```

## 5. Sync State Monitoring

### Check Sync Status
```typescript
// Get sync information
const { data: syncState } = await supabase
  .from('sync_state')
  .select('*')
  .eq('user_id', userId)
  .single();

console.log('Last sync:', syncState?.last_activity_sync);
console.log('Activities synced:', syncState?.activities_synced_count);
console.log('Errors:', syncState?.consecutive_errors);
```

## 6. Performance Optimization

### Index Usage
The migration creates these optimized indexes:
- `idx_activities_user_date` for timeline queries
- `idx_activities_sport_type` for sport filtering
- `idx_activities_strava_id` for conflict resolution

### Query Performance Tips
```sql
-- Good: Uses user_id + date index
SELECT * FROM activities 
WHERE user_id = $1 AND start_date >= $2 
ORDER BY start_date DESC;

-- Good: Uses sport_type index
SELECT * FROM activities 
WHERE user_id = $1 AND sport_type = 'Run';

-- Avoid: Full table scans
SELECT * FROM activities WHERE name ILIKE '%marathon%';
```

## 7. Error Handling

The sync system tracks and handles these scenarios:
- **Network failures**: Retries with exponential backoff
- **Rate limits**: Respects Strava's limits automatically
- **Duplicate data**: Handles gracefully without errors
- **Partial failures**: Continues processing remaining activities

## 8. Next Steps

### Phase 1: Complete Basic Setup ✅
- [x] Database schema
- [x] Sync utilities
- [x] React hooks
- [x] Duplicate prevention

### Phase 2: Add Authentication
- [ ] Strava OAuth integration
- [ ] Token storage & refresh
- [ ] Connection status UI

### Phase 3: Enhanced Features
- [ ] Activity streams (detailed metrics)
- [ ] Webhook integration for real-time updates
- [ ] Segment efforts tracking
- [ ] Training zones analysis

### Phase 4: Intelligence Layer
- [ ] Performance trends
- [ ] Training load analysis
- [ ] Goal recommendations
- [ ] Insight generation

## 9. Testing

Once you have Strava OAuth set up, you can test the sync with:

```typescript
// Add to your dashboard for testing
import { SyncButton } from '@/components/strava/SyncButton';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <SyncButton />
    </div>
  );
}
```

## Security Notes

- All database access uses Row Level Security (RLS)
- Users can only access their own data
- Strava tokens should be encrypted at rest
- API rate limits are enforced at the application level
- Regular token refresh prevents authorization issues

This foundation gives you a robust, scalable base for building your "Strava + Intelligence" platform! 🚀 