'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { StravaAuth } from '@/lib/strava/auth';
import type { StravaAuthResponse } from '@/types/strava';

// Consolidated interfaces
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

export interface SyncOptions {
  maxActivities?: number;
  sinceDays?: number;
  forceRefresh?: boolean;
}

export interface SyncResult {
  success: boolean;
  message: string;
  data?: {
    activitiesProcessed: number;
    newActivities: number;
    updatedActivities: number;
    syncDuration: number;
  };
  errors?: string[];
}

export interface SyncStatus {
  syncState: {
    last_activity_sync?: string;
    sync_enabled: boolean;
    sync_requests_today: number;
    consecutive_errors: number;
    last_error_message?: string;
  };
  activityCount: number;
  canSync: boolean;
}

export interface UseStravaManagerReturn {
  // Connection status
  connectionStatus: StravaConnectionStatus | null;
  isCheckingConnection: boolean;
  connectionError: string | null;
  
  // Access token
  accessToken: string | null;
  isLoadingToken: boolean;
  tokenError: string | null;
  
  // Authentication
  authenticateWithCode: (code: string) => void;
  isAuthenticating: boolean;
  authError: string | null;
  
  // Sync operations
  syncStatus: SyncStatus | null;
  isLoadingSyncStatus: boolean;
  syncStatusError: string | null;
  triggerSync: (options?: SyncOptions) => void;
  isSyncing: boolean;
  syncError: string | null;
  syncResult: SyncResult | null;
  
  // Actions
  refreshConnection: () => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Helper sync methods
  syncLatest: () => void;
  syncLastWeek: () => void;
  syncLastMonth: () => void;
  forceFullSync: () => void;
}

// Query keys
const QUERY_KEYS = {
  connection: 'strava-connection',
  token: 'strava-token',
  syncStatus: 'strava-sync-status',
} as const;

/**
 * Unified Strava management hook
 * Consolidates connection, token, auth, and sync operations
 */
export function useStravaManager(): UseStravaManagerReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Connection status query
  const {
    data: connectionStatus,
    isLoading: isCheckingConnection,
    error: connectionQueryError,
    refetch: refetchConnection,
  } = useQuery({
    queryKey: [QUERY_KEYS.connection, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const stravaAuth = new StravaAuth(false);
      return await stravaAuth.getConnectionStatus(user.id);
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Access token query
  const {
    data: accessToken,
    isLoading: isLoadingToken,
    error: tokenQueryError,
    refetch: refetchToken,
  } = useQuery({
    queryKey: [QUERY_KEYS.token, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const stravaAuth = new StravaAuth(false);
      return await stravaAuth.getValidAccessToken(user.id);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Sync status query
  const {
    data: syncStatus,
    isLoading: isLoadingSyncStatus,
    error: syncStatusQueryError,
    refetch: refetchSyncStatus,
  } = useQuery({
    queryKey: [QUERY_KEYS.syncStatus],
    queryFn: async (): Promise<SyncStatus> => {
      const response = await fetch('/api/strava/sync');
      if (!response.ok) {
        throw new Error('Failed to get sync status');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Authentication mutation
  const {
    mutate: authenticateWithCode,
    isPending: isAuthenticating,
    error: authMutationError,
  } = useMutation({
    mutationFn: async (code: string) => {
      if (!code || code.trim() === '') {
        throw new Error('No authorization code provided');
      }

      const response = await fetch('/api/auth/strava/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to exchange token with Strava';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result as { success: boolean; athlete: StravaAuthResponse['athlete'] };
    },
    onSuccess: () => {
      // Invalidate related queries on successful auth
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.connection, user?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.token, user?.id] });
    },
  });

  // Sync mutation
  const {
    mutate: triggerSync,
    isPending: isSyncing,
    error: syncMutationError,
    data: syncResult,
  } = useMutation({
    mutationFn: async (options: SyncOptions = {}): Promise<SyncResult> => {
      const response = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Sync failed');
      }

      return response.json();
    },
    onSuccess: () => {
      // Comprehensive cache invalidation after successful sync
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.syncStatus] });
      queryClient.invalidateQueries({ queryKey: ['strava', 'activities'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'activities'] });
      queryClient.invalidateQueries({ queryKey: ['athlete', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['training', 'load'] });
      queryClient.invalidateQueries({ queryKey: ['zone-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Action callbacks
  const refreshConnection = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.connection, user?.id] });
    await refetchConnection();
  }, [queryClient, user?.id, refetchConnection]);

  const refreshToken = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.token, user?.id] });
    // Also invalidate connection status since token changes affect connection
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.connection, user?.id] });
    await refetchToken();
  }, [queryClient, user?.id, refetchToken]);

  const refreshSyncStatus = useCallback(async () => {
    await refetchSyncStatus();
  }, [refetchSyncStatus]);

  const disconnect = useCallback(async () => {
    if (!user) return;

    try {
      const stravaAuth = new StravaAuth(false);
      await stravaAuth.disconnectUser(user.id);
      
      // Update cache to reflect disconnection
      queryClient.setQueryData([QUERY_KEYS.connection, user.id], { connected: false });
      
      // Invalidate queries to force fresh fetch
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.connection, user.id] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.token, user.id] });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to disconnect';
      console.error('Error disconnecting from Strava:', err);
      throw new Error(errorMsg);
    }
  }, [user, queryClient]);

  // Helper sync methods
  const syncLatest = useCallback(() => triggerSync({ maxActivities: 50 }), [triggerSync]);
  const syncLastWeek = useCallback(() => triggerSync({ sinceDays: 7, maxActivities: 100 }), [triggerSync]);
  const syncLastMonth = useCallback(() => triggerSync({ sinceDays: 30, maxActivities: 200 }), [triggerSync]);
  const forceFullSync = useCallback(() => triggerSync({ 
    forceRefresh: true, 
    maxActivities: 200,
    sinceDays: 90 
  }), [triggerSync]);

  // Error handling
  const connectionError = connectionQueryError ? 
    (connectionQueryError instanceof Error ? connectionQueryError.message : 'Failed to check connection status') : 
    null;

  const tokenError = tokenQueryError ? 
    (tokenQueryError instanceof Error ? tokenQueryError.message : 'Failed to get access token') : 
    null;

  const syncStatusError = syncStatusQueryError ? 
    (syncStatusQueryError instanceof Error ? syncStatusQueryError.message : 'Failed to get sync status') : 
    null;

  const authError = authMutationError ? 
    (authMutationError instanceof Error ? authMutationError.message : 'Authentication failed') : 
    null;

  const syncError = syncMutationError ? 
    (syncMutationError instanceof Error ? syncMutationError.message : 'Sync failed') : 
    null;

  return {
    // Connection status
    connectionStatus: connectionStatus || null,
    isCheckingConnection,
    connectionError,
    
    // Access token
    accessToken: accessToken || null,
    isLoadingToken,
    tokenError,
    
    // Authentication
    authenticateWithCode,
    isAuthenticating,
    authError,
    
    // Sync operations
    syncStatus: syncStatus || null,
    isLoadingSyncStatus,
    syncStatusError,
    triggerSync,
    isSyncing,
    syncError,
    syncResult: syncResult || null,
    
    // Actions
    refreshConnection,
    refreshToken,
    refreshSyncStatus,
    disconnect,
    
    // Helper sync methods
    syncLatest,
    syncLastWeek,
    syncLastMonth,
    forceFullSync,
  };
}

// Export query keys for use in other components
export { QUERY_KEYS as STRAVA_QUERY_KEYS }; 