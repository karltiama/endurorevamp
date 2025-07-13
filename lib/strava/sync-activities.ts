import { createClient } from '@/lib/supabase/client'
import type { StravaActivity } from './types'

// Helper function to safely convert values to numbers
function safeNumber(value: unknown, fieldName?: string): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return isNaN(value) ? null : value
  if (typeof value === 'string') {
    // Handle pace strings like "07:04 /km" 
    if (value.includes('/km')) {
      console.warn(`⚠️ Converting pace string to seconds: "${value}" for field: ${fieldName || 'unknown'}`)
      const timeMatch = value.match(/(\d{1,2}):(\d{2})/)
      if (timeMatch) {
        const minutes = parseInt(timeMatch[1])
        const seconds = parseInt(timeMatch[2])
        const totalSeconds = (minutes * 60) + seconds
        console.log(`✅ Pace converted: "${value}" -> ${totalSeconds} seconds per km`)
        return totalSeconds // Return total seconds per km
      }
      console.error(`❌ Failed to parse pace string: "${value}"`)
      return null
    }
    const parsed = parseFloat(value)
    if (isNaN(parsed)) {
      console.warn(`⚠️ Cannot convert to number: "${value}" for field: ${fieldName || 'unknown'}`)
      return null
    }
    return parsed
  }
  console.warn(`⚠️ Unexpected value type for ${fieldName || 'unknown'}: ${typeof value}`)
  return null
}

// Helper for required fields that should default to 0
function safeNumberRequired(value: unknown, fallback: number = 0): number {
  const result = safeNumber(value)
  return result !== null ? result : fallback
}

// Helper for fields that should be integers (rounds decimal values)
function safeInteger(value: unknown): number | null {
  const result = safeNumber(value)
  return result !== null ? Math.round(result) : null
}

// Helper function to calculate computed fields
function calculateComputedFields(activity: StravaActivity) {
  const startDate = new Date(activity.start_date_local || activity.start_date)
  
  // Calculate week number (1-52)
  const startOfYear = new Date(startDate.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((startDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24) + startOfYear.getDay() + 1) / 7)
  
  // Calculate average pace in seconds per km
  let averagePace = 0
  if (activity.distance && activity.moving_time && activity.distance > 0) {
    const distanceInKm = activity.distance / 1000
    averagePace = activity.moving_time / distanceInKm // seconds per km
  }
  
  // Calculate elevation per km
  let elevationPerKm = 0
  if (activity.distance && activity.total_elevation_gain && activity.distance > 0) {
    const distanceInKm = activity.distance / 1000
    elevationPerKm = activity.total_elevation_gain / distanceInKm
  }
  
  // Calculate efficiency score (average speed)
  const efficiencyScore = safeNumber(activity.average_speed)
  
  return {
    week_number: weekNumber,
    month_number: startDate.getMonth() + 1, // 1-12
    year_number: startDate.getFullYear(),
    day_of_week: startDate.getDay(), // 0-6 (Sunday = 0)
    average_pace: averagePace,
    elevation_per_km: elevationPerKm,
    efficiency_score: efficiencyScore
  }
}

export class StravaActivitySync {
  private supabase = createClient()

