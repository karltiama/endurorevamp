'use client'

import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useStravaToken } from '@/hooks/strava/useStravaToken'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StravaActivity {
  id: number
  name: string
  sport_type: string
  description?: string
  distance?: number
  moving_time?: number
  start_date?: string
  start_date_local?: string
  [key: string]: unknown
}

export function HevyDataDebugger() {
  const { user } = useAuth()
  const { accessToken } = useStravaToken()
  const [activities, setActivities] = useState<StravaActivity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const fetchRecentWorkouts = async () => {
    if (!accessToken) {
      setError('No Strava access token found')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Fetch recent activities from Strava API
      const response = await fetch('/api/strava/activities?limit=10', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`)
      }

      const data: StravaActivity[] = await response.json()
      
      // Filter for workout/weight training activities
      const workoutActivities = data.filter(activity => 
        activity.sport_type === 'WeightTraining' || 
        activity.sport_type === 'Workout' ||
        (activity.description && activity.description.includes('Set'))
      )

      setActivities(workoutActivities)
      
      if (workoutActivities.length === 0) {
        setError('No workout activities found in recent data')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔍 Hevy Data Debugger</CardTitle>
        <p className="text-sm text-gray-600">
          Fetch and examine recent workout data from Strava to see the actual format
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={fetchRecentWorkouts}
            disabled={isLoading || !accessToken}
            className="w-full"
          >
            {isLoading ? 'Fetching...' : 'Fetch Recent Workouts'}
          </Button>

          {error && (
            <div className="text-red-600 text-sm p-3 bg-red-50 rounded">
              {error}
            </div>
          )}

          {activities.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Found {activities.length} workout activities:
              </div>
              
              {activities.map((activity, index) => (
                <div key={activity.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{activity.name}</h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(activity.start_date_local || activity.start_date || '')}
                      </p>
                    </div>
                    <Badge variant="outline">{activity.sport_type}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <div className="font-medium">
                        {activity.moving_time ? `${Math.round(activity.moving_time / 60)}min` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Distance:</span>
                      <div className="font-medium">
                        {activity.distance ? `${Math.round(activity.distance)}m` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {activity.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Description:</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm font-mono whitespace-pre-wrap">
                        {activity.description}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">All Fields:</h4>
                    <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                      {Object.entries(activity).map(([key, value]) => (
                        <div key={key} className="mb-1">
                          <span className="text-blue-600">{key}:</span>{' '}
                          <span className="text-gray-800">
                            {typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 