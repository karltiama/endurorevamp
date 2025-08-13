import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { UpdateOnboardingRequest } from '@/types/goals';

// GET - Fetch user's onboarding status
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

    const { data: onboarding, error } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no onboarding record exists, create one
    if (error && error.code === 'PGRST116') {
      const { data: newOnboarding, error: createError } = await supabase
        .from('user_onboarding')
        .insert({
          user_id: user.id,
          current_step: 'goals',
        })
        .select('*')
        .single();

      if (createError) {
        console.error('Error creating onboarding record:', createError);
        return NextResponse.json(
          { error: 'Failed to initialize onboarding' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        onboarding: newOnboarding,
      });
    }

    if (error) {
      console.error('Error fetching onboarding status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch onboarding status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      onboarding,
    });
  } catch (error) {
    console.error('Onboarding GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update onboarding status
export async function PATCH(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: UpdateOnboardingRequest = await request.json();
    const supabase = await createClient();

    // Check if all steps are completed for setting completed_at
    const shouldMarkComplete =
      body.goals_completed &&
      body.strava_connected &&
      body.profile_completed &&
      body.first_sync_completed;

    const updateData: UpdateOnboardingRequest & {
      completed_at?: string;
      current_step?: 'goals' | 'strava' | 'complete';
    } = { ...body };

    if (shouldMarkComplete) {
      updateData.completed_at = new Date().toISOString();
      updateData.current_step = 'complete';
    }

    const { data: onboarding, error } = await supabase
      .from('user_onboarding')
      .update(updateData)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating onboarding status:', error);
      return NextResponse.json(
        { error: 'Failed to update onboarding status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      onboarding,
    });
  } catch (error) {
    console.error('Onboarding PATCH API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
