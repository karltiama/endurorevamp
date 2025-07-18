'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserActivities } from '@/hooks/use-user-activities'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatDistance } from '@/lib/utils'
import { useMemo } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Flame,
  Trophy,
  Target,
  Activity,
  Minus
} from 'lucide-react'
import { Activity as StravaActivity } from '@/lib/strava/types'
import { ActivityWithTrainingData } from '@/types'

interface PerformanceInsightsCardProps {
  userId: string
}

interface PerformanceInsights {
  paceImprovement: {
    value: number
    trend: 'up' | 'down' | 'stable'
    timeframe: string
  }
  consistencyStreak: number
  trainingLoadTrend: 'increasing' | 'decreasing' | 'stable'
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

const calculateConsistencyStreak = (activities: StravaActivity[]): number => {
  if (activities.length === 0) return 0

  const sortedActivities = activities
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

  let streak = 0
  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (let i = 0; i < 30; i++) { // Check last 30 days
    const checkDate = new Date(currentDate)
    checkDate.setDate(currentDate.getDate() - i)

    const hasActivity = sortedActivities.some(activity => {
      const activityDate = new Date(activity.start_date)
      activityDate.setHours(0, 0, 0, 0)
      return activityDate.getTime() === checkDate.getTime()
    })

    if (hasActivity) {
      streak++
    } else if (i === 0) {
      // If no activity today, check if there was one yesterday to start counting
      continue
    } else {
      // Break in streak
      break
    }
  }

  return streak
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

  if (previousLoad === 0) return 'stable'

  const change = ((recentLoad - previousLoad) / previousLoad) * 100

  if (change > 10) return 'increasing'
  if (change < -10) return 'decreasing'
  return 'stable'
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

  // Check for consistency achievement
  const streak = calculateConsistencyStreak(activities)
  if (streak >= 5) {
    achievements.push({
      type: 'consistency',
      title: 'Consistency Champion!',
      description: `${streak} day training streak - keep it up!`,
      date: new Date().toISOString(),
      icon: '🔥'
    })
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

const getTrendIcon = (trend: string, size = 'h-4 w-4') => {
  switch (trend) {
    case 'up':
    case 'increasing':
      return <TrendingUp className={`${size} text-green-600`} />
    case 'down':
    case 'decreasing':
      return <TrendingDown className={`${size} text-red-600`} />
    default:
      return <Minus className={`${size} text-gray-600`} />
  }
}

const getTrendColor = (trend: string): string => {
  switch (trend) {
    case 'up':
    case 'increasing':
      return 'text-green-600'
    case 'down':
    case 'decreasing':
      return 'text-red-600'
    default:
      return 'text-gray-600'
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

    // Calculate consistency streak
    const consistencyStreak = calculateConsistencyStreak(activities)

    // Calculate training load trend
    const trainingLoadTrend = calculateTrainingLoadTrend(recentActivities, previousActivities)

    // Find recent achievements
    const achievements = findRecentAchievements(activities, preferences)

    // Weekly distance comparison
    const weeklyDistance = calculateWeeklyDistance(recentActivities, previousActivities)

    // Average intensity trend
    const averageIntensity = calculateAverageIntensity(recentActivities, previousActivities)

    return {
      paceImprovement,
      consistencyStreak,
      trainingLoadTrend,
      achievements,
      weeklyDistance,
      averageIntensity
    }
  }, [activities, preferences])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-100 rounded-lg"></div>
            <div className="h-16 bg-gray-100 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !performanceInsights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Not enough data for insights</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Pace Improvement */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Target className="h-4 w-4" />
              Pace Trend
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(performanceInsights.paceImprovement.trend)}
              <span className={`font-bold ${getTrendColor(performanceInsights.paceImprovement.trend)}`}>
                {performanceInsights.paceImprovement.value.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {performanceInsights.paceImprovement.timeframe}
            </div>
          </div>

          {/* Consistency Streak */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Flame className="h-4 w-4" />
              Streak
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <span className="text-lg font-bold text-orange-600">
                {performanceInsights.consistencyStreak}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {performanceInsights.consistencyStreak === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>

        {/* Training Load Trend */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Training Load</span>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(performanceInsights.trainingLoadTrend)}
              <span className={`text-sm font-medium ${getTrendColor(performanceInsights.trainingLoadTrend)}`}>
                {performanceInsights.trainingLoadTrend}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Distance Comparison */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600">Weekly Distance</h4>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">
                {formatDistance(performanceInsights.weeklyDistance.current * 1000, preferences.distance)}
              </div>
              <div className="text-xs text-gray-500">This week</div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${performanceInsights.weeklyDistance.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {performanceInsights.weeklyDistance.change >= 0 ? '+' : ''}{performanceInsights.weeklyDistance.change}%
              </div>
              <div className="text-xs text-gray-500">vs last week</div>
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        {performanceInsights.achievements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Recent Achievements
            </h4>
            <div className="space-y-2">
              {performanceInsights.achievements.map((achievement, index) => (
                <div key={index} className="flex items-start gap-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-lg">{achievement.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-yellow-800">
                      {achievement.title}
                    </div>
                    <div className="text-xs text-yellow-600">
                      {achievement.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600">Avg Intensity</div>
              <div className="flex items-center justify-center gap-1">
                <span className="font-medium">{performanceInsights.averageIntensity.current} BPM</span>
                {getTrendIcon(performanceInsights.averageIntensity.trend, 'h-3 w-3')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Load Trend</div>
              <div className="flex items-center justify-center gap-1">
                <span className="font-medium capitalize">{performanceInsights.trainingLoadTrend}</span>
                {getTrendIcon(performanceInsights.trainingLoadTrend, 'h-3 w-3')}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 