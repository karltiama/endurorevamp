import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StravaActivitySync } from '@/lib/strava/sync-activities'

export async function POST(request: NextRequest) {
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

    // Parse request body for sync options
    let syncOptions = {}
    try {
      const body = await request.json()
      syncOptions = {
        maxActivities: body.maxActivities,
        sinceDays: body.sinceDays,
        forceRefresh: body.forceRefresh || false
      }
    } catch {
      // Use default options if body is empty or invalid
    }

    console.log(`🔄 Sync requested by user ${userId}:`, syncOptions)

    // Initialize sync service and perform sync
    const syncService = new StravaActivitySync()
    const result = await syncService.syncUserActivities(userId, syncOptions)

    // Return result
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Sync completed successfully',
        data: {
          activitiesProcessed: result.activitiesProcessed,
          newActivities: result.newActivities,
          updatedActivities: result.updatedActivities,
          syncDuration: result.syncDuration
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Sync completed with errors',
        errors: result.errors,
        data: {
          activitiesProcessed: result.activitiesProcessed,
          newActivities: result.newActivities,
          updatedActivities: result.updatedActivities,
          syncDuration: result.syncDuration
        }
      }, { status: 422 })
    }

  } catch (error) {
    console.error('❌ Sync API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error during sync',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
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

async function checkCanSync(userId: string, syncState: any): Promise<boolean> {
  if (!syncState) return true // First time sync

  if (!syncState.sync_enabled) return false

  // Reset daily counter if it's a new day
  const today = new Date().toDateString()
  if (syncState.last_sync_date !== today) {
    return true
  }

  // Check daily rate limit
  if (syncState.sync_requests_today >= 5) {
    return false
  }

  // Check minimum time between syncs (1 hour)
  if (syncState.last_activity_sync) {
    const lastSync = new Date(syncState.last_activity_sync)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    if (lastSync > oneHourAgo) {
      return false
    }
  }

  return true
} 