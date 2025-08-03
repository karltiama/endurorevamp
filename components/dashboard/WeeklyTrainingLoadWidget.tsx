'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'

import { useUserActivities } from '@/hooks/use-user-activities'
import { usePersonalizedTSSTarget } from '@/hooks/useTrainingProfile'
import { useMemo, useEffect } from 'react'
import { 
  Activity,
  BarChart3,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { ActivityWithTrainingData } from '@/types'
import { getCurrentWeekBoundaries } from '@/lib/utils'

interface WeeklyTrainingLoadWidgetProps {
  userId: string
}

interface WeeklyTrainingLoad {
  currentTSS: number
  targetTSS: number
  progressPercentage: number
  workoutsCompleted: number
  zoneDistribution: {
    zone1: number
    zone2: number
    zone3: number
    zone4: number
    zone5: number
  }
  dailyTSS: { day: string; tss: number }[]
  weeklyTrend: 'up' | 'down' | 'stable'
}

// Helper functions moved outside the component
const estimateTSS = (activity: ActivityWithTrainingData): number => {
  const durationHours = activity.moving_time / 3600
  const baseIntensity = activity.sport_type === 'Run' ? 70 : 60
  
  let intensityMultiplier = 1
  if (activity.average_heartrate) {
    intensityMultiplier = Math.max(0.5, Math.min(1.5, activity.average_heartrate / 140))
  }
  
  return durationHours * baseIntensity * intensityMultiplier
}

const calculateZoneDistribution = (activities: ActivityWithTrainingData[]) => {
  const distribution = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 }
  
  activities.forEach(activity => {
    const duration = activity.moving_time / 60 // minutes
    
    // Simple zone estimation based on heart rate or intensity
    if (activity.average_heartrate) {
      const hrPercent = activity.average_heartrate / 190 // Assume max HR 190
      
      if (hrPercent < 0.6) distribution.zone1 += duration
      else if (hrPercent < 0.7) distribution.zone2 += duration
      else if (hrPercent < 0.8) distribution.zone3 += duration
      else if (hrPercent < 0.9) distribution.zone4 += duration
      else distribution.zone5 += duration
    } else {
      // Default to zone 2 if no heart rate data
      distribution.zone2 += duration
    }
  })

  const totalTime = Object.values(distribution).reduce((sum, time) => sum + time, 0)
  
  // Convert to percentages
  Object.keys(distribution).forEach(zone => {
    distribution[zone as keyof typeof distribution] = totalTime > 0 
      ? Math.round((distribution[zone as keyof typeof distribution] / totalTime) * 100)
      : 0
  })

  return distribution
}

const calculateDailyTSS = (activities: ActivityWithTrainingData[], weekStart: Date) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dailyTSS: { day: string; tss: number }[] = []

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStart)
    dayDate.setDate(weekStart.getDate() + i)
    dayDate.setHours(0, 0, 0, 0)
    
    const nextDay = new Date(dayDate)
    nextDay.setDate(dayDate.getDate() + 1)
    
    const dayActivities = activities.filter(activity => {
      const activityDate = new Date(activity.start_date)
      return activityDate >= dayDate && activityDate < nextDay
    })

    const dayTSS = dayActivities.reduce((sum, activity) => {
      const tss = activity.training_stress_score || estimateTSS(activity)
      return sum + tss
    }, 0)

    dailyTSS.push({
      day: days[i],
      tss: Math.round(dayTSS)
    })
  }

  return dailyTSS
}

// Removed unused functions

