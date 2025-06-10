import { createClient } from '@/lib/supabase/server'
import { StravaAuth } from './auth'

interface SyncOptions {
  maxActivities?: number
  sinceDays?: number
  forceRefresh?: boolean
}

interface SyncResult {
  success: boolean
  activitiesProcessed: number
  newActivities: number
  updatedActivities: number
  errors: string[]
  syncDuration: number
}

interface StravaActivityResponse {
  id: number
  name: string
  sport_type: string
  start_date: string
  start_date_local: string
  timezone: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  average_speed: number
  max_speed: number
  average_heartrate?: number
  max_heartrate?: number
  average_watts?: number
  max_watts?: number
  weighted_average_watts?: number
  kilojoules?: number
  trainer: boolean
  commute: boolean
  manual: boolean
  achievement_count: number
  kudos_count: number
  comment_count: number
  has_heartrate: boolean
  has_power?: boolean
}

export class StravaActivitySync {
  private stravaAuth: StravaAuth

  constructor() {
    this.stravaAuth = new StravaAuth(true) // server mode
  }

  /**
   * Main sync function - handles the entire sync process
   */
  async syncUserActivities(
    userId: string, 
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      success: false,
      activitiesProcessed: 0,
      newActivities: 0,
      updatedActivities: 0,
      errors: [],
      syncDuration: 0
    }

    try {
      console.log(`🚀 Starting activity sync for user: ${userId}`)

      // 1. Check if sync is allowed (rate limiting)
      const canSync = await this.checkSyncPermissions(userId, options.forceRefresh)
      if (!canSync) {
        result.errors.push('Sync rate limit exceeded. Please wait before syncing again.')
        return result
      }

      // 2. Get valid access token
      const accessToken = await this.stravaAuth.getValidAccessToken(userId)
      if (!accessToken) {
        result.errors.push('No valid Strava access token found')
        return result
      }

      // 3. Determine sync timeframe
      const syncParams = await this.getSyncParameters(userId, options)
      console.log(`📅 Sync parameters:`, syncParams)

      // 4. Fetch activities from Strava
      console.log(`🔍 Fetching with params:`, syncParams)
      const activities = await this.fetchActivitiesFromStrava(accessToken, syncParams)
      console.log(`📡 Fetched ${activities.length} activities from Strava`)
      if (activities.length > 0) {
        console.log(`📊 First activity sample:`, {
          id: activities[0].id,
          name: activities[0].name,
          start_date: activities[0].start_date,
          sport_type: activities[0].sport_type
        })
      } else {
        console.log(`⚠️ No activities returned from Strava API`)
      }

      // 5. Process and store activities
      for (const stravaActivity of activities) {
        try {
          const stored = await this.storeActivity(userId, stravaActivity)
          result.activitiesProcessed++
          
          if (stored.isNew) {
            result.newActivities++
          } else {
            result.updatedActivities++
          }
        } catch (error) {
          console.error(`❌ Error storing activity ${stravaActivity.id}:`, error)
          result.errors.push(`Failed to store activity ${stravaActivity.id}`)
        }
      }

      // 6. Update weekly metrics
      await this.updateWeeklyMetrics(userId)

      // 7. Update sync state
      await this.updateSyncState(userId, {
        activitiesProcessed: result.activitiesProcessed,
        syncDuration: Date.now() - startTime
      })

      result.success = true
      result.syncDuration = Date.now() - startTime

      console.log(`✅ Sync completed:`, result)
      return result

    } catch (error) {
      console.error('❌ Sync failed:', error)
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
      result.syncDuration = Date.now() - startTime
      
      // Update sync state with error
      await this.updateSyncState(userId, {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return result
    }
  }

  /**
   * Check if user can sync (rate limiting and permissions)
   */
  private async checkSyncPermissions(userId: string, forceRefresh = false): Promise<boolean> {
    const supabase = await createClient()
    const { data: syncState } = await supabase
      .from('sync_state')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!syncState) {
      // First time sync - create sync state
      await supabase
        .from('sync_state')
        .insert({
          user_id: userId,
          sync_enabled: true,
          sync_requests_today: 0,
          last_sync_date: new Date().toDateString()
        })
      return true
    }

    // Check if sync is enabled
    if (!syncState.sync_enabled) {
      return false
    }

    // Reset daily counter if it's a new day
    const today = new Date().toDateString()
    if (syncState.last_sync_date !== today) {
      await supabase
        .from('sync_state')
        .update({
          sync_requests_today: 0,
          last_sync_date: today
        })
        .eq('user_id', userId)
      return true
    }

    // Check daily rate limit (max 5 syncs per day unless forced)
    if (!forceRefresh && syncState.sync_requests_today >= 5) {
      return false
    }

    // Check minimum time between syncs (1 hour unless forced)
    if (!forceRefresh && syncState.last_activity_sync) {
      const lastSync = new Date(syncState.last_activity_sync)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      if (lastSync > oneHourAgo) {
        return false
      }
    }

    return true
  }

