import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';

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
    
    const { data: goalTypes, error } = await supabase
      .from('goal_types')
      .select('*')
      .eq('is_active', true)
      .order('display_name');

    if (error) {
      console.error('Error fetching goal types:', error);
      return NextResponse.json(
        { error: 'Failed to fetch goal types' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      goalTypes: goalTypes || []
    });

  } catch (error) {
    console.error('Goal types API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 