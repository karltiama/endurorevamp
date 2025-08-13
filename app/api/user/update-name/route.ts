import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Update the user's metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    });

    if (updateError) {
      console.error('Error updating user name:', updateError);
      return NextResponse.json(
        { error: 'Failed to update name' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Name updated successfully',
      name: name.trim(),
    });
  } catch (error) {
    console.error('Error in update-name API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
