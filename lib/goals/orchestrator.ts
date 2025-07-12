/**
 * Goals Orchestrator Service
 * 
 * This service provides a unified interface for all goal-related operations
 * across the application, ensuring consistency and eliminating duplication.
 */

import { UserGoal, GoalType, CreateGoalRequest, GoalData } from '@/types/goals';
import { DynamicGoalSuggestion } from './dynamic-suggestions';
import { AutomaticGoalProgress } from './automatic-progress';

export interface GoalCreationContext {
  type: 'manual' | 'suggestion' | 'onboarding' | 'dashboard' | 'bulk';
  source?: string;
  metadata?: Record<string, any>;
}

export interface GoalUpdateContext {
  updateType: 'progress' | 'target' | 'settings' | 'dashboard' | 'completion';
  reason?: string;
  metadata?: Record<string, any>;
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
  type: 'missing_category' | 'low_progress' | 'dashboard_setup' | 'suggestion_available';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  action: {
    type: 'create_goal' | 'update_goal' | 'manage_dashboard' | 'review_suggestions';
    data?: any;
  };
}

export class GoalsOrchestrator {
  /**
   * Create a new goal with full context tracking
   */
  static async createGoal(
    goalData: CreateGoalRequest,
    context: GoalCreationContext = { type: 'manual' }
  ): Promise<UserGoal> {
    const enhancedGoalData = {
      ...goalData,
      goal_data: {
        ...goalData.goal_data,
        creation_context: context.type,
        creation_source: context.source,
        creation_metadata: context.metadata,
        created_at: new Date().toISOString(),
      } as GoalData
    };

    const response = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enhancedGoalData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create goal');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to create goal');
    }

    // Trigger analytics update
    await this.recordGoalEvent('goal_created', result.goal.id, context);

    return result.goal;
  }

  /**
   * Create a goal from an AI suggestion
   */
  static async createGoalFromSuggestion(
    suggestion: DynamicGoalSuggestion,
    customizations?: Partial<CreateGoalRequest>
  ): Promise<UserGoal> {
    const goalData: CreateGoalRequest = {
      goal_type_id: suggestion.goalType.id,
      target_value: suggestion.suggestedTarget,
      target_unit: suggestion.targetUnit,
      goal_data: {
        notes: `AI Suggestion: ${suggestion.reasoning}\n\nStrategies: ${suggestion.strategies.join(', ')}`,
        from_suggestion: true,
        suggestion_id: suggestion.id,
        suggestion_title: suggestion.title,
        suggestion_reasoning: suggestion.reasoning,
        suggestion_strategies: suggestion.strategies,
        suggestion_benefits: suggestion.benefits,
        difficulty_level: suggestion.difficulty === 'conservative' ? 'beginner' : 
                         suggestion.difficulty === 'moderate' ? 'intermediate' : 'advanced',
        success_probability: suggestion.successProbability,
        required_commitment: suggestion.requiredCommitment,
        ...(suggestion.warnings && { warnings: suggestion.warnings }),
        ...customizations?.goal_data,
      } as GoalData,
      priority: 1,
      ...customizations,
    };

    return this.createGoal(goalData, {
      type: 'suggestion',
      source: 'dynamic_suggestions',
      metadata: {
        suggestion_id: suggestion.id,
        suggestion_priority: suggestion.priority,
        suggestion_category: suggestion.category,
      }
    });
  }

  /**
   * Update a goal with context tracking
   */
  static async updateGoal(
    goalId: string,
    updates: Partial<UserGoal>,
    context: GoalUpdateContext = { updateType: 'settings' }
  ): Promise<UserGoal> {
    const enhancedUpdates = {
      ...updates,
      goal_data: {
        ...updates.goal_data,
        last_updated: new Date().toISOString(),
        last_update_context: context.updateType,
        last_update_reason: context.reason,
      } as GoalData,
    };

    const response = await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enhancedUpdates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update goal');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to update goal');
    }

    // Trigger analytics update
    await this.recordGoalEvent('goal_updated', goalId, context);

    return result.goal;
  }

  /**
   * Manage dashboard goals with validation
   */
  static async manageDashboardGoals(
    goalIds: string[],
    userId: string
  ): Promise<UserGoal[]> {
    if (goalIds.length > 3) {
      throw new Error('Maximum 3 dashboard goals allowed');
    }

    // Get user's goals
    const response = await fetch('/api/goals');
    const goalsData = await response.json();
    
    if (!goalsData.success) {
      throw new Error('Failed to fetch user goals');
    }

    const userGoals = goalsData.goals;
    const updatedGoals: UserGoal[] = [];

    // First, remove all goals from dashboard
    for (const goal of userGoals) {
      if (goal.goal_data?.show_on_dashboard) {
        const updated = await this.updateGoal(goal.id, {
          goal_data: {
            ...goal.goal_data,
            show_on_dashboard: false,
            dashboard_priority: undefined,
          } as GoalData,
        }, { updateType: 'dashboard', reason: 'dashboard_reorganization' });
        updatedGoals.push(updated);
      }
    }

    // Then, add selected goals to dashboard
    for (let i = 0; i < goalIds.length; i++) {
      const goalId = goalIds[i];
      const goal = userGoals.find((g: UserGoal) => g.id === goalId);
      
      if (!goal) {
        throw new Error(`Goal with ID ${goalId} not found`);
      }

      const updated = await this.updateGoal(goalId, {
        goal_data: {
          ...goal.goal_data,
          show_on_dashboard: true,
          dashboard_priority: i + 1,
        } as GoalData,
      }, { updateType: 'dashboard', reason: 'added_to_dashboard' });
      
      updatedGoals.push(updated);
    }

    return updatedGoals;
  }

  /**
   * Get comprehensive goal analytics
   */
  static async getGoalAnalytics(userId: string): Promise<GoalAnalytics> {
    const response = await fetch('/api/goals');
    const goalsData = await response.json();
    
    if (!goalsData.success) {
      throw new Error('Failed to fetch goals for analytics');
    }

    const goals: UserGoal[] = goalsData.goals;
    const activeGoals = goals.filter(g => g.is_active);
    const completedGoals = goals.filter(g => g.is_completed);
    const dashboardGoals = goals.filter(g => g.goal_data?.show_on_dashboard);
    
    // Calculate analytics
    const goalsByCategory: Record<string, number> = {};
    const goalsByContext: Record<string, number> = {};
    
    let totalProgress = 0;
    let progressCount = 0;

    for (const goal of goals) {
      // Category count
      if (goal.goal_type?.category) {
        goalsByCategory[goal.goal_type.category] = (goalsByCategory[goal.goal_type.category] || 0) + 1;
      }

      // Context count
      const context = goal.goal_data?.creation_context || 'manual';
      goalsByContext[context] = (goalsByContext[context] || 0) + 1;

      // Progress calculation
      if (goal.is_active && goal.target_value) {
        const progress = (goal.current_progress / goal.target_value) * 100;
        totalProgress += Math.min(100, progress);
        progressCount++;
      }
    }

    const suggestionGoals = goals.filter(g => g.goal_data?.from_suggestion).length;
    const autoTrackingGoals = await this.getAutoTrackingGoalsCount(userId);

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      dashboardGoals: dashboardGoals.length,
      goalsByCategory,
      goalsByContext,
      suggestionGoals,
      autoTrackingGoals,
      averageProgress: progressCount > 0 ? totalProgress / progressCount : 0,
      completionRate: goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0,
    };
  }

  /**
   * Get personalized recommendations
   */
  static async getGoalRecommendations(userId: string): Promise<GoalRecommendation[]> {
    const analytics = await this.getGoalAnalytics(userId);
    const recommendations: GoalRecommendation[] = [];

    // Check for missing dashboard goals
    if (analytics.dashboardGoals === 0) {
      recommendations.push({
        id: 'setup_dashboard',
        type: 'dashboard_setup',
        title: 'Set Up Dashboard Goals',
        description: 'Choose up to 3 goals to track on your dashboard for better focus.',
        priority: 'high',
        action: {
          type: 'manage_dashboard',
        }
      });
    }

    // Check for low progress goals
    if (analytics.averageProgress < 30 && analytics.activeGoals > 0) {
      recommendations.push({
        id: 'review_progress',
        type: 'low_progress',
        title: 'Review Goal Progress',
        description: 'Some goals may need attention. Consider adjusting targets or strategies.',
        priority: 'medium',
        action: {
          type: 'review_suggestions',
        }
      });
    }

    // Check for missing goal categories
    const commonCategories = ['distance', 'frequency', 'pace'];
    const missingCategories = commonCategories.filter(cat => !analytics.goalsByCategory[cat]);
    
    if (missingCategories.length > 0) {
      recommendations.push({
        id: 'missing_categories',
        type: 'missing_category',
        title: 'Complete Your Goal Profile',
        description: `Consider adding ${missingCategories.join(', ')} goals for balanced training.`,
        priority: 'low',
        action: {
          type: 'create_goal',
          data: { categories: missingCategories }
        }
      });
    }

    // Check for available AI suggestions
    if (analytics.suggestionGoals < 2) {
      recommendations.push({
        id: 'ai_suggestions',
        type: 'suggestion_available',
        title: 'Explore AI Suggestions',
        description: 'Get personalized goal recommendations based on your activity patterns.',
        priority: 'medium',
        action: {
          type: 'review_suggestions',
        }
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Bulk operations for goals
   */
  static async bulkUpdateGoals(
    updates: Array<{ goalId: string; updates: Partial<UserGoal> }>,
    context: GoalUpdateContext = { updateType: 'settings' }
  ): Promise<UserGoal[]> {
    const results: UserGoal[] = [];

    for (const update of updates) {
      const result = await this.updateGoal(update.goalId, update.updates, context);
      results.push(result);
    }

    return results;
  }

  /**
   * Archive completed goals
   */
  static async archiveCompletedGoals(userId: string): Promise<number> {
    const response = await fetch('/api/goals');
    const goalsData = await response.json();
    
    if (!goalsData.success) {
      throw new Error('Failed to fetch goals');
    }

    const completedGoals = goalsData.goals.filter((g: UserGoal) => g.is_completed);
    let archivedCount = 0;

    for (const goal of completedGoals) {
      await this.updateGoal(goal.id, {
        goal_data: {
          ...goal.goal_data,
          is_archived: true,
          archived_at: new Date().toISOString(),
        } as GoalData,
      }, { updateType: 'completion', reason: 'auto_archive' });
      archivedCount++;
    }

    return archivedCount;
  }

  /**
   * Get auto-tracking goals count
   */
  private static async getAutoTrackingGoalsCount(userId: string): Promise<number> {
    try {
      const result = await AutomaticGoalProgress.getQuantifiableGoals(userId);
      return result.quantifiable.length;
    } catch (error) {
      console.error('Error getting auto-tracking goals:', error);
      return 0;
    }
  }

  /**
   * Record goal events for analytics
   */
  private static async recordGoalEvent(
    eventType: string,
    goalId: string,
    context: any
  ): Promise<void> {
    try {
      // This could be extended to send to analytics service
      console.log(`Goal event: ${eventType}`, { goalId, context });
    } catch (error) {
      console.error('Error recording goal event:', error);
    }
  }

  /**
   * Validate goal data
   */
  static validateGoalData(goalData: CreateGoalRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!goalData.goal_type_id) {
      errors.push('Goal type is required');
    }

    if (goalData.target_value !== undefined && goalData.target_value <= 0) {
      errors.push('Target value must be greater than 0');
    }

    if (goalData.target_date) {
      const targetDate = new Date(goalData.target_date);
      const now = new Date();
      if (targetDate <= now) {
        errors.push('Target date must be in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get goal insights
   */
  static async getGoalInsights(goalId: string): Promise<{
    progressTrend: 'improving' | 'stable' | 'declining';
    timeToCompletion: number | null;
    recommendations: string[];
  }> {
    // This would typically analyze historical data
    // For now, return basic insights
    return {
      progressTrend: 'stable',
      timeToCompletion: null,
      recommendations: ['Stay consistent with your activities', 'Review your target if needed']
    };
  }
} 