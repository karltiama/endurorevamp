/**
 * Background Sync Service for Strava Activities
 *
 * This service handles automatic syncing of Strava activities for all users.
 * It's designed to run as a scheduled background job (cron job or similar).
 */

import { createClient } from '@/lib/supabase/server';
import { syncStravaActivities } from './sync-activities';

interface SyncStats {
  totalUsers: number;
  successfulSyncs: number;
  failedSyncs: number;
  tokensRefreshed: number;
  activitiesSynced: number;
  errors: string[];
}

interface BackgroundSyncOptions {
  syncType?: 'quick' | 'week' | 'month';
  maxUsers?: number;
  delayBetweenUsers?: number; // ms
  skipRecentlySynced?: boolean;
  minTimeSinceLastSync?: number; // ms
}

export class BackgroundSyncService {
  private static readonly DEFAULT_OPTIONS: Required<BackgroundSyncOptions> = {
    syncType: 'quick',
    maxUsers: 1000,
    delayBetweenUsers: 1000, // 1 second between users
    skipRecentlySynced: true,
    minTimeSinceLastSync: 2 * 60 * 60 * 1000, // 2 hours
  };

  /**
   * Run background sync for all users with active Strava connections
   */
  static async runBackgroundSync(
    options: BackgroundSyncOptions = {}
  ): Promise<SyncStats> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const stats: SyncStats = {
      totalUsers: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      tokensRefreshed: 0,
      activitiesSynced: 0,
      errors: [],
    };

    console.log('🔄 Starting background sync for all users...');
    const startTime = Date.now();

    try {
      const users = await this.getEligibleUsers(opts);
      stats.totalUsers = users.length;

      console.log(`📊 Found ${users.length} eligible users for sync`);

      for (const user of users) {
        try {
          await this.delay(opts.delayBetweenUsers);

          const result = await this.syncUserActivities(
            user.user_id,
            opts.syncType
          );

          if (result.success) {
            stats.successfulSyncs++;
            stats.activitiesSynced += result.activitiesSynced || 0;

            // Check if token was refreshed during sync
            if (result.tokenRefreshed) {
              stats.tokensRefreshed++;
            }
          } else {
            stats.failedSyncs++;
            stats.errors.push(
              `User ${user.user_id}: ${result.error || 'Unknown error'}`
            );
          }
        } catch (error) {
          stats.failedSyncs++;
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
          stats.errors.push(`User ${user.user_id}: ${errorMsg}`);
          console.error(`❌ Sync failed for user ${user.user_id}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Background sync completed in ${duration}ms`);
      console.log(`📊 Stats:`, stats);

      return stats;
    } catch (error) {
      console.error('❌ Background sync failed:', error);
      stats.errors.push(
        `System error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return stats;
    }
  }

  /**
   * Get users eligible for background sync
   */
  private static async getEligibleUsers(options: BackgroundSyncOptions) {
    const supabase = await createClient();

    let query = supabase
      .from('strava_tokens')
      .select('user_id, last_sync_at, expires_at')
      .order('last_sync_at', { ascending: true, nullsFirst: true });

    if (options.maxUsers) {
      query = query.limit(options.maxUsers);
    }

    const { data: users, error } = await query;

    if (error) {
      throw new Error(`Failed to get eligible users: ${error.message}`);
    }

    if (!users) {
      return [];
    }

    // Filter users based on sync options
    return users.filter(user => {
      if (!options.skipRecentlySynced || !options.minTimeSinceLastSync) {
        return true;
      }

      if (!user.last_sync_at) {
        return true; // Never synced, definitely eligible
      }

      const lastSync = new Date(user.last_sync_at).getTime();
      const timeSinceSync = Date.now() - lastSync;

      return timeSinceSync >= options.minTimeSinceLastSync;
    });
  }

  /**
   * Sync activities for a specific user
   */
  private static async syncUserActivities(userId: string, syncType: string) {
    try {
      console.log(`🔄 Syncing activities for user ${userId}...`);

      const result = await syncStravaActivities({
        userId,
        syncType: syncType === 'quick' ? 'quick' : 'full',
        forceRefresh: false,
      });

      if (result.success) {
        console.log(
          `✅ Sync successful for user ${userId}: ${result.activitiesSynced} activities`
        );

        // Update last sync timestamp
        await this.updateLastSyncTime(userId);
      }

      return {
        success: result.success,
        activitiesSynced: result.activitiesSynced,
        tokenRefreshed: false, // We'd need to track this in syncStravaActivities
        error: result.success ? null : result.errors?.join(', '),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Sync failed for user ${userId}:`, errorMsg);
      return {
        success: false,
        activitiesSynced: 0,
        tokenRefreshed: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Update last sync timestamp for user
   */
  private static async updateLastSyncTime(userId: string) {
    const supabase = await createClient();

    await supabase
      .from('strava_tokens')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  /**
   * Simple delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get sync statistics for monitoring
   */
  static async getSyncStatistics() {
    const supabase = await createClient();

    const { data: stats } = await supabase
      .from('strava_tokens')
      .select('user_id, last_sync_at, expires_at');

    if (!stats) {
      return null;
    }

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    return {
      totalUsers: stats.length,
      recentSyncs: stats.filter(
        s => s.last_sync_at && new Date(s.last_sync_at).getTime() > oneHourAgo
      ).length,
      staleSyncs: stats.filter(
        s => !s.last_sync_at || new Date(s.last_sync_at).getTime() < oneDayAgo
      ).length,
      expiredTokens: stats.filter(
        s => s.expires_at && new Date(s.expires_at).getTime() < now
      ).length,
    };
  }
}

/**
 * API endpoint wrapper for background sync
 */
export async function runScheduledSync() {
  return await BackgroundSyncService.runBackgroundSync({
    syncType: 'quick',
    maxUsers: 100, // Reasonable batch size
    delayBetweenUsers: 500, // 0.5 second between users
    skipRecentlySynced: true,
    minTimeSinceLastSync: 2 * 60 * 60 * 1000, // 2 hours
  });
}
