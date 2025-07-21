'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertTriangle, CheckCircle, Calendar } from 'lucide-react'

interface SyncState {
  user_id: string
  last_activity_sync?: string
  last_sync_date?: string
  sync_requests_today?: number
  total_activities_synced?: number
  sync_enabled?: boolean
  consecutive_errors?: number
  last_error_message?: string
  last_error_at?: string
  created_at?: string
  updated_at?: string
}

export function SyncStateDebugger() {
  const [syncState, setSyncState] = useState<SyncState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSyncState = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/debug/sync-state')
      const data = await response.json()
      
      if (data.success) {
        setSyncState(data.syncState)
      } else {
        setError(data.error || 'Failed to fetch sync state')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const updateSyncState = async (action: string, count?: number) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/debug/sync-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, count }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh the sync state after update
        await fetchSyncState()
      } else {
        setError(data.error || 'Failed to update sync state')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSyncState()
  }, [])

  const formatTimeAgo = (timestamp?: string) => {
    if (!timestamp) return 'Never'
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays} days ago`
  }

  const getSyncStatusColor = () => {
    if (!syncState) return 'bg-gray-100 text-gray-800'
    if (syncState.sync_enabled === false) return 'bg-red-100 text-red-800'
    if (syncState.consecutive_errors && syncState.consecutive_errors > 0) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getSyncStatusText = () => {
    if (!syncState) return 'No sync state'
    if (syncState.sync_enabled === false) return 'Sync Disabled'
    if (syncState.consecutive_errors && syncState.consecutive_errors > 0) return 'Has Errors'
    return 'Sync Enabled'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sync State Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            onClick={fetchSyncState} 
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          
          {syncState && (
            <Badge className={getSyncStatusColor()}>
              {getSyncStatusText()}
            </Badge>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {syncState ? (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600">Last Activity Sync</p>
                <p className="text-gray-900">{formatTimeAgo(syncState.last_activity_sync)}</p>
                {syncState.last_activity_sync && (
                  <p className="text-xs text-gray-500">
                    {new Date(syncState.last_activity_sync).toLocaleString()}
                  </p>
                )}
              </div>
              
              <div>
                <p className="font-medium text-gray-600">Last Sync Date</p>
                <p className="text-gray-900">{syncState.last_sync_date || 'Never'}</p>
              </div>
              
              <div>
                <p className="font-medium text-gray-600">Sync Requests Today</p>
                <p className="text-gray-900">{syncState.sync_requests_today || 0}/5</p>
              </div>
              
              <div>
                <p className="font-medium text-gray-600">Total Activities Synced</p>
                <p className="text-gray-900">{syncState.total_activities_synced || 0}</p>
              </div>
            </div>

            {/* Error Info */}
            {syncState.consecutive_errors && syncState.consecutive_errors > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Sync Errors</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Consecutive errors: {syncState.consecutive_errors}
                </p>
                {syncState.last_error_message && (
                  <p className="text-sm text-yellow-700 mt-1">
                    Last error: {syncState.last_error_message}
                  </p>
                )}
                {syncState.last_error_at && (
                  <p className="text-xs text-yellow-600 mt-1">
                    {formatTimeAgo(syncState.last_error_at)}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Quick Actions:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSyncState('set_just_now')}
                  disabled={isLoading}
                >
                  Set Sync to Now
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSyncState('reset_timer')}
                  disabled={isLoading}
                >
                  Set to 2 Hours Ago
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSyncState('clear_errors')}
                  disabled={isLoading}
                >
                  Clear Errors
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSyncState('reset_all')}
                  disabled={isLoading}
                >
                  Reset All
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {isLoading ? (
              <div className="animate-pulse">Loading sync state...</div>
            ) : (
              <div>
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No sync state found</p>
                <p className="text-sm">This usually means sync has never been run</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 