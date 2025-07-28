'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserActivities } from '@/hooks/use-user-activities'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatDistance } from '@/lib/utils'
import { useMemo } from 'react'
import { 
  TrendingUp, 
  Trophy,
  Activity,
  Zap,
  Target,
  BarChart3
} from 'lucide-react'
import { Activity as StravaActivity } from '@/lib/strava/types'
import { ActivityWithTrainingData } from '@/types'
import { Button } from '@/components/ui/button'

interface PerformanceInsightsCardProps {
  userId: string
}

interface PerformanceInsights {
  paceImprovement: {
    value: number
    trend: 'up' | 'down' | 'stable'
    timeframe: string
  }
  trainingLoadTrend: {
    trend: 'increasing' | 'decreasing' | 'stable'
    value: number
  }
  achievements: Achievement[]
  weeklyDistance: {
    current: number
    previous: number
    change: number
  }
  averageIntensity: {
    current: number
    trend: 'up' | 'down' | 'stable'
  }
  recentPerformance: {
    last7Days: number
    previous7Days: number
    improvement: number
  }
}

interface Achievement {
  type: 'distance' | 'pace' | 'consistency' | 'intensity'
  title: string
  description: string
  date: string
  icon: string
}

// Helper functions moved outside the component
const estimateTrainingLoad = (activity: StravaActivity): number => {
  const durationHours = activity.moving_time / 3600
  const baseLoad = activity.sport_type === 'Run' ? 50 : 40
  
  let intensityMultiplier = 1
  if (activity.average_heartrate) {
    intensityMultiplier = activity.average_heartrate / 140
  }
  
  return durationHours * baseLoad * intensityMultiplier
}

const calculatePaceImprovement = (recent: StravaActivity[], previous: StravaActivity[]) => {
  const getAveragePace = (activities: StravaActivity[]) => {
    const runningActivities = activities.filter(a => a.sport_type === 'Run')
    if (runningActivities.length === 0) return 0
    
    const totalPace = runningActivities.reduce((sum: number, activity: StravaActivity) => {
      const pace = activity.moving_time / (activity.distance / 1000) // seconds per km
      return sum + pace
    }, 0)
    
    return totalPace / runningActivities.length
  }

  const recentPace = getAveragePace(recent)
  const previousPace = getAveragePace(previous)

  if (recentPace === 0 || previousPace === 0) {
    return { value: 0, trend: 'stable' as const, timeframe: 'Last 7 days' }
  }

  const improvement = ((previousPace - recentPace) / previousPace) * 100
  const trend: 'up' | 'down' | 'stable' = improvement > 2 ? 'up' : improvement < -2 ? 'down' : 'stable'

  return {
    value: Math.abs(improvement),
    trend,
    timeframe: 'Last 7 days'
  }
}

const calculateTrainingLoadTrend = (recent: StravaActivity[], previous: StravaActivity[]) => {
  const getAverageLoad = (activities: StravaActivity[]) => {
    if (activities.length === 0) return 0
    const totalLoad = activities.reduce((sum: number, activity: StravaActivity) => {
      const load = (activity as ActivityWithTrainingData).training_load_score || estimateTrainingLoad(activity)
      return sum + load
    }, 0)
    return totalLoad / activities.length
  }

  const recentLoad = getAverageLoad(recent)
  const previousLoad = getAverageLoad(previous)

  if (previousLoad === 0) return { trend: 'stable' as const, value: recentLoad }

  const change = ((recentLoad - previousLoad) / previousLoad) * 100

  if (change > 10) return { trend: 'increasing' as const, value: recentLoad }
  if (change < -10) return { trend: 'decreasing' as const, value: recentLoad }
  return { trend: 'stable' as const, value: recentLoad }
}

const findRecentAchievements = (activities: StravaActivity[], preferences: { distance: 'km' | 'miles' }): Achievement[] => {
  const achievements: Achievement[] = []
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Check for longest distance in last 7 days
  const recentActivities = activities.filter(a => new Date(a.start_date) >= sevenDaysAgo)
  const longestRecent = recentActivities.reduce((max: StravaActivity, activity: StravaActivity) => 
    activity.distance > max.distance ? activity : max, { distance: 0 } as StravaActivity)

  if (longestRecent.distance > 0) {
    const olderActivities = activities.filter(a => new Date(a.start_date) < sevenDaysAgo)
    const previousLongest = olderActivities.reduce((max: StravaActivity, activity: StravaActivity) => 
      activity.distance > max.distance ? activity : max, { distance: 0 } as StravaActivity)

    if (longestRecent.distance > previousLongest.distance) {
      achievements.push({
        type: 'distance',
        title: 'New Distance PR!',
        description: `${formatDistance(longestRecent.distance, preferences.distance)} - your longest ${longestRecent.sport_type.toLowerCase()} yet`,
        date: longestRecent.start_date,
        icon: '🏆'
      })
    }
  }

  return achievements.slice(0, 2) // Limit to 2 achievements
}

