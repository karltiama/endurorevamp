'use client'

import { useUserActivities } from '@/hooks/use-user-activities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQueryClient } from '@tanstack/react-query'

interface DatabaseActivityCheckerProps {
  userId: string
}

export function DatabaseActivityChecker({ userId }: DatabaseActivityCheckerProps) {
  const { data: activities, isLoading, error, refetch } = useUserActivities(userId)
  const queryClient = useQueryClient()

  const handleRefresh = () => {
    // Force refresh of activities from database
    queryClient.invalidateQueries({ queryKey: ['user', 'activities'] })
    refetch()
  }

  const handleClearCache = () => {
    // Clear all React Query cache
    queryClient.clear()
    window.location.reload()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔍 Database Activity Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading activities from database...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔍 Database Activity Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">Error: {error.message}</div>
          <Button onClick={handleRefresh} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const latestActivities = activities?.slice(0, 5) || []
  const runActivities = activities?.filter(a => 
    a.sport_type?.toLowerCase().includes('run') || 
    a.activity_type?.toLowerCase().includes('run')
  ) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          🔍 Database Activity Check
          <div className="flex gap-2">
            <Button onClick={handleRefresh} size="sm" variant="outline">
              Refresh
            </Button>
            <Button onClick={handleClearCache} size="sm" variant="destructive">
              Clear Cache
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{activities?.length || 0}</div>
            <div className="text-sm text-gray-600">Total Activities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{runActivities.length}</div>
            <div className="text-sm text-gray-600">Runs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {activities?.length ? new Date(activities[0].start_date_local).toLocaleDateString() : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Latest Activity</div>
          </div>
        </div>

        {/* Latest Activities */}
        <div>
          <h4 className="font-medium mb-2">📊 Latest 5 Activities from Database:</h4>
          {latestActivities.length > 0 ? (
            <div className="space-y-2">
              {latestActivities.map((activity, index) => (
                <div key={activity.strava_activity_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      {index === 0 ? 'Latest' : `#${index + 1}`}
                    </Badge>
                    <span className="font-medium">{activity.name}</span>
                    <Badge variant="outline">{activity.sport_type}</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(activity.start_date_local).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
              ⚠️ No activities found in database. You need to sync your Strava data first.
            </div>
          )}
        </div>

        {/* Data Source Indicator */}
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-800">Data Source: Database (useUserActivities)</span>
          </div>
          <div className="text-sm text-green-600 mt-1">
            This component reads directly from your local database, NOT from Strava API.
          </div>
        </div>

        {/* Debug Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <h5 className="font-medium text-blue-800 mb-2">🔧 Debug Actions:</h5>
          <div className="text-sm space-y-1">
            <div>1. **No activities?** → Use the Sync Dashboard above to sync from Strava</div>
            <div>2. **Missing latest run?** → Click &quot;Refresh&quot; or sync recent activities</div>
            <div>3. **Components showing different data?** → Click &quot;Clear Cache&quot; to reset everything</div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
} 