  /**
   * Determine what timeframe to sync based on options and last sync
   */
  private async getSyncParameters(userId: string, options: SyncOptions) {
    const supabase = await createClient()
    const { data: syncState } = await supabase
      .from('sync_state')
      .select('*')
      .eq('user_id', userId)
      .single()

    let after: number | undefined
    let per_page = Math.min(options.maxActivities || 50, 200) // Strava max is 200

    if (options.sinceDays) {
      // Sync activities from specific number of days ago
      const sinceDate = new Date()
      sinceDate.setDate(sinceDate.getDate() - options.sinceDays)
      after = Math.floor(sinceDate.getTime() / 1000)
    } else if (syncState?.last_activity_sync && !options.forceRefresh) {
      // Incremental sync - only new activities since last sync
      const lastSyncDate = new Date(syncState.last_activity_sync)
      // Add small buffer (1 hour) to catch any activities that might have been updated
      lastSyncDate.setHours(lastSyncDate.getHours() - 1)
      after = Math.floor(lastSyncDate.getTime() / 1000)
    } else {
      // First time sync or forced refresh - get last 3 months
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      after = Math.floor(threeMonthsAgo.getTime() / 1000)
      per_page = Math.min(options.maxActivities || 200, 200)
    }

    console.log(`📅 Sync time range: ${after ? new Date(after * 1000).toISOString() : 'all time'} to now, max ${per_page} activities`)
    return { after, per_page }
  }

  /**
   * Fetch activities from Strava API
   */
  private async fetchActivitiesFromStrava(
    accessToken: string, 
    params: { after?: number; per_page: number }
  ): Promise<StravaActivityResponse[]> {
    const url = new URL('https://www.strava.com/api/v3/athlete/activities')
    
    if (params.after) {
      url.searchParams.set('after', params.after.toString())
    }
    url.searchParams.set('per_page', params.per_page.toString())

    console.log('🌐 Fetching from Strava:', url.toString())

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.status} - ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Store a single activity in the database
   */
  private async storeActivity(
    userId: string, 
    stravaActivity: StravaActivityResponse
  ): Promise<{ isNew: boolean }> {
    const supabase = await createClient()
    
    // Map Strava activity to our database structure with proper type handling
    const activityData = {
      user_id: userId,
      strava_activity_id: stravaActivity.id,
      name: stravaActivity.name,
      sport_type: stravaActivity.sport_type,
      start_date: stravaActivity.start_date,
      start_date_local: stravaActivity.start_date_local,
      timezone: stravaActivity.timezone,
      distance: stravaActivity.distance,
      moving_time: stravaActivity.moving_time,
      elapsed_time: stravaActivity.elapsed_time,
      total_elevation_gain: stravaActivity.total_elevation_gain,
      average_speed: stravaActivity.average_speed,
      max_speed: stravaActivity.max_speed,
      // Round heart rate values to integers
      average_heartrate: stravaActivity.average_heartrate ? Math.round(stravaActivity.average_heartrate) : null,
      max_heartrate: stravaActivity.max_heartrate ? Math.round(stravaActivity.max_heartrate) : null,
      has_heartrate: stravaActivity.has_heartrate,
      // Round power values to integers if your schema expects integers
      average_watts: stravaActivity.average_watts ? Math.round(stravaActivity.average_watts) : null,
      max_watts: stravaActivity.max_watts ? Math.round(stravaActivity.max_watts) : null,
      weighted_average_watts: stravaActivity.weighted_average_watts ? Math.round(stravaActivity.weighted_average_watts) : null,
      kilojoules: stravaActivity.kilojoules ? Math.round(stravaActivity.kilojoules) : null,
      has_power: Boolean(stravaActivity.average_watts),
      trainer: stravaActivity.trainer,
      commute: stravaActivity.commute,
      manual: stravaActivity.manual,
      achievement_count: stravaActivity.achievement_count,
      kudos_count: stravaActivity.kudos_count,
      comment_count: stravaActivity.comment_count
    }

    // Try to insert, if conflict then update
    const { data, error } = await supabase
      .from('activities')
      .upsert(activityData, {
        onConflict: 'strava_activity_id',
        ignoreDuplicates: false
      })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    // Check if this was a new activity (created recently)
    const createdAt = new Date(data.created_at)
    const updatedAt = new Date(data.updated_at)
    const isNew = Math.abs(createdAt.getTime() - updatedAt.getTime()) < 1000 // Within 1 second

    return { isNew }
  }

