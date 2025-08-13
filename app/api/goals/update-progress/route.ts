import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { NextResponse } from 'next/server';

interface GoalProgress {
  goal_type: string;
  current_progress: number;
  target_value: number;
  progress_percentage: number;
}

export async function POST() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    console.log('🔄 Updating goal progress for user:', user.id);

    // Call the database function to update all goals for the user
    const { data: goalProgressResults, error: goalProgressError } =
      await supabase.rpc('calculate_goal_progress', {
        p_user_id: user.id,
      });

    if (goalProgressError) {
      console.error('❌ Goal progress update failed:', goalProgressError);
      return NextResponse.json(
        {
          error: 'Failed to update goal progress',
          details: goalProgressError.message,
        },
        { status: 500 }
      );
    }

    console.log(
      `✅ Goal progress updated for ${goalProgressResults?.length || 0} goals`
    );

    // Log progress for each goal
    if (goalProgressResults?.length) {
      goalProgressResults.forEach((goal: GoalProgress) => {
        console.log(
          `📈 Goal "${goal.goal_type}": ${goal.current_progress}/${goal.target_value} (${goal.progress_percentage.toFixed(1)}%)`
        );
      });
    }

    return NextResponse.json({
      success: true,
      goalsUpdated: goalProgressResults?.length || 0,
      goals: goalProgressResults || [],
    });
  } catch (error) {
    console.error('❌ Goal progress update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
