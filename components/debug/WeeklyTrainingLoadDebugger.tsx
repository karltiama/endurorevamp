'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { useUserActivities } from '@/hooks/use-user-activities'
import { usePersonalizedTSSTarget } from '@/hooks/useTrainingProfile'
import { getCurrentWeekBoundaries } from '@/lib/utils'
import { ActivityWithTrainingData } from '@/types'

interface WeeklyTrainingLoadDebuggerProps {
  userId?: string
}

export function WeeklyTrainingLoadDebugger({ userId }: WeeklyTrainingLoadDebuggerProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

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

  const { data: activities, isLoading, error, refetch } = useUserActivities(currentUserId || '')
  const { data: personalizedTSSTarget } = usePersonalizedTSSTarget(currentUserId || '')

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

    // Calculate TSS for current week
    const currentWeekTSS = thisWeekActivities.reduce((sum, activity) => {
      const tss = (activity as ActivityWithTrainingData).training_stress_score || 0
      return sum + tss
    }, 0)

    // Calculate TSS for previous week
    const previousWeekTSS = previousWeekActivities.reduce((sum, activity) => {
      const tss = (activity as ActivityWithTrainingData).training_stress_score || 0
      return sum + tss
    }, 0)

    // Count activities with TSS
    const activitiesWithTSS = thisWeekActivities.filter(activity => 
      (activity as ActivityWithTrainingData).training_stress_score !== null && 
      (activity as ActivityWithTrainingData).training_stress_score !== undefined
    ).length

    // Calculate progress percentage
    const targetTSS = personalizedTSSTarget || 400
    const progressPercentage = targetTSS > 0 ? Math.round((currentWeekTSS / targetTSS) * 100) : 0

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
          training_stress_score: (a as ActivityWithTrainingData).training_stress_score,
          moving_time: a.moving_time,
          average_heartrate: a.average_heartrate
        })),
        totalTSS: currentWeekTSS,
        activitiesWithTSS,
        progressPercentage
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
          training_stress_score: (a as ActivityWithTrainingData).training_stress_score,
          moving_time: a.moving_time,
          average_heartrate: a.average_heartrate
        })),
        totalTSS: previousWeekTSS
      },
      targetTSS,
      allActivities: activities.slice(0, 5).map(a => ({
        id: a.id,
        name: a.name,
        start_date: a.start_date,
        start_date_local: a.start_date_local,
        parsed_date: new Date(a.start_date).toISOString(),
        sport_type: a.sport_type,
        training_stress_score: (a as ActivityWithTrainingData).training_stress_score
      }))
    })
  }, [activities, personalizedTSSTarget])

  const handleRefresh = () => {
    refetch()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Training Load Debugger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (error || !debugInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Training Load Debugger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>No debug info available</div>
        </CardContent>
      </Card>
    )
  }

  const needsTSSUpdate = debugInfo.currentWeek.activities.length > 0 && 
    debugInfo.currentWeek.activitiesWithTSS === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Weekly Training Load Debugger
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
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
            <p><strong>Total TSS:</strong> {debugInfo.currentWeek.totalTSS}</p>
            <p><strong>Target TSS:</strong> {debugInfo.targetTSS}</p>
            <p><strong>Progress:</strong> {debugInfo.currentWeek.progressPercentage}%</p>
            <p><strong>Activities with TSS:</strong> {debugInfo.currentWeek.activitiesWithTSS}</p>
          </div>
          
          {needsTSSUpdate && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                ⚠️ No activities have TSS calculated. This will affect progress accuracy.
              </p>
            </div>
          )}
          
          {debugInfo.currentWeek.activities.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Activities in current week:</p>
              <div className="space-y-1">
                {debugInfo.currentWeek.activities.map((activity: any, index: number) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                    <p><strong>{activity.name}</strong></p>
                    <p>Date: {new Date(activity.start_date).toLocaleString()}</p>
                    <p>Sport: {activity.sport_type}</p>
                    <p>Duration: {Math.round(activity.moving_time / 60)}min</p>
                    <p>TSS: {activity.training_stress_score || 'Not calculated'}</p>
                    {activity.average_heartrate && (
                      <p>HR: {activity.average_heartrate}bpm</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-800 flex items-center gap-1">
                <Info className="h-3 w-3" />
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
            <p><strong>Total TSS:</strong> {debugInfo.previousWeek.totalTSS}</p>
          </div>
        </div>

        {/* Progress Analysis */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-purple-700 mb-2">Progress Analysis</h3>
          <div className="text-sm space-y-1">
            <p><strong>Current Week TSS:</strong> {debugInfo.currentWeek.totalTSS}</p>
            <p><strong>Previous Week TSS:</strong> {debugInfo.previousWeek.totalTSS}</p>
            <p><strong>Target TSS:</strong> {debugInfo.targetTSS}</p>
            <p><strong>Progress:</strong> {debugInfo.currentWeek.progressPercentage}%</p>
            
            <div className="mt-2">
              <Badge variant={debugInfo.currentWeek.progressPercentage >= 100 ? "default" : "secondary"}>
                {debugInfo.currentWeek.progressPercentage >= 100 ? "Target Reached" : "In Progress"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-2">Recent Activities (All Time)</h3>
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