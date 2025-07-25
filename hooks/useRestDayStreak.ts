import { useState, useEffect } from 'react'
import { useUserActivities } from './use-user-activities'
import { calculateActivityStreakWithRestDays } from '@/lib/dashboard/metrics'

interface RestDayPreferences {
  restDayCredits: number // Number of rest days allowed per week
  restDaysUsed: number // Number of rest days used this week
  weekStart: string // ISO string of current week start
  autoUseRestDays: boolean // Whether to automatically use rest days
  showRestDayPrompts: boolean // Whether to show rest day confirmation dialogs
}

interface RestDayStreakData {
  current: number
  longest: number
  consistency: number
  restDaysRemaining: number
  streakType: 'active' | 'rest_day' | 'broken'
  nextRestDayAvailable: Date | null
  canUseRestDay: boolean
  shouldShowRestDayPrompt: boolean
}

const REST_DAY_PREFERENCES_KEY = 'rest-day-preferences'

export function useRestDayStreak(userId: string) {
  const { data: activities, isLoading, error } = useUserActivities(userId)
  
  const [preferences, setPreferences] = useState<RestDayPreferences>({
    restDayCredits: 2,
    restDaysUsed: 0,
    weekStart: getCurrentWeekStart().toISOString(),
    autoUseRestDays: false,
    showRestDayPrompts: true
  })

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(REST_DAY_PREFERENCES_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Failed to load rest day preferences:', error)
      }
    }
  }, [])

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem(REST_DAY_PREFERENCES_KEY, JSON.stringify(preferences))
  }, [preferences])

  // Check if we need to reset weekly rest day usage
  useEffect(() => {
    const currentWeekStart = getCurrentWeekStart()
    const savedWeekStart = new Date(preferences.weekStart)
    
    if (currentWeekStart.getTime() !== savedWeekStart.getTime()) {
      // New week, reset rest days used
      setPreferences(prev => ({
        ...prev,
        restDaysUsed: 0,
        weekStart: currentWeekStart.toISOString()
      }))
    }
  }, [preferences.weekStart])

  const baseStreakData = calculateActivityStreakWithRestDays(
    activities || [],
    preferences.restDayCredits,
    preferences.restDaysUsed
  )

  const streakData: RestDayStreakData = {
    ...baseStreakData,
    canUseRestDay: baseStreakData.restDaysRemaining > 0,
    shouldShowRestDayPrompt: false // Will be calculated below
  }

  const updatePreferences = (updates: Partial<RestDayPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }))
  }

  const useRestDay = () => {
    if (streakData.canUseRestDay) {
      setPreferences(prev => ({
        ...prev,
        restDaysUsed: prev.restDaysUsed + 1
      }))
      return true
    }
    return false
  }

  const resetRestDaysUsed = () => {
    setPreferences(prev => ({
      ...prev,
      restDaysUsed: 0
    }))
  }

  // Determine if we should show rest day prompt
  const shouldShowRestDayPrompt = 
    preferences.showRestDayPrompts &&
    streakData.restDaysRemaining > 0 &&
    streakData.streakType === 'broken' &&
    activities &&
    activities.length > 0

  return {
    // Data
    streakData: {
      ...streakData,
      shouldShowRestDayPrompt
    },
    
    // Preferences
    preferences,
    updatePreferences,
    
    // Actions
    useRestDay,
    resetRestDaysUsed,
    
    // State
    isLoading,
    error
  }
}

function getCurrentWeekStart(): Date {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
} 