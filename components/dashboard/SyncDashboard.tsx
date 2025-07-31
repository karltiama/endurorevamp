'use client'

import { useStravaSync, useSyncStatusInfo } from '@/hooks/use-strava-sync'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FullSyncButton } from '@/components/strava/FullSyncButton'

export default function SyncDashboard() {
  const {
    forceFullSync,
    refreshStatus,
    isSyncing,
    syncError,
    syncResult,
    isLoadingStatus
  } = useStravaSync()

  const {
    lastSyncText,
    canSync,
    syncDisabledReason,
    activityCount,
    todaySyncs,
    maxSyncs,
    consecutiveErrors = 0,
    lastError
  } = useSyncStatusInfo()

  if (isLoadingStatus) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="h-5 bg-muted rounded mb-3"></div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3" data-testid="loading-skeleton">
            <div className="h-3 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Activity Sync</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
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
        </div>

        {/* Sync Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs font-medium text-muted-foreground">Last Sync</div>
            <div className="text-sm font-semibold">{lastSyncText}</div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs font-medium text-muted-foreground">Activities</div>
            <div className="text-sm font-semibold">{activityCount}</div>
          </div>
        </div>

        {/* Daily Sync Counter */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-800">Daily Sync Usage</div>
              <div className="text-xs text-blue-600">
                {todaySyncs >= maxSyncs 
                  ? 'Daily limit reached. Try again tomorrow.'
                  : `${maxSyncs - todaySyncs} syncs remaining today`
                }
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-lg font-bold text-blue-700">{todaySyncs}</div>
              <div className="text-sm text-blue-500">/ {maxSyncs}</div>
            </div>
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(todaySyncs / maxSyncs) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Error Display */}
        {consecutiveErrors > 0 && lastError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-red-800">
                {consecutiveErrors === 1 ? 'Last sync failed' : `${consecutiveErrors} failures`}
              </span>
            </div>
            <p className="text-red-700 text-xs mt-1">{lastError}</p>
          </div>
        )}

        {/* Sync Result Display */}
        {syncResult && (
          <div className={`border rounded-lg p-3 ${
            syncResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              <svg className={`h-4 w-4 mr-2 ${
                syncResult.success ? 'text-green-400' : 'text-red-400'
              }`} fill="currentColor" viewBox="0 0 20 20">
                {syncResult.success ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              <span className={`text-sm font-medium ${
                syncResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {syncResult.data ? (
                  `📊 Sync summary: ${syncResult.data.newActivities} new, ${syncResult.data.updatedActivities} updated`
                ) : (
                  syncResult.message
                )}
              </span>
            </div>
            {syncResult.data && syncResult.data.activitiesProcessed > 0 && (
              <div className="text-xs mt-2 text-muted-foreground">
                Processed {syncResult.data.activitiesProcessed} activities in {Math.round(syncResult.data.syncDuration / 1000)}s
              </div>
            )}
            {syncResult.errors && syncResult.errors.length > 0 && (
              <div className="text-xs mt-2">
                <div className="text-red-700 font-medium">Errors:</div>
                <ul className="text-red-600 list-disc list-inside">
                  {syncResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Sync Error Display */}
        {syncError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-red-800">Sync Failed</span>
            </div>
            <p className="text-red-700 text-xs mt-1">{syncError.message}</p>
          </div>
        )}

        {/* Sync Disabled Warning */}
        {!canSync && syncDisabledReason && !syncDisabledReason.includes('Daily sync limit') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-yellow-800">Sync Disabled</span>
            </div>
            <p className="text-yellow-700 text-xs mt-1">{syncDisabledReason}</p>
          </div>
        )}

        {/* Simplified Sync Action */}
        <div className="text-center">
          <div className="mb-3">
            <h3 className="text-sm font-medium mb-1">Sync Your Strava Activities</h3>
            <p className="text-xs text-muted-foreground">
              Import your latest activities from Strava.
            </p>
          </div>
          
          <button
            onClick={forceFullSync}
            disabled={!canSync || isSyncing}
            className={`px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              !canSync 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            } ${isSyncing ? 'opacity-75 cursor-not-allowed' : ''}`}
            data-testid="sync-button"
            data-can-sync={canSync}
            data-is-syncing={isSyncing}
            data-disabled={!canSync || isSyncing}
          >
            {isSyncing ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </div>
            ) : !canSync ? (
              'Daily Limit Reached'
            ) : (
              'Sync Activities'
            )}
          </button>
          
          {!canSync && syncDisabledReason && !syncDisabledReason.includes('Daily sync limit') && (
            <p className="text-xs text-muted-foreground mt-2">{syncDisabledReason}</p>
          )}
        </div>

        {/* Full Sync Section */}
        <div className="border-t pt-4">
          <div className="text-center mb-3">
            <h3 className="text-sm font-medium mb-1">Full Historical Sync</h3>
            <p className="text-xs text-muted-foreground">
              Import ALL your Strava activities (may take several minutes).
            </p>
          </div>
          
          <FullSyncButton />
        </div>
      </CardContent>
    </Card>
  )
} 