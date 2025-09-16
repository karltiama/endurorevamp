/**
 * Debug script to check database state and sync status
 * Run this in browser console on /dashboard
 */

console.log('🔍 Starting database debug check...');

// 1. Check if latest run is in database
async function checkDatabaseActivities() {
  console.log('\n📊 Checking database activities...');

  try {
    const response = await fetch('/api/strava/activities');
    if (!response.ok) {
      console.error('❌ Failed to fetch activities from database');
      return;
    }

    const activities = await response.json();
    console.log(`✅ Found ${activities.length} activities in database`);

    if (activities.length > 0) {
      const latest = activities[0];
      console.log('🏃 Latest activity:', {
        name: latest.name,
        type: latest.sport_type,
        date: latest.start_date_local,
        distance: latest.distance,
        duration: latest.moving_time,
      });
    }

    return activities;
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

// 2. Check sync status
async function checkSyncStatus() {
  console.log('\n⚡ Checking sync status...');

  try {
    const response = await fetch('/api/strava/sync');
    const syncData = await response.json();

    console.log('📈 Sync Status:', {
      canSync: syncData.canSync,
      activityCount: syncData.activityCount,
      lastSync: syncData.syncState?.last_activity_sync,
      todaySyncs: syncData.syncState?.sync_requests_today,
      errors: syncData.syncState?.consecutive_errors,
    });

    return syncData;
  } catch (error) {
    console.error('❌ Sync status check failed:', error);
  }
}

// 3. Force a fresh sync
async function testSync() {
  console.log('\n🔄 Testing sync...');

  try {
    const response = await fetch('/api/strava/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxActivities: 10, sinceDays: 7 }),
    });

    const result = await response.json();
    console.log('🎯 Sync Result:', result);

    return result;
  } catch (error) {
    console.error('❌ Sync test failed:', error);
  }
}

// 4. Check React Query cache
function checkReactQueryCache() {
  console.log('\n🗂️ Checking React Query cache...');

  // Look for query client in window
  const queryClient =
    window.__REACT_QUERY_CLIENT__ ||
    window.ReactQueryClient ||
    (window.React &&
      window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        ?.ReactCurrentOwner?.current?.memoizedProps?.queryClient);

  if (queryClient) {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    console.log(`Found ${queries.length} cached queries:`);
    queries.forEach(query => {
      if (query.queryKey[0] === 'user' || query.queryKey[0] === 'athlete') {
        console.log(
          '📋',
          query.queryKey,
          '→',
          query.state.status,
          `(${query.state.dataUpdatedAt})`
        );
      }
    });
  } else {
    console.log('❌ React Query client not found in window');
  }
}

// 5. Run full debug
async function runFullDebug() {
  console.log('🚀 Running full debug sequence...\n');

  const activities = await checkDatabaseActivities();
  const syncStatus = await checkSyncStatus();
  checkReactQueryCache();

  console.log('\n📋 Debug Summary:');
  console.log('• Activities in DB:', activities?.length || 'unknown');
  console.log(
    '• Last sync:',
    syncStatus?.syncState?.last_activity_sync || 'unknown'
  );
  console.log('• Sync enabled:', syncStatus?.canSync || 'unknown');

  console.log('\n💡 Next steps:');
  if (!activities || activities.length === 0) {
    console.log('1. Run testSync() to sync your activities');
  } else {
    console.log('1. Activities found in DB - check component refresh');
    console.log('2. Try hard refresh (Ctrl+F5) to clear cache');
  }
}

// Auto-run on script load
runFullDebug();

// Export functions for manual use
window.debugStrava = {
  checkDatabaseActivities,
  checkSyncStatus,
  testSync,
  checkReactQueryCache,
  runFullDebug,
};
