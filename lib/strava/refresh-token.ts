import type { SupabaseClient } from '@supabase/supabase-js';

type ExistingTokenData = {
  strava_athlete_id?: number | null;
  athlete_firstname?: string | null;
  athlete_lastname?: string | null;
  athlete_profile?: string | null;
};

type RefreshSuccess = {
  success: true;
  athlete: {
    id?: number;
    firstname?: string;
    lastname?: string;
    profile?: string;
  };
};

type RefreshFailure = {
  success: false;
  error: string;
  status: number;
  retryable: boolean;
  invalidGrant: boolean;
  invalidClientSecret: boolean;
};

export type RefreshTokenResult = RefreshSuccess | RefreshFailure;

export async function refreshAndPersistStravaToken({
  supabase,
  userId,
  refreshToken,
  existingToken,
}: {
  supabase: SupabaseClient;
  userId: string;
  refreshToken: string;
  existingToken?: ExistingTokenData;
}): Promise<RefreshTokenResult> {
  const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      success: false,
      error:
        'Strava credentials not configured. Please check STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET environment variables.',
      status: 500,
      retryable: false,
      invalidGrant: false,
      invalidClientSecret: false,
    };
  }

  const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!refreshResponse.ok) {
    const errorText = await refreshResponse.text();
    const invalidGrant =
      refreshResponse.status === 400 && errorText.includes('invalid_grant');
    const invalidClientSecret =
      errorText.includes('client_secret') && errorText.includes('invalid');

    return {
      success: false,
      error: `Token refresh failed: ${refreshResponse.status} - ${errorText}`,
      status: refreshResponse.status,
      retryable: !invalidGrant && !invalidClientSecret,
      invalidGrant,
      invalidClientSecret,
    };
  }

  const authData = await refreshResponse.json();
  const athlete = authData.athlete;

  const { error: upsertError } = await supabase.from('strava_tokens').upsert(
    {
      user_id: userId,
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
      token_type: authData.token_type,
      expires_at: new Date(authData.expires_at * 1000).toISOString(),
      expires_in: authData.expires_in,
      strava_athlete_id: athlete?.id ?? existingToken?.strava_athlete_id ?? null,
      athlete_firstname:
        athlete?.firstname ?? existingToken?.athlete_firstname ?? null,
      athlete_lastname: athlete?.lastname ?? existingToken?.athlete_lastname ?? null,
      athlete_profile: athlete?.profile ?? existingToken?.athlete_profile ?? null,
    },
    {
      onConflict: 'user_id',
      ignoreDuplicates: false,
    }
  );

  if (upsertError) {
    return {
      success: false,
      error: 'Failed to store refreshed tokens',
      status: 500,
      retryable: true,
      invalidGrant: false,
      invalidClientSecret: false,
    };
  }

  return {
    success: true,
    athlete: {
      id: athlete?.id ?? existingToken?.strava_athlete_id ?? undefined,
      firstname: athlete?.firstname ?? existingToken?.athlete_firstname ?? undefined,
      lastname: athlete?.lastname ?? existingToken?.athlete_lastname ?? undefined,
      profile: athlete?.profile ?? existingToken?.athlete_profile ?? undefined,
    },
  };
}
