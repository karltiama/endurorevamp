'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  GoalType, 
  UserGoal, 
  CreateGoalRequest, 
  UserOnboarding,
  UserStats,
  GetGoalTypesResponse,
  GetUserGoalsResponse,
  CreateGoalResponse
} from '@/types/goals';
import { DynamicGoalSuggestion } from '@/lib/goals/dynamic-suggestions';

// Query keys
export const goalQueryKeys = {
  all: ['goals'] as const,
  userGoals: ['goals', 'user'] as const,
  goalTypes: ['goals', 'types'] as const,
  onboarding: ['onboarding'] as const,
};

// Extended interface for unified goal creation
export interface UnifiedGoalCreationData {
  // Core goal data
  goalTypeId: string;
  targetValue?: number;
  targetUnit?: string;
  targetDate?: string;
  timePeriod?: 'weekly' | 'monthly' | 'single_activity' | 'ongoing';
  notes?: string;
  priority?: number;
  
  // Context-specific data
  context?: 'manual' | 'suggestion' | 'onboarding' | 'dashboard';
  suggestion?: DynamicGoalSuggestion; // For suggestion-based goals
  
  // Dashboard-specific data
  showOnDashboard?: boolean;
  dashboardPriority?: number;
  
  // Onboarding-specific data
  isOnboardingGoal?: boolean;
}

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
  });
};

// Fetch user goals
export const useUserGoals = () => {
  return useQuery({
    queryKey: goalQueryKeys.userGoals,
    queryFn: async (): Promise<{ goals: UserGoal[]; onboarding: UserOnboarding | null; userStats?: UserStats }> => {
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
        onboarding: data.onboarding || null,
        userStats: data.userStats
      };
    },
  });
};

// Unified goal creation hook
export const useUnifiedGoalCreation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UnifiedGoalCreationData): Promise<UserGoal> => {
      // Convert unified data to API format
      const goalData: CreateGoalRequest = {
        goal_type_id: data.goalTypeId,
        target_value: data.targetValue,
        target_unit: data.targetUnit,
        target_date: data.targetDate,
        time_period: data.timePeriod,
        goal_data: {
          notes: data.notes || '',
          
          // Context-specific data
          creation_context: data.context || 'manual',
          
          // Dashboard display settings
          show_on_dashboard: data.showOnDashboard || false,
          dashboard_priority: data.dashboardPriority,
          
          // Onboarding marker
          ...(data.isOnboardingGoal && { is_onboarding_goal: true }),
          
          // Suggestion-specific data
          ...(data.suggestion && {
            from_suggestion: true,
            suggestion_id: data.suggestion.id,
            suggestion_title: data.suggestion.title,
            suggestion_reasoning: data.suggestion.reasoning,
            suggestion_strategies: data.suggestion.strategies,
            suggestion_benefits: data.suggestion.benefits,
            difficulty_level: data.suggestion.difficulty === 'conservative' ? 'beginner' as const : 
                             data.suggestion.difficulty === 'moderate' ? 'intermediate' as const : 
                             'advanced' as const,
            success_probability: data.suggestion.successProbability,
            required_commitment: data.suggestion.requiredCommitment,
            ...(data.suggestion.warnings && { warnings: data.suggestion.warnings })
          })
        },
        priority: data.priority || 1
      };

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
      
      const result: CreateGoalResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create goal');
      }
      
      return result.goal;
    },
    onSuccess: () => {
      // Invalidate and refetch user goals
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
    },
  });
};

// Legacy create goal hook (for backwards compatibility)
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

// Batch goal creation for onboarding
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

// Update goal hook
export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ goalId, updates }: { goalId: string; updates: Partial<UserGoal> }): Promise<UserGoal> => {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update goal');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update goal');
      }
      
      return data.goal;
    },
    onSuccess: () => {
      // Invalidate and refetch user goals
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
    },
  });
};

// Delete goal hook
export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (goalId: string): Promise<void> => {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete goal');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete goal');
      }
    },
    onSuccess: () => {
      // Invalidate and refetch user goals
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
    },
  });
};

// Convenience hooks for specific contexts
export const useCreateGoalFromSuggestion = () => {
  const unifiedCreation = useUnifiedGoalCreation();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (suggestion: DynamicGoalSuggestion): Promise<UserGoal> => {
      return unifiedCreation.mutateAsync({
        goalTypeId: suggestion.goalType.id,
        targetValue: suggestion.suggestedTarget,
        targetUnit: suggestion.targetUnit,
        context: 'suggestion',
        suggestion: suggestion,
        notes: `AI Suggestion: ${suggestion.reasoning}\n\nStrategies: ${suggestion.strategies.join(', ')}`
      });
    },
    onSuccess: () => {
      // Invalidate and refetch user goals
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
    },
  });
};

export const useCreateDashboardGoal = () => {
  const unifiedCreation = useUnifiedGoalCreation();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UnifiedGoalCreationData & { showOnDashboard: true }): Promise<UserGoal> => {
      return unifiedCreation.mutateAsync({
        ...data,
        context: 'dashboard',
        showOnDashboard: true
      });
    },
    onSuccess: () => {
      // Invalidate and refetch user goals
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
    },
  });
};

// Goal management utilities
export const useGoalManagement = () => {
  const { data: goalsData } = useUserGoals();
  const updateGoal = useUpdateGoal();
  
  const toggleDashboardGoal = async (goalId: string, showOnDashboard: boolean, priority?: number) => {
    return updateGoal.mutateAsync({
      goalId,
      updates: {
        goal_data: {
          show_on_dashboard: showOnDashboard,
          dashboard_priority: priority
        }
      }
    });
  };
  
  const getDashboardGoals = () => {
    return goalsData?.goals?.filter(goal => 
      goal.is_active && goal.goal_data?.show_on_dashboard
    ).sort((a, b) => {
      const aPriority = a.goal_data?.dashboard_priority || 999;
      const bPriority = b.goal_data?.dashboard_priority || 999;
      return aPriority - bPriority;
    }) || [];
  };
  
  const getGoalsByContext = (context: string) => {
    return goalsData?.goals?.filter(goal => 
      goal.goal_data?.creation_context === context
    ) || [];
  };
  
  const getSuggestionGoals = () => {
    return goalsData?.goals?.filter(goal => 
      goal.goal_data?.from_suggestion
    ) || [];
  };
  
  return {
    goals: goalsData?.goals || [],
    toggleDashboardGoal,
    getDashboardGoals,
    getGoalsByContext,
    getSuggestionGoals,
    isLoading: updateGoal.isPending
  };
}; 

// Onboarding status hook - used by onboarding components
export const useOnboardingStatus = () => {
  const { data: goalsData, isLoading, error } = useUserGoals();
  
  const onboarding = goalsData?.onboarding || null;
  const hasCompletedOnboarding = onboarding?.completed_at != null;
  const currentStep = onboarding?.current_step || 'goals';
  
  return {
    onboarding,
    hasCompletedOnboarding,
    currentStep,
    isLoading,
    error
  };
}; 