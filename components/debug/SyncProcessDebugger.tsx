'use client'
/* eslint-disable react/no-unescaped-entities */

import { useState, useMemo } from 'react'
import { useStravaSync, useSyncStatusInfo } from '@/hooks/use-strava-sync'
import { SyncStateManipulator } from './SyncStateManipulator'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

interface DebugStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  details?: string
  error?: string
  timestamp?: Date
}

export function SyncProcessDebugger() {
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([])
  const [isRunning, setIsRunning] = useState(false)
  
  const {
    syncStatus,
    isLoadingStatus,
    statusError,
    refreshStatus,
    isSyncing,
    syncError,
    syncResult
  } = useStravaSync()

  const {
    canSync,
    syncDisabledReason,
    activityCount,
    todaySyncs,
    maxSyncs,
    consecutiveErrors,
    lastError
  } = useSyncStatusInfo()

  const queryClient = useQueryClient()

  const addStep = (step: Omit<DebugStep, 'timestamp'>) => {
    setDebugSteps(prev => [...prev, { ...step, timestamp: new Date() }])
  }

  const updateStep = (id: string, updates: Partial<DebugStep>) => {
    setDebugSteps(prev => 
      prev.map(step => 
        step.id === id ? { ...step, ...updates } : step
      )
    )
  }

  const runFullDebug = async () => {
    setIsRunning(true)
    setDebugSteps([])

    try {
      // Step 1: Check initial state
      addStep({
        id: 'initial-state',
        name: 'Check Initial State',
        status: 'running',
        details: 'Analyzing current sync status and configuration'
      })

      console.log('🔍 Debug: Initial State', {
        syncStatus,
        isLoadingStatus,
        statusError,
        canSync,
        syncDisabledReason,
        todaySyncs,
        maxSyncs,
        consecutiveErrors,
        lastError
      })

      updateStep('initial-state', {
        status: 'success',
        details: `Status loaded. canSync: ${canSync}, todaySyncs: ${todaySyncs}/${maxSyncs}, disabled: ${syncDisabledReason || 'none'}`
      })

      // Step 2: Check if sync is possible
      addStep({
        id: 'sync-possibility',
        name: 'Check Sync Possibility',
        status: 'running',
        details: 'Determining if sync can be performed'
      })

      if (!canSync) {
        updateStep('sync-possibility', {
          status: 'error',
          details: `Sync not possible: ${syncDisabledReason}`,
          error: syncDisabledReason || 'Unknown reason'
        })
        setIsRunning(false)
        return
      }

      updateStep('sync-possibility', {
        status: 'success',
        details: 'Sync is possible and allowed'
      })

      // Step 3: Check current database state
      addStep({
        id: 'database-check',
        name: 'Check Current Database State',
        status: 'running',
        details: 'Checking what activities are currently in the database'
      })

      // Get current activities from database
      const supabase = createClient()
      const { data: currentActivities, error: dbError } = await supabase
        .from('activities')
        .select('id, name, sport_type, start_date_local, strava_activity_id')
        .order('start_date', { ascending: false })
        .limit(10)

      if (dbError) {
        updateStep('database-check', {
          status: 'error',
          details: `Database error: ${dbError.message}`,
          error: dbError.message
        })
        setIsRunning(false)
        return
      }

      updateStep('database-check', {
        status: 'success',
        details: `Database has ${currentActivities?.length || 0} activities. Latest: ${currentActivities?.[0]?.name || 'None'}`
      })

      // Step 4: Attempt sync
      addStep({
        id: 'sync-attempt',
        name: 'Attempt Sync',
        status: 'running',
        details: 'Triggering sync operation to fetch latest activities'
      })

      console.log('🔄 Debug: Starting sync...')
      
      // Actually trigger the sync
      try {
        const syncResponse = await fetch('/api/strava/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            maxActivities: 50,
            forceRefresh: false
          })
        })

        if (!syncResponse.ok) {
          const syncError = await syncResponse.json()
          updateStep('sync-attempt', {
            status: 'error',
            details: `Sync failed: ${syncError.message || 'Unknown error'}`,
            error: syncError.message || 'Unknown error'
          })
          setIsRunning(false)
          return
        }

        const syncResult = await syncResponse.json()
        updateStep('sync-attempt', {
          status: 'success',
          details: `Sync completed: ${syncResult.data?.activitiesProcessed || 0} activities processed, ${syncResult.data?.newActivities || 0} new, ${syncResult.data?.updatedActivities || 0} updated`
        })

      } catch (syncError) {
        updateStep('sync-attempt', {
          status: 'error',
          details: `Sync error: ${syncError instanceof Error ? syncError.message : 'Unknown error'}`,
          error: syncError instanceof Error ? syncError.message : 'Unknown error'
        })
        setIsRunning(false)
        return
      }

      // Step 5: Check database after sync
      addStep({
        id: 'post-sync-check',
        name: 'Check Database After Sync',
        status: 'running',
        details: 'Verifying activities were added to database'
      })

      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check database again
      const { data: updatedActivities, error: updatedDbError } = await supabase
        .from('activities')
        .select('id, name, sport_type, start_date_local, strava_activity_id')
        .order('start_date', { ascending: false })
        .limit(10)

      if (updatedDbError) {
        updateStep('post-sync-check', {
          status: 'error',
          details: `Database error after sync: ${updatedDbError.message}`,
          error: updatedDbError.message
        })
      } else {
        const newCount = (updatedActivities?.length || 0) - (currentActivities?.length || 0)
        updateStep('post-sync-check', {
          status: 'success',
          details: `Database updated: ${updatedActivities?.length || 0} total activities (${newCount > 0 ? `+${newCount} new` : 'no change'}). Latest: ${updatedActivities?.[0]?.name || 'None'}`
        })
      }

      // Step 6: Check React Query cache
      addStep({
        id: 'cache-check',
        name: 'Check React Query Cache',
        status: 'running',
        details: 'Verifying that components will see updated data'
      })

      // Invalidate cache to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['user', 'activities'] })
      queryClient.invalidateQueries({ queryKey: ['strava', 'sync-status'] })

      updateStep('cache-check', {
        status: 'success',
        details: 'Cache invalidated. Components should now show updated data.'
      })

      // Step 7: Final state check
      addStep({
        id: 'final-state',
        name: 'Check Final State',
        status: 'running',
        details: 'Verifying final sync state and activity count'
      })

      // Refresh status to get updated values
      refreshStatus()

      setTimeout(() => {
        updateStep('final-state', {
          status: 'success',
          details: `Final state: ${activityCount} activities, ${todaySyncs}/${maxSyncs} syncs today. Check your dashboard components now!`
        })
        setIsRunning(false)
      }, 1000)

    } catch (error) {
      addStep({
        id: 'debug-error',
        name: 'Debug Error',
        status: 'error',
        details: 'An error occurred during debugging',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      setIsRunning(false)
    }
  }

  const clearDebug = () => {
    setDebugSteps([])
  }

  const getStepIcon = (status: DebugStep['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'running': return '🔄'
      case 'success': return '✅'
      case 'error': return '❌'
      default: return '⏳'
    }
  }

  const getStepColor = (status: DebugStep['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500'
      case 'running': return 'text-blue-600'
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-500'
    }
  }

  const rawDataJson = useMemo(() => {
    return JSON.stringify({
      syncStatus,
      isLoadingStatus,
      statusError,
      canSync,
      syncDisabledReason,
      activityCount,
      todaySyncs,
      maxSyncs,
      consecutiveErrors,
      lastError,
      isSyncing,
      syncError,
      syncResult
    }, null, 2);
  }, [syncStatus, isLoadingStatus, statusError, canSync, syncDisabledReason, activityCount, todaySyncs, maxSyncs, consecutiveErrors, lastError, isSyncing, syncError, syncResult]);

  // Add state for activities data
  const [activitiesData, setActivitiesData] = useState<Array<{
    id: string
    name: string
    sport_type: string
    start_date_local: string
    strava_activity_id: number
    distance: number
    moving_time: number
  }>>([])

  const checkActivities = async () => {
    const supabase = createClient()
    const { data: activities, error } = await supabase
      .from('activities')
      .select('id, name, sport_type, start_date_local, strava_activity_id, distance, moving_time')
      .order('start_date', { ascending: false })
      .limit(10)
    
    if (!error && activities) {
      setActivitiesData(activities)
    }
  }

  const checkTokenStatus = async () => {
    addStep({
      id: 'token-status',
      name: 'Check Token Status',
      status: 'running',
      details: 'Checking if Strava tokens are valid'
    })

    try {
      const supabase = createClient()
      const { data: tokens, error: tokenError } = await supabase
        .from('strava_tokens')
        .select('*')
        .single()

      if (tokenError) {
        updateStep('token-status', {
          status: 'error',
          details: `No tokens found: ${tokenError.message}`,
          error: 'No Strava tokens in database'
        })
        return
      }

      const now = Math.floor(Date.now() / 1000)
      const isExpired = tokens.expires_at <= now
      const timeUntilExpiry = tokens.expires_at - now

      console.log('🔑 Token status:', {
        hasTokens: !!tokens,
        expiresAt: new Date(tokens.expires_at * 1000).toISOString(),
        isExpired,
        timeUntilExpiry: Math.floor(timeUntilExpiry / 60) + ' minutes'
      })

      if (isExpired) {
        updateStep('token-status', {
          status: 'error',
          details: `Tokens expired ${Math.abs(Math.floor(timeUntilExpiry / 60))} minutes ago. Need to re-authenticate.`,
          error: 'Tokens expired'
        })
      } else {
        updateStep('token-status', {
          status: 'success',
          details: `Tokens valid for ${Math.floor(timeUntilExpiry / 60)} more minutes`
        })
      }

    } catch (error) {
      updateStep('token-status', {
        status: 'error',
        details: `Token check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const debugMissingActivity = async () => {
    addStep({
      id: 'missing-activity-debug',
      name: 'Debug Missing 7/22 Activity',
      status: 'running',
      details: 'Checking specifically for missing 7/22 workout'
    })

    try {
      // Step 1: Check if activity exists in database
      const supabase = createClient()
      const { data: dbActivities, error: dbError } = await supabase
        .from('activities')
        .select('id, name, sport_type, start_date_local, strava_activity_id')
        .gte('start_date_local', '2024-07-22')
        .lte('start_date_local', '2024-07-22T23:59:59')
        .order('start_date_local', { ascending: false })

      if (dbError) {
        updateStep('missing-activity-debug', {
          status: 'error',
          details: `Database error: ${dbError.message}`,
          error: dbError.message
        })
        return
      }

      console.log('🔍 Database activities on 7/22:', dbActivities)

      if (dbActivities && dbActivities.length > 0) {
        updateStep('missing-activity-debug', {
          status: 'success',
          details: `Found ${dbActivities.length} activities on 7/22 in database. Activity is already synced!`
        })
        return
      }

      updateStep('missing-activity-debug', {
        status: 'running',
        details: 'No 7/22 activities in database. Checking Strava API...'
      })

      // Step 2: Check Strava API directly
      try {
        const apiResponse = await fetch('/api/strava/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            maxActivities: 200,
            forceRefresh: true
          })
        })

        if (!apiResponse.ok) {
          const apiError = await apiResponse.json()
          updateStep('missing-activity-debug', {
            status: 'error',
            details: `API sync failed: ${apiError.message || 'Unknown error'}`,
            error: apiError.message || 'Unknown error'
          })
          return
        }

        const apiResult = await apiResponse.json()
        console.log('🔄 API sync result:', apiResult)

        // Step 3: Check database again after sync
        await new Promise(resolve => setTimeout(resolve, 2000))

        const { data: updatedDbActivities, error: updatedDbError } = await supabase
          .from('activities')
          .select('id, name, sport_type, start_date_local, strava_activity_id')
          .gte('start_date_local', '2024-07-22')
          .lte('start_date_local', '2024-07-22T23:59:59')
          .order('start_date_local', { ascending: false })

        if (updatedDbError) {
          updateStep('missing-activity-debug', {
            status: 'error',
            details: `Database error after sync: ${updatedDbError.message}`,
            error: updatedDbError.message
          })
          return
        }

        if (updatedDbActivities && updatedDbActivities.length > 0) {
          updateStep('missing-activity-debug', {
            status: 'success',
            details: `✅ Found ${updatedDbActivities.length} activities on 7/22 after sync! Activities: ${updatedDbActivities.map(a => a.name).join(', ')}`
          })
        } else {
          updateStep('missing-activity-debug', {
            status: 'error',
            details: '❌ Still no 7/22 activities found. The activity may not exist in Strava or there\'s an API issue.',
            error: 'Activity not found in Strava API response'
          })
        }

      } catch (apiError) {
        updateStep('missing-activity-debug', {
          status: 'error',
          details: `API error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
          error: apiError instanceof Error ? apiError.message : 'Unknown error'
        })
      }

    } catch (error) {
      updateStep('missing-activity-debug', {
        status: 'error',
        details: `Debug error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Sync Process Debugger</h2>
        <div className="flex space-x-2">
          <button
            onClick={runFullDebug}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running...' : 'Run Full Debug'}
          </button>
          <button
            onClick={clearDebug}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Clear
          </button>
          <button
            onClick={checkActivities}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Check Activities
          </button>
          <button
            onClick={checkTokenStatus}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Check Token Status
          </button>
          <button
            onClick={debugMissingActivity}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Debug 7/22 Activity
          </button>
        </div>
      </div>

      {/* Current State Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Current State</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">canSync:</span>
            <span className={`ml-1 font-medium ${canSync ? 'text-green-600' : 'text-red-600'}`}>
              {canSync ? 'true' : 'false'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">todaySyncs:</span>
            <span className="ml-1 font-medium">{todaySyncs}/{maxSyncs}</span>
          </div>
          <div>
            <span className="text-gray-500">isSyncing:</span>
            <span className={`ml-1 font-medium ${isSyncing ? 'text-blue-600' : 'text-gray-600'}`}>
              {isSyncing ? 'true' : 'false'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">disabled:</span>
            <span className="ml-1 font-medium text-red-600">
              {syncDisabledReason || 'none'}
            </span>
          </div>
        </div>
      </div>

      {/* Activities Data Display */}
      {activitiesData.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-700 mb-2">📊 Database Activities ({activitiesData.length})</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {activitiesData.map((activity, index) => (
              <div key={activity.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                  <span className="font-medium text-sm">{activity.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {activity.sport_type}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {new Date(activity.start_date_local).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Steps */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Debug Steps</h3>
        {debugSteps.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No debug steps yet. Click "Run Full Debug" to start.</p>
        ) : (
          <div className="space-y-2">
            {debugSteps.map((step) => (
              <div
                key={step.id}
                className={`p-3 rounded-lg border ${
                  step.status === 'error' 
                    ? 'bg-red-50 border-red-200' 
                    : step.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : step.status === 'running'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStepIcon(step.status)}</span>
                    <div>
                      <h4 className={`font-medium ${getStepColor(step.status)}`}>
                        {step.name}
                      </h4>
                      {step.details && (
                        <p className="text-sm text-gray-600 mt-1">{step.details}</p>
                      )}
                      {step.error && (
                        <p className="text-sm text-red-600 mt-1">Error: {step.error}</p>
                      )}
                    </div>
                  </div>
                  {step.timestamp && (
                    <span className="text-xs text-gray-500">
                      {step.timestamp.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw Data Display */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Raw Data</h3>
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
            Click to view raw sync data
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto text-xs">
            {rawDataJson}
          </pre>
        </details>
      </div>

      {/* Sync State Manipulator */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">State Manipulation</h3>
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
            Click to open sync state manipulator
          </summary>
          <div className="mt-2">
            <SyncStateManipulator />
          </div>
        </details>
      </div>
    </div>
  )
} 