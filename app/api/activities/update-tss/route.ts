import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureActivitiesHaveTSS } from '@/lib/training/training-load';

export async function POST() {
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

    // Update TSS for all activities that don't have it
    const result = await ensureActivitiesHaveTSS(user.id);

    return NextResponse.json({
      success: true,
      updated: result.updated,
      errors: result.errors,
      message: `Updated TSS for ${result.updated} activities`,
    });
  } catch (error) {
    console.error('Update TSS API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
