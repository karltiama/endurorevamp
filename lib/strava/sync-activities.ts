import { createClient } from '@/lib/supabase/server';
import { StravaActivity, Activity } from '@/lib/strava/types';
import { TrainingLoadCalculator } from '@/lib/training/training-load';

interface SyncOptions {
  userId: string;
  forceRefresh?: boolean;
  maxActivities?: number;
}

interface SyncResult {
  success: boolean;
  activitiesSynced: number;
  newActivities: number;
  updatedActivities: number;
  errors: string[];
}

interface StravaAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
}

export class StravaActivitySync {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async syncUserActivities(options: {
    maxActivities?: number;
    sinceDays?: number;
    forceRefresh?: boolean;
  } = {}): Promise<{
    success: boolean;
    activitiesProcessed: number;
    newActivities: number;
    updatedActivities: number;
    syncDuration: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    
    const result = await syncStravaActivities({
      userId: this.userId,
      forceRefresh: options.forceRefresh || false,
      maxActivities: options.maxActivities || 200
    });

    const syncDuration = Date.now() - startTime;

    return {
      success: result.success,
      activitiesProcessed: result.activitiesSynced,
      newActivities: result.newActivities,
      updatedActivities: result.updatedActivities,
      syncDuration,
      errors: result.errors
    };
  }

  // Remove the storeActivity method from this class since it should only be called from API routes
  // This method was causing the cookies issue when called from client-side
}

export async function syncStravaActivities(options: SyncOptions): Promise<SyncResult> {
  const { userId, forceRefresh = false, maxActivities = 200 } = options;
  const result: SyncResult = {
    success: false,
    activitiesSynced: 0,
    newActivities: 0,
    updatedActivities: 0,
    errors: []
  };

  try {
    const supabase = await createClient();

    // Get user's Strava tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('strava_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokens) {
      result.errors.push('No Strava tokens found for user');
      return result;
    }

    // Check if token needs refresh
    const now = Math.floor(Date.now() / 1000);
    if (tokens.expires_at <= now || forceRefresh) {
      const refreshResult = await refreshStravaToken(userId, tokens.refresh_token);
      if (!refreshResult.success) {
        result.errors.push('Failed to refresh Strava token');
        return result;
      }
    }

    // Fetch activities from Strava
    const activities = await fetchStravaActivities(tokens.access_token, maxActivities);
    if (!activities) {
      result.errors.push('Failed to fetch activities from Strava');
      return result;
    }

    // Sync activities to database
    const syncResult = await syncActivitiesToDatabase(userId, activities);
    
    // Update sync state after successful sync
    const today = new Date().toDateString()
    const { error: syncStateError } = await supabase
      .from('sync_state')
      .upsert({
        user_id: userId,
        last_activity_sync: new Date().toISOString(),
        last_sync_date: today,
        sync_requests_today: 1, // Will be incremented by existing logic
        total_activities_synced: (syncResult.newActivities + syncResult.updatedActivities),
        sync_enabled: true,
        consecutive_errors: 0,
        last_error_message: null,
        last_error_at: null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })

    if (syncStateError) {
      console.error('Error updating sync state:', syncStateError)
      // Don't fail the sync for sync state update errors
    }
    
    result.success = true;
    result.activitiesSynced = activities.length;
    result.newActivities = syncResult.newActivities;
    result.updatedActivities = syncResult.updatedActivities;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error during sync');
  }

  return result;
}

async function refreshStravaToken(userId: string, refreshToken: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const tokenData: StravaAuthResponse = await response.json();

    // Update tokens in database
    const supabase = await createClient();
    const { error } = await supabase
      .from('strava_tokens')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update tokens: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error refreshing Strava token:', error);
    return { success: false };
  }
}

