import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { CreateGoalRequest } from '@/types/goals';

// GET - Fetch user's goals
export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    
    // Fetch user goals with goal type information
    const { data: goals, error: goalsError } = await supabase
      .from('user_goals')
      .select(`
        *,
        goal_type:goal_types(*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (goalsError) {
      console.error('Error fetching user goals:', goalsError);
      return NextResponse.json(
        { error: 'Failed to fetch goals' },
        { status: 500 }
      );
    }

    // Fetch onboarding status
    const { data: onboarding, error: onboardingError } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Don't treat missing onboarding record as an error
    if (onboardingError && onboardingError.code !== 'PGRST116') {
      console.error('Error fetching onboarding status:', onboardingError);
    }

    return NextResponse.json({
      success: true,
      goals: goals || [],
      onboarding: onboarding || null
    });

  } catch (error) {
    console.error('Goals GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new goal
export async function POST(request: Request) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateGoalRequest = await request.json();
    
    // Validate required fields
    if (!body.goal_type_id) {
      return NextResponse.json(
        { error: 'Goal type is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Check if goal type exists and is active
    const { data: goalType, error: goalTypeError } = await supabase
      .from('goal_types')
      .select('*')
      .eq('id', body.goal_type_id)
      .eq('is_active', true)
      .single();

    if (goalTypeError || !goalType) {
      return NextResponse.json(
        { error: 'Invalid goal type' },
        { status: 400 }
      );
    }

    // Create the goal
    const { data: goal, error: createError } = await supabase
      .from('user_goals')
      .insert({
        user_id: user.id,
        goal_type_id: body.goal_type_id,
        target_value: body.target_value,
        target_unit: body.target_unit || goalType.unit,
        target_date: body.target_date,
        goal_data: body.goal_data || {},
        priority: body.priority || 1,
        progress_unit: body.target_unit || goalType.unit
      })
      .select(`
        *,
        goal_type:goal_types(*)
      `)
      .single();

    if (createError) {
      console.error('Error creating goal:', createError);
      
      // Handle duplicate goal error
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'You already have an active goal of this type' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      goal
    });

  } catch (error) {
    console.error('Goals POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 