  /**
   * Update weekly metrics based on stored activities
   */
  private async updateWeeklyMetrics(userId: string): Promise<void> {
    const supabase = await createClient()
    
    // Get the date range we need to update (last 8 weeks to be safe)
    const eightWeeksAgo = new Date()
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

    try {
      // Calculate weekly metrics
      const { data: weeklyData, error } = await supabase.rpc('calculate_weekly_metrics', {
        p_user_id: userId,
        p_start_date: eightWeeksAgo.toISOString().split('T')[0]
      })

      if (error) {
        console.error('❌ Error calculating weekly metrics:', error)
        // Don't throw error - weekly metrics are not critical for sync
        console.log('⚠️ Continuing sync without weekly metrics update')
        return
      }

      console.log(`📊 Updated weekly metrics for ${weeklyData?.length || 0} weeks`)
    } catch (error) {
      console.error('❌ Weekly metrics calculation failed:', error)
      console.log('⚠️ Continuing sync without weekly metrics update')
      // Don't throw error - weekly metrics are not critical for sync
    }
  }

  /**
   * Update sync state after successful/failed sync
   */
  private async updateSyncState(
    userId: string, 
    updateData: {
      activitiesProcessed?: number
      syncDuration?: number
      error?: string
    }
  ): Promise<void> {
    const supabase = await createClient()
    const now = new Date().toISOString()
    
    const updates: any = {
      last_activity_sync: now,
      updated_at: now
    }

    if (updateData.error) {
      updates.consecutive_errors = await this.incrementConsecutiveErrors(userId)
      updates.last_error_message = updateData.error
      updates.last_error_at = now
    } else {
      updates.consecutive_errors = 0
      updates.last_error_message = null
      updates.last_error_at = null
      
      if (updateData.activitiesProcessed !== undefined) {
        // Increment total and daily counters
        updates.total_activities_synced = await this.incrementTotalActivities(userId, updateData.activitiesProcessed)
        updates.sync_requests_today = await this.incrementDailySync(userId)
      }
    }

    await supabase
      .from('sync_state')
      .upsert({
        user_id: userId,
        ...updates
      }, {
        onConflict: 'user_id'
      })
  }

  private async incrementConsecutiveErrors(userId: string): Promise<number> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('sync_state')
      .select('consecutive_errors')
      .eq('user_id', userId)
      .single()
    
    return (data?.consecutive_errors || 0) + 1
  }

  private async incrementTotalActivities(userId: string, newActivities: number): Promise<number> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('sync_state')
      .select('total_activities_synced')
      .eq('user_id', userId)
      .single()
    
    return (data?.total_activities_synced || 0) + newActivities
  }

  private async incrementDailySync(userId: string): Promise<number> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('sync_state')
      .select('sync_requests_today')
      .eq('user_id', userId)
      .single()
    
    return (data?.sync_requests_today || 0) + 1
  }
} 