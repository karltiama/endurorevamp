import { useState, useEffect, useCallback } from 'react';
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

/**
 * Hook to manage Strava connection status
 * Checks if user is connected and provides connection management
 */
export function useStravaConnection(): UseStravaConnectionReturn {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<StravaConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!user) {
      setConnectionStatus(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const stravaAuth = new StravaAuth(false);
      const status = await stravaAuth.getConnectionStatus(user.id);
      setConnectionStatus(status);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to check connection status';
      setError(errorMsg);
      console.error('Error checking Strava connection:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const disconnect = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const stravaAuth = new StravaAuth(false);
      await stravaAuth.disconnectUser(user.id);
      setConnectionStatus({ connected: false });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to disconnect';
      setError(errorMsg);
      console.error('Error disconnecting from Strava:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Check connection status on mount and when user changes
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    connectionStatus,
    isLoading,
    error,
    refreshStatus,
    disconnect,
  };
} 