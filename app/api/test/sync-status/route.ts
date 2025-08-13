import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Get comprehensive sync status for testing
export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Strava token info
    const { data: tokens } = await supabase
      .from('strava_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get recent activities
    const { data: activities } = await supabase
      .from('activities')
      .select('id, name, start_date, strava_activity_id, created_at')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(5);

    // Get sync statistics
    const { data: syncStats } = await supabase
      .from('activities')
      .select('created_at')
      .eq('user_id', user.id)
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    const now = Date.now();
    const tokenExpiry = tokens?.expires_at
      ? new Date(tokens.expires_at).getTime()
      : null;
    const tokenExpiresIn = tokenExpiry ? Math.max(0, tokenExpiry - now) : null;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      stravaConnection: {
        isConnected: !!tokens,
        athleteId: tokens?.strava_athlete_id,
        athleteName: tokens
          ? `${tokens.athlete_firstname} ${tokens.athlete_lastname}`
          : null,
        tokenExpiresIn: tokenExpiresIn
          ? Math.floor(tokenExpiresIn / 1000)
          : null,
        tokenExpiresAt: tokens?.expires_at,
        lastSyncAt: tokens?.last_sync_at,
        hasRefreshToken: !!tokens?.refresh_token,
      },
      recentActivities: activities || [],
      syncStats: {
        activitiesLast24Hours: syncStats?.length || 0,
        totalActivities: activities?.length || 0,
        lastActivityDate: activities?.[0]?.start_date || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