export function WeeklyTrainingLoadWidget({ userId }: WeeklyTrainingLoadWidgetProps) {
  const queryClient = useQueryClient()
  const { data: activities, isLoading, error, refetch, isRefetching } = useUserActivities(userId)
  const { data: personalizedTSSTarget } = usePersonalizedTSSTarget(userId)

  // Force refresh data when component mounts to ensure freshness
  useEffect(() => {
    // Invalidate cache to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['user', 'activities', userId] })
    queryClient.invalidateQueries({ queryKey: ['personalized-tss-target', userId] })
  }, [userId, queryClient])

  const weeklyTrainingLoad = useMemo((): WeeklyTrainingLoad | null => {
    if (!activities || activities.length === 0) return null

    // Get current week activities (Monday to Sunday)
    const { start: currentWeekStart, end: currentWeekEnd } = getCurrentWeekBoundaries()

    // Filter activities for current week
    const thisWeekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.start_date)
      return activityDate >= currentWeekStart && activityDate <= currentWeekEnd
    })

    // Calculate current TSS
    const currentTSS = thisWeekActivities.reduce((sum, activity) => {
      const tss = (activity as ActivityWithTrainingData).training_stress_score || estimateTSS(activity as ActivityWithTrainingData)
      return sum + tss
    }, 0)

    // Target TSS (personalized based on user profile)
    const targetTSS = personalizedTSSTarget || 400

    // Calculate zone distribution
    const zoneDistribution = calculateZoneDistribution(thisWeekActivities)

    // Daily TSS breakdown
    const dailyTSS = calculateDailyTSS(thisWeekActivities, currentWeekStart)

    // Weekly trend (compare with previous week)
    const previousWeekStart = new Date(currentWeekStart)
    previousWeekStart.setDate(currentWeekStart.getDate() - 7)
    const previousWeekEnd = new Date(currentWeekStart)
    previousWeekEnd.setDate(currentWeekStart.getDate() - 1)

    const previousWeekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.start_date)
      return activityDate >= previousWeekStart && activityDate <= previousWeekEnd
    })

    const previousTSS = previousWeekActivities.reduce((sum, activity) => {
      const tss = (activity as ActivityWithTrainingData).training_stress_score || estimateTSS(activity as ActivityWithTrainingData)
      return sum + tss
    }, 0)

    const weeklyTrend = currentTSS > previousTSS * 1.1 ? 'up' : 
                      currentTSS < previousTSS * 0.9 ? 'down' : 'stable'

    // Debug information - removed unused variable

    return {
      currentTSS: Math.round(currentTSS),
      targetTSS,
      progressPercentage: Math.round((currentTSS / targetTSS) * 100),
      workoutsCompleted: thisWeekActivities.length,
      zoneDistribution,
      dailyTSS,
      weeklyTrend
    }
  }, [activities, personalizedTSSTarget])

  const handleRefresh = () => {
    // Force refresh of all related data
    queryClient.invalidateQueries({ queryKey: ['user', 'activities', userId] })
    queryClient.invalidateQueries({ queryKey: ['personalized-tss-target', userId] })
    queryClient.invalidateQueries({ queryKey: ['training', 'load', userId] })
    refetch()
  }

  // Removed unused function

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Weekly Training Load
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3" data-testid="loading-skeleton">
            <div className="h-16 bg-gray-100 rounded-lg"></div>
            <div className="h-12 bg-gray-100 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !weeklyTrainingLoad) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Weekly Training Load
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No training data for this week</p>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm" 
              className="mt-3"
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              {isRefetching ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show warning if no activities have TSS calculated
  const needsTSSUpdate = activities?.some(activity => {
    const activityWithTraining = activity as ActivityWithTrainingData
    return activityWithTraining.training_stress_score === null || activityWithTraining.training_stress_score === undefined
  }) || false

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5" />
          Weekly Progress
          {/* Removed trend icon */}
          <Button 
            onClick={handleRefresh} 
            variant="ghost" 
            size="sm"
            className="ml-auto"
            disabled={isRefetching}
            title="Refresh training data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 h-full flex flex-col justify-between">
        {/* Simplified TSS Progress - Focus on ONE key metric */}
        <div className="text-center space-y-3">
          <div className="text-3xl font-bold text-blue-600">
            {weeklyTrainingLoad.progressPercentage}%
          </div>
          <div className="text-sm text-gray-600">
            Weekly TSS Progress
          </div>
          <Progress 
            value={Math.min(100, weeklyTrainingLoad.progressPercentage)} 
            className="h-3"
          />
          <div className="text-xs text-gray-500">
            {weeklyTrainingLoad.currentTSS} / {weeklyTrainingLoad.targetTSS} TSS
          </div>
        </div>

        {/* Quick Status Indicators */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {weeklyTrainingLoad.workoutsCompleted}
            </div>
            <div className="text-xs text-green-600">Workouts</div>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              {weeklyTrainingLoad.zoneDistribution.zone2}%
            </div>
            <div className="text-xs text-blue-600">Zone 2</div>
          </div>
        </div>

        {/* Daily TSS Distribution */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Daily Distribution</h4>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {weeklyTrainingLoad.dailyTSS.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-gray-600">{day.day}</div>
                <div className="text-gray-900 font-medium">{day.tss}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning if TSS needs updating - Compact */}
        {needsTSSUpdate && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <div className="flex items-center gap-2 text-xs text-yellow-800">
              <AlertTriangle className="h-3 w-3" />
              <span>TSS data updating</span>
            </div>
          </div>
        )}

        {/* View Details Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => {
            // Navigate to detailed training load page
            window.location.href = '/dashboard/training'
          }}
        >
          View Detailed Analysis
        </Button>
      </CardContent>
    </Card>
  )
} 