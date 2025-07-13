'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useUserGoals } from '@/hooks/useGoals';
import { useGoalManagement } from '@/hooks/useGoals';
import { useGoalsOrchestrator } from '@/hooks/useGoalsOrchestrator';
import { UserGoal } from '@/types/goals';

interface GoalsContextType {
  // Data
  goals: UserGoal[];
  dashboardGoals: UserGoal[];
  activeGoals: UserGoal[];
  completedGoals: UserGoal[];
  isLoading: boolean;
  error: Error | null;
  
  // Management functions
  getDashboardGoals: () => UserGoal[];
  getGoalsByContext: (context: string) => UserGoal[];
  getSuggestionGoals: () => UserGoal[];
  
  // Orchestrator functions
  createGoal: (params: any) => Promise<any>;
  createGoalFromSuggestion: (params: any) => Promise<any>;
  updateGoal: (params: any) => Promise<any>;
  manageDashboardGoals: (params: any) => Promise<any>;
  isCreating: boolean;
  isUpdating: boolean;
  isManaging: boolean;
  
  // Refresh functions
  refreshGoals: () => void;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

interface GoalsProviderProps {
  children: ReactNode;
}

export function GoalsProvider({ children }: GoalsProviderProps) {
  const { data: goalsData, isLoading, error, refetch } = useUserGoals();
  const { getDashboardGoals, getGoalsByContext, getSuggestionGoals } = useGoalManagement();
  const orchestrator = useGoalsOrchestrator();

  const goals = goalsData?.goals || [];
  const activeGoals = goals.filter(goal => goal.is_active);
  const completedGoals = goals.filter(goal => goal.is_completed);
  const dashboardGoals = getDashboardGoals();

  const value = {
    // Data
    goals,
    dashboardGoals,
    activeGoals,
    completedGoals,
    isLoading,
    error,
    
    // Management functions
    getDashboardGoals,
    getGoalsByContext,
    getSuggestionGoals,
    
    // Orchestrator functions
    createGoal: orchestrator.createGoal,
    createGoalFromSuggestion: orchestrator.createGoalFromSuggestion,
    updateGoal: orchestrator.updateGoal,
    manageDashboardGoals: orchestrator.manageDashboardGoals,
    isCreating: orchestrator.isCreating,
    isUpdating: orchestrator.isUpdating,
    isManaging: orchestrator.isManaging,
    
    // Refresh functions
    refreshGoals: refetch,
  } as GoalsContextType;

  return (
    <GoalsContext.Provider value={value}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoalsContext() {
  const context = useContext(GoalsContext);
  if (context === undefined) {
    throw new Error('useGoalsContext must be used within a GoalsProvider');
  }
  return context;
} 