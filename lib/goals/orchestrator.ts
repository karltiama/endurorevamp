/**
 * Goals Orchestrator Service
 * 
 * This service provides a unified interface for all goal-related operations
 * across the application, ensuring consistency and eliminating duplication.
 */

import { createClient } from '@/lib/supabase/server';
import { UserGoal, GoalType, GoalData, CreateGoalRequest } from '@/types/goals';
import { DynamicGoalSuggestion } from '@/lib/goals/dynamic-suggestions';

interface GoalOrchestratorOptions {
  userId: string;
  supabase?: Awaited<ReturnType<typeof createClient>>;
}

interface GoalCalculationResult {
  goalId: string;
  currentProgress: number;
  progressPercentage: number;
  isCompleted: boolean;
  lastUpdated: string;
}

interface GoalSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'distance' | 'frequency' | 'duration' | 'intensity';
  target: number;
  unit: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
}

// Types for static methods
export interface GoalCreationContext {
  type: 'manual' | 'suggestion' | 'automatic';
  source?: string;
}

export interface GoalUpdateContext {
  updateType: 'target' | 'progress' | 'status' | 'priority';
  reason?: string;
}

export interface GoalAnalytics {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  dashboardGoals: number;
  goalsByCategory: Record<string, number>;
  goalsByContext: Record<string, number>;
  suggestionGoals: number;
  autoTrackingGoals: number;
  averageProgress: number;
  completionRate: number;
}

export interface GoalRecommendation {
  id: string;
  type: 'dashboard_setup' | 'goal_creation' | 'progress_update';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: {
    type: 'manage_dashboard' | 'create_goal' | 'update_progress';
    data?: unknown;
  };
}

export class GoalOrchestrator {
  private userId: string;
  private supabase: Awaited<ReturnType<typeof createClient>>;

  constructor(options: GoalOrchestratorOptions) {
    this.userId = options.userId;
    this.supabase = options.supabase || (null as unknown as Awaited<ReturnType<typeof createClient>>); // Will be initialized in init()
  }

  async init(): Promise<void> {
    if (!this.supabase) {
      this.supabase = await createClient();
    }
  }

  async getUserGoals(): Promise<UserGoal[]> {
    const { data, error } = await this.supabase
      .from('user_goals')
      .select(`
        *,
        goal_types (*)
      `)
      .eq('user_id', this.userId)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching user goals:', error);
      return [];
    }

