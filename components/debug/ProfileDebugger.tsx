'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUserActivities } from '@/hooks/use-user-activities'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import type { Activity } from '@/lib/strava/types'

interface ProfileDebuggerProps {
  userId: string
}

interface DebugInfo {
  dbActivities: Activity[]
  dbError?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  syncState: any
  syncError?: string
  hookActivities: Activity[]
  hookError?: string
  isLoading: boolean
  error?: string
}

export function ProfileDebugger({ userId }: ProfileDebuggerProps) {
  const { data: activities, isLoading, error, refetch } = useUserActivities(userId)
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const runDebug = async () => {
    if (!user) return
    
    setIsChecking(true)
    const supabase = createClient()

    try {
      // Check database directly
      const { data: dbActivities, error: dbError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(10)

      // Check sync state
      const { data: syncState, error: syncError } = await supabase
        .from('sync_state')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setDebugInfo({
        dbActivities: dbActivities || [],
        dbError: dbError?.message,
        syncState: syncState || null,
        syncError: syncError?.message,
        hookActivities: activities || [],
        hookError: error?.message,
        isLoading
      })
    } catch (error) {
      setDebugInfo({
        dbActivities: [],
        syncState: null,
        hookActivities: [],
        isLoading: false,
        error: (error as Error).message
      })
    } finally {
      setIsChecking(false)
    }
  }

  const triggerSync = async () => {
    try {
      const response = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxActivities: 50,
          forceRefresh: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Sync failed: ${error.message}`)
        return
      }

      const result = await response.json()
      alert(`Sync completed: ${result.data?.activitiesProcessed || 0} activities processed`)
      
      // Refresh the hook data
      refetch()
    } catch (error) {
      alert(`Sync error: ${(error as Error).message}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Profile Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDebug} disabled={isChecking}>
            {isChecking ? 'Checking...' : 'Run Debug'}
          </Button>
          <Button onClick={triggerSync} variant="outline">
            Trigger Sync
          </Button>
          <Button onClick={() => refetch()} variant="outline">
            Refresh Data
          </Button>
        </div>

        {/* Current State */}
        <div className="space-y-2">
          <h4 className="font-medium">Current State:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Hook Loading:</span>
              <Badge variant={isLoading ? "default" : "secondary"} className="ml-2">
                {isLoading ? 'Loading' : 'Loaded'}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Hook Error:</span>
              <Badge variant={error ? "destructive" : "secondary"} className="ml-2">
                {error ? 'Error' : 'None'}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Activities Count:</span>
              <Badge variant="outline" className="ml-2">
                {activities?.length || 0}
              </Badge>
            </div>
            <div>
              <span className="font-medium">User ID:</span>
              <span className="ml-2 text-xs font-mono">{userId}</span>
            </div>
          </div>
        </div>

        {/* Debug Results */}
        {debugInfo && (
          <div className="space-y-4">
            <h4 className="font-medium">Debug Results:</h4>
            
            {/* Database Activities */}
            <div className="p-3 bg-blue-50 rounded border">
              <h5 className="font-medium text-blue-800 mb-2">Database Activities:</h5>
              {debugInfo.dbError ? (
                <div className="text-red-600 text-sm">Error: {debugInfo.dbError}</div>
              ) : (
                <div className="text-sm">
                  <div className="mb-2">Count: {debugInfo.dbActivities?.length || 0}</div>
                  {debugInfo.dbActivities?.length > 0 && (
                    <div className="space-y-1">
                      <div className="font-medium">Latest Activities:</div>
                      {debugInfo.dbActivities?.slice(0, 3).map((activity: Activity, index: number) => (
                        <div key={index} className="text-xs bg-white p-2 rounded border">
                          <div className="font-medium">{activity.name}</div>
                          <div className="text-gray-600">
                            {activity.sport_type} • {new Date(activity.start_date_local).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hook Activities */}
            <div className="p-3 bg-green-50 rounded border">
              <h5 className="font-medium text-green-800 mb-2">Hook Activities:</h5>
              {debugInfo.hookError ? (
                <div className="text-red-600 text-sm">Error: {debugInfo.hookError}</div>
              ) : (
                <div className="text-sm">
                  <div className="mb-2">Count: {debugInfo.hookActivities.length}</div>
                  {debugInfo.hookActivities.length > 0 && (
                    <div className="space-y-1">
                      <div className="font-medium">Latest Activities:</div>
                      {debugInfo.hookActivities?.slice(0, 3).map((activity: Activity, index: number) => (
                        <div key={index} className="text-xs bg-white p-2 rounded border">
                          <div className="font-medium">{activity.name}</div>
                          <div className="text-gray-600">
                            {activity.sport_type} • {new Date(activity.start_date_local).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sync State */}
            <div className="p-3 bg-purple-50 rounded border">
              <h5 className="font-medium text-purple-800 mb-2">Sync State:</h5>
              {debugInfo.syncError ? (
                <div className="text-red-600 text-sm">Error: {debugInfo.syncError}</div>
              ) : debugInfo.syncState ? (
                <div className="text-sm space-y-1">
                  <div>Last Sync: {debugInfo.syncState.last_activity_sync || 'Never'}</div>
                  <div>Today Syncs: {debugInfo.syncState.today_syncs || 0}</div>
                  <div>Consecutive Errors: {debugInfo.syncState.consecutive_errors || 0}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">No sync state found</div>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="p-3 bg-yellow-50 rounded border">
          <h5 className="font-medium text-yellow-800 mb-2">Recommendations:</h5>
          <div className="text-sm space-y-1">
            {(!activities || activities.length === 0) && (
              <div>• No activities found - try &quot;Trigger Sync&quot; to fetch from Strava</div>
            )}
            {activities && activities.length > 0 && debugInfo?.dbActivities?.length === 0 && (
              <div>• Activities in hook but not in database - check database connection</div>
            )}
            {debugInfo?.dbActivities?.length > 0 && (!activities || activities.length === 0) && (
              <div>• Activities in database but not in hook - check React Query cache</div>
            )}
            {debugInfo?.syncState?.consecutive_errors > 0 && (
              <div>• Sync has consecutive errors - check Strava connection</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 