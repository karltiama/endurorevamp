'use client'

import { useStravaSync, useSyncStatusInfo } from '@/hooks/use-strava-sync'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FullSyncButton } from '@/components/strava/FullSyncButton'
import { SyncButton } from '@/components/strava/SyncButton'

export default function SyncDashboard() {
  const {
    refreshStatus,
    isSyncing,
    isLoadingStatus
  } = useStravaSync()

  const {
    lastSyncText,
    activityCount,
    todaySyncs,
    maxSyncs
  } = useSyncStatusInfo()

  if (isLoadingStatus) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="h-5 bg-muted rounded mb-2"></div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="animate-pulse space-y-2" data-testid="loading-skeleton">
            <div className="h-3 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Activity Sync</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {/* Status and Stats - Combined and compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshStatus}
              disabled={isLoadingStatus}
              className="text-sm text-muted-foreground hover:text-foreground focus:outline-none"
              title="Refresh sync status"
            >
              <svg className={`w-3 h-3 ${isLoadingStatus ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
              <span className="text-xs text-muted-foreground">
                {isSyncing ? 'Syncing...' : 'Ready'}
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>{activityCount} activities</div>
            <div>{lastSyncText}</div>
          </div>
        </div>

        {/* Daily Sync Counter - Compact */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-blue-700">
              {todaySyncs >= maxSyncs 
                ? 'Daily limit reached'
                : `${maxSyncs - todaySyncs} remaining`
              }
            </div>
            <div className="flex items-center space-x-1">
              <div className="text-sm font-bold text-blue-700">{todaySyncs}</div>
              <div className="text-xs text-blue-500">/ {maxSyncs}</div>
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1 mt-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(todaySyncs / maxSyncs) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Sync Buttons - Compact layout */}
        <div className="space-y-1.5 pt-1 border-t border-gray-100">
          {/* Quick Sync */}
          <div>
            <div className="mb-1">
              <h3 className="text-xs font-medium">Quick Sync</h3>
              <p className="text-xs text-muted-foreground">50 most recent activities</p>
            </div>
            <SyncButton />
          </div>

          {/* Full Sync */}
          <div>
            <div className="mb-1">
              <h3 className="text-xs font-medium">Full Historical Sync</h3>
              <p className="text-xs text-muted-foreground">All activities (may take several minutes)</p>
            </div>
            <FullSyncButton />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 