import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { StravaAuth } from '@/lib/strava/auth';

export interface UseStravaTokenReturn {
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
}

/**
 * Hook to get and manage the valid Strava access token
 */
export function useStravaToken(): UseStravaTokenReturn {
  const { user } = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshToken = useCallback(async () => {
    if (!user) {
      setAccessToken(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const stravaAuth = new StravaAuth(false);
      const token = await stravaAuth.getValidAccessToken(user.id);
      setAccessToken(token);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get access token';
      setError(errorMsg);
      console.error('Error getting Strava access token:', err);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Get access token on mount and when user changes
  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  return {
    accessToken,
    isLoading,
    error,
    refreshToken,
  };
} 