const calculateWeeklyDistance = (recent: StravaActivity[], previous: StravaActivity[]) => {
  const getWeeklyDistance = (activities: StravaActivity[]) => 
    activities.reduce((sum: number, activity: StravaActivity) => sum + activity.distance, 0) / 1000 // Convert to km

  const current = getWeeklyDistance(recent)
  const prev = getWeeklyDistance(previous)
  const change = prev > 0 ? ((current - prev) / prev) * 100 : 0

  return {
    current: Math.round(current * 10) / 10,
    previous: Math.round(prev * 10) / 10,
    change: Math.round(change)
  }
}

const calculateAverageIntensity = (recent: StravaActivity[], previous: StravaActivity[]) => {
  const getAverageIntensity = (activities: StravaActivity[]) => {
    if (activities.length === 0) return 0
    const totalIntensity = activities.reduce((sum: number, activity: StravaActivity) => {
      return sum + (activity.average_heartrate || 120)
    }, 0)
    return totalIntensity / activities.length
  }

  const currentIntensity = getAverageIntensity(recent)
  const previousIntensity = getAverageIntensity(previous)

  const change = previousIntensity > 0 ? ((currentIntensity - previousIntensity) / previousIntensity) * 100 : 0
  const trend: 'up' | 'down' | 'stable' = change > 5 ? 'up' : change < -5 ? 'down' : 'stable'

  return {
    current: Math.round(currentIntensity),
    trend
  }
}

const calculateRecentPerformance = (recent: StravaActivity[], previous: StravaActivity[]) => {
  const getTotalDistance = (activities: StravaActivity[]) => 
    activities.reduce((sum: number, activity: StravaActivity) => sum + activity.distance, 0) / 1000

  const last7Days = getTotalDistance(recent)
  const previous7Days = getTotalDistance(previous)
  const improvement = previous7Days > 0 ? ((last7Days - previous7Days) / previous7Days) * 100 : 0

  return {
    last7Days: Math.round(last7Days * 10) / 10,
    previous7Days: Math.round(previous7Days * 10) / 10,
    improvement: Math.round(improvement)
  }
}

