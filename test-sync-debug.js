// Quick sync test - run with: node test-sync-debug.js
// This will help us debug the sync issue

const fetch = require('node-fetch');

async function testSync() {
  try {
    console.log('🔍 Testing sync endpoint...');
    
    // Test the sync status endpoint first
    const statusResponse = await fetch('http://localhost:3000/api/strava/sync', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📊 Status Response:', statusResponse.status);
    const statusData = await statusResponse.json();
    console.log('📊 Status Data:', JSON.stringify(statusData, null, 2));
    
    if (statusResponse.status === 401) {
      console.log('❌ Need to be authenticated to test sync');
      console.log('💡 Go to localhost:3000/dashboard/settings and try the sync there');
      return;
    }
    
    // Test the sync POST endpoint
    console.log('\n🔄 Testing sync POST...');
    const syncResponse = await fetch('http://localhost:3000/api/strava/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxActivities: 10,
        forceRefresh: true
      })
    });
    
    console.log('🔄 Sync Response:', syncResponse.status);
    const syncData = await syncResponse.json();
    console.log('🔄 Sync Data:', JSON.stringify(syncData, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSync(); 