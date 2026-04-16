import { NextRequest, NextResponse } from 'next/server';

function buildState(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'Strava client ID is not configured' },
        { status: 500 }
      );
    }

    const requestUrl =
      request.nextUrl instanceof URL ? request.nextUrl : new URL(request.url);
    const origin = requestUrl.origin;
    const redirectUri = `${origin}/api/auth/strava/callback`;
    const state = buildState();

    const authUrl = new URL('https://www.strava.com/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'read,activity:read_all');
    authUrl.searchParams.set('approval_prompt', 'auto');
    authUrl.searchParams.set('state', state);

    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('strava_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to start OAuth',
      },
      { status: 500 }
    );
  }
}
