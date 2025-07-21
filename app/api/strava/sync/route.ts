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
    const result = await syncStravaActivities({
      userId: user.id,
      ...options
    })

    return NextResponse.json(result)
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
      const today = new Date().toDateString()
      if (syncState.last_sync_date !== today) {
        console.log('📅 Resetting daily sync counter for new day')
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

    return NextResponse.json({
      syncState: syncState || null,
      activityCount: activityCount || 0,
      canSync: await checkCanSync(userId, syncState)
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
} | null): Promise<boolean> {
  if (!syncState) {
    return true // First time sync
  }

  if (!syncState.sync_enabled) {
    return false
  }

  // Check daily rate limit first (regardless of date)
  if ((syncState.sync_requests_today || 0) >= 5) {
    console.log('❌ Daily rate limit exceeded:', syncState.sync_requests_today)
    return false
  }

  // Reset daily counter if it's a new day
  const today = new Date().toDateString()
  if (syncState.last_sync_date !== today) {
    // It's a new day, but we still need to check other conditions
    console.log('📅 New day detected, resetting daily counter')
  }

  // Check minimum time between syncs (1 hour)
  if (syncState.last_activity_sync) {
    const lastSync = new Date(syncState.last_activity_sync)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    if (lastSync > oneHourAgo) {
      console.log('❌ Too soon since last sync (1 hour cooldown)')
      return false
    }
  }

  return true
} 