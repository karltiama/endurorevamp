import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { StravaAuth } from '@/lib/strava/auth';
import { STRAVA_CONNECTION_QUERY_KEY } from './useStravaConnection';

export interface UseStravaTokenReturn {
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
}

const STRAVA_TOKEN_QUERY_KEY = 'strava-token';

/**
 * Hook to get and manage the valid Strava access token
 * Uses React Query for better caching and state management
 */
export function useStravaToken(): UseStravaTokenReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: accessToken,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: [STRAVA_TOKEN_QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const stravaAuth = new StravaAuth(false);
      return await stravaAuth.getValidAccessToken(user.id);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const refreshToken = useCallback(async () => {
    await queryClient.invalidateQueries({ 
      queryKey: [STRAVA_TOKEN_QUERY_KEY, user?.id] 
    });
    // Also invalidate connection status since token changes affect connection
    await queryClient.invalidateQueries({ 
      queryKey: [STRAVA_CONNECTION_QUERY_KEY, user?.id] 
    });
    await refetch();
  }, [queryClient, user?.id, refetch]);

  const error = queryError ? 
    (queryError instanceof Error ? queryError.message : 'Failed to get access token') : 
    null;

  return {
    accessToken: accessToken || null,
    isLoading,
    error,
    refreshToken,
  };
}

// Export the query key for use in other hooks
export { STRAVA_TOKEN_QUERY_KEY }; 