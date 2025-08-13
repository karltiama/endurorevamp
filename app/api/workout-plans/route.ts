import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';

interface WorkoutPlanRow {
  plan_id: string;
  week_start: string;
  day_of_week: number | null;
  workout_type?: string;
  sport?: string;
  duration?: number;
  intensity?: number;
  distance?: number;
  difficulty?: string;
  energy_cost?: number;
  recovery_time?: number;
  reasoning?: string;
  goal_alignment?: string;
  weather_consideration?: string;
  instructions?: string[];
  tips?: string[];
  modifications?: Record<string, unknown>;
  alternatives?: string[];
  total_tss?: number;
  total_distance?: string;
  total_time?: number;
  periodization_phase?: string;
}

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Get the current week's plan for the user
    const { data: planData, error } = await supabase.rpc(
      'get_current_week_plan',
      {
        user_uuid: user.id,
      }
    );

    if (error) {
      console.error('Error fetching workout plan:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workout plan' },
        { status: 500 }
      );
    }

    // Transform the data into the expected format
    if (planData && planData.length > 0) {
      const firstRow = planData[0];
      const workouts: { [dayOfWeek: number]: unknown } = {};

      // Initialize all days as null
      for (let i = 0; i < 7; i++) {
        workouts[i] = null;
      }

      // Fill in the workouts from the database
      planData.forEach((row: WorkoutPlanRow) => {
        if (row.day_of_week !== null) {
          workouts[row.day_of_week] = {
            id: row.plan_id + '-' + row.day_of_week,
            type: row.workout_type,
            sport: row.sport,
            duration: row.duration,
            intensity: row.intensity,
            distance: row.distance,
            difficulty: row.difficulty,
            energyCost: row.energy_cost,
            recoveryTime: row.recovery_time,
            reasoning: row.reasoning,
            goalAlignment: row.goal_alignment,
            weatherConsideration: row.weather_consideration,
            instructions: row.instructions || [],
            tips: row.tips || [],
            modifications: row.modifications || {},
            alternatives: row.alternatives || [],
          };
        }
      });

      const weeklyPlan = {
        id: firstRow.plan_id,
        weekStart: firstRow.week_start,
        workouts,
        totalTSS: firstRow.total_tss,
        totalDistance: parseFloat(firstRow.total_distance),
        totalTime: firstRow.total_time,
        periodizationPhase: firstRow.periodization_phase,
        isEditable: true,
      };

      return NextResponse.json({ weeklyPlan });
    }

    // No plan found
    return NextResponse.json({ weeklyPlan: null });
  } catch (error) {
    console.error('Error in GET /api/workout-plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/workout-plans: Starting request');

    const user = await requireAuth();
    console.log('POST /api/workout-plans: User authenticated:', user.id);

    const supabase = await createClient();
    const body = await request.json();

    const { weeklyPlan } = body;
    console.log('POST /api/workout-plans: Received weeklyPlan:', {
      id: weeklyPlan?.id,
      weekStart: weeklyPlan?.weekStart,
      workoutsCount: Object.values(weeklyPlan?.workouts || {}).filter(
        w => w !== null
      ).length,
      totalTSS: weeklyPlan?.totalTSS,
      totalDistance: weeklyPlan?.totalDistance,
      totalTime: weeklyPlan?.totalTime,
    });

    if (!weeklyPlan) {
      console.error('POST /api/workout-plans: No weekly plan provided');
      return NextResponse.json(
        { error: 'Weekly plan is required' },
        { status: 400 }
      );
    }

    // Calculate the week start date (Sunday)
    const weekStart = new Date(weeklyPlan.weekStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Go to Sunday

    // Ensure required fields are present
    const planData = {
      ...weeklyPlan,
      periodizationPhase: weeklyPlan.periodizationPhase || 'base',
      totalTSS: weeklyPlan.totalTSS || 0,
      totalDistance: weeklyPlan.totalDistance || 0,
      totalTime: weeklyPlan.totalTime || 0,
    };

    console.log('POST /api/workout-plans: Saving workout plan with data:', {
      periodizationPhase: planData.periodizationPhase,
      totalTSS: planData.totalTSS,
      totalDistance: planData.totalDistance,
      totalTime: planData.totalTime,
      weekStartDate: weekStart.toISOString().split('T')[0],
    });

    // Log the exact JSON being passed to the database function
    const planDataJson = JSON.stringify(planData);
    console.log(
      'POST /api/workout-plans: plan_data JSON length:',
      planDataJson.length
    );
    console.log(
      'POST /api/workout-plans: plan_data JSON preview:',
      planDataJson.substring(0, 500) + '...'
    );

    // Save the workout plan using the database function
    console.log('POST /api/workout-plans: Calling save_workout_plan with:', {
      user_uuid: user.id,
      week_start_date: weekStart.toISOString().split('T')[0],
      plan_data_type: typeof planData,
      plan_data_keys: Object.keys(planData),
    });

    const { data: planId, error } = await supabase.rpc('save_workout_plan', {
      user_uuid: user.id,
      week_start_date: weekStart.toISOString().split('T')[0],
      plan_data: planData, // Pass as object, not string
    });

    if (error) {
      console.error(
        'POST /api/workout-plans: Error saving workout plan:',
        error
      );
      console.error('POST /api/workout-plans: Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        {
          error: 'Failed to save workout plan',
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log(
      'POST /api/workout-plans: Successfully saved plan with ID:',
      planId
    );

    return NextResponse.json({
      success: true,
      planId,
      message: 'Workout plan saved successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/workout-plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    console.log('DELETE /api/workout-plans: Starting request');

    const user = await requireAuth();
    console.log('DELETE /api/workout-plans: User authenticated:', user.id);

    const supabase = await createClient();
    console.log('DELETE /api/workout-plans: Supabase client created');

    // Get the current week start date (Sunday)
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Go to Sunday
    const weekStartDate = weekStart.toISOString().split('T')[0];

    console.log('DELETE /api/workout-plans: Week start date:', weekStartDate);

    // First, let's see what plans exist for this week
    const { data: existingPlans, error: selectError } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStartDate);

    if (selectError) {
      console.error('Error selecting existing plans:', selectError);
      return NextResponse.json(
        { error: 'Failed to check existing plans' },
        { status: 500 }
      );
    }

    console.log(
      'DELETE /api/workout-plans: Existing plans for this week:',
      existingPlans
    );

    // Delete ALL plans for this week (not just active ones)
    const { error } = await supabase
      .from('workout_plans')
      .delete()
      .eq('user_id', user.id)
      .eq('week_start', weekStartDate);

    if (error) {
      console.error('Error deleting workout plan:', error);
      return NextResponse.json(
        { error: 'Failed to delete workout plan' },
        { status: 500 }
      );
    }

    console.log('DELETE /api/workout-plans: Successfully deleted workout plan');

    return NextResponse.json({
      success: true,
      message: 'Workout plan reset to recommended plan',
    });
  } catch (error) {
    console.error('Error in DELETE /api/workout-plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
