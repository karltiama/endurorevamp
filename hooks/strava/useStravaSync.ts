import { useState, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { StravaSync } from '@/lib/strava/sync';
import { StravaAuth } from '@/lib/strava/auth';
import { SyncOptions, SyncResult } from '@/lib/strava/types';

export interface UseStravaSyncReturn {
  syncData: (options?: SyncOptions) => Promise<SyncResult>;
  isLoading: boolean;
  lastSyncResult: SyncResult | null;
  error: string | null;
}

/**
 * Hook for syncing Strava data
 * Handles authentication and provides sync state
 */
export function useStravaSync(): UseStravaSyncReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncData = useCallback(async (options: SyncOptions = {}) => {
    if (!user) {
      const errorMsg = 'User must be authenticated';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get access token from stored Strava tokens
      const stravaAuth = new StravaAuth(false);
      const accessToken = await stravaAuth.getValidAccessToken(user.id);
      
      if (!accessToken) {
        const errorMsg = 'Strava not connected. Please connect your Strava account.';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      const stravaSync = new StravaSync(accessToken, false);
      const result = await stravaSync.syncAll(user.id, options);
      
      setLastSyncResult(result);
      
      if (!result.success) {
        const errorMsg = result.errors.join(', ') || 'Sync failed';
        setError(errorMsg);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown sync error';
      setError(errorMsg);
      
      const failedResult: SyncResult = {
        success: false,
        activitiesProcessed: 0,
        profileUpdated: false,
        errors: [errorMsg],
      };
      
      setLastSyncResult(failedResult);
      return failedResult;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    syncData,
    isLoading,
    lastSyncResult,
    error,
  };
}

 