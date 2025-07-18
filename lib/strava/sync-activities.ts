import { createClient } from '@/lib/supabase/server';
import { Activity as StravaActivity } from '@/lib/strava/types';

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

  async storeActivity(userId: string, activity: StravaActivity): Promise<{
    data: any;
    isNew: boolean;
  }> {
    const supabase = await createClient();
    
    // Check if activity already exists
    const { data: existingActivity } = await supabase
      .from('activities')
      .select('id')
      .eq('user_id', userId)
      .eq('strava_activity_id', activity.id)
      .single();

    const activityData = {
      user_id: userId,
      strava_activity_id: activity.id,
      name: activity.name,
      distance: activity.distance || 0,
      moving_time: activity.moving_time || 0,
      elapsed_time: activity.elapsed_time || 0,
      total_elevation_gain: activity.total_elevation_gain || 0,
      sport_type: activity.sport_type,
      start_date: activity.start_date,
      start_date_local: activity.start_date_local,
      timezone: activity.timezone,
      achievement_count: activity.achievement_count || 0,
      kudos_count: activity.kudos_count || 0,
      comment_count: activity.comment_count || 0,
      athlete_count: activity.athlete_count || 0,
      photo_count: activity.photo_count || 0,
      trainer: activity.trainer || false,
      commute: activity.commute || false,
      manual: activity.manual || false,
      private: activity.private || false,
      gear_id: activity.gear_id,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      average_cadence: activity.average_cadence,
      has_heartrate: activity.has_heartrate || false,
      average_heartrate: activity.average_heartrate,
      max_heartrate: activity.max_heartrate,
      updated_at: new Date().toISOString(),
    };

    if (existingActivity) {
      // Update existing activity
      const { data, error } = await supabase
        .from('activities')
        .update(activityData)
        .eq('id', existingActivity.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update activity: ${error.message}`);
      }

      return { data, isNew: false };
    } else {
      // Insert new activity
      const { data, error } = await supabase
        .from('activities')
        .insert(activityData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to insert activity: ${error.message}`);
      }

      return { data, isNew: true };
    }
  }
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
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${maxActivities}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${response.statusText}`);
    }

    const activities: StravaActivity[] = await response.json();
    return activities;
  } catch (error) {
    console.error('Error fetching Strava activities:', error);
    return null;
  }
}

async function syncActivitiesToDatabase(userId: string, activities: StravaActivity[]): Promise<{ newActivities: number; updatedActivities: number }> {
  const supabase = await createClient();
  let newActivities = 0;
  let updatedActivities = 0;

  for (const activity of activities) {
    try {
      // Check if activity already exists
      const { data: existingActivity } = await supabase
        .from('activities')
        .select('id')
        .eq('user_id', userId)
        .eq('strava_activity_id', activity.id)
        .single();

      const activityData = {
        user_id: userId,
        strava_activity_id: activity.id,
        name: activity.name,
        distance: activity.distance,
        moving_time: activity.moving_time,
        elapsed_time: activity.elapsed_time,
        total_elevation_gain: activity.total_elevation_gain,
        sport_type: activity.sport_type,
        start_date: activity.start_date,
        start_date_local: activity.start_date_local,
        timezone: activity.timezone,
        achievement_count: activity.achievement_count,
        kudos_count: activity.kudos_count,
        comment_count: activity.comment_count,
        athlete_count: activity.athlete_count,
        photo_count: activity.photo_count,
        trainer: activity.trainer,
        commute: activity.commute,
        manual: activity.manual,
        private: activity.private,
        gear_id: activity.gear_id,
        average_speed: activity.average_speed,
        max_speed: activity.max_speed,
        average_cadence: activity.average_cadence,
        has_heartrate: activity.has_heartrate,
        average_heartrate: activity.average_heartrate,
        max_heartrate: activity.max_heartrate,
        updated_at: new Date().toISOString(),
      };

      if (existingActivity) {
        // Update existing activity
        const { error } = await supabase
          .from('activities')
          .update(activityData)
          .eq('id', existingActivity.id);

        if (!error) {
          updatedActivities++;
        }
      } else {
        // Insert new activity
        const { error } = await supabase
          .from('activities')
          .insert({
            ...activityData,
            created_at: new Date().toISOString(),
          });

        if (!error) {
          newActivities++;
        }
      }
    } catch (error) {
      console.error(`Error syncing activity ${activity.id}:`, error);
    }
  }

  return { newActivities, updatedActivities };
} 