import { createClient } from '@/lib/supabase/client'
import type { StravaActivity } from './types'

// Helper function to safely convert values to numbers
function safeNumber(value: any, fieldName?: string): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return isNaN(value) ? null : value
  if (typeof value === 'string') {
    // Handle pace strings like "07:04 /km" 
    if (value.includes('/km')) {
      // Convert pace string to seconds per km
      const timeMatch = value.match(/(\d{1,2}):(\d{2})/)
      if (timeMatch) {
        const minutes = parseInt(timeMatch[1])
        const seconds = parseInt(timeMatch[2])
        return (minutes * 60) + seconds // Return total seconds per km
      }
      return null
    }
    const parsed = parseFloat(value)
    return isNaN(parsed) ? null : parsed
  }
  return null
}

// Helper for required fields that should default to 0
function safeNumberRequired(value: any, fallback: number = 0): number {
  const result = safeNumber(value)
  return result !== null ? result : fallback
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

  async syncUserActivities(userId: string, options: any = {}) {
    const startTime = Date.now()
    
    try {
      // For now, return a basic success response
      // This method should be expanded to handle the full sync logic
      return {
        success: true,
        activitiesProcessed: 0,
        newActivities: 0,
        updatedActivities: 0,
        syncDuration: Date.now() - startTime,
        errors: []
      }
    } catch (error) {
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

  async storeActivity(userId: string, activity: StravaActivity) {
    const computedFields = calculateComputedFields(activity)
    
    // Map to your EXACT database schema
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
      average_heartrate: safeNumber(activity.average_heartrate),
      max_heartrate: safeNumber(activity.max_heartrate),
      has_heartrate: Boolean(activity.has_heartrate),
      average_watts: safeNumber(activity.average_watts),
      max_watts: safeNumber(activity.max_watts),
      weighted_average_watts: safeNumber(activity.weighted_average_watts),
      kilojoules: safeNumber(activity.kilojoules),
      has_power: Boolean(activity.device_watts || activity.average_watts),
      trainer: Boolean(activity.trainer),
      commute: Boolean(activity.commute),
      manual: Boolean(activity.manual),
      achievement_count: safeNumberRequired(activity.achievement_count),
      kudos_count: safeNumberRequired(activity.kudos_count),
      comment_count: safeNumberRequired(activity.comment_count),
      // Computed fields
      ...computedFields
    }

    // Use the correct unique constraint that exists in your database
    const { data, error } = await this.supabase
      .from('activities')
      .upsert(activityData, { 
        onConflict: 'strava_activity_id', // Use actual constraint from schema analysis
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('Store activity error:', error)
      throw new Error(`Failed to store activity: ${error.message}`)
    }

    // Determine if this was a new activity or update
    const isNew = data.created_at === data.updated_at

    return {
      data,
      isNew
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