    return data || [];
  }

  async createGoal(goalData: {
    goal_type_id: string;
    target_value?: number;
    target_unit?: string;
    time_period: 'weekly' | 'monthly' | 'single_activity' | 'ongoing';
    goal_data?: GoalData;
    priority?: number;
  }): Promise<UserGoal | null> {
    const { data, error } = await this.supabase
      .from('user_goals')
      .insert({
        user_id: this.userId,
        ...goalData,
        current_progress: 0,
        streak_count: 0,
        is_active: true,
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating goal:', error);
      return null;
    }

    return data;
  }

  async updateGoalProgress(goalId: string, progress: number): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_goals')
      .update({
        current_progress: progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error updating goal progress:', error);
      return false;
    }

    return true;
  }

  async calculateGoalProgress(goal: UserGoal): Promise<GoalCalculationResult> {
    // This is a simplified calculation - in a real app, you'd calculate based on activities
    const progressPercentage = goal.target_value 
      ? Math.min(100, (goal.current_progress / goal.target_value) * 100)
      : 0;

    return {
      goalId: goal.id,
      currentProgress: goal.current_progress,
      progressPercentage,
      isCompleted: goal.is_completed,
      lastUpdated: goal.updated_at
    };
  }

  async generateGoalSuggestions(): Promise<GoalSuggestion[]> {
    // This would typically analyze user activities and generate personalized suggestions
    const suggestions: GoalSuggestion[] = [
      {
        id: 'weekly-distance',
        title: 'Build Weekly Distance',
        description: 'Gradually increase your weekly running distance',
        type: 'distance',
        target: 25,
        unit: 'km',
        priority: 'high',
        reasoning: 'Start with a conservative weekly distance goal'
      },
      {
        id: 'weekly-frequency',
        title: 'Establish Training Frequency',
        description: 'Run consistently throughout the week',
        type: 'frequency',
        target: 3,
        unit: 'runs/week',
        priority: 'high',
        reasoning: 'Consistency is key to long-term progress'
      }
    ];

    return suggestions;
  }

  async getGoalTypes(): Promise<GoalType[]> {
    const { data, error } = await this.supabase
      .from('goal_types')
      .select('*')
      .eq('is_active', true)
      .order('display_name');

    if (error) {
      console.error('Error fetching goal types:', error);
      return [];
    }

    return data || [];
  }

  async deleteGoal(goalId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error deleting goal:', error);
      return false;
    }

    return true;
  }

  async markGoalCompleted(goalId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_goals')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error marking goal completed:', error);
      return false;
    }

    return true;
  }

  // Static methods for API-based operations
  static async createGoal(goalData: CreateGoalRequest, context?: GoalCreationContext): Promise<UserGoal> {
    const response = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...goalData,
        goal_data: {
          ...goalData.goal_data,
          creation_context: context?.type || 'manual',
          creation_source: context?.source || 'unknown',
          created_at: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create goal');
    }

    const result = await response.json();
    return result.goal;
  }

  static async createGoalFromSuggestion(suggestion: DynamicGoalSuggestion, customizations?: Partial<CreateGoalRequest>): Promise<UserGoal> {
    const goalData: CreateGoalRequest = {
              goal_type_id: suggestion.goalType.name,
      target_value: suggestion.suggestedTarget,
      target_unit: suggestion.targetUnit,
      time_period: 'ongoing',
      goal_data: {
        from_suggestion: true,
        suggestion_id: suggestion.id,
        suggestion_reasoning: suggestion.reasoning,
        difficulty_level: suggestion.difficulty === 'conservative' ? 'beginner' : 
                         suggestion.difficulty === 'moderate' ? 'intermediate' : 'advanced',
        success_probability: suggestion.successProbability,
        warnings: suggestion.warnings || [],
        ...customizations?.goal_data
      },
      ...customizations
    };

    return this.createGoal(goalData, { type: 'suggestion', source: 'ai' });
  }

  static async updateGoal(goalId: string, updates: Partial<UserGoal>, context?: GoalUpdateContext): Promise<UserGoal> {
    const response = await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...updates,
        goal_data: {
          ...updates.goal_data,
          last_update_context: context?.updateType,
          last_update_reason: context?.reason,
          last_updated: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update goal');
    }

    const result = await response.json();
    return result.goal;
  }

  static async manageDashboardGoals(goalIds: string[], userId: string): Promise<UserGoal[]> {
    if (goalIds.length > 3) {
      throw new Error('Maximum 3 dashboard goals allowed');
    }

    const response = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalIds, userId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to manage dashboard goals');
    }

    const result = await response.json();
    return result.goals || [];
  }

  static async getGoalAnalytics(userId: string): Promise<GoalAnalytics> {
    const response = await fetch(`/api/goals/analytics?userId=${userId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch goal analytics');
    }

    const result = await response.json();
    return result.analytics || result;
  }

  static async getGoalRecommendations(userId: string): Promise<GoalRecommendation[]> {
    const response = await fetch(`/api/goals/recommendations?userId=${userId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch goal recommendations');
    }

    const result = await response.json();
    return result.recommendations || result;
  }

  static validateGoalData(goalData: CreateGoalRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!goalData.goal_type_id) {
      errors.push('Goal type is required');
    }

    if (goalData.target_value !== undefined && goalData.target_value <= 0) {
      errors.push('Target value must be greater than 0');
    }

    if (!goalData.time_period) {
      errors.push('Time period is required');
    }

    if (goalData.target_date && new Date(goalData.target_date) <= new Date()) {
      errors.push('Target date must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static async bulkUpdateGoals(updates: Array<{ goalId: string; updates: Partial<UserGoal> }>, context?: GoalUpdateContext): Promise<UserGoal[]> {
    const response = await fetch('/api/goals/bulk-update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, context })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to bulk update goals');
    }

    const result = await response.json();
    return result.goals || [];
  }

  static async archiveCompletedGoals(userId: string): Promise<number> {
    const response = await fetch('/api/goals/archive-completed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to archive completed goals');
    }

    const result = await response.json();
    return result.archivedCount || 0;
  }

  static async getGoalInsights(goalId: string): Promise<unknown> {
    const response = await fetch(`/api/goals/${goalId}/insights`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch goal insights');
    }

    const result = await response.json();
    return result.insights || result;
  }
} 