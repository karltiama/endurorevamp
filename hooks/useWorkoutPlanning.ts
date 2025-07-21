import { useQuery } from '@tanstack/react-query'
import { useUserActivities } from './use-user-activities'
import { useTrainingLoad } from './useTrainingLoad'
import { useUnitPreferences } from './useUnitPreferences'
import { WorkoutPlanner, type WorkoutRecommendation, type WorkoutPlanningContext } from '@/lib/training/workout-planning'

interface UseWorkoutPlanningOptions {
  userId: string
  includeWeather?: boolean
}

export function useWorkoutPlanning({ userId, includeWeather = false }: UseWorkoutPlanningOptions) {
  // Get user activities
  const { data: activities = [], isLoading: activitiesLoading, error: activitiesError } = useUserActivities(userId)
  
  // Get training load data
  const { data: trainingLoadData, isLoading: trainingLoadLoading, error: trainingLoadError } = useTrainingLoad(userId, { days: 30 })
  
  // Get unit preferences
  const { preferences: unitPreferences } = useUnitPreferences()

  // Get today's workout recommendation
  const { data: todaysWorkout, isLoading: todaysWorkoutLoading } = useQuery({
    queryKey: ['workout-planning', 'todays-workout', userId, activities.length, trainingLoadData?.metrics, unitPreferences],
    queryFn: () => generateTodaysWorkout(userId, activities, trainingLoadData?.metrics, unitPreferences),
    enabled: !!userId && activities.length > 0 && !!trainingLoadData?.metrics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Get weekly workout plan
  const { data: weeklyPlan, isLoading: weeklyPlanLoading } = useQuery({
    queryKey: ['workout-planning', 'weekly-plan', userId, activities.length, trainingLoadData?.metrics, unitPreferences],
    queryFn: () => generateWeeklyPlan(userId, activities, trainingLoadData?.metrics, unitPreferences, todaysWorkout || null),
    enabled: !!userId && activities.length > 0 && !!trainingLoadData?.metrics,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    // Today's workout
    todaysWorkout,
    isLoadingTodaysWorkout: todaysWorkoutLoading || activitiesLoading || trainingLoadLoading,
    
    // Weekly plan
    weeklyPlan,
    isLoadingWeeklyPlan: weeklyPlanLoading || activitiesLoading || trainingLoadLoading,
    
    // Loading states
    isLoading: activitiesLoading || trainingLoadLoading,
    error: activitiesError || trainingLoadError,
    
    // Data availability
    hasData: activities.length > 0 && !!trainingLoadData?.metrics,
  }
}

/**
 * Generate today's workout recommendation
 */
function generateTodaysWorkout(
  userId: string, 
  activities: any[], 
  trainingLoadMetrics: any,
  unitPreferences: any
): WorkoutRecommendation | null {
  if (!trainingLoadMetrics || activities.length === 0) {
    return null
  }

  const context: WorkoutPlanningContext = {
    userId,
    currentTrainingLoad: trainingLoadMetrics,
    recentActivities: activities.slice(0, 10), // Last 10 activities
    userGoals: [], // TODO: Get from goals system
    userPreferences: {
      preferredSports: ['Run', 'Ride', 'Swim'], // Default preferences
      availableTime: 60, // Default 60 minutes
      unitPreferences, // Include user's unit preferences
      // TODO: Get weather data if includeWeather is true
    }
  }

  const planner = new WorkoutPlanner(context)
  return planner.generateTodaysWorkout()
}

/**
 * Generate weekly workout plan
 */
function generateWeeklyPlan(
  userId: string, 
  activities: any[], 
  trainingLoadMetrics: any,
  unitPreferences: any,
  todaysWorkout: WorkoutRecommendation | null
): WorkoutRecommendation[] {
  if (!trainingLoadMetrics || activities.length === 0) {
    return []
  }

  const context: WorkoutPlanningContext = {
    userId,
    currentTrainingLoad: trainingLoadMetrics,
    recentActivities: activities.slice(0, 20), // Last 20 activities
    userGoals: [], // TODO: Get from goals system
    userPreferences: {
      preferredSports: ['Run', 'Ride', 'Swim'], // Default preferences
      availableTime: 60, // Default 60 minutes
      unitPreferences, // Include user's unit preferences
    }
  }

  const planner = new WorkoutPlanner(context)
  return planner.generateWeeklyPlanStartingFromToday(todaysWorkout)
} 