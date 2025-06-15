'use client'

import { useUserActivities } from '../../hooks/use-user-activities'
import { calculateWeeklyDistance, calculateActivityStreak, calculateMonthlyProgress } from '@/lib/dashboard/metrics'
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
  const monthlyProgress = calculateMonthlyProgress(activities)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <WeeklyDistanceCard distance={weeklyDistance} />
      <StreakCard streakData={streakData} />
      <MonthlyGoalCard progress={monthlyProgress} />
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
      <div className="mt-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Last week</span>
          <span className="font-medium">{formatDistance(distance.previous)}</span>
        </div>
        <div className="flex items-center">
          <span className={`text-sm font-medium ${changeColor}`}>
            {changeIcon} {Math.abs(distance.change)}% change
          </span>
        </div>
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

function MonthlyGoalCard({ progress }: { 
  progress: { 
    current: number; 
    target: number; 
    progress: number; 
    daysLeft: number;
    onTrack: boolean;
    projectedTotal: number;
  } 
}) {
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${meters.toFixed(0)} m`
  }

  const getProgressColor = () => {
    if (progress.progress >= 100) return 'text-green-600'
    if (progress.onTrack) return 'text-blue-600'
    return 'text-orange-600'
  }

  const getProgressIcon = () => {
    if (progress.progress >= 100) return '🎉'
    if (progress.onTrack) return '🎯'
    return '⚡'
  }

  const getStatusMessage = () => {
    if (progress.progress >= 100) return 'Goal achieved!'
    if (progress.onTrack) return 'On track'
    return 'Push harder!'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">Monthly Goal</p>
          <p className="text-3xl font-bold text-gray-900">{progress.progress.toFixed(1)}%</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full">
          <span className="text-xl">{getProgressIcon()}</span>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Current</span>
          <span className="font-medium">{formatDistance(progress.current)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Target</span>
          <span className="font-medium">{formatDistance(progress.target)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${getProgressColor()}`}>
            {getStatusMessage()}
          </span>
          <span className="text-xs text-gray-500">
            {progress.daysLeft} days left
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              progress.progress >= 100 ? 'bg-green-500' : 
              progress.onTrack ? 'bg-blue-500' : 'bg-orange-500'
            }`}
            style={{ width: `${Math.min(100, progress.progress)}%` }}
          ></div>
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