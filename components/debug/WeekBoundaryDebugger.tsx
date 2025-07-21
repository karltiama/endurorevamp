'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
import { getCurrentWeekBoundaries } from '@/lib/utils'
import { useUserActivities } from '@/hooks/use-user-activities'

interface WeekBoundaryDebuggerProps {
  userId?: string
}

interface ActivityDebugInfo {
  id: string | undefined
  name: string
  start_date: string
  start_date_local: string
  parsed_date: string
  sport_type: string
  training_stress_score?: number
}

interface WeekDebugInfo {
  start: string
  end: string
  activities: ActivityDebugInfo[]
}

interface DebugInfo {
  now: string
  currentWeek: WeekDebugInfo
  previousWeek: WeekDebugInfo
  nextWeek: WeekDebugInfo
  allActivities: ActivityDebugInfo[]
  dateCalculation: {
    currentDay: number
    currentDate: number
    weekStartCalculation: string
    explanation: string
  }
}

export function WeekBoundaryDebugger({ userId }: WeekBoundaryDebuggerProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Get user ID from auth if not provided
  useEffect(() => {
    if (userId) {
      setCurrentUserId(userId)
    } else {
      // Get user ID from auth context
      const getUser = async () => {
        try {
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setCurrentUserId(user.id)
          }
        } catch (error) {
          console.error('Error getting user:', error)
        }
      }
      getUser()
    }
  }, [userId])

  const { data: activities, isLoading } = useUserActivities(currentUserId || '')
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

    // Get activities for previous week
    const previousWeekStart = new Date(currentWeekStart)
    previousWeekStart.setDate(currentWeekStart.getDate() - 7)
    const previousWeekEnd = new Date(currentWeekStart)
    previousWeekEnd.setDate(currentWeekStart.getDate() - 1)

    const previousWeekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.start_date)
      return activityDate >= previousWeekStart && activityDate <= previousWeekEnd
    })

    // Get activities for next week
    const nextWeekStart = new Date(currentWeekEnd)
    nextWeekStart.setDate(currentWeekEnd.getDate() + 1)
    const nextWeekEnd = new Date(nextWeekStart)
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6)

    const nextWeekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.start_date)
      return activityDate >= nextWeekStart && activityDate <= nextWeekEnd
    })

    setDebugInfo({
      now: now.toISOString(),
      currentWeek: {
        start: currentWeekStart.toISOString(),
        end: currentWeekEnd.toISOString(),
        activities: thisWeekActivities.map(a => ({
          id: a.id,
          name: a.name,
          start_date: a.start_date,
          start_date_local: a.start_date_local,
          parsed_date: new Date(a.start_date).toISOString(),
          sport_type: a.sport_type,
          training_stress_score: (a as { training_stress_score?: number }).training_stress_score
        }))
      },
      previousWeek: {
        start: previousWeekStart.toISOString(),
        end: previousWeekEnd.toISOString(),
        activities: previousWeekActivities.map(a => ({
          id: a.id,
          name: a.name,
          start_date: a.start_date,
          start_date_local: a.start_date_local,
          parsed_date: new Date(a.start_date).toISOString(),
          sport_type: a.sport_type,
          training_stress_score: (a as { training_stress_score?: number }).training_stress_score
        }))
      },
      nextWeek: {
        start: nextWeekStart.toISOString(),
        end: nextWeekEnd.toISOString(),
        activities: nextWeekActivities.map(a => ({
          id: a.id,
          name: a.name,
          start_date: a.start_date,
          start_date_local: a.start_date_local,
          parsed_date: new Date(a.start_date).toISOString(),
          sport_type: a.sport_type,
          training_stress_score: (a as { training_stress_score?: number }).training_stress_score
        }))
      },
      allActivities: activities.slice(0, 5).map(a => ({
        id: a.id,
        name: a.name,
        start_date: a.start_date,
        start_date_local: a.start_date_local,
        parsed_date: new Date(a.start_date).toISOString(),
        sport_type: a.sport_type,
        training_stress_score: (a as { training_stress_score?: number }).training_stress_score
      })),
      // Add debug info about the date calculation
      dateCalculation: {
        currentDay: now.getDay(),
        currentDate: now.getDate(),
        weekStartCalculation: now.getDay() === 0 ? 
          `${now.getDate()} - 6 = ${now.getDate() - 6} (Sunday: show week ending today)` :
          `${now.getDate()} - ${now.getDay()} + 1 = ${now.getDate() - now.getDay() + 1} (Other days: show week starting Monday)`,
        explanation: now.getDay() === 0 ? 
          "Today is Sunday, so showing the week that's ending today (Monday-Sunday)" : 
          "Today is not Sunday, so showing the current week (Monday-Sunday)"
      }
    })
  }, [activities])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Week Boundary Debugger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!debugInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Week Boundary Debugger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>No debug info available</div>
        </CardContent>
      </Card>
    )
  }

  const currentWeekTSS = debugInfo.currentWeek.activities.reduce((sum: number, a: any) => 
    sum + (a.training_stress_score || 0), 0
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Week Boundary Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p><strong>Current Time:</strong> {new Date(debugInfo.now).toLocaleString()}</p>
        </div>

        {/* Current Week */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-green-700 mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Current Week (Monday - Sunday)
          </h3>
          <div className="text-sm space-y-1">
            <p><strong>Start:</strong> {new Date(debugInfo.currentWeek.start).toLocaleString()}</p>
            <p><strong>End:</strong> {new Date(debugInfo.currentWeek.end).toLocaleString()}</p>
            <p><strong>Activities:</strong> {debugInfo.currentWeek.activities.length}</p>
            <p><strong>Total TSS:</strong> {currentWeekTSS}</p>
          </div>
          
          {debugInfo.currentWeek.activities.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Activities in current week:</p>
              <div className="space-y-1">
                {debugInfo.currentWeek.activities.map((activity: any, index: number) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                    <p><strong>{activity.name}</strong></p>
                    <p>Date: {new Date(activity.start_date).toLocaleString()}</p>
                    <p>Sport: {activity.sport_type}</p>
                    <p>TSS: {activity.training_stress_score || 'Not calculated'}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                No activities found in current week
              </p>
            </div>
          )}
        </div>

        {/* Previous Week */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-blue-700 mb-2">Previous Week</h3>
          <div className="text-sm space-y-1">
            <p><strong>Start:</strong> {new Date(debugInfo.previousWeek.start).toLocaleString()}</p>
            <p><strong>End:</strong> {new Date(debugInfo.previousWeek.end).toLocaleString()}</p>
            <p><strong>Activities:</strong> {debugInfo.previousWeek.activities.length}</p>
          </div>
        </div>

        {/* Next Week */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-purple-700 mb-2">Next Week</h3>
          <div className="text-sm space-y-1">
            <p><strong>Start:</strong> {new Date(debugInfo.nextWeek.start).toLocaleString()}</p>
            <p><strong>End:</strong> {new Date(debugInfo.nextWeek.end).toLocaleString()}</p>
            <p><strong>Activities:</strong> {debugInfo.nextWeek.activities.length}</p>
          </div>
        </div>

        {/* Date Calculation Debug */}
        <div className="border rounded-lg p-4 bg-blue-50">
          <h3 className="font-medium text-blue-700 mb-2">Date Calculation Debug</h3>
          <div className="text-sm space-y-1">
            <p><strong>Current Day:</strong> {debugInfo.dateCalculation.currentDay} (0=Sunday, 1=Monday, etc.)</p>
            <p><strong>Current Date:</strong> {debugInfo.dateCalculation.currentDate}</p>
            <p><strong>Week Start Calculation:</strong> {debugInfo.dateCalculation.weekStartCalculation}</p>
            <p><strong>Explanation:</strong> {debugInfo.dateCalculation.explanation}</p>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-2">Recent Activities (All)</h3>
          <div className="space-y-1">
            {debugInfo.allActivities.map((activity: any, index: number) => (
              <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                <p><strong>{activity.name}</strong></p>
                <p>Date: {new Date(activity.start_date).toLocaleString()}</p>
                <p>Sport: {activity.sport_type}</p>
                <p>TSS: {activity.training_stress_score || 'Not calculated'}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 