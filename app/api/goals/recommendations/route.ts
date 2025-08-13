import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Verify the user can only access their own data
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch user's recent activities to understand their training patterns
    const { data: recentActivities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
      .limit(20);

    if (activitiesError) {
      console.error(
        'Error fetching recent activities for recommendations:',
        activitiesError
      );
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      );
    }

    // Fetch current goals
    const { data: currentGoals, error: goalsError } = await supabase
      .from('user_goals')
      .select(
        `
        *,
        goal_type:goal_types(*)
      `
      )
      .eq('user_id', userId)
      .eq('is_active', true);

    if (goalsError) {
      console.error(
        'Error fetching current goals for recommendations:',
        goalsError
      );
      return NextResponse.json(
        { error: 'Failed to fetch goals' },
        { status: 500 }
      );
    }

    // Fetch available goal types
    const { data: goalTypes, error: typesError } = await supabase
      .from('goal_types')
      .select('*')
      .order('name');

    if (typesError) {
      console.error(
        'Error fetching goal types for recommendations:',
        typesError
      );
      return NextResponse.json(
        { error: 'Failed to fetch goal types' },
        { status: 500 }
      );
    }

    // Generate recommendations based on user's activity patterns
    const recommendations = generateGoalRecommendations(
      recentActivities || [],
      currentGoals || [],
      goalTypes || []
    );

    return NextResponse.json({
      success: true,
      recommendations,
      currentGoals: currentGoals || [],
      recentActivities: recentActivities || [],
    });
  } catch (error) {
    console.error('Error in GET /api/goals/recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface Activity {
  distance?: number;
  average_speed?: number;
  moving_time?: number;
  start_date?: string;
}

interface Goal {
  goal_type?: {
    metric_type?: string;
  };
}

interface GoalType {
  metric_type?: string;
}

function generateGoalRecommendations(
  activities: Activity[],
  currentGoals: Goal[],
  goalTypes: GoalType[]
): unknown[] {
  const recommendations = [];

  // Analyze activity patterns
  const totalDistance = activities.reduce(
    (sum, activity) => sum + (activity.distance || 0),
    0
  );
  const averagePace =
    activities.length > 0
      ? activities.reduce(
          (sum, activity) => sum + (activity.average_speed || 0),
          0
        ) / activities.length
      : 0;

  // Check if user has distance goals
  const hasDistanceGoal = currentGoals.some(
    g => g.goal_type?.metric_type === 'total_distance'
  );
  if (!hasDistanceGoal && totalDistance > 0) {
    const distanceGoalType = goalTypes.find(
      gt => gt.metric_type === 'total_distance'
    );
    if (distanceGoalType) {
      const suggestedTarget = Math.round(totalDistance * 1.2); // 20% increase
      recommendations.push({
        type: 'distance',
        goalType: distanceGoalType,
        suggestedTarget,
        reasoning: `Based on your recent activities, you've covered ${Math.round(totalDistance)}km. Consider setting a distance goal to challenge yourself further.`,
        priority: 'medium',
      });
    }
  }

  // Check if user has pace goals
  const hasPaceGoal = currentGoals.some(
    g => g.goal_type?.metric_type === 'average_pace'
  );
  if (!hasPaceGoal && averagePace > 0) {
    const paceGoalType = goalTypes.find(
      gt => gt.metric_type === 'average_pace'
    );
    if (paceGoalType) {
      const currentPaceMinutes = 60 / averagePace; // Convert m/s to min/km
      const suggestedTarget = Math.max(currentPaceMinutes * 0.9, 3.5); // 10% improvement, min 3:30/km
      recommendations.push({
        type: 'pace',
        goalType: paceGoalType,
        suggestedTarget: Math.round(suggestedTarget * 100) / 100, // Round to 2 decimal places
        reasoning: `Your current average pace is ${Math.round(currentPaceMinutes * 100) / 100} min/km. Consider setting a pace goal to improve your speed.`,
        priority: 'medium',
      });
    }
  }

  // Check if user has frequency goals
  const hasFrequencyGoal = currentGoals.some(
    g => g.goal_type?.metric_type === 'run_count'
  );
  if (!hasFrequencyGoal && activities.length > 0) {
    const frequencyGoalType = goalTypes.find(
      gt => gt.metric_type === 'run_count'
    );
    if (frequencyGoalType) {
      const weeklyAverage = activities.filter(a => {
        if (!a.start_date) return false;
        const activityDate = new Date(a.start_date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return activityDate > weekAgo;
      }).length;

      const suggestedTarget = Math.max(weeklyAverage + 1, 3); // At least 3 runs per week
      recommendations.push({
        type: 'frequency',
        goalType: frequencyGoalType,
        suggestedTarget,
        reasoning: `You're averaging ${weeklyAverage} runs per week. Consider setting a frequency goal to maintain consistency.`,
        priority: 'low',
      });
    }
  }

  // If no specific recommendations, suggest a general fitness goal
  if (recommendations.length === 0) {
    const generalGoalType = goalTypes.find(
      gt => gt.metric_type === 'total_distance'
    );
    if (generalGoalType) {
      recommendations.push({
        type: 'general',
        goalType: generalGoalType,
        suggestedTarget: 50, // 50km total distance
        reasoning:
          'Start with a general fitness goal to track your progress and build momentum.',
        priority: 'low',
      });
    }
  }

  return recommendations;
}
