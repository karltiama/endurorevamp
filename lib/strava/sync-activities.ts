import { createClient } from '@/lib/supabase/client'
import type { StravaActivity } from './types'
import { AutomaticGoalProgress } from '@/lib/goals/automatic-progress'

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

  async syncUserActivities() {
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
    // Debug: Log the raw activity data to see what fields contain pace strings
    console.log('🔍 Raw activity data from Strava:', activity)
    
    // Check for any fields that might contain pace strings
    Object.entries(activity).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes('/km')) {
        console.warn(`⚠️ Found pace string in field '${key}': "${value}"`)
      }
    })
    
    // Create a clean activity object without any pace-related fields that might interfere
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cleanActivity = { ...activity } as any // Need dynamic property access for field removal
    
    // Remove any pace-related fields from Strava that might contain strings
    const paceFieldsToRemove = ['average_pace', 'best_efforts', 'pace', 'splits_metric', 'splits_standard']
    paceFieldsToRemove.forEach(field => {
      if (field in cleanActivity) {
        console.log(`🧹 Removing potential pace field: ${field}`)
        delete cleanActivity[field]
      }
    })
    
    console.log('🧹 Cleaned activity (removed pace fields):', cleanActivity)
    
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
    
    // Debug: Log the processed activity data
    console.log('🔍 Processed activity data for database:', activityData)
    
    // Check for any remaining pace strings in the processed data
    Object.entries(activityData).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes('/km')) {
        console.error(`❌ ERROR: Pace string found in processed data field '${key}': "${value}"`)
        console.error('This will cause a database error. Filtering out...')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (activityData as any)[key] // Dynamic property deletion
      }
    })
    
    // Final safety check: ensure all values are valid for database
    const safeActivityData = Object.fromEntries(
      Object.entries(activityData).filter(([key, value]) => {
        // Filter out any string values that contain pace patterns, but allow dates and other valid strings
        if (typeof value === 'string' && (value.includes('/km') || value.includes('/mi'))) {
          console.error(`🚫 Filtering out pace string for ${key}: "${value}"`)
          return false
        }
        // Check for pace time patterns (like "07:04") but exclude ISO dates and timezone strings
        if (typeof value === 'string' && value.includes(':') && 
            !key.includes('date') && !key.includes('timezone') && 
            value.match(/^\d{1,2}:\d{2}$/)) {
          console.error(`🚫 Filtering out pace time pattern for ${key}: "${value}"`)
          return false
        }
        return true
      })
    )

    console.log('🔒 Final safe activity data for database:', safeActivityData)
    
    // Use the correct unique constraint that exists in your database
    const { data, error } = await this.supabase
      .from('activities')
      .upsert(safeActivityData, { 
        onConflict: 'user_id,strava_activity_id', // Use composite constraint columns (order matters)
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

    // 🎯 AUTOMATIC GOAL PROGRESS UPDATE
    // This connects your activities to your goals automatically!
    try {
      await AutomaticGoalProgress.updateProgressFromActivity(userId, {
        ...safeActivityData,
        strava_activity_id: activity.id, // Ensure we have the original activity ID
        start_date: activity.start_date
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any); // Complex activity data structure - interface would be too complex
      console.log(`🎯 Updated goal progress for activity ${activity.id}`);
    } catch (goalError) {
      console.error('Goal progress update failed (non-critical):', goalError);
      // Don't fail the sync if goal update fails - it's supplementary
    }

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