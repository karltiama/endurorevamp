import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { StravaAuth } from '@/lib/strava/auth';

export interface StravaConnectionStatus {
  connected: boolean;
  athlete?: {
    id: number;
    firstname?: string;
    lastname?: string;
    profile?: string;
  };
  expiresAt?: string;
}

export interface UseStravaConnectionReturn {
  connectionStatus: StravaConnectionStatus | null;
  isLoading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const STRAVA_CONNECTION_QUERY_KEY = 'strava-connection';

/**
 * Hook to manage Strava connection status
 * Uses React Query for better caching and state management
 */
export function useStravaConnection(): UseStravaConnectionReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: connectionStatus,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: [STRAVA_CONNECTION_QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const stravaAuth = new StravaAuth(false);
      return await stravaAuth.getConnectionStatus(user.id);
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes - longer to prevent frequent checks
    gcTime: 15 * 60 * 1000, // 15 minutes - longer cache retention
    refetchOnWindowFocus: false, // Prevent refetch on window focus which might cause disconnected flash
    refetchOnReconnect: false, // Prevent unnecessary refetch on network reconnect
  });

  const refreshStatus = useCallback(async () => {
    await queryClient.invalidateQueries({ 
      queryKey: [STRAVA_CONNECTION_QUERY_KEY, user?.id] 
    });
    await refetch();
  }, [queryClient, user?.id, refetch]);

  const disconnect = useCallback(async () => {
    if (!user) return;

    try {
      const stravaAuth = new StravaAuth(false);
      await stravaAuth.disconnectUser(user.id);
      
      // Immediately update the cache to reflect disconnection
      queryClient.setQueryData(
        [STRAVA_CONNECTION_QUERY_KEY, user.id], 
        { connected: false }
      );
      
      // Also invalidate to force a fresh fetch
      await queryClient.invalidateQueries({ 
        queryKey: [STRAVA_CONNECTION_QUERY_KEY, user.id] 
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to disconnect';
      console.error('Error disconnecting from Strava:', err);
      throw new Error(errorMsg);
    }
  }, [user, queryClient]);

  const error = queryError ? 
    (queryError instanceof Error ? queryError.message : 'Failed to check connection status') : 
    null;

  return {
    connectionStatus: connectionStatus || null,
    isLoading,
    error,
    refreshStatus,
    disconnect,
  };
}

// Export the query key for use in other hooks
export { STRAVA_CONNECTION_QUERY_KEY }; 