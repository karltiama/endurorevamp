'use client'

import { useUserActivities } from '../../hooks/use-user-activities'
import { calculateWeeklyDistance, calculateActivityStreak, getLastActivity } from '@/lib/dashboard/metrics'
import type { Activity } from '@/lib/strava/types'

interface KeyMetricsProps {
  userId: string
}

export function KeyMetrics({ userId }: KeyMetricsProps) {
  const { data: activities, isLoading, error } = useUserActivities(userId)

  if (isLoading) {
    return <KeyMetricsSkeleton />
  }

  if (error || !activities) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Unable to load metrics</p>
        </div>
      </div>
    )
  }

  const weeklyDistance = calculateWeeklyDistance(activities)
  const streakData = calculateActivityStreak(activities)
  const lastActivity = getLastActivity(activities)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <WeeklyDistanceCard distance={weeklyDistance} />
      <StreakCard streakData={streakData} />
      <LastRunCard lastActivity={lastActivity} />
    </div>
  )
}

function WeeklyDistanceCard({ distance }: { distance: { current: number; previous: number; change: number } }) {
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${meters.toFixed(0)} m`
  }

  const changeIcon = distance.change > 0 ? '↗️' : distance.change < 0 ? '↘️' : '➡️'
  const changeColor = distance.change > 0 ? 'text-green-600' : distance.change < 0 ? 'text-red-600' : 'text-gray-600'

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">This Week</p>
          <p className="text-3xl font-bold text-gray-900">{formatDistance(distance.current)}</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
          <span className="text-xl">📏</span>
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <span className={`text-sm font-medium ${changeColor}`}>
          {changeIcon} {Math.abs(distance.change)}% vs last week
        </span>
      </div>
    </div>
  )
}

function StreakCard({ streakData }: { streakData: { current: number; longest: number; consistency: number } }) {
  const getStreakEmoji = (days: number) => {
    if (days >= 30) return '🔥'
    if (days >= 14) return '⚡'
    if (days >= 7) return '✨'
    if (days >= 3) return '💪'
    return '🎯'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">Current Streak</p>
          <p className="text-3xl font-bold text-gray-900">{streakData.current} days</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full">
          <span className="text-xl">{getStreakEmoji(streakData.current)}</span>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Longest streak</span>
          <span className="font-medium">{streakData.longest} days</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Consistency</span>
          <span className="font-medium">{streakData.consistency}%</span>
        </div>
      </div>
    </div>
  )
}

function LastRunCard({ lastActivity }: { lastActivity: Activity | null }) {
  if (!lastActivity) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Last Activity</p>
            <p className="text-lg text-gray-500">No activities yet</p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
            <span className="text-xl">🏃‍♂️</span>
          </div>
        </div>
      </div>
    )
  }

  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(1)} km`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const getDaysAgo = (dateString: string) => {
    const daysDiff = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff === 0) return 'Today'
    if (daysDiff === 1) return 'Yesterday'
    return `${daysDiff} days ago`
  }

  const getActivityIcon = (sportType: string) => {
    const icons: Record<string, string> = {
      'Ride': '🚴‍♂️',
      'Run': '🏃‍♂️',
      'Swim': '🏊‍♂️',
      'Hike': '🥾',
      'Walk': '🚶‍♂️',
      'Workout': '💪',
    }
    return icons[sportType] || '🏃‍♂️'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-600">Last Activity</p>
          <p className="text-lg font-bold text-gray-900 truncate">{lastActivity.name}</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
          <span className="text-xl">{getActivityIcon(lastActivity.sport_type)}</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Distance</span>
          <span className="font-medium">{formatDistance(lastActivity.distance)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Duration</span>
          <span className="font-medium">{formatDuration(lastActivity.moving_time)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">When</span>
          <span className="font-medium">{getDaysAgo(lastActivity.start_date)}</span>
        </div>
      </div>
    </div>
  )
}

function KeyMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </div>
            <div className="mt-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 