  async syncUserActivities(
    userId: string,
    options: { 
      maxActivities?: number, 
      sinceDays?: number, 
      forceRefresh?: boolean 
    } = {},
    serverSupabase?: any // eslint-disable-line @typescript-eslint/no-explicit-any -- External library type
  ) {
    const startTime = Date.now()
    
    try {
      console.log('🔄 Starting sync for user:', userId)
      
      // Use server-side supabase client if provided, otherwise use client-side
      const supabaseClient = serverSupabase || this.supabase
      
      // 🚨 CRITICAL FIX: Update sync state IMMEDIATELY to prevent race conditions
      try {
        const { data: currentSyncState } = await supabaseClient
          .from('sync_state')
          .select('sync_requests_today, total_activities_synced')
          .eq('user_id', userId)
          .single()

        const currentRequestsToday = currentSyncState?.sync_requests_today || 0

        await this.updateSyncState(userId, {
          last_activity_sync: new Date().toISOString(),
          last_sync_date: new Date().toDateString(),
          sync_requests_today: currentRequestsToday + 1,
          consecutive_errors: 0,
          last_error_message: null,
          sync_enabled: true
        }, supabaseClient)
      } catch (syncStateError) {
        console.warn('⚠️ Failed to update sync state immediately:', syncStateError)
      }
      
      // Get user's Strava access token
      const { data: tokenData, error: tokenError } = await supabaseClient
        .from('strava_tokens')
        .select('access_token, expires_at')
        .eq('user_id', userId)
        .single()
      
      if (tokenError || !tokenData?.access_token) {
        throw new Error('No valid Strava token found. Please reconnect your Strava account.')
      }
      
      // Check if token is expired
      if (tokenData.expires_at && new Date(tokenData.expires_at) <= new Date()) {
        throw new Error('Strava token has expired. Please reconnect your Strava account.')
      }
      
      // Determine sync parameters
      const maxActivities = Math.min(options.maxActivities || 50, 200) // API max is 200
      const sinceDays = options.sinceDays || 30
      
      // Calculate 'after' timestamp (Strava uses Unix timestamps)
      const sinceDate = new Date()
      sinceDate.setDate(sinceDate.getDate() - sinceDays)
      const afterTimestamp = Math.floor(sinceDate.getTime() / 1000)
      
      // Fetch activities from Strava API
      const stravaUrl = `https://www.strava.com/api/v3/athlete/activities?after=${afterTimestamp}&per_page=${maxActivities}`
      
      const response = await fetch(stravaUrl, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Strava API error: ${response.status} - ${errorText}`)
      }
      
      const stravaActivities = await response.json()
      console.log(`✅ Fetched ${stravaActivities.length} activities from Strava API`)
      console.log(`📋 Activities to process: ${stravaActivities.map((a: StravaActivity) => a.name).slice(0, 3).join(', ')}${stravaActivities.length > 3 ? '...' : ''}`)
      
      if (!stravaActivities.length) {
        return {
          success: true,
          activitiesProcessed: 0,
          newActivities: 0,
          updatedActivities: 0,
          syncDuration: Date.now() - startTime,
          errors: []
        }
      }
      
      // Process activities one by one
      let activitiesProcessed = 0
      let newActivities = 0
      let updatedActivities = 0
      const errors: string[] = []
      
      for (const stravaActivity of stravaActivities) {
        try {
          const result = await this.storeActivity(userId, stravaActivity, supabaseClient)
          
          if (result.isNew) {
            newActivities++
            console.log(`🆕 NEW: ${stravaActivity.name} (${stravaActivity.id})`)
          } else {
            updatedActivities++
            console.log(`🔄 UPDATED: ${stravaActivity.name} (${stravaActivity.id})`)
          }
          activitiesProcessed++
        } catch (error) {
          const errorMsg = `Failed to process activity ${stravaActivity.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(`❌ ${errorMsg}`)
          errors.push(errorMsg)
        }
      }
      
      console.log(`🎉 Sync completed: ${activitiesProcessed} processed (${newActivities} new, ${updatedActivities} updated)`)
      console.log(`📊 Summary: ${newActivities} new activities, ${updatedActivities} updated activities`)
      
      // Update total activities count (sync state already updated at start)
      try {
        const { data: currentSyncState } = await supabaseClient
          .from('sync_state')
          .select('total_activities_synced')
          .eq('user_id', userId)
          .single()

        const currentTotalActivities = currentSyncState?.total_activities_synced || 0

        await this.updateSyncState(userId, {
          total_activities_synced: currentTotalActivities + activitiesProcessed
        }, supabaseClient)
        // Total activities count updated
      } catch (syncStateError) {
        console.warn('⚠️ Failed to update total activities count:', syncStateError)
      }
      
      return {
        success: true,
        activitiesProcessed,
        newActivities,
        updatedActivities,
        syncDuration: Date.now() - startTime,
        errors
      }
    } catch (error) {
      console.error('❌ Sync failed:', error)
      return {
        success: false,
        activitiesProcessed: 0,
        newActivities: 0,
        updatedActivities: 0,
        syncDuration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async storeActivity(userId: string, activity: StravaActivity, serverSupabase?: any) { // eslint-disable-line @typescript-eslint/no-explicit-any -- External library type
    // Create a clean activity object without any pace-related fields that might interfere
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic property access
    const cleanActivity = { ...activity } as any
    
    // Remove any pace-related fields from Strava that might contain strings
    const paceFieldsToRemove = ['average_pace', 'best_efforts', 'pace', 'splits_metric', 'splits_standard']
    paceFieldsToRemove.forEach(field => {
      if (field in cleanActivity) {
        delete cleanActivity[field]
      }
    })
    
    const computedFields = calculateComputedFields(cleanActivity)
    
    // Map to your EXACT database schema - explicitly handle each field
    const activityData = {
      user_id: userId,
      strava_activity_id: activity.id,
      name: activity.name || '',
      sport_type: activity.sport_type || activity.type || '',
      start_date: activity.start_date,
      start_date_local: activity.start_date_local || activity.start_date,
      timezone: activity.timezone || '',
      // Required fields - use safeNumberRequired with 0 fallback
      distance: safeNumberRequired(activity.distance),
      moving_time: safeNumberRequired(activity.moving_time),
      elapsed_time: safeNumberRequired(activity.elapsed_time),
      // Optional fields - use safeNumber with null fallback
      total_elevation_gain: safeNumber(activity.total_elevation_gain),
      average_speed: safeNumber(activity.average_speed),
      max_speed: safeNumber(activity.max_speed),
      average_heartrate: safeInteger(activity.average_heartrate),
      max_heartrate: safeInteger(activity.max_heartrate),
      has_heartrate: Boolean(activity.has_heartrate),
      average_watts: safeInteger(activity.average_watts),
      max_watts: safeInteger(activity.max_watts),
      weighted_average_watts: safeInteger(activity.weighted_average_watts),
      kilojoules: safeInteger(activity.kilojoules),
      has_power: Boolean(activity.device_watts || activity.average_watts),
      trainer: Boolean(activity.trainer),
      commute: Boolean(activity.commute),
      manual: Boolean(activity.manual),
      achievement_count: safeNumberRequired(activity.achievement_count),
      kudos_count: safeNumberRequired(activity.kudos_count),
      comment_count: safeNumberRequired(activity.comment_count),
      // Computed fields - these override any potential pace strings from Strava
      ...computedFields
    }
    
    // Check for any remaining pace strings in the processed data
    Object.entries(activityData).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes('/km')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (activityData as any)[key] // Dynamic property deletion
      }
    })
    
    // Final safety check: ensure all values are valid for database
    const safeActivityData = Object.fromEntries(
      Object.entries(activityData).filter(([key, value]) => {
        // Filter out any string values that contain pace patterns, but allow dates and other valid strings
        if (typeof value === 'string' && (value.includes('/km') || value.includes('/mi'))) {
          return false
        }
        // Check for pace time patterns (like "07:04") but exclude ISO dates and timezone strings
        if (typeof value === 'string' && value.includes(':') && 
            !key.includes('date') && !key.includes('timezone') && 
            value.match(/^\d{1,2}:\d{2}$/)) {
          return false
        }
        return true
      })
    )
    
    // Use server-side supabase client if provided, otherwise use client-side
    const supabaseClient = serverSupabase || this.supabase
    
    // Check if activity already exists before upsert
    const { data: existingActivity } = await supabaseClient
      .from('activities')
      .select('strava_activity_id')
      .eq('strava_activity_id', activity.id)
      .single()
    
    const isNew = !existingActivity
    
    // Use upsert without specifying onConflict to let the database handle it
    const { data, error } = await supabaseClient
      .from('activities')
      .upsert(safeActivityData, { 
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('Store activity error:', error)
      throw new Error(`Failed to store activity: ${error.message}`)
    }

    // 🎯 GOAL PROGRESS UPDATE DISABLED
    // Removed automatic goal progress updates to focus on core sync functionality
    // Goal progression will be handled separately by the AI-driven goal system

    return {
      data,
      isNew
    }
  }

  // Helper method to update sync state tracking
  private async updateSyncState(
    userId: string, 
    updates: {
      last_activity_sync?: string;
      last_sync_date?: string;
      sync_requests_today?: number;
      total_activities_synced?: number;
      consecutive_errors?: number;
      last_error_message?: string | null;
      sync_enabled?: boolean;
    },
    supabaseClient?: any // eslint-disable-line @typescript-eslint/no-explicit-any -- External library type
  ) {
    const client = supabaseClient || this.supabase
    
    const { error } = await client
      .from('sync_state')
      .upsert({
        user_id: userId,
        ...updates,
      }, {
        onConflict: 'user_id'
      })
    
    if (error) {
      throw new Error(`Failed to update sync state: ${error.message}`)
    }
  }
}

// Export the function for backward compatibility
export async function syncActivities(activities: StravaActivity[], userId: string) {
  const syncService = new StravaActivitySync()
  
  const results = []
  for (const activity of activities) {
    try {
      const result = await syncService.storeActivity(userId, activity)
      results.push(result.data)
    } catch (error) {
      console.error(`Failed to sync activity ${activity.id}:`, error)
      throw error
    }
  }

  return results
} 