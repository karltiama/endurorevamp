import { 
  StravaAthlete, 
  StravaActivity, 
  AthleteProfile, 
  Activity, 
  SyncState, 
  SyncOptions, 
  SyncResult 
} from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Main sync service for Strava data
 * Handles duplicate prevention and smart updates
 */
export class StravaSync {
  private accessToken: string;
  private supabaseClient: SupabaseClient | null = null;
  private isServer: boolean;

  constructor(accessToken: string, isServer = false) {
    this.accessToken = accessToken;
    this.isServer = isServer;
  }

  private async getSupabase(): Promise<SupabaseClient> {
    if (!this.supabaseClient) {
      if (this.isServer) {
        const { createClient } = await import('@/lib/supabase/server');
        this.supabaseClient = await createClient();
      } else {
        const { createClient: createBrowserClient } = await import('@/lib/supabase/client');
        this.supabaseClient = createBrowserClient();
      }
    }
    return this.supabaseClient!; // Non-null assertion since we just set it
  }

  /**
   * Full sync: Profile + Activities
   */
  async syncAll(userId: string, options: SyncOptions = {}): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      activitiesProcessed: 0,
      profileUpdated: false,
      errors: [],
    };

    try {
      // Get or create sync state
      const syncState = await this.getSyncState(userId);
      
      // Check if we should sync (avoid unnecessary API calls)
      if (!this.shouldSync(syncState, options)) {
        result.success = true;
        return result;
      }

      // 1. Sync athlete profile
      const profileResult = await this.syncAthleteProfile(userId);
      result.profileUpdated = profileResult;

      // 2. Sync activities
      const activitiesResult = await this.syncActivities(userId, options);
      result.activitiesProcessed = activitiesResult.count;
      
      // Update sync state
      await this.updateSyncState(userId, {
        last_activity_sync: new Date().toISOString(),
        last_profile_sync: new Date().toISOString(),
        activities_synced_count: (syncState?.activities_synced_count || 0) + activitiesResult.count,
        consecutive_errors: 0,
        last_sync_error: null,
      });

      result.success = true;
    } catch (error) {
      console.error('Sync error:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      // Track errors in sync state
      await this.updateSyncState(userId, {
        last_sync_error: { error: error instanceof Error ? error.message : 'Unknown error' },
        consecutive_errors: ((await this.getSyncState(userId))?.consecutive_errors || 0) + 1,
      });
    }

    return result;
  }

  /**
   * Sync athlete profile (prevents unnecessary updates)
   */
  async syncAthleteProfile(userId: string): Promise<boolean> {
    try {
      // Fetch from Strava API
      const stravaAthlete = await this.fetchStravaAthlete();
      
      // Check if profile exists and if update is needed
      const supabase = await this.getSupabase();
      const { data: existingProfile } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const profileData: Partial<AthleteProfile> = {
        user_id: userId,
        strava_athlete_id: stravaAthlete.id,
        firstname: stravaAthlete.firstname,
        lastname: stravaAthlete.lastname,
        username: stravaAthlete.username,
        city: stravaAthlete.city,
        state: stravaAthlete.state,
        country: stravaAthlete.country,
        sex: stravaAthlete.sex,
        premium: stravaAthlete.premium,
        ftp: stravaAthlete.ftp,
        weight: stravaAthlete.weight,
        profile_medium: stravaAthlete.profile_medium,
        profile_large: stravaAthlete.profile,
        strava_created_at: stravaAthlete.created_at,
        strava_updated_at: stravaAthlete.updated_at,
        last_synced_at: new Date().toISOString(),
      };

      if (!existingProfile) {
        // Create new profile
        const { error } = await supabase
          .from('athlete_profiles')
          .insert(profileData);
        
        if (error) throw error;
        return true;
      } else {
        // Check if update is needed (avoid unnecessary writes)
        if (this.profileNeedsUpdate(existingProfile, profileData)) {
          const { error } = await supabase
            .from('athlete_profiles')
            .update(profileData)
            .eq('user_id', userId);
          
          if (error) throw error;
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Profile sync error:', error);
      throw error;
    }
  }

  /**
   * Sync activities with smart duplicate prevention
   */
  async syncActivities(
    userId: string, 
    options: SyncOptions = {}
  ): Promise<{ count: number; lastActivityId?: number }> {
    try {
      const syncState = await this.getSyncState(userId);
      let activitiesProcessed = 0;
      let lastActivityId: number | undefined;

      // Determine sync parameters
      const since = this.calculateSinceTimestamp(syncState, options);
      const perPage = Math.min(options.maxActivities || 30, 200); // API max is 200

      // Fetch activities from Strava
      const stravaActivities = await this.fetchStravaActivities({
        after: since,
        per_page: perPage,
      });

      if (!stravaActivities.length) {
        return { count: 0 };
      }

      // Process activities in batch
      for (const stravaActivity of stravaActivities) {
        const wasProcessed = await this.processActivity(userId, stravaActivity, options.forceRefresh);
        if (wasProcessed) {
          activitiesProcessed++;
        }
        lastActivityId = stravaActivity.id;
      }

      return { count: activitiesProcessed, lastActivityId };
    } catch (error) {
      console.error('Activities sync error:', error);
      throw error;
    }
  }

  /**
   * Process single activity (upsert with conflict resolution)
   */
  private async processActivity(
    userId: string, 
    stravaActivity: StravaActivity, 
    forceUpdate = false
  ): Promise<boolean> {
    try {
      // Check if activity already exists
      const supabase = await this.getSupabase();
      const { data: existingActivity } = await supabase
        .from('activities')
        .select('strava_activity_id, last_synced_at')
        .eq('strava_activity_id', stravaActivity.id)
        .eq('user_id', userId)
        .single();

      const activityData: Partial<Activity> = {
        user_id: userId,
        strava_activity_id: stravaActivity.id,
        name: stravaActivity.name,
        sport_type: stravaActivity.sport_type,
        activity_type: stravaActivity.type,
        distance: stravaActivity.distance,
        moving_time: stravaActivity.moving_time,
        elapsed_time: stravaActivity.elapsed_time,
        total_elevation_gain: stravaActivity.total_elevation_gain,
        start_date: stravaActivity.start_date,
        start_date_local: stravaActivity.start_date_local,
        timezone: stravaActivity.timezone,
        
        // Performance metrics
        average_speed: stravaActivity.average_speed,
        max_speed: stravaActivity.max_speed,
        average_heartrate: stravaActivity.average_heartrate,
        max_heartrate: stravaActivity.max_heartrate,
        average_watts: stravaActivity.average_watts,
        weighted_average_watts: stravaActivity.weighted_average_watts,
        max_watts: stravaActivity.max_watts,
        average_cadence: stravaActivity.average_cadence,
        kilojoules: stravaActivity.kilojoules,
        
        // Convert lat/lng arrays to PostGIS POINT format
        start_latlng: stravaActivity.start_latlng 
          ? `POINT(${stravaActivity.start_latlng[1]} ${stravaActivity.start_latlng[0]})`
          : undefined,
        end_latlng: stravaActivity.end_latlng 
          ? `POINT(${stravaActivity.end_latlng[1]} ${stravaActivity.end_latlng[0]})`
          : undefined,
        
        // Characteristics
        trainer: stravaActivity.trainer,
        commute: stravaActivity.commute,
        manual: stravaActivity.manual,
        private: stravaActivity.private,
        device_name: stravaActivity.device_name,
        device_watts: stravaActivity.device_watts,
        has_heartrate: stravaActivity.has_heartrate,
        
        // Social metrics
        kudos_count: stravaActivity.kudos_count,
        comment_count: stravaActivity.comment_count,
        athlete_count: stravaActivity.athlete_count,
        photo_count: stravaActivity.photo_count,
        achievement_count: stravaActivity.achievement_count,
        pr_count: stravaActivity.pr_count,
        
        // Additional
        calories: stravaActivity.calories,
        description: stravaActivity.description,
        gear_id: stravaActivity.gear_id,
        
        last_synced_at: new Date().toISOString(),
      };

      if (!existingActivity) {
        // Insert new activity
        const { error } = await supabase
          .from('activities')
          .insert(activityData);
        
        if (error) throw error;
        return true;
      } else if (forceUpdate || this.activityNeedsUpdate(existingActivity, activityData)) {
        // Update existing activity
        const { error } = await supabase
          .from('activities')
          .update(activityData)
          .eq('strava_activity_id', stravaActivity.id)
          .eq('user_id', userId);
        
        if (error) throw error;
        return true;
      }

      return false; // No update needed
    } catch (error) {
      console.error(`Error processing activity ${stravaActivity.id}:`, error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  
  private async getSyncState(userId: string): Promise<SyncState | null> {
    const supabase = await this.getSupabase();
    const { data } = await supabase
      .from('sync_state')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return data;
  }

  private async updateSyncState(userId: string, updates: Partial<SyncState>) {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('sync_state')
      .upsert({
        user_id: userId,
        ...updates,
      }, {
        onConflict: 'user_id'
      });
    
    if (error) throw error;
  }

  private shouldSync(syncState: SyncState | null, options: SyncOptions): boolean {
    if (options.forceRefresh) return true;
    if (!syncState?.last_activity_sync) return true;
    
    const lastSync = new Date(syncState.last_activity_sync);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    
    // Sync at most every 1 hour unless forced
    return hoursSinceSync >= 1;
  }

  private calculateSinceTimestamp(syncState: SyncState | null, options: SyncOptions): number {
    if (options.sinceDays) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - options.sinceDays);
      return Math.floor(daysAgo.getTime() / 1000);
    }
    
    if (syncState?.last_activity_sync) {
      return Math.floor(new Date(syncState.last_activity_sync).getTime() / 1000);
    }
    
    // Default: last 30 days for first sync
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return Math.floor(thirtyDaysAgo.getTime() / 1000);
  }

  private profileNeedsUpdate(existing: any, updated: any): boolean {
    const fieldsToCheck = [
      'firstname', 'lastname', 'username', 'city', 'state', 'country',
      'ftp', 'weight', 'premium', 'profile_medium', 'profile_large'
    ];
    
    return fieldsToCheck.some(field => existing[field] !== updated[field]);
  }

  private activityNeedsUpdate(existing: any, updated: any): boolean {
    // Check if activity was synced more than 24 hours ago
    const lastSync = new Date(existing.last_synced_at);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    
    // Update if it's been more than 24 hours (social metrics may have changed)
    return hoursSinceSync >= 24;
  }

  /**
   * Strava API calls
   */
  
  private async fetchStravaAthlete(): Promise<StravaAthlete> {
    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch athlete: ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchStravaActivities(params: {
    after?: number;
    per_page?: number;
    page?: number;
  } = {}): Promise<StravaActivity[]> {
    const searchParams = new URLSearchParams();
    
    if (params.after) searchParams.append('after', params.after.toString());
    if (params.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params.page) searchParams.append('page', params.page.toString());

    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${response.statusText}`);
    }

    return response.json();
  }
} 