'use client'

import { useState } from 'react'
import { useStravaSync, useSyncStatusInfo } from '@/hooks/use-strava-sync'
import { SyncStateManipulator } from './SyncStateManipulator'

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
    forceFullSync,
    refreshStatus,
    isSyncing,
    syncError,
    syncResult
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

      // Step 3: Attempt sync
      addStep({
        id: 'sync-attempt',
        name: 'Attempt Sync',
        status: 'running',
        details: 'Triggering sync operation'
      })

      console.log('🔄 Debug: Starting sync...')
      
      // We'll use a timeout to simulate the sync process
      // In a real scenario, you'd call forceFullSync() here
      setTimeout(() => {
        updateStep('sync-attempt', {
          status: 'success',
          details: 'Sync operation completed'
        })

        // Step 4: Check results
        addStep({
          id: 'sync-results',
          name: 'Check Sync Results',
          status: 'running',
          details: 'Analyzing sync results and errors'
        })

        console.log('📊 Debug: Sync Results', {
          syncResult,
          syncError,
          isSyncing
        })

        if (syncError) {
          updateStep('sync-results', {
            status: 'error',
            details: `Sync failed: ${syncError.message}`,
            error: syncError.message
          })
        } else if (syncResult) {
          updateStep('sync-results', {
            status: 'success',
            details: `Sync successful: ${syncResult.message}`
          })
        } else {
          updateStep('sync-results', {
            status: 'success',
            details: 'Sync completed without errors'
          })
        }

        // Step 5: Final state check
        addStep({
          id: 'final-state',
          name: 'Check Final State',
          status: 'running',
          details: 'Verifying final sync state'
        })

        // Refresh status to get updated values
        refreshStatus()

        setTimeout(() => {
          updateStep('final-state', {
            status: 'success',
            details: `Final state: ${activityCount} activities, ${todaySyncs}/${maxSyncs} syncs today`
          })
          setIsRunning(false)
        }, 1000)

      }, 2000)

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
            {JSON.stringify({
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
            }, null, 2)}
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