'use client';

import { useQuery } from '@tanstack/react-query';
import { useGoalTypes, useUserGoals } from './useGoals';
import { SmartGoalGenerator } from '@/lib/goals/smart-goal-generator';
import {
  DynamicGoalSuggestion,
  DynamicGoalEngine,
  UserPerformanceProfile,
} from '@/lib/goals/dynamic-suggestions';
import { Activity } from '@/lib/strava/types';
import { createClient } from '@/lib/supabase/client';
import { useUnitPreferences } from './useUnitPreferences';

export interface UseDynamicGoalsReturn {
  suggestions: DynamicGoalSuggestion[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  userProfile: UserPerformanceProfile | null;
}

export interface UseDynamicGoalsOptions {
  enabled?: boolean;
  staleTime?: number;
  maxSuggestions?: number;
}

/**
 * Hook for generating and managing dynamic goal suggestions
 */
export const useDynamicGoals = (
  userId: string,
  options: UseDynamicGoalsOptions = {}
): UseDynamicGoalsReturn => {
  const { data: goalTypes = [], isLoading: isLoadingTypes } = useGoalTypes();
  const { data: goalsData, isLoading: isLoadingGoals } = useUserGoals();
  const { preferences } = useUnitPreferences();

  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    ...generatorOptions
  } = options;

  const dynamicGoalsQuery = useQuery({
    queryKey: ['goals', 'dynamic-suggestions', userId, generatorOptions],
    queryFn: async (): Promise<{
      suggestions: DynamicGoalSuggestion[];
      userProfile: UserPerformanceProfile;
    }> => {
      console.log('useDynamicGoals: Starting fetch for userId:', userId);
      const supabase = createClient();

      // Get user's activities from database
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false })
        .limit(500);

      console.log('useDynamicGoals: Query result:', {
        dataCount: data?.length || 0,
        error: error?.message,
        sampleData: data?.slice(0, 3).map(d => ({
          name: d.name,
          start_date: d.start_date,
          start_date_local: d.start_date_local,
        })),
      });

      if (error) {
        console.error('useDynamicGoals: Database error:', error);
        throw new Error(`Failed to fetch activities: ${error.message}`);
      }

      const activities: Activity[] = data || [];

      // Get existing goals
      const existingGoals = goalsData?.goals || [];

      // Analyze user performance
      const userProfile = DynamicGoalEngine.analyzeUserPerformance(
        activities,
        existingGoals
      );

      console.log('useDynamicGoals: User profile generated:', {
        totalActivities: userProfile.totalActivities,
        weeklyDistance: userProfile.weeklyDistance,
        runningExperience: userProfile.runningExperience,
        runFrequency: userProfile.runFrequency,
      });

      // Generate dynamic suggestions using DynamicGoalEngine
      const suggestions = DynamicGoalEngine.generateDynamicSuggestions(
        userProfile,
        existingGoals,
        preferences
      );

      console.log(
        'useDynamicGoals: Generated suggestions:',
        suggestions.length
      );

      return { suggestions, userProfile };
    },
    enabled:
      enabled &&
      !!userId &&
      !isLoadingTypes &&
      !isLoadingGoals &&
      goalTypes.length > 0,
    staleTime,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    suggestions: dynamicGoalsQuery.data?.suggestions || [],
    isLoading: isLoadingTypes || isLoadingGoals || dynamicGoalsQuery.isLoading,
    error: dynamicGoalsQuery.error
      ? (dynamicGoalsQuery.error as Error).message
      : null,
    refetch: dynamicGoalsQuery.refetch,
    userProfile: dynamicGoalsQuery.data?.userProfile || null,
  };
};

/**
 * Hook for getting dynamic suggestions for a specific category
 */
export const useDynamicGoalsByCategory = (
  userId: string,
  category: string,
  options: UseDynamicGoalsOptions = {}
) => {
  const allSuggestions = useDynamicGoals(userId, options);

  return {
    ...allSuggestions,
    suggestions: allSuggestions.suggestions.filter(
      s => s.category === category
    ),
  };
};

/**
 * Hook for getting prioritized suggestions (high priority first)
 */
export const usePrioritizedDynamicGoals = (
  userId: string,
  options: UseDynamicGoalsOptions = {}
) => {
  const allSuggestions = useDynamicGoals(userId, options);

  return {
    ...allSuggestions,
    suggestions: allSuggestions.suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }),
  };
};

/**
 * Hook for getting beginner-friendly suggestions
 */
export const useBeginnerDynamicGoals = (
  userId: string,
  options: UseDynamicGoalsOptions = {}
) => {
  return useDynamicGoals(userId, {
    ...options,
    maxSuggestions: 6,
  });
};

/**
 * Hook for getting suggestions excluding categories the user already has active goals in
 */
export const useNewCategoryDynamicGoals = (
  userId: string,
  options: UseDynamicGoalsOptions = {}
) => {
  const { data: goalsData } = useUserGoals();

  // Get categories user already has active goals in
  const activeCategories =
    goalsData?.goals
      ?.filter(g => g.is_active)
      ?.map(g => g.goal_type?.category)
      ?.filter(Boolean) || [];

  const allSuggestions = useDynamicGoals(userId, options);

  return {
    ...allSuggestions,
    suggestions: allSuggestions.suggestions.filter(
      s => !activeCategories.includes(s.category as any)
    ),
  };
};