export function PerformanceInsightsCard({ userId }: PerformanceInsightsCardProps) {
  const { data: activities, isLoading, error } = useUserActivities(userId)
  const { preferences } = useUnitPreferences()

  const performanceInsights = useMemo((): PerformanceInsights | null => {
    if (!activities || activities.length === 0) return null

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Recent activities (last 7 days)
    const recentActivities = activities.filter(activity => 
      new Date(activity.start_date) >= sevenDaysAgo
    )

    // Previous period activities (7-14 days ago)
    const previousActivities = activities.filter(activity => {
      const date = new Date(activity.start_date)
      return date >= fourteenDaysAgo && date < sevenDaysAgo
    })

    // Calculate pace improvement
    const paceImprovement = calculatePaceImprovement(recentActivities, previousActivities)

    // Calculate training load trend
    const trainingLoadTrend = calculateTrainingLoadTrend(recentActivities, previousActivities)

    // Find recent achievements
    const achievements = findRecentAchievements(activities, preferences)

    // Weekly distance comparison
    const weeklyDistance = calculateWeeklyDistance(recentActivities, previousActivities)

    // Average intensity trend
    const averageIntensity = calculateAverageIntensity(recentActivities, previousActivities)

    // Recent performance comparison
    const recentPerformance = calculateRecentPerformance(recentActivities, previousActivities)

    return {
      paceImprovement,
      trainingLoadTrend,
      achievements,
      weeklyDistance,
      averageIntensity,
      recentPerformance
    }
  }, [activities, preferences])

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 h-full flex flex-col justify-center">
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-100 rounded-lg"></div>
            <div className="h-12 bg-gray-100 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !performanceInsights) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 h-full flex flex-col justify-center">
          <div className="text-center py-6 text-gray-500">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Not enough data for insights</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          Performance Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 h-full flex flex-col justify-between">
        {/* Quick Performance Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pace Improvement */}
          <div className={`p-3 rounded-lg text-center ${
            performanceInsights.paceImprovement.trend === 'up' 
              ? 'bg-green-50 border border-green-200' 
              : performanceInsights.paceImprovement.trend === 'down' 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className={`h-4 w-4 ${
                performanceInsights.paceImprovement.trend === 'up' 
                  ? 'text-green-600' 
                  : performanceInsights.paceImprovement.trend === 'down' 
                    ? 'text-red-600' 
                    : 'text-gray-600'
              }`} />
              <span className="text-sm font-medium">Pace</span>
            </div>
            <div className={`text-xl font-bold ${
              performanceInsights.paceImprovement.trend === 'up' 
                ? 'text-green-600' 
                : performanceInsights.paceImprovement.trend === 'down' 
                  ? 'text-red-600' 
                  : 'text-gray-600'
            }`}>
              {performanceInsights.paceImprovement.trend === 'up' ? '+' : performanceInsights.paceImprovement.trend === 'down' ? '-' : ''}{performanceInsights.paceImprovement.value.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {performanceInsights.paceImprovement.trend === 'up' ? 'Improving' : performanceInsights.paceImprovement.trend === 'down' ? 'Slower' : 'Stable'}
            </div>
          </div>

          {/* Weekly Distance */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">This Week</span>
            </div>
            <div className="text-xl font-bold text-blue-600">
              {performanceInsights.weeklyDistance.current > 0 
                ? parseFloat(formatDistance(performanceInsights.weeklyDistance.current * 1000, preferences.distance)).toFixed(1)
                : '0'
              }
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {preferences.distance === 'miles' ? 'miles' : 'km'}
            </div>
          </div>

          {/* Training Load Trend */}
          <div className={`p-3 rounded-lg text-center ${
            performanceInsights.trainingLoadTrend.trend === 'increasing' 
              ? 'bg-orange-50 border border-orange-200' 
              : performanceInsights.trainingLoadTrend.trend === 'decreasing' 
                ? 'bg-purple-50 border border-purple-200' 
                : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className={`h-4 w-4 ${
                performanceInsights.trainingLoadTrend.trend === 'increasing' 
                  ? 'text-orange-600' 
                  : performanceInsights.trainingLoadTrend.trend === 'decreasing' 
                    ? 'text-purple-600' 
                    : 'text-gray-600'
              }`} />
              <span className="text-sm font-medium">Load</span>
            </div>
            <div className={`text-xl font-bold ${
              performanceInsights.trainingLoadTrend.trend === 'increasing' 
                ? 'text-orange-600' 
                : performanceInsights.trainingLoadTrend.trend === 'decreasing' 
                  ? 'text-purple-600' 
                  : 'text-gray-600'
            }`}>
              {Math.round(performanceInsights.trainingLoadTrend.value)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {performanceInsights.trainingLoadTrend.trend === 'increasing' ? 'Building' : performanceInsights.trainingLoadTrend.trend === 'decreasing' ? 'Recovery' : 'Stable'}
            </div>
          </div>

          {/* Average Intensity */}
          <div className={`p-3 rounded-lg text-center ${
            performanceInsights.averageIntensity.trend === 'up' 
              ? 'bg-red-50 border border-red-200' 
              : performanceInsights.averageIntensity.trend === 'down' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className={`h-4 w-4 ${
                performanceInsights.averageIntensity.trend === 'up' 
                  ? 'text-red-600' 
                  : performanceInsights.averageIntensity.trend === 'down' 
                    ? 'text-green-600' 
                    : 'text-gray-600'
              }`} />
              <span className="text-sm font-medium">Intensity</span>
            </div>
            <div className={`text-xl font-bold ${
              performanceInsights.averageIntensity.trend === 'up' 
                ? 'text-red-600' 
                : performanceInsights.averageIntensity.trend === 'down' 
                  ? 'text-green-600' 
                  : 'text-gray-600'
            }`}>
              {performanceInsights.averageIntensity.current}
            </div>
            <div className="text-xs text-gray-500 mt-1">BPM avg</div>
          </div>
        </div>

        {/* Recent Achievement - If any */}
        {performanceInsights.achievements.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <Trophy className="h-4 w-4" />
              <span>Recent: {performanceInsights.achievements[0].title}</span>
            </div>
          </div>
        )}

        {/* View Details Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => {
            // Navigate to detailed performance page
            window.location.href = '/dashboard/analytics'
          }}
        >
          View Detailed Insights
        </Button>
      </CardContent>
    </Card>
  )
} 