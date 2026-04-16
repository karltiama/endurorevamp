import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { refreshAndPersistStravaToken } from '@/lib/strava/refresh-token';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'No authenticated user found',
      });
    }

    // Check if user has Strava tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('strava_tokens')
      .select(
        'strava_athlete_id, athlete_firstname, athlete_lastname, athlete_profile, expires_at'
      )
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      authenticated: true,
      user_id: user.id,
      has_strava_tokens: !!tokens && !tokenError,
      athlete: tokens
        ? {
            id: tokens.strava_athlete_id,
            firstname: tokens.athlete_firstname,
            lastname: tokens.athlete_lastname,
            profile: tokens.athlete_profile,
          }
        : null,
      expires_at: tokens?.expires_at ?? null,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function PUT() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'No authenticated user found',
        },
        { status: 401 }
      );
    }

    // Get current tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('strava_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokens) {
      return NextResponse.json(
        {
          success: false,
          error: 'No Strava tokens found. Please reconnect your account.',
        },
        { status: 404 }
      );
    }

    const refreshResult = await refreshAndPersistStravaToken({
      supabase,
      userId: user.id,
      refreshToken: tokens.refresh_token,
      existingToken: tokens,
    });

    if (!refreshResult.success) {
      if (refreshResult.invalidGrant) {
        await supabase.from('strava_tokens').delete().eq('user_id', user.id);
        return NextResponse.json(
          {
            success: false,
            error:
              'Token refresh failed. Please reconnect your Strava account.',
          },
          { status: refreshResult.status }
        );
      }

      if (refreshResult.invalidClientSecret) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Invalid Strava client secret. Please check your STRAVA_CLIENT_SECRET environment variable matches your Strava app credentials.',
            retryable: false,
          },
          { status: refreshResult.status }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: refreshResult.error,
          retryable: refreshResult.retryable,
        },
        { status: refreshResult.status }
      );
    }

    return NextResponse.json({
      success: true,
      athlete: refreshResult.athlete.id
        ? refreshResult.athlete
        : {
        id: tokens.strava_athlete_id,
        firstname: tokens.athlete_firstname,
        lastname: tokens.athlete_lastname,
        profile: tokens.athlete_profile,
          },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to refresh token',
        retryable: true,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Add more robust JSON parsing
    let requestBody;
    try {
      const text = await request.text();

      if (!text || text.trim() === '') {
        throw new Error('Request body is empty');
      }

      requestBody = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body format' },
        { status: 400 }
      );
    }

    const { code, state } = requestBody;

    if (!code) {
      console.error('❌ No authorization code provided');
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }
    if (!state) {
      return NextResponse.json(
        { error: 'OAuth state is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = await createClient();

    // Validate OAuth state to protect against CSRF/mismatched callbacks
    const expectedState = cookieStore.get('strava_oauth_state')?.value;
    if (!expectedState || expectedState !== state) {
      cookieStore.set('strava_oauth_state', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      return NextResponse.json(
        { error: 'Invalid OAuth state. Please try connecting again.' },
        { status: 400 }
      );
    }
    // One-time use state: clear after successful validation
    cookieStore.set('strava_oauth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    // Get the authenticated user (secure)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      );
    }

    // Validate environment variables
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error:
            'Strava credentials not configured. Please check STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET environment variables.',
        },
        { status: 500 }
      );
    }

    // Exchange code for tokens with Strava
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return NextResponse.json(
        { error: `Strava API error: ${tokenResponse.status} - ${errorText}` },
        { status: tokenResponse.status }
      );
    }

    const authData = await tokenResponse.json();
    const exchangeAthlete = authData.athlete;
    if (!exchangeAthlete) {
      return NextResponse.json(
        { error: 'Invalid Strava response: missing athlete data' },
        { status: 502 }
      );
    }

    // Store tokens in Supabase
    const { error: storeError } = await supabase.from('strava_tokens').upsert(
      {
        user_id: user.id,
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        token_type: authData.token_type,
        expires_at: new Date(authData.expires_at * 1000).toISOString(),
        expires_in: authData.expires_in,
        strava_athlete_id: exchangeAthlete.id,
        athlete_firstname: exchangeAthlete.firstname,
        athlete_lastname: exchangeAthlete.lastname,
        athlete_profile: exchangeAthlete.profile,
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      }
    );

    if (storeError) {
      return NextResponse.json(
        { error: 'Failed to store Strava tokens in database' },
        { status: 500 }
      );
    }

    // Set a cookie to indicate successful connection
    cookieStore.set('strava_connected', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Return success response
    return NextResponse.json({
      success: true,
      athlete: exchangeAthlete,
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to exchange token',
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'No authenticated user found' },
        { status: 401 }
      );
    }

    const { error: deleteError } = await supabase
      .from('strava_tokens')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to disconnect Strava account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Strava disconnect error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to disconnect token',
      },
      { status: 500 }
    );
  }
}
