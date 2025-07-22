'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'

import { useUserActivities } from '@/hooks/use-user-activities'
import { usePersonalizedTSSTarget } from '@/hooks/useTrainingProfile'
import { useMemo, useEffect } from 'react'
import { 
  TrendingUp, 
  Calendar, 
  Target,
  Activity,
  BarChart3,
  Clock,
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

const getZoneColor = (zone: number): string => {
  const colors = {
    1: 'bg-blue-200',
    2: 'bg-green-200', 
    3: 'bg-yellow-200',
    4: 'bg-orange-200',
    5: 'bg-red-200'
  }
  return colors[zone as keyof typeof colors] || 'bg-gray-200'
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-green-600" />
    case 'down':
      return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
    default:
      return <TrendingUp className="h-4 w-4 text-gray-400" />
  }
}

export function WeeklyTrainingLoadWidget({ userId }: WeeklyTrainingLoadWidgetProps) {
  const queryClient = useQueryClient()
  const { data: activities, isLoading, error, refetch } = useUserActivities(userId)
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

    // Debug information
    const activitiesWithTSS = thisWeekActivities.filter(activity => 
      (activity as ActivityWithTrainingData).training_stress_score !== null && 
      (activity as ActivityWithTrainingData).training_stress_score !== undefined
    ).length

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

  const handleUpdateTSS = async () => {
    try {
      const response = await fetch('/api/activities/update-tss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to update TSS')
      }

      const result = await response.json()
      console.log('TSS update result:', result)

      // Refresh data after TSS update
      handleRefresh()
    } catch (error) {
      console.error('Error updating TSS:', error)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly Training Load
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4" data-testid="loading-skeleton">
            <div className="h-20 bg-gray-100 rounded-lg"></div>
            <div className="h-16 bg-gray-100 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !weeklyTrainingLoad) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly Training Load
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No training data for this week</p>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm" 
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show warning if no activities have TSS calculated
  const needsTSSUpdate = false // Removed debug info check

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Weekly Training Load
          {getTrendIcon(weeklyTrainingLoad.weeklyTrend)}
          <Button 
            onClick={handleRefresh} 
            variant="ghost" 
            size="sm"
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* TSS Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-600" />
              <span className="font-medium">TSS Progress</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {weeklyTrainingLoad.currentTSS}
              </div>
              <div className="text-sm text-gray-600">
                / {weeklyTrainingLoad.targetTSS} target
              </div>
            </div>
          </div>
          
          <Progress 
            value={Math.min(100, weeklyTrainingLoad.progressPercentage)} 
            className="h-3"
          />
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>{weeklyTrainingLoad.progressPercentage}% complete</span>
            <span>{weeklyTrainingLoad.targetTSS - weeklyTrainingLoad.currentTSS} TSS remaining</span>
          </div>
        </div>

        {/* Warning if TSS needs updating */}
        {needsTSSUpdate && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">TSS Calculation Needed</span>
              </div>
              <Button 
                onClick={handleUpdateTSS} 
                variant="outline" 
                size="sm"
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              >
                Calculate TSS
              </Button>
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              Some activities don&apos;t have training stress scores calculated. 
              Click &quot;Calculate TSS&quot; to get accurate values.
            </p>
          </div>
        )}

        {/* Zone Distribution */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Training Zones
          </h4>
          
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(weeklyTrainingLoad.zoneDistribution).map(([zone, percentage]) => {
              const zoneNumber = parseInt(zone.replace('zone', ''))
              return (
                <div key={zone} className="text-center">
                  <div className={`h-8 rounded-t ${getZoneColor(zoneNumber)} opacity-80`}
                       style={{ height: `${Math.max(8, percentage * 0.8)}px` }}>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Z{zoneNumber}</div>
                  <div className="text-xs font-medium">{percentage}%</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Workouts</span>
            </div>
            <div className="text-xl font-bold text-blue-900">
              {weeklyTrainingLoad.workoutsCompleted}
            </div>
            <div className="text-xs text-blue-600">This week</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Zone 2</span>
            </div>
            <div className="text-xl font-bold text-green-900">
              {weeklyTrainingLoad.zoneDistribution.zone2}%
            </div>
            <div className="text-xs text-green-600">Aerobic base</div>
          </div>
        </div>

        {/* Daily TSS Chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600">Daily Distribution</h4>
          <div className="flex justify-between items-end h-16 px-2">
            {weeklyTrainingLoad.dailyTSS.map((day) => (
              <div key={day.day} className="flex flex-col items-center flex-1">
                <div 
                  className="w-4 bg-blue-500 rounded-t opacity-70 min-h-1"
                  style={{ height: `${Math.max(4, (day.tss / 150) * 48)}px` }}
                ></div>
                <div className="text-xs text-gray-600 mt-1">{day.day}</div>
                <div className="text-xs font-medium">{day.tss}</div>
              </div>
            ))}
          </div>
        </div>


      </CardContent>
    </Card>
  )
} 