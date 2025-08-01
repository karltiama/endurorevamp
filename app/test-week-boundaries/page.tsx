'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, RefreshCw } from 'lucide-react'
import { getCurrentWeekBoundaries } from '@/lib/utils'
import { useUserActivities } from '@/hooks/use-user-activities'
import { useAuth } from '@/providers/AuthProvider'
import type { Activity } from '@/lib/strava/types'

interface ActivityWithTSS extends Activity {
  training_stress_score?: number
}

interface WeekActivity {
  id: string | undefined
  name: string
  start_date: string
  sport_type: string
  training_stress_score?: number
}

interface WeekData {
  week: number
  start: string
  end: string
  activities: WeekActivity[]
}

interface DebugInfo {
  now: string
  currentWeek: {
    start: string
    end: string
    activities: WeekActivity[]
  }
  previousWeeks: WeekData[]
  allActivities: WeekActivity[]
}

export default function TestWeekBoundariesPage() {
  const { user } = useAuth()
  const { data: activities, isLoading, refetch } = useUserActivities(user?.id || '')
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)

  useEffect(() => {
    if (!activities) return

    const now = new Date()
    const { start: currentWeekStart, end: currentWeekEnd } = getCurrentWeekBoundaries()
    
    // Get activities for current week
    const thisWeekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.start_date)
      return activityDate >= currentWeekStart && activityDate <= currentWeekEnd
    })

    // Get activities for previous 4 weeks
    const previousWeeks: WeekData[] = []
    for (let i = 1; i <= 4; i++) {
      const weekStart = new Date(currentWeekStart)
      weekStart.setDate(currentWeekStart.getDate() - (7 * i))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const weekActivities = activities.filter(activity => {
        const activityDate = new Date(activity.start_date)
        return activityDate >= weekStart && activityDate <= weekEnd
      })

      previousWeeks.push({
        week: i,
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
        activities: weekActivities.map((a: ActivityWithTSS) => ({
          id: a.id,
          name: a.name,
          start_date: a.start_date,
          sport_type: a.sport_type,
          training_stress_score: a.training_stress_score
        }))
      })
    }

    setDebugInfo({
      now: now.toISOString(),
      currentWeek: {
        start: currentWeekStart.toISOString(),
        end: currentWeekEnd.toISOString(),
        activities: thisWeekActivities.map((a: ActivityWithTSS) => ({
          id: a.id,
          name: a.name,
          start_date: a.start_date,
          sport_type: a.sport_type,
          training_stress_score: a.training_stress_score
        }))
      },
      previousWeeks,
      allActivities: activities.slice(0, 10).map((a: ActivityWithTSS) => ({
        id: a.id,
        name: a.name,
        start_date: a.start_date,
        sport_type: a.sport_type,
        training_stress_score: a.training_stress_score
      }))
    })
  }, [activities])

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!debugInfo) {
    return (
      <div className="container mx-auto p-6">
        <div>No debug info available</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Week Boundaries Test</h1>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Week */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>Start:</strong> {new Date(debugInfo.currentWeek.start).toLocaleDateString()}</p>
            <p><strong>End:</strong> {new Date(debugInfo.currentWeek.end).toLocaleDateString()}</p>
            <p><strong>Activities:</strong> {debugInfo.currentWeek.activities.length}</p>
            
            {debugInfo.currentWeek.activities.length > 0 ? (
              <div className="mt-3 space-y-2">
                <p className="font-medium">Activities in current week:</p>
                {debugInfo.currentWeek.activities.map((activity: WeekActivity, index: number) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                    <p><strong>{activity.name}</strong></p>
                    <p>Date: {new Date(activity.start_date).toLocaleDateString()}</p>
                    <p>Sport: {activity.sport_type}</p>
                    <p>TSS: {activity.training_stress_score || 'Not calculated'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">No activities found in current week</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Previous Weeks */}
      {debugInfo.previousWeeks.map((week: WeekData, index: number) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>Previous Week {week.week}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p><strong>Start:</strong> {new Date(week.start).toLocaleDateString()}</p>
              <p><strong>End:</strong> {new Date(week.end).toLocaleDateString()}</p>
              <p><strong>Activities:</strong> {week.activities.length}</p>
              
              {week.activities.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="font-medium">Activities:</p>
                  {week.activities.map((activity: WeekActivity, actIndex: number) => (
                    <div key={actIndex} className="bg-gray-50 p-2 rounded text-xs">
                      <p><strong>{activity.name}</strong></p>
                      <p>Date: {new Date(activity.start_date).toLocaleDateString()}</p>
                      <p>Sport: {activity.sport_type}</p>
                      <p>TSS: {activity.training_stress_score || 'Not calculated'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities (All)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {debugInfo.allActivities.map((activity: WeekActivity, index: number) => (
              <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                <p><strong>{activity.name}</strong></p>
                <p>Date: {new Date(activity.start_date).toLocaleDateString()}</p>
                <p>Sport: {activity.sport_type}</p>
                <p>TSS: {activity.training_stress_score || 'Not calculated'}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 