async function fetchStravaActivities(accessToken: string, maxActivities: number): Promise<StravaActivity[] | null> {
  try {
    console.log(`🔍 Fetching activities from Strava API (max: ${maxActivities})`);
    
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${maxActivities}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ Strava API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch activities: ${response.statusText}`);
    }

    const activities: StravaActivity[] = await response.json();
    
    console.log(`✅ Fetched ${activities.length} activities from Strava`);
    console.log('📅 Activity date range:', {
      newest: activities[0]?.start_date,
      oldest: activities[activities.length - 1]?.start_date,
      total: activities.length
    });
    
    // Log specific activities for debugging
    activities.forEach((activity, index) => {
      if (index < 5 || activity.start_date?.includes('2024-07-22')) {
        console.log(`  ${index + 1}. ID: ${activity.id}, Date: ${activity.start_date}, Name: ${activity.name}`);
      }
    });
    
    return activities;
  } catch (error) {
    console.error('Error fetching Strava activities:', error);
    return null;
  }
}

export async function syncActivitiesToDatabase(userId: string, activities: StravaActivity[]): Promise<{ newActivities: number; updatedActivities: number }> {
  const supabase = await createClient();
  let newActivities = 0;
  let updatedActivities = 0;

  // Initialize training load calculator with default thresholds for TSS calculations
  const defaultThresholds = {
    maxHeartRate: 185, // Default max HR
    restingHeartRate: 60, // Default resting HR
    functionalThresholdPower: 250, // Default FTP for cycling
    lactateThreshold: 157 // Default lactate threshold (85% of max HR)
  }
  const trainingLoadCalculator = new TrainingLoadCalculator(defaultThresholds);

  // Helper function to safely convert values to numbers
  const safeNumber = (value: unknown, defaultValue: number = 0): number => {
    if (value === null || value === undefined) return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Helper function to safely convert values to integers (for database INTEGER fields)
  const safeInteger = (value: unknown, defaultValue: number = 0): number => {
    if (value === null || value === undefined) return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : Math.round(num);
  };

  // Helper function to get week number
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  console.log(`🔄 Starting sync for ${activities.length} activities...`);

  for (const activity of activities) {
    try {
      console.log(`\n🔍 Processing activity: ID ${activity.id}, Date: ${activity.start_date}, Name: "${activity.name}"`);
      
      // Check if activity already exists
      const { data: existingActivity } = await supabase
        .from('activities')
        .select('id')
        .eq('user_id', userId)
        .eq('strava_activity_id', activity.id)
        .maybeSingle();

      if (existingActivity) {
        console.log(`  ⚠️ Activity ${activity.id} already exists in database`);
      } else {
        console.log(`  ➕ Activity ${activity.id} is new - will insert`);
      }

      // Calculate TSS for this activity
      const tss = trainingLoadCalculator.calculateTSS(activity as unknown as Activity);

      const activityData = {
        user_id: userId,
        strava_activity_id: activity.id,
        name: activity.name,
        distance: safeNumber(activity.distance, 0),
        moving_time: safeNumber(activity.moving_time, 0),
        elapsed_time: safeNumber(activity.elapsed_time, 0),
        total_elevation_gain: safeNumber(activity.total_elevation_gain, 0),
        sport_type: activity.sport_type,
        start_date: activity.start_date,
        start_date_local: activity.start_date_local,
        timezone: activity.timezone,
        achievement_count: safeNumber(activity.achievement_count, 0),
        kudos_count: safeNumber(activity.kudos_count, 0),
        comment_count: safeNumber(activity.comment_count, 0),
        trainer: activity.trainer || false,
        commute: activity.commute || false,
        manual: activity.manual || false,
        average_speed: safeNumber(activity.average_speed, 0),
        max_speed: safeNumber(activity.max_speed, 0),
        has_heartrate: activity.has_heartrate || false,
        average_heartrate: safeInteger(activity.average_heartrate, 0),
        max_heartrate: safeInteger(activity.max_heartrate, 0),
        // Power fields that exist in database
        average_watts: safeInteger(activity.average_watts, 0),
        max_watts: safeInteger(activity.max_watts, 0),
        weighted_average_watts: safeInteger(activity.weighted_average_watts, 0),
        kilojoules: safeInteger(activity.kilojoules, 0),
        // Description field for Hevy workout data
        description: activity.description || null,
        // Route data
        summary_polyline: activity.map?.summary_polyline || null,
        polyline: activity.map?.polyline || null,
        map_id: activity.map?.id || null,
        start_latlng: activity.start_latlng ? `${activity.start_latlng[0]},${activity.start_latlng[1]}` : null,
        end_latlng: activity.end_latlng ? `${activity.end_latlng[0]},${activity.end_latlng[1]}` : null,
        // Training metrics
        training_stress_score: safeInteger(tss, 0),
        // Computed fields
        week_number: safeInteger(getWeekNumber(new Date(activity.start_date)), 0),
        month_number: safeInteger(new Date(activity.start_date).getMonth() + 1, 0),
        year_number: safeInteger(new Date(activity.start_date).getFullYear(), 0),
        day_of_week: safeInteger(new Date(activity.start_date).getDay(), 0),
        average_pace: activity.moving_time && activity.distance ? safeNumber(activity.moving_time / (activity.distance / 1000), 0) : null,
        elevation_per_km: activity.total_elevation_gain && activity.distance ? safeNumber(activity.total_elevation_gain / (activity.distance / 1000), 0) : null,
        efficiency_score: safeNumber(activity.average_speed, 0),
        updated_at: new Date().toISOString(),
      };

      if (existingActivity) {
        // Update existing activity
        const { error } = await supabase
          .from('activities')
          .update(activityData)
          .eq('id', existingActivity.id);

        if (error) {
          console.error(`❌ Error updating activity ${activity.id}:`, error);
          console.error(`  Error details:`, error);
        } else {
          updatedActivities++;
          console.log(`✅ Updated activity ${activity.id} (TSS: ${tss})`);
        if (activity.map?.summary_polyline) {
          console.log(`  📍 Route data: Map ID ${activity.map.id}, Polyline length: ${activity.map.summary_polyline.length}`);
        } else {
          console.log(`  📍 No route data for activity ${activity.id}`);
        }
        }
      } else {
        // Insert new activity
        const { error } = await supabase
          .from('activities')
          .insert({
            ...activityData,
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error(`❌ Error inserting activity ${activity.id}:`, error);
          console.error(`  Error details:`, error);
          console.error(`  Activity data:`, activityData);
        } else {
          newActivities++;
          console.log(`✅ Inserted new activity ${activity.id} (TSS: ${tss})`);
      if (activity.map?.summary_polyline) {
        console.log(`  📍 Route data: Map ID ${activity.map.id}, Polyline length: ${activity.map.summary_polyline.length}`);
      } else {
        console.log(`  📍 No route data for activity ${activity.id}`);
      }
        }
      }
    } catch (error) {
      console.error(`❌ Error syncing activity ${activity.id}:`, error);
      console.error(`  Activity details:`, { id: activity.id, name: activity.name, date: activity.start_date });
    }
  }

  console.log(`📊 Sync summary: ${newActivities} new, ${updatedActivities} updated`);
  return { newActivities, updatedActivities };
} 

/**
 * Update existing activities with TSS calculations
 * This ensures all activities have training_stress_score values
 */
export async function updateActivitiesWithTSS(userId: string): Promise<{ updated: number; errors: number }> {
  const supabase = await createClient()
  let updated = 0
  let errors = 0

  // Initialize training load calculator with default thresholds
  const defaultThresholds = {
    maxHeartRate: 185,
    restingHeartRate: 60,
    functionalThresholdPower: 250,
    lactateThreshold: 157
  }
  const trainingLoadCalculator = new TrainingLoadCalculator(defaultThresholds)

  try {
    // Get all activities for this user that don't have TSS
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .is('training_stress_score', null)

    if (error) {
      console.error('Error fetching activities for TSS update:', error)
      return { updated: 0, errors: 1 }
    }

    if (!activities || activities.length === 0) {
      console.log('✅ All activities already have TSS values')
      return { updated: 0, errors: 0 }
    }

    console.log(`🔄 Updating TSS for ${activities.length} activities...`)

    for (const activity of activities) {
      try {
        // Calculate TSS for this activity
        const tss = trainingLoadCalculator.calculateTSS(activity)

        // Update the activity with TSS
        const { error: updateError } = await supabase
          .from('activities')
          .update({ 
            training_stress_score: tss,
            updated_at: new Date().toISOString()
          })
          .eq('id', activity.id)

        if (updateError) {
          console.error(`Error updating TSS for activity ${activity.id}:`, updateError)
          errors++
        } else {
          updated++
          console.log(`✅ Updated TSS for activity ${activity.id}: ${tss}`)
        }
      } catch (error) {
        console.error(`Error processing activity ${activity.id}:`, error)
        errors++
      }
    }

    console.log(`📊 TSS update summary: ${updated} updated, ${errors} errors`)
    return { updated, errors }
  } catch (error) {
    console.error('Error in updateActivitiesWithTSS:', error)
    return { updated: 0, errors: 1 }
  }
} 