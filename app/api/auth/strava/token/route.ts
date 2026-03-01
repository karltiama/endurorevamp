import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

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
      .select('strava_athlete_id, athlete_firstname, athlete_lastname')
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
            name: `${tokens.athlete_firstname} ${tokens.athlete_lastname}`,
          }
        : null,
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

    // Validate environment variables
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('❌ Missing Strava credentials:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            'Strava credentials not configured. Please check STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET environment variables.',
        },
        { status: 500 }
      );
    }

    // Refresh tokens with Strava
    console.log('🔄 Refreshing Strava tokens for user:', user.id);
    const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error(
        '❌ Token refresh failed:',
        refreshResponse.status,
        errorText
      );

      // Only remove tokens on specific error types, not all failures
      if (
        refreshResponse.status === 400 &&
        errorText.includes('invalid_grant')
      ) {
        console.log('🔄 Invalid refresh token, removing from database');
        await supabase.from('strava_tokens').delete().eq('user_id', user.id);

        return NextResponse.json(
          {
            success: false,
            error:
              'Token refresh failed. Please reconnect your Strava account.',
          },
          { status: refreshResponse.status }
        );
      }

      // Check for client_secret validation errors
      if (
        errorText.includes('client_secret') &&
        errorText.includes('invalid')
      ) {
        console.error(
          '❌ Invalid client_secret. Please verify STRAVA_CLIENT_SECRET environment variable matches your Strava app settings.'
        );
        return NextResponse.json(
          {
            success: false,
            error:
              'Invalid Strava client secret. Please check your STRAVA_CLIENT_SECRET environment variable matches your Strava app credentials.',
            retryable: false,
          },
          { status: refreshResponse.status }
        );
      }

      // For other errors, return the error but don't disconnect user
      return NextResponse.json(
        {
          success: false,
          error: `Token refresh failed: ${refreshResponse.status} - ${errorText}`,
          retryable: true,
        },
        { status: refreshResponse.status }
      );
    }

    const authData = await refreshResponse.json();
    // Strava refresh_token grant may not include athlete; keep existing DB values if missing
    const athlete = authData.athlete;
    console.log(
      '✅ Token refresh successful for athlete:',
      athlete?.id ?? tokens.strava_athlete_id
    );

    // Store the refreshed tokens (use existing athlete fields when refresh response omits them)
    const { error: storeError } = await supabase.from('strava_tokens').upsert(
      {
        user_id: user.id,
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        token_type: authData.token_type,
        expires_at: new Date(authData.expires_at * 1000).toISOString(),
        expires_in: authData.expires_in,
        strava_athlete_id: athlete?.id ?? tokens.strava_athlete_id,
        athlete_firstname: athlete?.firstname ?? tokens.athlete_firstname,
        athlete_lastname: athlete?.lastname ?? tokens.athlete_lastname,
        athlete_profile: athlete?.profile ?? tokens.athlete_profile,
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      }
    );

    if (storeError) {
      console.error('❌ Error storing refreshed tokens:', storeError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to store refreshed tokens',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      athlete: athlete ?? {
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
      console.log('📥 Request body text:', text);

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

    const { code } = requestBody;

    if (!code) {
      console.error('❌ No authorization code provided');
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    console.log('🔑 Processing code:', code.substring(0, 10) + '...');

    const cookieStore = await cookies();
    const supabase = await createClient();

    // Get the authenticated user (secure)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ No authenticated user found');
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      );
    }

    console.log('👤 User authenticated:', user.id);

    // Validate environment variables
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('❌ Missing Strava credentials:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      });
      return NextResponse.json(
        {
          error:
            'Strava credentials not configured. Please check STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET environment variables.',
        },
        { status: 500 }
      );
    }

    // Exchange code for tokens with Strava
    console.log('🌐 Calling Strava token endpoint...');
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

    console.log('📡 Strava response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Strava API error:', tokenResponse.status, errorText);
      return NextResponse.json(
        { error: `Strava API error: ${tokenResponse.status} - ${errorText}` },
        { status: tokenResponse.status }
      );
    }

    const authData = await tokenResponse.json();
    const exchangeAthlete = authData.athlete;
    if (!exchangeAthlete) {
      console.error('❌ Strava token response missing athlete object');
      return NextResponse.json(
        { error: 'Invalid Strava response: missing athlete data' },
        { status: 502 }
      );
    }
    console.log(
      '✅ Strava token exchange successful for athlete:',
      exchangeAthlete.id
    );

    // Store tokens in Supabase
    console.log('💾 Storing tokens in database...');
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
      console.error('❌ Error storing tokens:', storeError);
      return NextResponse.json(
        { error: 'Failed to store Strava tokens in database' },
        { status: 500 }
      );
    }

    console.log('✅ Tokens stored successfully');

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
