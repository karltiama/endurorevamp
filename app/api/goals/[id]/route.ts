import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';

// PATCH - Update a goal
export async function PATCH(
  request: Request,
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

    const { id: goalId } = await params;
    const body = await request.json();
    
    const supabase = await createClient();
    
    // Verify the goal belongs to the user
    const { data: existingGoal, error: fetchError } = await supabase
      .from('user_goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingGoal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Update the goal
    const { data: updatedGoal, error: updateError } = await supabase
      .from('user_goals')
      .update({
        target_value: body.target_value,
        target_date: body.target_date,
        goal_data: body.goal_data,
        current_progress: body.current_progress,
        is_completed: body.is_completed,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select(`
        *,
        goal_type:goal_types(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating goal:', updateError);
      return NextResponse.json(
        { error: 'Failed to update goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      goal: updatedGoal
    });

  } catch (error) {
    console.error('Goal PATCH API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a goal
export async function DELETE(
  request: Request,
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

    const { id: goalId } = await params;
    const supabase = await createClient();
    
    // Verify the goal belongs to the user
    const { data: existingGoal, error: fetchError } = await supabase
      .from('user_goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingGoal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Delete the goal (this will cascade to goal_progress due to foreign key)
    const { error: deleteError } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting goal:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully'
    });

  } catch (error) {
    console.error('Goal DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 