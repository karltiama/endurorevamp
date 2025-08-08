'use client'

import React, { useState } from 'react'
import { useUserGoals, useGoalManagement } from '@/hooks/useGoals'
import { useUserActivities } from '../../hooks/use-user-activities'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatDistance } from '@/lib/utils'
import { DashboardGoalSelector } from './DashboardGoalSelector'
import { Button } from '@/components/ui/button'
import { Target, Settings } from 'lucide-react'
import type { UserGoal } from '@/types/goals'

interface KeyMetricsProps {
  userId: string
}

export function KeyMetrics({ userId }: KeyMetricsProps) {
  const { isLoading: goalsLoading } = useUserGoals()
  const { isLoading: activitiesLoading } = useUserActivities(userId)
  const { preferences } = useUnitPreferences()
  const { getDashboardGoals } = useGoalManagement()
  const [showGoalSelector, setShowGoalSelector] = useState(false)

  if (goalsLoading || activitiesLoading) {
    return <KeyMetricsSkeleton />
  }

  // Get goals marked for dashboard display
  const dashboardGoals = getDashboardGoals()

  // If no dashboard goals are set, show message to set them up
  if (dashboardGoals.length === 0) {
    return (
      <>
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Set Up Your Dashboard Goals</h3>
            <p className="text-blue-700 mb-4">
              Choose up to 3 goals to track as key metrics on your dashboard.
            </p>
            <Button 
              onClick={() => setShowGoalSelector(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Target className="h-4 w-4 mr-2" />
              Choose Dashboard Goals
            </Button>
          </div>
        </div>
        
        <DashboardGoalSelector
          open={showGoalSelector}
          onOpenChange={setShowGoalSelector}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Key Metrics</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGoalSelector(true)}
          className="text-gray-600 hover:text-gray-900"
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Goals
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {dashboardGoals.slice(0, 3).map((goal, index) => (
          <GoalMetricCard 
            key={goal.id}
            goal={goal}
            unit={preferences.distance}
            priority={index + 1}
          />
        ))}
      </div>
      
      <DashboardGoalSelector
        open={showGoalSelector}
        onOpenChange={setShowGoalSelector}
      />
    </>
  )
}

interface GoalMetricCardProps {
  goal: UserGoal
  unit: 'km' | 'miles'
  priority: number
}

function GoalMetricCard({ goal, unit, priority }: GoalMetricCardProps) {
  const progress = calculateGoalProgress(goal)
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              #{priority}
            </span>
            {goal.goal_type?.display_name}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {formatGoalValue(progress.current, goal, unit)}
          </p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
          <span className="text-xl">{getGoalIcon(goal.goal_type?.category)}</span>
        </div>
      </div>
      
      <div className="mt-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Target</span>
          <span className="font-medium">
            {formatGoalValue(goal.target_value || 0, goal, unit)}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className={`font-medium ${getProgressColor(progress.percentage)}`}>
            {progress.percentage.toFixed(1)}%
          </span>
        </div>
        
        {goal.time_period !== 'ongoing' && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Time left</span>
            <span className="text-gray-600">
              {calculateTimeRemaining(goal)}
            </span>
          </div>
        )}
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(progress.percentage)}`}
            style={{ width: `${Math.min(100, progress.percentage)}%` }}
          ></div>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          {getProgressMessage(progress)}
        </div>
      </div>
    </div>
  )
}

// Helper functions
function calculateGoalProgress(goal: UserGoal) {
  const current = goal.current_progress || 0
  const target = goal.target_value || 1
  const percentage = (current / target) * 100
  
  return {
    current,
    target,
    percentage,
    remaining: Math.max(0, target - current)
  }
}

function formatGoalValue(value: number, goal: UserGoal, unit: 'km' | 'miles'): string {
  const category = goal.goal_type?.category
  
  switch (category) {
    case 'distance':
      // Value is already in km from database, so convert to meters for formatDistance
      return formatDistance(value * 1000, unit)
    case 'frequency':
      return `${Math.round(value)} runs`
    case 'pace':
      const minutes = Math.floor(value / 60)
      const seconds = Math.round(value % 60)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    case 'duration':
      const hours = Math.floor(value / 60)
      const mins = Math.round(value % 60)
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    default:
      return `${value.toFixed(1)} ${goal.target_unit || ''}`
  }
}

function getGoalIcon(category?: string): string {
  switch (category) {
    case 'distance': return '📏'
    case 'pace': return '⚡'
    case 'frequency': return '🔄'
    case 'duration': return '⏱️'
    case 'elevation': return '⛰️'
    case 'heart_rate': return '❤️'
    case 'event': return '🏁'
    default: return '🎯'
  }
}

function getProgressColor(percentage: number): string {
  if (percentage >= 100) return 'text-green-600'
  if (percentage >= 80) return 'text-blue-600'
  if (percentage >= 50) return 'text-orange-600'
  return 'text-red-600'
}

function getProgressBarColor(percentage: number): string {
  if (percentage >= 100) return 'bg-green-500'
  if (percentage >= 80) return 'bg-blue-500'
  if (percentage >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}

function calculateTimeRemaining(goal: UserGoal): string {
  if (!goal.target_date) {
    return goal.time_period === 'weekly' ? 'This week' : 'This month'
  }
  
  const targetDate = new Date(goal.target_date)
  const now = new Date()
  const diffTime = targetDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day'
  if (diffDays < 7) return `${diffDays} days`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`
  return `${Math.ceil(diffDays / 30)} months`
}

function getProgressMessage(progress: { percentage: number }): string {
  const percentage = progress.percentage
  
  if (percentage >= 100) return '🎉 Goal achieved!'
  if (percentage >= 80) return '🔥 Almost there!'
  if (percentage >= 50) return '💪 Keep it up!'
  if (percentage >= 25) return '📈 Good progress!'
  return '🚀 Just getting started!'
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