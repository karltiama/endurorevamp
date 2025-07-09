import { createClient } from '@/lib/supabase/client';
import { Activity } from '@/lib/strava/types';
import { UserGoal, GoalType } from '@/types/goals';

const supabase = createClient();

/**
 * Automatically calculate and update goal progress based on activity data
 * This connects your actual Strava activities to your goal progress
 */
interface GoalProgressRecord {
  activity_date: string;
  contribution_amount: number;
}

export class AutomaticGoalProgress {
  
  /**
   * Update goal progress after an activity is synced
   * This is the main function called during activity sync
   */
  static async updateProgressFromActivity(
    userId: string, 
    activity: Activity
  ): Promise<void> {
    try {
      // Calculate average pace in seconds per km from the activity data
      const averagePace = activity.distance && activity.moving_time 
        ? (activity.moving_time / (activity.distance / 1000))
        : null;

      // Call the database function to update all relevant goals
      const { error } = await supabase.rpc('update_goal_progress_from_activity', {
        p_user_id: userId,
        p_activity_id: activity.strava_activity_id.toString(),
        p_activity_date: new Date(activity.start_date).toISOString().split('T')[0],
        p_distance: (activity.distance || 0) / 1000, // Convert meters to km
        p_duration: activity.moving_time || 0,
        p_elevation_gain: activity.total_elevation_gain || 0,
        p_average_pace: averagePace,
        p_heart_rate_zones: null // TODO: Add HR zone data when available
      });

      if (error) {
        console.error('Error updating goal progress:', error);
        throw error;
      }

      console.log(`✅ Updated goal progress for activity ${activity.strava_activity_id}`);
    } catch (error) {
      console.error('Failed to update goal progress from activity:', error);
      // Don't throw - we don't want to fail the sync if goal update fails
    }
  }

  /**
   * Recalculate all goal progress for a user
   * Useful for fixing progress after goal changes or data corrections
   */
  static async recalculateAllProgress(userId: string): Promise<void> {
    try {
      // Get all activities for the user
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: true });

      if (activitiesError) throw activitiesError;

      // Reset all goal progress to zero
      const { error: resetError } = await supabase
        .from('user_goals')
        .update({ 
          current_progress: 0, 
          best_result: null,
          is_completed: false,
          completed_at: null,
          last_progress_update: null
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (resetError) throw resetError;

      // Get user goal IDs first
      const { data: userGoals, error: goalError } = await supabase
        .from('user_goals')
        .select('id')
        .eq('user_id', userId);

      if (goalError) throw goalError;

      // Clear existing progress records
      if (userGoals && userGoals.length > 0) {
        const goalIds = userGoals.map(g => g.id);
        const { error: clearError } = await supabase
          .from('goal_progress')
          .delete()
          .in('user_goal_id', goalIds);

        if (clearError) throw clearError;
      }

      // Process each activity to rebuild progress
      for (const activity of activities || []) {
        await this.updateProgressFromActivity(userId, activity as Activity);
      }

      console.log(`✅ Recalculated progress for ${activities?.length || 0} activities`);
    } catch (error) {
      console.error('Failed to recalculate goal progress:', error);
      throw error;
    }
  }

  /**
   * Get quantifiable goals that can be automatically tracked
   * Returns which goals can be connected to activity data
   */
  static async getQuantifiableGoals(userId: string) {
    const { data: goals, error } = await supabase
      .from('user_goals')
      .select(`
        *,
        goal_type:goal_types(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    const quantifiable = goals?.filter((goal: UserGoal & { goal_type?: GoalType }) => {
      const metricType = goal.goal_type?.metric_type;
      
      // These metrics can be automatically calculated from activity data
      const autoTrackableMetrics = [
        'total_distance',      // Weekly/monthly distance goals
        'max_distance',        // Longest run goals
        'average_pace',        // Pace improvement goals
        'run_count',          // Frequency goals (runs per week/month)
        'total_time',         // Time-based goals (hours per week)
        'max_duration',       // Longest run duration
        'total_elevation',    // Elevation gain goals
        'elevation_per_km'    // Hill training consistency
      ];

      return metricType && autoTrackableMetrics.includes(metricType);
    }) || [];

    const manual = goals?.filter((goal: UserGoal & { goal_type?: GoalType }) => {
      const metricType = goal.goal_type?.metric_type;
      
      // These require manual input or special data
      const manualMetrics = [
        'zone_2_time',        // Requires HR zone data
        'zone_4_time',        // Requires HR zone data
        'race_time',          // Event-specific goals
        'weight_loss'         // Non-activity goals
      ];

      return metricType && manualMetrics.includes(metricType);
    }) || [];

    return {
      quantifiable,
      manual,
      stats: {
        total: goals?.length || 0,
        autoTracked: quantifiable.length,
        manualTracked: manual.length,
        autoTrackingPercentage: goals?.length ? Math.round((quantifiable.length / goals.length) * 100) : 0
      }
    };
  }

  /**
   * Get current progress for time-period based goals (weekly/monthly)
   * Calculates progress within the current time period
   */
  static async getCurrentPeriodProgress(userId: string, goalId: string) {
    const { data: goal, error } = await supabase
      .from('user_goals')
      .select(`
        *,
        goal_type:goal_types(*),
        goal_progress(*)
      `)
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (!goal) return null;

    const now = new Date();
    const startOfPeriod = goal.time_period === 'weekly' 
      ? this.getStartOfWeek(now)
      : this.getStartOfMonth(now);

    // Get progress within current period
    const periodProgress = goal.goal_progress?.filter((progress: GoalProgressRecord) => 
      new Date(progress.activity_date) >= startOfPeriod
    ) || [];

    const currentPeriodProgress = periodProgress.reduce(
      (sum: number, p: GoalProgressRecord) => sum + (p.contribution_amount || 0), 
      0
    );

    return {
      goal,
      currentPeriodProgress,
      targetValue: goal.target_value || 0,
      progressPercentage: goal.target_value 
        ? Math.round((currentPeriodProgress / goal.target_value) * 100)
        : 0,
      remainingToTarget: Math.max(0, (goal.target_value || 0) - currentPeriodProgress),
      periodStart: startOfPeriod,
      periodEnd: goal.time_period === 'weekly' 
        ? this.getEndOfWeek(now)
        : this.getEndOfMonth(now),
      recentActivities: periodProgress.length
    };
  }

  private static getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day; // Start week on Sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private static getEndOfWeek(date: Date): Date {
    const end = new Date(this.getStartOfWeek(date));
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private static getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private static getEndOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }
} 