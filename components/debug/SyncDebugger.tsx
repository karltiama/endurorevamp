'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQueryClient } from '@tanstack/react-query'
import { useStravaToken } from '@/hooks/strava/useStravaToken'
import { useStravaConnection } from '@/hooks/strava/useStravaConnection'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'

interface SyncDebugResult {
  step: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: unknown
}

export function SyncDebugger() {
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugResults, setDebugResults] = useState<SyncDebugResult[]>([])
  const queryClient = useQueryClient()
  const { accessToken } = useStravaToken()
  const { connectionStatus } = useStravaConnection()
  const { user } = useAuth()

  const addResult = (result: SyncDebugResult) => {
    setDebugResults(prev => [...prev, result])
  }

  const updateLastResult = (updates: Partial<SyncDebugResult>) => {
    setDebugResults(prev => {
      const newResults = [...prev]
      const lastIndex = newResults.length - 1
      if (lastIndex >= 0) {
        newResults[lastIndex] = { ...newResults[lastIndex], ...updates }
      }
      return newResults
    })
  }

  const runSyncDebug = async () => {
    setIsDebugging(true)
    setDebugResults([])

    try {
      // Step 1: Check Strava token
      addResult({
        step: '1. Check Strava Token',
        status: 'pending',
        message: 'Checking if you have a valid Strava access token...'
      })

      if (!accessToken) {
        updateLastResult({
          status: 'error',
          message: 'No valid Strava token found. You need to connect your Strava account.',
          data: { 
            connected: connectionStatus?.connected || false,
            athlete: connectionStatus?.athlete 
          }
        })
        return
      }

      updateLastResult({
        status: 'success',
        message: `Token found for ${connectionStatus?.athlete?.firstname || 'athlete'}`,
        data: {
          tokenLength: accessToken.length,
          connected: connectionStatus?.connected,
          athlete: connectionStatus?.athlete
        }
      })

      // Step 2: Check what Strava API returns
      addResult({
        step: '2. Fetch from Strava API',
        status: 'pending',
        message: 'Fetching latest activities directly from Strava...'
      })

      const stravaResponse = await fetch('/api/strava/activities?limit=5', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      if (!stravaResponse.ok) {
        updateLastResult({
          status: 'error',
          message: `Strava API call failed: ${stravaResponse.status} - ${stravaResponse.statusText}`
        })
        return
      }

      const stravaActivities = await stravaResponse.json()
      updateLastResult({
        status: 'success',
        message: `Fetched ${stravaActivities.length} activities from Strava API`,
        data: stravaActivities.slice(0, 2) // Show first 2 for debugging
      })

      // Step 3: Test sync process
      addResult({
        step: '3. Run Sync Process',
        status: 'pending',
        message: 'Triggering sync to store activities in database...'
      })

      const syncResponse = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxActivities: 10,
          forceRefresh: true
        })
      })

      if (!syncResponse.ok) {
        const syncError = await syncResponse.json()
        updateLastResult({
          status: 'error',
          message: `Sync failed: ${syncError.message || 'Unknown error'}`
        })
        return
      }

      const syncResult = await syncResponse.json()
      updateLastResult({
        status: 'success',
        message: `Sync completed: ${syncResult.data?.activitiesProcessed || 0} activities processed`,
        data: syncResult
      })

      // Step 4: Verify database
      addResult({
        step: '4. Verify Database Storage',
        status: 'pending',
        message: 'Checking if activities were stored in database...'
      })

      if (!user) {
        updateLastResult({
          status: 'error',
          message: 'No authenticated user found for database query'
        })
        return
      }

      // Invalidate cache first
      queryClient.invalidateQueries({ queryKey: ['user', 'activities'] })
      
      // Wait a bit for cache invalidation
      await new Promise(resolve => setTimeout(resolve, 500))

      // Query database directly using Supabase client (same as useUserActivities hook)
      const supabase = createClient()
      const { data: dbActivities, error: dbError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(5)

      if (dbError) {
        updateLastResult({
          status: 'error',
          message: `Database query failed: ${dbError.message}`,
          data: { error: dbError }
        })
        return
      }

      updateLastResult({
        status: 'success',
        message: `Found ${dbActivities?.length || 0} activities in database`,
        data: dbActivities?.slice(0, 2) || []
      })

      // Step 5: Compare latest activity
      if (stravaActivities.length > 0 && dbActivities && dbActivities.length > 0) {
        addResult({
          step: '5. Compare Latest Activity',
          status: 'pending',
          message: 'Comparing latest Strava activity with database...'
        })

        const latestStrava = stravaActivities[0]
        const latestDb = dbActivities.find((db) => db.strava_activity_id === latestStrava.id)

        if (latestDb) {
          updateLastResult({
            status: 'success',
            message: `✅ Latest activity "${latestStrava.name}" is in database`,
            data: { strava: latestStrava, database: latestDb }
          })
        } else {
          updateLastResult({
            status: 'error',
            message: `❌ Latest activity "${latestStrava.name}" (ID: ${latestStrava.id}) is NOT in database`,
            data: { strava: latestStrava, missingFromDb: true, dbActivities: dbActivities.map(a => ({ id: a.strava_activity_id, name: a.name })) }
          })
        }
      } else if (stravaActivities.length > 0 && (!dbActivities || dbActivities.length === 0)) {
        addResult({
          step: '5. Compare Latest Activity',
          status: 'error',
          message: `❌ Found ${stravaActivities.length} activities from Strava but 0 in database`,
          data: { stravaCount: stravaActivities.length, dbCount: 0 }
        })
      }

    } catch (error) {
      console.error('Debug error:', error)
      updateLastResult({
        status: 'error',
        message: `Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsDebugging(false)
    }
  }

  const clearResults = () => {
    setDebugResults([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          🔍 Sync Debugger
          <div className="flex gap-2">
            <Button onClick={clearResults} size="sm" variant="outline" disabled={isDebugging}>
              Clear
            </Button>
            <Button onClick={runSyncDebug} size="sm" disabled={isDebugging}>
              {isDebugging ? 'Debugging...' : 'Debug Sync'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            This tool will step through the sync process to identify where your recent run might be getting lost.
          </p>

          {debugResults.length === 0 && !isDebugging && (
            <div className="text-center py-8 text-gray-500">
              Click &quot;Debug Sync&quot; to start diagnosing the sync issue
            </div>
          )}

          {debugResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{result.step}</h4>
                <Badge 
                  variant={
                    result.status === 'success' ? 'default' : 
                    result.status === 'error' ? 'destructive' : 
                    'secondary'
                  }
                >
                  {result.status === 'pending' && '⏳'}
                  {result.status === 'success' && '✅'}
                  {result.status === 'error' && '❌'}
                  {result.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-700">{result.message}</p>
              
{result.data != null && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">View Data</summary>
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
{JSON.stringify(result.data || {}, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 