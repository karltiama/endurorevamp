'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  GoalType, 
  UserGoal, 
  CreateGoalRequest, 
  UserOnboarding,
  GetGoalTypesResponse,
  GetUserGoalsResponse,
  CreateGoalResponse
} from '@/types/goals';

// Query keys
export const goalQueryKeys = {
  all: ['goals'] as const,
  userGoals: ['goals', 'user'] as const,
  goalTypes: ['goals', 'types'] as const,
  onboarding: ['onboarding'] as const,
};

// Fetch goal types
export const useGoalTypes = () => {
  return useQuery({
    queryKey: goalQueryKeys.goalTypes,
    queryFn: async (): Promise<GoalType[]> => {
      const response = await fetch('/api/goals/types');
      
      if (!response.ok) {
        throw new Error('Failed to fetch goal types');
      }
      
      const data: GetGoalTypesResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch goal types');
      }
      
      return data.goalTypes;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch user goals
export const useUserGoals = () => {
  return useQuery({
    queryKey: goalQueryKeys.userGoals,
    queryFn: async (): Promise<{ goals: UserGoal[]; onboarding: UserOnboarding | null }> => {
      const response = await fetch('/api/goals');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user goals');
      }
      
      const data: GetUserGoalsResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch user goals');
      }
      
      return {
        goals: data.goals,
        onboarding: data.onboarding || null
      };
    },
  });
};

// Create a new goal
export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (goalData: CreateGoalRequest): Promise<UserGoal> => {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create goal');
      }
      
      const data: CreateGoalResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create goal');
      }
      
      return data.goal;
    },
    onSuccess: () => {
      // Invalidate and refetch user goals
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
    },
  });
};

// Create multiple goals (for onboarding)
export const useCreateMultipleGoals = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (goals: CreateGoalRequest[]): Promise<UserGoal[]> => {
      const createdGoals: UserGoal[] = [];
      
      // Create goals sequentially to handle potential errors
      for (const goalData of goals) {
        const response = await fetch('/api/goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(goalData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create goal');
        }
        
        const data: CreateGoalResponse = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to create goal');
        }
        
        createdGoals.push(data.goal);
      }
      
      return createdGoals;
    },
    onSuccess: () => {
      // Invalidate and refetch user goals
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
    },
  });
};

// Helper hook to get goal type by ID
export const useGoalTypeById = (goalTypeId: string) => {
  const { data: goalTypes = [] } = useGoalTypes();
  return goalTypes.find(type => type.id === goalTypeId);
};

// Helper hook to check if user has completed onboarding
export const useOnboardingStatus = () => {
  const { data } = useUserGoals();
  
  return {
    onboarding: data?.onboarding,
    hasCompletedGoals: data?.onboarding?.goals_completed ?? false,
    hasCompletedOnboarding: data?.onboarding?.completed_at != null,
    currentStep: data?.onboarding?.current_step ?? 'goals',
  };
}; 