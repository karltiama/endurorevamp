import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: activityId } = await params;
    const body = await request.json();

    // Validate RPE value
    const { perceived_exertion } = body;
    if (
      !perceived_exertion ||
      typeof perceived_exertion !== 'number' ||
      perceived_exertion < 1 ||
      perceived_exertion > 10
    ) {
      return NextResponse.json(
        { error: 'Invalid RPE value. Must be a number between 1 and 10.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Determine if we're dealing with a UUID (database id) or bigint (strava_activity_id)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        activityId
      );

    let query = supabase
      .from('activities')
      .update({
        perceived_exertion: perceived_exertion,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (isUUID) {
      // If it's a UUID, use it as the database id
      query = query.eq('id', activityId);
    } else {
      // If it's a number, use it as strava_activity_id
      query = query.eq('strava_activity_id', parseInt(activityId));
    }

    const { data: updatedActivity, error: updateError } = await query
      .select()
      .single();

    if (updateError) {
      console.error('Error updating activity RPE:', updateError);
      return NextResponse.json(
        { error: 'Failed to update activity RPE' },
        { status: 500 }
      );
    }

    if (!updatedActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      activity: updatedActivity,
    });
  } catch (error) {
    console.error('Activity RPE update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
