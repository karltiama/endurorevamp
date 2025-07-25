'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from '@/lib/strava/types'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { convertDistance, getDistanceUnit } from '@/lib/utils'
import { ActivityContributionCalendar } from './ActivityContributionCalendar'
import { TrendingUp, Calendar, Activity as ActivityIcon } from 'lucide-react'

interface ActivityFrequencyWidgetProps {
  activities: Activity[]
}

// Helper functions
const calculateLongestStreak = (activities: Activity[]): number => {
  if (activities.length === 0) return 0
  
  const sortedActivities = activities
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  
  let longestStreak = 0
  let currentStreak = 0
  let lastDate: string | null = null
  
  sortedActivities.forEach(activity => {
    const activityDate = new Date(activity.start_date).toDateString()
    
    if (lastDate === null) {
      currentStreak = 1
    } else {
      const lastDateObj = new Date(lastDate)
      const currentDateObj = new Date(activity.start_date)
      const daysDiff = Math.floor((currentDateObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 1) {
        currentStreak++
      } else {
        currentStreak = 1
      }
    }
    
    longestStreak = Math.max(longestStreak, currentStreak)
    lastDate = activityDate
  })
  
  return longestStreak
}

const calculateCurrentStreak = (activities: Activity[]): number => {
  if (activities.length === 0) return 0
  
  const sortedActivities = activities
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let currentStreak = 0
  let checkDate = new Date(today)
  
  for (let i = 0; i < 30; i++) { // Check last 30 days max
    const hasActivityOnDate = sortedActivities.some(activity => {
      const activityDate = new Date(activity.start_date)
      activityDate.setHours(0, 0, 0, 0)
      return activityDate.getTime() === checkDate.getTime()
    })
    
    if (hasActivityOnDate) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }
  
  return currentStreak
}

export function ActivityFrequencyWidget({ activities }: ActivityFrequencyWidgetProps) {
  const { preferences } = useUnitPreferences()

  const frequencyData = useMemo(() => {
    if (!activities || activities.length === 0) return null

    const currentDate = new Date()
    const fourWeeksAgo = new Date(currentDate.getTime() - 28 * 24 * 60 * 60 * 1000)
    
    // Filter to last 4 weeks
    const recentActivities = activities.filter(activity => 
      new Date(activity.start_date) >= fourWeeksAgo
    )

    // Calculate weekly activity counts
    const weeklyCounts = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - (currentDate.getDay() + 7 * i))
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      const weekActivities = recentActivities.filter(activity => {
        const activityDate = new Date(activity.start_date)
        return activityDate >= weekStart && activityDate <= weekEnd
      })
      
      weeklyCounts.push({
        week: `Week ${4 - i}`,
        count: weekActivities.length,
        distance: weekActivities.reduce((sum, activity) => sum + activity.distance, 0)
      })
    }

    // Calculate consistency metrics
    const totalActivities = recentActivities.length
    const averagePerWeek = totalActivities / 4
    const consistencyScore = Math.min(100, (averagePerWeek / 3) * 100) // Assuming 3 activities/week is good
    const longestStreak = calculateLongestStreak(recentActivities)
    const currentStreak = calculateCurrentStreak(recentActivities)

    return {
      weeklyCounts,
      totalActivities,
      averagePerWeek,
      consistencyScore,
      longestStreak,
      currentStreak
    }
  }, [activities, preferences.distance])

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Frequency
          </CardTitle>
          <CardDescription>
            Track your training consistency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No activities found</p>
            <p className="text-sm">Sync your activities to see your frequency</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!frequencyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Frequency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            <div className="animate-pulse">Loading frequency data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { weeklyCounts, totalActivities, averagePerWeek, consistencyScore, longestStreak, currentStreak } = frequencyData

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Activity Frequency
        </CardTitle>
        <CardDescription>
          Your training consistency over the last 4 weeks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalActivities}</div>
            <div className="text-sm text-blue-600">Total Activities</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{averagePerWeek.toFixed(1)}</div>
            <div className="text-sm text-green-600">Avg/Week</div>
          </div>
        </div>

        {/* Consistency Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Consistency Score</span>
            <span className="text-sm font-bold">{Math.round(consistencyScore)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${consistencyScore}%` }}
            />
          </div>
        </div>

        {/* Streaks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">{currentStreak}</div>
            <div className="text-xs text-orange-600">Current Streak</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">{longestStreak}</div>
            <div className="text-xs text-purple-600">Longest Streak</div>
          </div>
        </div>

        {/* Weekly Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Weekly Breakdown</span>
          </div>
          <div className="space-y-1">
            {weeklyCounts.map((week, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{week.week}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{week.count} activities</span>
                  <span className="text-muted-foreground">
                    ({convertDistance(week.distance, preferences.distance).toFixed(1)} {getDistanceUnit(preferences.distance)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Calendar */}
        <div className="pt-2 border-t">
          <div className="text-sm font-medium mb-2">Activity Calendar</div>
          <div className="h-24 w-full overflow-x-auto max-w-full flex justify-center items-center">
            <div className="min-w-[220px] max-w-full">
              <ActivityContributionCalendar activities={activities} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 