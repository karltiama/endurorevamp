'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { 
  GoalsOrchestrator, 
  GoalAnalytics, 
  GoalRecommendation, 
  GoalCreationContext, 
  GoalUpdateContext 
} from '@/lib/goals/orchestrator';
import { UserGoal, CreateGoalRequest } from '@/types/goals';
import { DynamicGoalSuggestion } from '@/lib/goals/dynamic-suggestions';
import { goalQueryKeys } from './useGoals';

/**
 * Main hook for goal orchestration
 */
export const useGoalsOrchestrator = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Analytics query
  const analyticsQuery = useQuery({
    queryKey: ['goals', 'analytics', user?.id],
    queryFn: () => GoalsOrchestrator.getGoalAnalytics(user!.id),
    enabled: !!user,
  });

  // Recommendations query
  const recommendationsQuery = useQuery({
    queryKey: ['goals', 'recommendations', user?.id],
    queryFn: () => GoalsOrchestrator.getGoalRecommendations(user!.id),
    enabled: !!user,
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async ({ goalData, context }: { 
      goalData: CreateGoalRequest; 
      context?: GoalCreationContext 
    }) => {
      return GoalsOrchestrator.createGoal(goalData, context);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
      queryClient.invalidateQueries({ queryKey: ['goals', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['goals', 'recommendations'] });
    },
  });

  // Create goal from suggestion mutation
  const createGoalFromSuggestionMutation = useMutation({
    mutationFn: async ({ 
      suggestion, 
      customizations 
    }: { 
      suggestion: DynamicGoalSuggestion; 
      customizations?: Partial<CreateGoalRequest> 
    }) => {
      return GoalsOrchestrator.createGoalFromSuggestion(suggestion, customizations);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
      queryClient.invalidateQueries({ queryKey: ['goals', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['goals', 'recommendations'] });
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ 
      goalId, 
      updates, 
      context 
    }: { 
      goalId: string; 
      updates: Partial<UserGoal>; 
      context?: GoalUpdateContext 
    }) => {
      return GoalsOrchestrator.updateGoal(goalId, updates, context);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
      queryClient.invalidateQueries({ queryKey: ['goals', 'analytics'] });
    },
  });

  // Manage dashboard goals mutation
  const manageDashboardGoalsMutation = useMutation({
    mutationFn: async (goalIds: string[]) => {
      return GoalsOrchestrator.manageDashboardGoals(goalIds, user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
      queryClient.invalidateQueries({ queryKey: ['goals', 'analytics'] });
    },
  });

  // Bulk update goals mutation
  const bulkUpdateGoalsMutation = useMutation({
    mutationFn: async ({ 
      updates, 
      context 
    }: { 
      updates: Array<{ goalId: string; updates: Partial<UserGoal> }>; 
      context?: GoalUpdateContext 
    }) => {
      return GoalsOrchestrator.bulkUpdateGoals(updates, context);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
      queryClient.invalidateQueries({ queryKey: ['goals', 'analytics'] });
    },
  });

  // Archive completed goals mutation
  const archiveCompletedGoalsMutation = useMutation({
    mutationFn: () => GoalsOrchestrator.archiveCompletedGoals(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
      queryClient.invalidateQueries({ queryKey: ['goals', 'analytics'] });
    },
  });

  return {
    // Data
    analytics: analyticsQuery.data,
    recommendations: recommendationsQuery.data,
    
    // Loading states
    isLoadingAnalytics: analyticsQuery.isLoading,
    isLoadingRecommendations: recommendationsQuery.isLoading,
    
    // Mutations
    createGoal: createGoalMutation.mutateAsync,
    createGoalFromSuggestion: createGoalFromSuggestionMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutateAsync,
    manageDashboardGoals: manageDashboardGoalsMutation.mutateAsync,
    bulkUpdateGoals: bulkUpdateGoalsMutation.mutateAsync,
    archiveCompletedGoals: archiveCompletedGoalsMutation.mutateAsync,
    
    // Mutation states
    isCreating: createGoalMutation.isPending || createGoalFromSuggestionMutation.isPending,
    isUpdating: updateGoalMutation.isPending || bulkUpdateGoalsMutation.isPending,
    isManaging: manageDashboardGoalsMutation.isPending,
    
    // Utility functions
    validateGoalData: GoalsOrchestrator.validateGoalData,
    getGoalInsights: GoalsOrchestrator.getGoalInsights,
    
    // Refresh functions
    refreshAnalytics: () => analyticsQuery.refetch(),
    refreshRecommendations: () => recommendationsQuery.refetch(),
  };
};

/**
 * Hook for goal analytics
 */
export const useGoalAnalytics = (): {
  analytics: GoalAnalytics | undefined;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
} => {
  const { user } = useAuth();
  
  const query = useQuery({
    queryKey: ['goals', 'analytics', user?.id],
    queryFn: () => GoalsOrchestrator.getGoalAnalytics(user!.id),
    enabled: !!user,
  });

  return {
    analytics: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refresh: () => query.refetch(),
  };
};

/**
 * Hook for goal recommendations
 */
export const useGoalRecommendations = (): {
  recommendations: GoalRecommendation[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
} => {
  const { user } = useAuth();
  
  const query = useQuery({
    queryKey: ['goals', 'recommendations', user?.id],
    queryFn: () => GoalsOrchestrator.getGoalRecommendations(user!.id),
    enabled: !!user,
  });

  return {
    recommendations: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refresh: () => query.refetch(),
  };
};

/**
 * Hook for creating goals with orchestrator
 */
export const useCreateGoalOrchestrated = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ goalData, context }: { 
      goalData: CreateGoalRequest; 
      context?: GoalCreationContext 
    }) => {
      return GoalsOrchestrator.createGoal(goalData, context);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
      queryClient.invalidateQueries({ queryKey: ['goals', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['goals', 'recommendations'] });
    },
  });
};

/**
 * Hook for updating goals with orchestrator
 */
export const useUpdateGoalOrchestrated = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      goalId, 
      updates, 
      context 
    }: { 
      goalId: string; 
      updates: Partial<UserGoal>; 
      context?: GoalUpdateContext 
    }) => {
      return GoalsOrchestrator.updateGoal(goalId, updates, context);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
      queryClient.invalidateQueries({ queryKey: ['goals', 'analytics'] });
    },
  });
};

/**
 * Hook for managing dashboard goals
 */
export const useDashboardGoalsManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (goalIds: string[]) => {
      return GoalsOrchestrator.manageDashboardGoals(goalIds, user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.userGoals });
      queryClient.invalidateQueries({ queryKey: ['goals', 'analytics'] });
    },
  });
}; 