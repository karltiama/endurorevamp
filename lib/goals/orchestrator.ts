/**
 * Goals Orchestrator Service
 * 
 * This service provides a unified interface for all goal-related operations
 * across the application, ensuring consistency and eliminating duplication.
 */

import { createClient } from '@/lib/supabase/server';
import { UserGoal, GoalType, GoalData } from '@/types/goals';

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

export class GoalOrchestrator {
  private userId: string;
  private supabase: Awaited<ReturnType<typeof createClient>>;

  constructor(options: GoalOrchestratorOptions) {
    this.userId = options.userId;
    this.supabase = options.supabase || null as any; // Will be initialized in init()
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
} 