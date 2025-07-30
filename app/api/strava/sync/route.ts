import { NextRequest, NextResponse } from 'next/server'
import { syncStravaActivities } from '@/lib/strava/sync-activities'
import { updateActivitiesWithTSS } from '@/lib/strava/sync-activities'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, ...options } = await request.json()

    if (action === 'update-tss') {
      // Update existing activities with TSS calculations
      const result = await updateActivitiesWithTSS(user.id)
      return NextResponse.json({
        success: true,
        action: 'update-tss',
        ...result
      })
    }

    // Default action: sync activities
    const syncStartTime = Date.now()
    const result = await syncStravaActivities({
      userId: user.id,
      ...options
    })
    const syncDuration = Date.now() - syncStartTime

    // Transform the result to match the expected UI format
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Sync completed successfully' : 'Sync failed',
      data: result.success ? {
        activitiesProcessed: result.activitiesSynced,
        newActivities: result.newActivities,
        updatedActivities: result.updatedActivities,
        syncDuration: syncDuration
      } : undefined,
      errors: result.errors
    })
  } catch (error) {
    console.error('Sync API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET() {
  try {
    // Get authenticated user (secure)
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Get sync state
    const { data: syncState, error } = await supabase
      .from('sync_state')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is ok
      throw error
    }

    // Reset daily counter if it's a new day
    if (syncState) {
      const today = new Date().toISOString().split('T')[0] // Format: "2025-07-29"
      if (syncState.last_sync_date !== today) {
        console.log('📅 GET: Resetting daily sync counter for new day')
        await supabase
          .from('sync_state')
          .update({ 
            sync_requests_today: 0,
            last_sync_date: today
          })
          .eq('user_id', userId)
        
        // Update syncState for the response
        syncState.sync_requests_today = 0
        syncState.last_sync_date = today
      }
    }

    // Get activity count
    const { count: activityCount } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Check sync permissions
    const canSyncResult = await checkCanSync(userId, syncState)

    return NextResponse.json({
      syncState: syncState || null,
      activityCount: activityCount || 0,
      canSync: canSyncResult.canSync,
      syncDisabledReason: canSyncResult.reason
    })

  } catch (error) {
    console.error('❌ Sync status API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function checkCanSync(userId: string, syncState: {
  sync_enabled?: boolean;
  last_sync_date?: string;
  sync_requests_today?: number;
  last_activity_sync?: string;
  last_sync_new_activities?: number; // Track if last sync had new activities
} | null): Promise<{ canSync: boolean; reason?: string }> {
  if (!syncState) {
    return { canSync: true } // First time sync
  }

  if (!syncState.sync_enabled) {
    return { canSync: false, reason: 'Sync is disabled for your account' }
  }

  // Check daily rate limit first (regardless of date)
  if ((syncState.sync_requests_today || 0) >= 5) {
    console.log('❌ Daily rate limit exceeded:', syncState.sync_requests_today)
    return { canSync: false, reason: 'Daily sync limit reached (5/day)' }
  }

  // Reset daily counter if it's a new day
  const today = new Date().toISOString().split('T')[0] // Format: "2025-07-29"
  if (syncState.last_sync_date !== today) {
    // It's a new day, but we still need to check other conditions
    console.log('📅 New day detected, resetting daily counter')
  }

  // Smart 1-hour cooldown: Only apply if last sync had no new activities
  if (syncState.last_activity_sync) {
    const lastSync = new Date(syncState.last_activity_sync)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    if (lastSync > oneHourAgo) {
      const hadNewActivities = (syncState.last_sync_new_activities || 0) > 0
      
      if (!hadNewActivities) {
        console.log('❌ Too soon since last sync with no new activities (1 hour cooldown)')
        const minutesLeft = Math.ceil((lastSync.getTime() - oneHourAgo.getTime()) / (1000 * 60))
        return { 
          canSync: false, 
          reason: `No new activities found in last sync. Please wait ${minutesLeft} minutes before trying again.` 
        }
      } else {
        console.log('✅ Last sync had new activities, allowing immediate re-sync')
      }
    }
  }

  return { canSync: true }
} 