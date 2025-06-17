'use client'

import { useState } from 'react'
import { useStravaSync, useSyncStatusInfo } from '@/hooks/use-strava-sync'

export default function SyncDashboard() {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customDays, setCustomDays] = useState(7)
  const [customActivities, setCustomActivities] = useState(50)

  const {
    syncLatest,
    syncLastWeek,
    syncLastMonth,
    forceFullSync,
    customSync,
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
    consecutiveErrors,
    lastError
  } = useSyncStatusInfo()

  const handleCustomSync = () => {
    customSync({
      sinceDays: customDays,
      maxActivities: customActivities
    })
  }

  const handleForceCustomSync = () => {
    customSync({
      sinceDays: customDays,
      maxActivities: customActivities,
      forceRefresh: true // Bypass rate limits for debugging
    })
  }

  if (isLoadingStatus) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Activity Sync</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshStatus}
            disabled={isLoadingStatus}
            className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
            title="Refresh sync status"
          >
            <svg className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isSyncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isSyncing ? 'Syncing...' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600">Last Sync</div>
          <div className="text-lg font-semibold text-gray-900">{lastSyncText}</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600">Total Activities</div>
          <div className="text-lg font-semibold text-gray-900">{activityCount}</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600">Today's Syncs</div>
          <div className="text-lg font-semibold text-gray-900">{todaySyncs}/{maxSyncs}</div>
        </div>
      </div>

      {/* Error Display */}
      {consecutiveErrors > 0 && lastError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-red-800">
              {consecutiveErrors === 1 ? 'Last sync failed' : `${consecutiveErrors} consecutive sync failures`}
            </span>
          </div>
          <p className="text-red-700 text-sm mt-1">{lastError}</p>
        </div>
      )}

      {/* Sync Result Display */}
      {syncResult && (
        <div className={`border rounded-lg p-4 mb-6 ${
          syncResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            <svg className={`h-5 w-5 mr-2 ${
              syncResult.success ? 'text-green-400' : 'text-red-400'
            }`} fill="currentColor" viewBox="0 0 20 20">
              {syncResult.success ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              )}
            </svg>
            <span className={`font-medium ${
              syncResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {syncResult.message}
            </span>
          </div>
          {syncResult.data && (
            <div className="text-sm mt-2 space-y-1">
              <div className="text-gray-600">
                Processed {syncResult.data.activitiesProcessed} activities 
                ({syncResult.data.newActivities} new, {syncResult.data.updatedActivities} updated)
              </div>
              <div className="text-gray-600">
                Completed in {Math.round(syncResult.data.syncDuration / 1000)}s
              </div>
            </div>
          )}
          {syncResult.errors && syncResult.errors.length > 0 && (
            <div className="text-sm mt-2">
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-red-800">Sync Failed</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{syncError.message}</p>
        </div>
      )}

      {/* Sync Disabled Warning */}
      {!canSync && syncDisabledReason && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-yellow-800">Sync Temporarily Disabled</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">{syncDisabledReason}</p>
        </div>
      )}

      {/* Quick Sync Actions */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Sync Options</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={syncLatest}
            disabled={!canSync || isSyncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? 'Syncing...' : 'Latest (50)'}
          </button>
          
          <button
            onClick={syncLastWeek}
            disabled={!canSync || isSyncing}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last Week
          </button>
          
          <button
            onClick={syncLastMonth}
            disabled={!canSync || isSyncing}
            className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last Month
          </button>
          
          <button
            onClick={forceFullSync}
            disabled={!canSync || isSyncing}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Full Sync
          </button>
        </div>
      </div>

      {/* Advanced Options */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-3"
        >
          <svg className={`h-4 w-4 mr-1 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Advanced Options
        </button>

        {showAdvanced && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days to sync
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  onChange={(e) => setCustomDays(parseInt(e.target.value) || 7)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max activities
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={customActivities}
                  onChange={(e) => setCustomActivities(parseInt(e.target.value) || 50)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleCustomSync}
                disabled={!canSync || isSyncing}
                className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Custom Sync
              </button>
              
              <button
                onClick={handleForceCustomSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Bypasses rate limits - for debugging missing activities"
              >
                🚨 Force Sync
              </button>
                         </div>
          </div>
        )}
      </div>
    </div>
  )
} 