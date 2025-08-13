import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';

export async function POST() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Create a simple test plan
    const testPlan = {
      id: 'test-plan',
      weekStart: new Date().toISOString().split('T')[0],
      workouts: {
        0: null, // Sunday - rest
        1: {
          // Monday
          id: 'test-workout-1',
          type: 'easy',
          sport: 'Run',
          duration: 30,
          intensity: 4,
          distance: 5,
          difficulty: 'beginner',
          energyCost: 4,
          recoveryTime: 12,
          reasoning: 'Test workout',
          alternatives: [],
          instructions: ['Test instruction'],
          tips: ['Test tip'],
        },
        2: null, // Tuesday - rest
        3: null, // Wednesday - rest
        4: null, // Thursday - rest
        5: null, // Friday - rest
        6: null, // Saturday - rest
      },
      totalTSS: 120,
      totalDistance: 5,
      totalTime: 30,
      periodizationPhase: 'base',
      isEditable: true,
    };

    console.log('Test: Calling save_workout_plan with test data');

    const { data: planId, error } = await supabase.rpc('save_workout_plan', {
      user_uuid: user.id,
      week_start_date: new Date().toISOString().split('T')[0],
      plan_data: testPlan,
    });

    if (error) {
      console.error('Test: Error saving workout plan:', error);
      return NextResponse.json(
        {
          error: 'Failed to save test workout plan',
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log('Test: Successfully saved test plan with ID:', planId);

    return NextResponse.json({
      success: true,
      planId,
      message: 'Test workout plan saved successfully',
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
