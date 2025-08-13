import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EnhancedWorkoutPlanner } from '@/lib/training/enhanced-workout-planning';
import { useUserActivities } from './use-user-activities';
import { useTrainingLoad } from './useTrainingLoad';
import { useUnitPreferences } from './useUnitPreferences';
import { useUserGoals } from './useGoals';
import { generateEnhancedWorkoutRecommendations } from '@/lib/training/enhanced-workout-planning';
import type {
  EnhancedWorkoutRecommendation,
  WeeklyWorkoutPlan,
} from '@/lib/training/enhanced-workout-planning';

interface UseEnhancedWorkoutPlanningOptions {
  userId: string;
  includeWeather?: boolean;
}

export function useEnhancedWorkoutPlanning({
  userId,
  includeWeather = false,
}: UseEnhancedWorkoutPlanningOptions) {
  // Get user activities
  const {
    data: activities = [],
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useUserActivities(userId);

  // Get training load data - use last 21 days but exclude this week for more accurate planning
  const {
    data: trainingLoadData,
    isLoading: trainingLoadLoading,
    error: trainingLoadError,
  } = useTrainingLoad(userId, { days: 21 });

  // Get unit preferences
  const { preferences: unitPreferences } = useUnitPreferences();

  // Get user goals
  const {
    data: goalsData,
    isLoading: goalsLoading,
    error: goalsError,
  } = useUserGoals();
  const goals = goalsData?.goals || [];

  // Get saved workout plan from database
  const {
    data: savedPlanData,
    isLoading: savedPlanLoading,
    error: savedPlanError,
  } = useQuery({
    queryKey: ['workout-plans', userId],
    queryFn: async () => {
      const response = await fetch('/api/workout-plans');
      if (!response.ok) {
        throw new Error('Failed to fetch workout plan');
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter activities to exclude this week's activities for workout planning
  const getActivitiesForWorkoutPlanning = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    // Only use activities from before this week for workout planning
    return activities.filter(activity => {
      const activityDate = new Date(activity.start_date_local);
      return activityDate < startOfWeek;
    });
  };

  const planningActivities = getActivitiesForWorkoutPlanning();

  // Get today's workout recommendation - derive from weekly plan
  const { data: todaysWorkout, isLoading: todaysWorkoutLoading } = useQuery({
    queryKey: [
      'enhanced-workout-planning',
      'todays-workout',
      userId,
      planningActivities.length,
      trainingLoadData?.metrics,
      goals.length,
      unitPreferences,
      savedPlanData?.weeklyPlan?.id || 'no-saved-plan',
    ],
    queryFn: () => {
      console.log("useEnhancedWorkoutPlanning: Today's workout queryFn called");
      console.log(
        'useEnhancedWorkoutPlanning: savedPlanData?.weeklyPlan exists:',
        !!savedPlanData?.weeklyPlan
      );

      if (!trainingLoadData?.metrics) {
        // Create a fallback today's workout
        const fallbackWorkout = createFallbackTodaysWorkout();
        return { todaysWorkout: fallbackWorkout, weeklyPlan: null };
      }

      // If we have a saved plan, derive today's workout from it
      if (savedPlanData?.weeklyPlan) {
        console.log(
          "useEnhancedWorkoutPlanning: Deriving today's workout from saved plan"
        );
        const todaysWorkout = deriveTodaysWorkoutFromPlan(
          savedPlanData.weeklyPlan
        );
        return { todaysWorkout, weeklyPlan: savedPlanData.weeklyPlan };
      }

      // Otherwise generate both
      console.log(
        'useEnhancedWorkoutPlanning: Generating new workout recommendations'
      );
      return generateEnhancedWorkoutRecommendations(
        userId,
        planningActivities,
        trainingLoadData.metrics,
        goals
      );
    },
    enabled:
      !!userId && planningActivities.length > 0 && !!trainingLoadData?.metrics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get weekly workout plan (use saved plan if available, otherwise generate)
  const { data: weeklyPlan, isLoading: weeklyPlanLoading } = useQuery({
    queryKey: [
      'enhanced-workout-planning',
      'weekly-plan',
      userId,
      planningActivities.length,
      trainingLoadData?.metrics,
      goals.length,
      unitPreferences,
      savedPlanData?.weeklyPlan?.id || 'no-saved-plan',
    ],
    queryFn: async () => {
      console.log('useEnhancedWorkoutPlanning: Weekly plan queryFn called');
      console.log(
        'useEnhancedWorkoutPlanning: savedPlanData?.weeklyPlan:',
        savedPlanData?.weeklyPlan?.id
      );

      // If we have a saved plan, use it
      if (savedPlanData?.weeklyPlan) {
        console.log('useEnhancedWorkoutPlanning: Using saved plan');
        return { weeklyPlan: savedPlanData.weeklyPlan };
      }

      // Otherwise generate a new plan
      console.log('useEnhancedWorkoutPlanning: Generating new plan');
      // Check if we have the required data
      if (!trainingLoadData?.metrics) {
        // Create a fallback plan with basic workouts
        console.log('useEnhancedWorkoutPlanning: Using fallback plan');
        const fallbackPlan = createFallbackWeeklyPlan();
        return { weeklyPlan: fallbackPlan };
      }

      const result = generateEnhancedWorkoutRecommendations(
        userId,
        planningActivities,
        trainingLoadData.metrics,
        goals
      );
      console.log(
        'useEnhancedWorkoutPlanning: Generated plan result:',
        result.weeklyPlan?.id
      );
      return result;
    },
    enabled:
      !!userId && planningActivities.length > 0 && !!trainingLoadData?.metrics,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    // Today's workout
    todaysWorkout: todaysWorkout?.todaysWorkout || null,
    isLoadingTodaysWorkout:
      todaysWorkoutLoading ||
      activitiesLoading ||
      trainingLoadLoading ||
      goalsLoading,

    // Weekly plan
    weeklyPlan: weeklyPlan?.weeklyPlan || null,
    isLoadingWeeklyPlan:
      weeklyPlanLoading ||
      activitiesLoading ||
      trainingLoadLoading ||
      goalsLoading ||
      savedPlanLoading,

    // Loading states
    isLoading:
      activitiesLoading ||
      trainingLoadLoading ||
      goalsLoading ||
      savedPlanLoading,
    error: activitiesError || trainingLoadError || goalsError || savedPlanError,

    // Data availability - make goals optional since they might fail to load
    hasData: planningActivities.length > 0 && !!trainingLoadData?.metrics,

    // Raw data for debugging
    activities,
    trainingLoadData,
    goals,
    unitPreferences,
  };
}

/**
 * Derive today's workout from the weekly plan
 */
function deriveTodaysWorkoutFromPlan(
  weeklyPlan: WeeklyWorkoutPlan
): EnhancedWorkoutRecommendation | null {
  // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();

  console.log('deriveTodaysWorkoutFromPlan: Today is day', today, 'of week');
  console.log(
    'deriveTodaysWorkoutFromPlan: Available workouts in plan:',
    Object.keys(weeklyPlan.workouts)
  );
  console.log(
    "deriveTodaysWorkoutFromPlan: Today's workout:",
    weeklyPlan.workouts[today]
  );

  // Get today's workout from the plan
  const todaysWorkout = weeklyPlan.workouts[today];

  if (!todaysWorkout) {
    console.log(
      'deriveTodaysWorkoutFromPlan: No workout found for today (day',
      today,
      ')'
    );
    return null;
  }

  console.log('deriveTodaysWorkoutFromPlan: Found workout for today:', {
    type: todaysWorkout.type,
    sport: todaysWorkout.sport,
    duration: todaysWorkout.duration,
    intensity: todaysWorkout.intensity,
  });

  return todaysWorkout;
}

/**
 * Create a fallback today's workout when training load data is not available
 */
function createFallbackTodaysWorkout(): EnhancedWorkoutRecommendation {
  return {
    id: `fallback-today-${Date.now()}`,
    type: 'easy',
    sport: 'Run',
    duration: 30,
    intensity: 4,
    distance: 5,
    difficulty: 'beginner',
    energyCost: 4,
    recoveryTime: 12,
    reasoning: 'Basic training session to maintain fitness.',
    alternatives: [],
    instructions: [
      'Start with 5 minutes of walking',
      'Gradually increase to easy jogging',
      'Keep pace comfortable and conversational',
      'Finish with 5 minutes of walking',
    ],
    tips: [
      'Focus on consistency over intensity',
      'Listen to your body',
      'Stay hydrated throughout',
    ],
  };
}

/**
 * Create a fallback weekly plan when training load data is not available
 */
function createFallbackWeeklyPlan(): WeeklyWorkoutPlan {
  const weekStart = new Date().toISOString().split('T')[0];
  const workouts: {
    [dayOfWeek: number]: EnhancedWorkoutRecommendation | null;
  } = {};

  // Create a basic weekly plan with 3-4 workouts
  for (let day = 0; day < 7; day++) {
    if (day === 0 || day === 3 || day === 5) {
      // Monday, Thursday, Saturday - workout days
      workouts[day] = {
        id: `fallback-${day}-${Date.now()}`,
        type: 'easy',
        sport: 'Run',
        duration: 30,
        intensity: 4,
        distance: 5,
        difficulty: 'beginner',
        energyCost: 4,
        recoveryTime: 12,
        reasoning: 'Basic training session to maintain fitness.',
        alternatives: [],
        instructions: [
          'Start with 5 minutes of walking',
          'Gradually increase to easy jogging',
          'Keep pace comfortable and conversational',
          'Finish with 5 minutes of walking',
        ],
        tips: [
          'Focus on consistency over intensity',
          'Listen to your body',
          'Stay hydrated throughout',
        ],
      };
    } else {
      // Rest days
      workouts[day] = null;
    }
  }

  return {
    id: `fallback-week-${weekStart}`,
    weekStart,
    workouts,
    totalTSS: 120,
    totalDistance: 15,
    totalTime: 90,
    periodizationPhase: 'base',
    isEditable: true,
  };
}

// Helper function to generate a new workout plan
async function generateNewWorkoutPlan(
  userId: string,
  queryClient: any
): Promise<WeeklyWorkoutPlan | null> {
  try {
    console.log('generateNewWorkoutPlan: Starting plan generation');

    // Get data from the existing React Query cache instead of making new API calls
    const activitiesData = queryClient.getQueryData([
      'user',
      'activities',
      userId,
    ]);
    const goalsData = queryClient.getQueryData(['goals', 'user']);
    const trainingLoadData = queryClient.getQueryData([
      'training-load',
      userId,
      21,
      activitiesData?.length || 0,
    ]);

    console.log(
      'generateNewWorkoutPlan: Activities from cache:',
      activitiesData?.length || 0
    );
    console.log(
      'generateNewWorkoutPlan: Goals from cache:',
      goalsData?.goals?.length || 0
    );
    console.log(
      'generateNewWorkoutPlan: Training load from cache:',
      trainingLoadData?.metrics
    );

    // If we don't have the required data, return null and let the caller handle it
    if (!activitiesData || !goalsData || !trainingLoadData?.metrics) {
      console.error('generateNewWorkoutPlan: Missing required data from cache');
      console.log(
        'generateNewWorkoutPlan: activitiesData exists:',
        !!activitiesData
      );
      console.log('generateNewWorkoutPlan: goalsData exists:', !!goalsData);
      console.log(
        'generateNewWorkoutPlan: trainingLoadData exists:',
        !!trainingLoadData
      );
      return null;
    }

    // Filter activities to exclude current week (same logic as in the hook)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Go to Sunday

    const planningActivities = activitiesData.filter((activity: any) => {
      const activityDate = new Date(activity.start_date_local);
      return activityDate < weekStart;
    });

    console.log(
      'generateNewWorkoutPlan: Planning activities (filtered):',
      planningActivities.length
    );

    // Create the context for plan generation
    const context = {
      currentTrainingLoad: trainingLoadData.metrics,
      recentActivities: planningActivities,
      userGoals: goalsData.goals || [],
      userPreferences: {
        preferredSports: ['Run'],
        availableTime: 60, // 60 minutes per day
        experienceLevel: 'intermediate' as const,
        intensityPreference: 'moderate',
        timeAvailability: 'medium',
      },
      userId: userId, // Add userId to the context
    };

    // Generate the plan using the same logic as the hook
    const planner = new EnhancedWorkoutPlanner(context);
    const newPlan = planner.generateWeeklyPlan();

    // Validate the generated plan
    if (
      !newPlan ||
      !newPlan.workouts ||
      Object.keys(newPlan.workouts).length === 0
    ) {
      console.error(
        'generateNewWorkoutPlan: Generated plan is invalid or empty'
      );
      return null;
    }

    console.log('generateNewWorkoutPlan: Generated new plan:', newPlan.id);
    console.log('generateNewWorkoutPlan: Plan structure:', {
      id: newPlan.id,
      weekStart: newPlan.weekStart,
      periodizationPhase: newPlan.periodizationPhase,
      totalTSS: newPlan.totalTSS,
      totalDistance: newPlan.totalDistance,
      totalTime: newPlan.totalTime,
      workouts: Object.entries(newPlan.workouts).map(([day, workout]) => ({
        day,
        workout: workout
          ? {
              type: workout.type,
              sport: workout.sport,
              duration: workout.duration,
              intensity: workout.intensity,
              distance: workout.distance,
              difficulty: workout.difficulty,
              energyCost: workout.energyCost,
              recoveryTime: workout.recoveryTime,
              reasoning: workout.reasoning,
            }
          : null,
      })),
    });
    return newPlan;
  } catch (error) {
    console.error('Error generating new workout plan:', error);
    return null;
  }
}

/**
 * Hook for managing workout plan updates
 */
export function useWorkoutPlanManager(userId: string) {
  const queryClient = useQueryClient();
  const { weeklyPlan, isLoading } = useEnhancedWorkoutPlanning({ userId });

  const updateWeeklyPlan = async (updatedPlan: WeeklyWorkoutPlan) => {
    try {
      console.log('updateWeeklyPlan: Starting API call');
      console.log('updateWeeklyPlan: Plan data:', {
        id: updatedPlan.id,
        weekStart: updatedPlan.weekStart,
        workoutsCount: Object.values(updatedPlan.workouts).filter(
          w => w !== null
        ).length,
        totalTSS: updatedPlan.totalTSS,
        totalDistance: updatedPlan.totalDistance,
        totalTime: updatedPlan.totalTime,
      });

      const response = await fetch('/api/workout-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weeklyPlan: updatedPlan }),
      });

      console.log('updateWeeklyPlan: Response status:', response.status);
      console.log('updateWeeklyPlan: Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('updateWeeklyPlan: Response error:', errorText);
        console.error('updateWeeklyPlan: Response status:', response.status);
        throw new Error(
          `Failed to save workout plan: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log('updateWeeklyPlan: Response result:', result);
      return result;
    } catch (error) {
      console.error('Error saving workout plan:', error);
      throw error;
    }
  };

  const saveWorkoutPlan = async (plan: WeeklyWorkoutPlan) => {
    try {
      console.log('saveWorkoutPlan: Starting save operation');
      const result = await updateWeeklyPlan(plan);

      // Invalidate and refetch queries to ensure fresh data
      console.log('saveWorkoutPlan: Invalidating queries after save');
      await queryClient.invalidateQueries({
        queryKey: ['workout-plans', userId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['enhanced-workout-planning', 'weekly-plan'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['enhanced-workout-planning', 'todays-workout'],
      });

      // Force refetch to ensure immediate update
      await queryClient.refetchQueries({ queryKey: ['workout-plans', userId] });
      await queryClient.refetchQueries({
        queryKey: ['enhanced-workout-planning'],
      });

      // Add a small delay to ensure the database operation completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Force refetch again to ensure we get the latest data
      await queryClient.refetchQueries({ queryKey: ['workout-plans', userId] });
      await queryClient.refetchQueries({
        queryKey: ['enhanced-workout-planning'],
      });

      // Update the cache directly to ensure immediate UI update
      console.log(
        'saveWorkoutPlan: Updating cache directly for immediate UI update'
      );
      queryClient.setQueryData(['workout-plans', userId], { weeklyPlan: plan });

      // Also update the today's workout cache
      const todaysWorkout = deriveTodaysWorkoutFromPlan(plan);
      queryClient.setQueryData(
        ['enhanced-workout-planning', 'todays-workout', userId],
        { todaysWorkout, weeklyPlan: plan }
      );

      console.log(
        'saveWorkoutPlan: Queries invalidated, refetched, and cache updated'
      );

      return { success: true, plan: result };
    } catch (error) {
      console.error('Failed to save workout plan:', error);
      return { success: false, error };
    }
  };

  const resetToRecommended = async () => {
    try {
      console.log('resetToRecommended: Starting reset request');

      const response = await fetch('/api/workout-plans', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('resetToRecommended: Response status:', response.status);
      console.log('resetToRecommended: Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('resetToRecommended: Response error:', errorText);
        console.error('resetToRecommended: Response status:', response.status);
        throw new Error(
          `Failed to reset workout plan: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log('resetToRecommended: Response result:', result);

      // Invalidate the workout plans query to refetch fresh data
      console.log('resetToRecommended: Invalidating queries');
      console.log('resetToRecommended: Invalidating workout-plans query');
      await queryClient.invalidateQueries({
        queryKey: ['workout-plans', userId],
      });
      console.log(
        'resetToRecommended: Invalidating enhanced-workout-planning query'
      );
      await queryClient.invalidateQueries({
        queryKey: ['enhanced-workout-planning'],
      });
      console.log('resetToRecommended: Invalidating weekly-plan query');
      await queryClient.invalidateQueries({
        queryKey: ['enhanced-workout-planning', 'weekly-plan'],
      });
      console.log('resetToRecommended: Invalidating todays-workout query');
      await queryClient.invalidateQueries({
        queryKey: ['enhanced-workout-planning', 'todays-workout'],
      });
      // Force refetch all enhanced workout planning queries
      console.log(
        'resetToRecommended: Forcing refetch of all enhanced-workout-planning queries'
      );
      await queryClient.refetchQueries({
        queryKey: ['enhanced-workout-planning'],
      });
      // Force refetch the saved plan query specifically
      console.log('resetToRecommended: Forcing refetch of workout-plans query');
      await queryClient.refetchQueries({ queryKey: ['workout-plans', userId] });
      console.log('resetToRecommended: Queries invalidated');

      // Try to generate a proper plan using the same logic as initial generation
      console.log('resetToRecommended: Generating new intelligent plan');
      const newPlan = await generateNewWorkoutPlan(userId, queryClient);

      if (newPlan && newPlan.workouts) {
        console.log('resetToRecommended: Saving new intelligent plan');
        const saveResult = await saveWorkoutPlan(newPlan);
        if (saveResult.success) {
          console.log(
            'resetToRecommended: New intelligent plan saved successfully'
          );
          // Add a small delay to ensure the save operation completes
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('resetToRecommended: Forcing refetch after save');

          // Clear all workout-related cache completely
          console.log('resetToRecommended: Clearing workout-related cache');
          await queryClient.removeQueries({ queryKey: ['workout-plans'] });
          await queryClient.removeQueries({
            queryKey: ['enhanced-workout-planning'],
          });

          // Force fresh refetch of all workout queries
          console.log(
            'resetToRecommended: Forcing fresh refetch of all workout queries'
          );
          await queryClient.refetchQueries({ queryKey: ['workout-plans'] });
          await queryClient.refetchQueries({
            queryKey: ['enhanced-workout-planning'],
          });

          // Add another delay and refetch to ensure we get the latest data
          await new Promise(resolve => setTimeout(resolve, 200));
          await queryClient.refetchQueries({ queryKey: ['workout-plans'] });
          await queryClient.refetchQueries({
            queryKey: ['enhanced-workout-planning'],
          });

          return { success: true, result, newPlan };
        } else {
          console.log(
            'resetToRecommended: Failed to save new intelligent plan'
          );
          return { success: true, result, newPlan: null };
        }
      } else {
        console.log(
          'resetToRecommended: No intelligent plan generated, will use fallback'
        );
        // Create a fallback plan if generation fails
        const fallbackPlan = createFallbackWeeklyPlan();
        console.log('resetToRecommended: Creating fallback plan');
        const saveResult = await saveWorkoutPlan(fallbackPlan);
        if (saveResult.success) {
          console.log('resetToRecommended: Fallback plan saved successfully');
          await queryClient.refetchQueries({
            queryKey: ['enhanced-workout-planning'],
          });
          return { success: true, result, newPlan: fallbackPlan };
        } else {
          console.log('resetToRecommended: Failed to save fallback plan');
          // If even the fallback fails, just return success without a plan
          // The UI will handle this gracefully
          return { success: true, result, newPlan: null };
        }
      }
    } catch (error) {
      console.error('Failed to reset workout plan:', error);
      return { success: false, error };
    }
  };

  return {
    weeklyPlan,
    isLoading,
    saveWorkoutPlan,
    updateWeeklyPlan,
    resetToRecommended,
  };
}

/**
 * Hook for workout plan analytics
 */
export function useWorkoutPlanAnalytics(weeklyPlan: WeeklyWorkoutPlan | null) {
  if (!weeklyPlan) {
    return {
      totalWorkouts: 0,
      totalTSS: 0,
      totalDistance: 0,
      totalTime: 0,
      workoutDistribution: {},
      intensityDistribution: {},
      sportDistribution: {},
      periodizationPhase: 'base',
      recommendations: [],
    };
  }

  const workouts = Object.values(weeklyPlan.workouts).filter(
    w => w !== null
  ) as EnhancedWorkoutRecommendation[];

  // Calculate distributions
  const workoutDistribution = workouts.reduce(
    (acc, workout) => {
      acc[workout.type] = (acc[workout.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const sportDistribution = workouts.reduce(
    (acc, workout) => {
      acc[workout.sport] = (acc[workout.sport] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const intensityDistribution = {
    low: workouts.filter(w => w.intensity <= 3).length,
    moderate: workouts.filter(w => w.intensity > 3 && w.intensity <= 6).length,
    high: workouts.filter(w => w.intensity > 6).length,
  };

  // Generate recommendations based on plan analysis
  const recommendations = generatePlanRecommendations(weeklyPlan, workouts);

  return {
    totalWorkouts: workouts.length,
    totalTSS: weeklyPlan.totalTSS,
    totalDistance: weeklyPlan.totalDistance,
    totalTime: weeklyPlan.totalTime,
    workoutDistribution,
    intensityDistribution,
    sportDistribution,
    periodizationPhase: weeklyPlan.periodizationPhase,
    recommendations,
  };
}

/**
 * Generate recommendations for workout plan improvements
 */
function generatePlanRecommendations(
  plan: WeeklyWorkoutPlan,
  workouts: EnhancedWorkoutRecommendation[]
) {
  const recommendations = [];

  // Check for recovery balance
  const recoveryWorkouts = workouts.filter(w => w.type === 'recovery').length;
  const intenseWorkouts = workouts.filter(w => w.intensity >= 7).length;

  if (intenseWorkouts > 2 && recoveryWorkouts < 2) {
    recommendations.push({
      type: 'warning',
      message:
        'Consider adding more recovery days to balance your intense workouts',
      priority: 'high',
    });
  }

  // Check for variety
  const uniqueTypes = new Set(workouts.map(w => w.type)).size;
  if (uniqueTypes < 3) {
    recommendations.push({
      type: 'info',
      message: 'Adding more workout variety can improve overall fitness',
      priority: 'medium',
    });
  }

  // Check for progression
  if (plan.totalTSS > 500) {
    recommendations.push({
      type: 'success',
      message: 'Your weekly training load is well-balanced',
      priority: 'low',
    });
  } else if (plan.totalTSS < 200) {
    recommendations.push({
      type: 'warning',
      message: 'Consider increasing your weekly training volume gradually',
      priority: 'medium',
    });
  }

  // Check for rest days
  const restDays = Object.values(plan.workouts).filter(w => w === null).length;
  if (restDays === 0) {
    recommendations.push({
      type: 'warning',
      message: 'Include at least one rest day for recovery',
      priority: 'high',
    });
  }

  return recommendations;
}

/**
 * Hook that ensures today's workout is always synchronized with the weekly plan
 */
export function useSynchronizedTodaysWorkout(userId: string) {
  const { weeklyPlan, isLoadingWeeklyPlan, hasData } =
    useEnhancedWorkoutPlanning({ userId });

  // Derive today's workout directly from the weekly plan
  const todaysWorkout = weeklyPlan
    ? deriveTodaysWorkoutFromPlan(weeklyPlan)
    : null;

  return {
    todaysWorkout,
    weeklyPlan,
    isLoading: isLoadingWeeklyPlan,
    hasData,
  };
}
