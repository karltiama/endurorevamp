import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function clearStateCookie(response: NextResponse) {
  response.cookies.set('strava_oauth_state', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export async function GET(request: NextRequest) {
  const requestUrl =
    request.nextUrl instanceof URL ? request.nextUrl : new URL(request.url);
  const dashboardUrl = new URL('/dashboard', requestUrl.origin);

  try {
    const code = requestUrl.searchParams.get('code');
    const state = requestUrl.searchParams.get('state');
    const oauthError = requestUrl.searchParams.get('error');
    const oauthErrorDescription = requestUrl.searchParams.get(
      'error_description'
    );

    if (oauthError) {
      dashboardUrl.searchParams.set('strava', 'error');
      dashboardUrl.searchParams.set(
        'reason',
        oauthErrorDescription || oauthError || 'authorization_failed'
      );
      return NextResponse.redirect(dashboardUrl);
    }

    if (!code || !state) {
      dashboardUrl.searchParams.set('strava', 'error');
      dashboardUrl.searchParams.set('reason', 'missing_code_or_state');
      return NextResponse.redirect(dashboardUrl);
    }

    const expectedState = request.cookies.get('strava_oauth_state')?.value;
    if (!expectedState || expectedState !== state) {
      dashboardUrl.searchParams.set('strava', 'error');
      dashboardUrl.searchParams.set('reason', 'invalid_state');
      const mismatchResponse = NextResponse.redirect(dashboardUrl);
      clearStateCookie(mismatchResponse);
      return mismatchResponse;
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      dashboardUrl.searchParams.set('strava', 'error');
      dashboardUrl.searchParams.set('reason', 'unauthenticated');
      const unauthenticatedResponse = NextResponse.redirect(dashboardUrl);
      clearStateCookie(unauthenticatedResponse);
      return unauthenticatedResponse;
    }

    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      dashboardUrl.searchParams.set('strava', 'error');
      dashboardUrl.searchParams.set('reason', 'missing_strava_credentials');
      const credentialResponse = NextResponse.redirect(dashboardUrl);
      clearStateCookie(credentialResponse);
      return credentialResponse;
    }

    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      dashboardUrl.searchParams.set('strava', 'error');
      dashboardUrl.searchParams.set('reason', 'token_exchange_failed');
      const exchangeFailureResponse = NextResponse.redirect(dashboardUrl);
      clearStateCookie(exchangeFailureResponse);
      return exchangeFailureResponse;
    }

    const authData = await tokenResponse.json();
    const athlete = authData.athlete;
    if (!athlete) {
      dashboardUrl.searchParams.set('strava', 'error');
      dashboardUrl.searchParams.set('reason', 'missing_athlete_data');
      const athleteResponse = NextResponse.redirect(dashboardUrl);
      clearStateCookie(athleteResponse);
      return athleteResponse;
    }

    const { error: storeError } = await supabase.from('strava_tokens').upsert(
      {
        user_id: user.id,
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        token_type: authData.token_type,
        expires_at: new Date(authData.expires_at * 1000).toISOString(),
        expires_in: authData.expires_in,
        strava_athlete_id: athlete.id,
        athlete_firstname: athlete.firstname,
        athlete_lastname: athlete.lastname,
        athlete_profile: athlete.profile,
      },
      { onConflict: 'user_id', ignoreDuplicates: false }
    );

    if (storeError) {
      dashboardUrl.searchParams.set('strava', 'error');
      dashboardUrl.searchParams.set('reason', 'token_store_failed');
      const storeFailureResponse = NextResponse.redirect(dashboardUrl);
      clearStateCookie(storeFailureResponse);
      return storeFailureResponse;
    }

    dashboardUrl.searchParams.set('strava', 'connected');
    const successResponse = NextResponse.redirect(dashboardUrl);
    clearStateCookie(successResponse);
    return successResponse;
  } catch (_error) {
    dashboardUrl.searchParams.set('strava', 'error');
    dashboardUrl.searchParams.set('reason', 'callback_exception');
    const fallbackResponse = NextResponse.redirect(dashboardUrl);
    clearStateCookie(fallbackResponse);
    return fallbackResponse;
  }
}
