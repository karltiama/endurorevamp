import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface SyncOptions {
  maxActivities?: number
  sinceDays?: number
  forceRefresh?: boolean
}

interface SyncResult {
  success: boolean
  message: string
  data?: {
    activitiesProcessed: number
    newActivities: number
    updatedActivities: number
    syncDuration: number
  }
  errors?: string[]
}

interface SyncStatus {
  syncState: any
  activityCount: number
  canSync: boolean
}

// Helper function to format sync status info
function formatSyncStatusInfo(syncStatus: SyncStatus | undefined) {
  if (!syncStatus) {
    return {
      lastSyncText: 'Never synced',
      canSync: true,
      syncDisabledReason: null,
      activityCount: 0,
      todaySyncs: 0,
      maxSyncs: 5
    }
  }

  const { syncState, activityCount, canSync } = syncStatus

  // Format last sync time
  let lastSyncText = 'Never synced'
  if (syncState?.last_activity_sync) {
    const lastSync = new Date(syncState.last_activity_sync)
    const now = new Date()
    const diffMs = now.getTime() - lastSync.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) {
      lastSyncText = 'Just now'
    } else if (diffMins < 60) {
      lastSyncText = `${diffMins} minutes ago`
    } else if (diffHours < 24) {
      lastSyncText = `${diffHours} hours ago`
    } else if (diffDays === 1) {
      lastSyncText = 'Yesterday'
    } else {
      lastSyncText = `${diffDays} days ago`
    }
  }

  // Determine why sync might be disabled
  let syncDisabledReason = null
  if (!canSync) {
    if (!syncState?.sync_enabled) {
      syncDisabledReason = 'Sync is disabled for your account'
    } else if (syncState?.sync_requests_today >= 5) {
      syncDisabledReason = 'Daily sync limit reached (5/day)'
    } else if (syncState?.last_activity_sync) {
      const lastSync = new Date(syncState.last_activity_sync)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      if (lastSync > oneHourAgo) {
        syncDisabledReason = 'Please wait 1 hour between syncs'
      }
    }
  }

  // Debug logging
  // console.log('useSyncStatusInfo Debug:', {
  //   syncState: {
  //     sync_enabled: syncState?.sync_enabled,
  //     sync_requests_today: syncState?.sync_requests_today,
  //     last_activity_sync: syncState?.last_activity_sync
  //   },
  //   canSync,
  //   syncDisabledReason,
  //   todaySyncs: syncState?.sync_requests_today || 0,
  //   maxSyncs: 5
  // })

  return {
    lastSyncText,
    canSync,
    syncDisabledReason,
    activityCount,
    todaySyncs: syncState?.sync_requests_today || 0,
    maxSyncs: 5,
    consecutiveErrors: syncState?.consecutive_errors || 0,
    lastError: syncState?.last_error_message
  }
}

// Trigger activity sync
async function triggerSync(options: SyncOptions = {}): Promise<SyncResult> {
  const response = await fetch('/api/strava/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Sync failed')
  }

  return response.json()
}

// Get sync status
async function getSyncStatus(): Promise<SyncStatus> {
  const response = await fetch('/api/strava/sync')

  if (!response.ok) {
    throw new Error('Failed to get sync status')
  }

  return response.json()
}

export function useStravaSync() {
  const queryClient = useQueryClient()

  // Query for sync status
  const {
    data: syncStatus,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['strava', 'sync-status'],
    queryFn: getSyncStatus,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch when switching tabs
    refetchOnReconnect: false, // Don't refetch on network reconnect
    retry: false, // Don't retry on error in tests
    // No refetchInterval - only fetch when explicitly requested
  })

  // Mutation for triggering sync
  const {
    mutate: triggerSyncMutation,
    isPending: isSyncing,
    error: syncError,
    data: syncResult
  } = useMutation({
    mutationFn: triggerSync,
    onSuccess: (data) => {
      // Invalidate related queries - comprehensive cache refresh
      queryClient.invalidateQueries({ queryKey: ['strava', 'sync-status'] })
      queryClient.invalidateQueries({ queryKey: ['strava', 'activities'] })
      queryClient.invalidateQueries({ queryKey: ['strava', 'weekly-metrics'] })
      
      // Invalidate database-based queries for consistent UI updates
      queryClient.invalidateQueries({ queryKey: ['user', 'activities'] })
      queryClient.invalidateQueries({ queryKey: ['athlete', 'profile'] })
      queryClient.invalidateQueries({ queryKey: ['training', 'load'] })
      queryClient.invalidateQueries({ queryKey: ['zone-analysis'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => {
      console.error('❌ Sync failed:', error)
    }
  })

  // Helper functions with different sync strategies
  const syncLatest = () => {
    triggerSyncMutation({ maxActivities: 50 })
  }

  const syncLastWeek = () => {
    triggerSyncMutation({ sinceDays: 7, maxActivities: 100 })
  }

  const syncLastMonth = () => {
    triggerSyncMutation({ sinceDays: 30, maxActivities: 200 })
  }

  const forceFullSync = () => {
    triggerSyncMutation({ 
      forceRefresh: false, // Don't bypass rate limits
      maxActivities: 200,
      sinceDays: 90 // Last 3 months
    })
  }

  const customSync = (options: SyncOptions) => {
    triggerSyncMutation(options)
  }

  const refreshStatus = () => {
    refetchStatus()
  }

  const syncStatusInfo = formatSyncStatusInfo(syncStatus)

  return {
    // Status
    syncStatus,
    isLoadingStatus,
    statusError,
    
    // Sync controls
    syncLatest,
    syncLastWeek,
    syncLastMonth,
    forceFullSync,
    customSync,
    
    // Sync state
    isSyncing,
    syncError,
    syncResult,
    
    // Manual controls
    refetchStatus,
    refreshStatus,
    
    // Formatted sync info
    syncStatusInfo
  }
}

// Hook for getting formatted sync information
export function useSyncStatusInfo() {
  const { syncStatus } = useStravaSync()
  return formatSyncStatusInfo(syncStatus)
} 