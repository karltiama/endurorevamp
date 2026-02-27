import type { SupabaseClient } from '@supabase/supabase-js';
import type { StravaAuthResponse } from '@/lib/strava/types';

export interface StravaTokens {
  id?: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  expires_in: number;
  strava_athlete_id: number;
  athlete_firstname?: string;
  athlete_lastname?: string;
  athlete_profile?: string;
  scope?: string;
  created_at?: string;
  updated_at?: string;
}

export class StravaAuth {
  private supabaseClient: SupabaseClient | null = null;
  private isServer: boolean;

  constructor(isServer = false) {
    this.isServer = isServer;
  }

  private async getSupabase(): Promise<SupabaseClient> {
    if (!this.supabaseClient) {
      if (this.isServer) {
        const { createClient } = await import('@/lib/supabase/server');
        this.supabaseClient = await createClient();
      } else {
        const { createClient: createBrowserClient } = await import(
          '@/lib/supabase/client'
        );
        this.supabaseClient = createBrowserClient();
      }
    }
    return this.supabaseClient;
  }

  /**
   * Store tokens after successful OAuth exchange
   */
  async storeTokens(
    userId: string,
    authResponse: StravaAuthResponse
  ): Promise<void> {
    const supabase = await this.getSupabase();

    const tokenData: Omit<StravaTokens, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      access_token: authResponse.access_token,
      refresh_token: authResponse.refresh_token,
      token_type: authResponse.token_type,
      expires_at: new Date(authResponse.expires_at * 1000).toISOString(),
      expires_in: authResponse.expires_in,
      strava_athlete_id: authResponse.athlete.id,
      athlete_firstname: authResponse.athlete.firstname,
      athlete_lastname: authResponse.athlete.lastname,
      athlete_profile: authResponse.athlete.profile,
      // scope: authResponse.scope, // Add if Strava returns scope
    };

    const { error } = await supabase.from('strava_tokens').upsert(tokenData, {
      onConflict: 'user_id',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error('Error storing Strava tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Get stored tokens for a user
   */
  async getTokens(userId: string): Promise<StravaTokens | null> {
    const supabase = await this.getSupabase();

    const { data, error } = await supabase
      .from('strava_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No tokens found - user not connected
        return null;
      }
      console.error('Error fetching Strava tokens:', error);
      throw new Error('Failed to fetch authentication tokens');
    }

    return data;
  }

  /**
   * Check if user is connected to Strava
   * Returns true if we have tokens (refresh token can renew expired access tokens)
   */
  async isConnected(userId: string): Promise<boolean> {
    try {
      const tokens = await this.getTokens(userId);
      // User is connected if we have tokens - the refresh token can always renew access
      return tokens !== null && !!tokens.refresh_token;
    } catch (error) {
      console.error('Error checking Strava connection:', error);
      return false;
    }
  }

  /**
   * Check if access token is expired or expiring soon
   */
  isTokenExpired(tokens: StravaTokens): boolean {
    const expiresAt = new Date(tokens.expires_at);
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    return expiresAt.getTime() <= now.getTime() + bufferTime;
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(userId: string): Promise<string | null> {
    try {
      const tokens = await this.getTokens(userId);
      if (!tokens) return null;

      // Check if token needs refresh
      const expiresAt = new Date(tokens.expires_at);
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer - reduced from 10 minutes

      if (expiresAt.getTime() <= now.getTime() + bufferTime) {
        // Token expired or expiring soon, refresh it
        console.log('🔄 Token expiring soon, attempting refresh...');
        const refreshedTokens = await this.refreshTokens(
          tokens.refresh_token,
          userId
        );
        return refreshedTokens?.access_token || tokens.access_token; // Fallback to old token if refresh fails
      }

      return tokens.access_token;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      // Don't disconnect user immediately on error, just return null
      return null;
    }
  }

  /**
   * Refresh expired tokens.
   * Client-side: delegates to the server API route (secrets aren't available in the browser).
   * Server-side: calls Strava directly.
   */
  async refreshTokens(
    refreshToken: string,
    userId: string
  ): Promise<StravaTokens | null> {
    if (!this.isServer) {
      return this.refreshTokensViaApi(userId);
    }
    return this.refreshTokensDirectly(refreshToken, userId);
  }

  /**
   * Client-side refresh: call our own API route which has access to STRAVA_CLIENT_SECRET
   */
  private async refreshTokensViaApi(
    userId: string
  ): Promise<StravaTokens | null> {
    try {
      console.log('🔄 Refreshing Strava tokens via API route...');

      const response = await fetch('/api/auth/strava/token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Token refresh via API failed:', response.status, errorData);

        if (response.status === 404) {
          console.log('🔄 No tokens found, user needs to reconnect');
          return null;
        }

        throw new Error(
          errorData.error || `Token refresh failed: ${response.status}`
        );
      }

      console.log('✅ Token refresh via API successful');
      return await this.getTokens(userId);
    } catch (error) {
      console.error('Error refreshing Strava tokens via API:', error);
      return null;
    }
  }

  /**
   * Server-side refresh: call Strava API directly with client secret
   */
  private async refreshTokensDirectly(
    refreshToken: string,
    userId: string
  ): Promise<StravaTokens | null> {
    try {
      console.log('🔄 Refreshing Strava tokens for user:', userId);

      const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
      const clientSecret = process.env.STRAVA_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        console.error('❌ Missing Strava credentials:', {
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
        });
        throw new Error(
          'Strava credentials not configured. Please check NEXT_PUBLIC_STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET environment variables.'
        );
      }

      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token refresh failed:', response.status, errorText);

        if (
          errorText.includes('client_secret') &&
          errorText.includes('invalid')
        ) {
          console.error(
            '❌ Invalid client_secret. Please verify STRAVA_CLIENT_SECRET environment variable matches your Strava app settings.'
          );
          throw new Error(
            'Invalid Strava client secret. Please check your STRAVA_CLIENT_SECRET environment variable matches your Strava app credentials.'
          );
        }

        if (response.status === 400 && errorText.includes('invalid_grant')) {
          console.log('🔄 Invalid refresh token, user needs to reconnect');
          await this.disconnectUser(userId);
        }

        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }

      const authResponse: StravaAuthResponse = await response.json();
      console.log('✅ Token refresh successful');

      await this.storeTokens(userId, authResponse);

      return await this.getTokens(userId);
    } catch (error) {
      console.error('Error refreshing Strava tokens:', error);

      if (error instanceof Error && error.message.includes('invalid_grant')) {
        await this.disconnectUser(userId);
      }

      return null;
    }
  }

  /**
   * Disconnect user from Strava (remove tokens)
   */
  async disconnectUser(userId: string): Promise<void> {
    const supabase = await this.getSupabase();

    const { error } = await supabase
      .from('strava_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error disconnecting user from Strava:', error);
      throw new Error('Failed to disconnect from Strava');
    }
  }

  /**
   * Get connection status with user info
   * Proactively refreshes expired tokens to maintain connection
   */
  async getConnectionStatus(userId: string): Promise<{
    connected: boolean;
    athlete?: {
      id: number;
      firstname?: string;
      lastname?: string;
      profile?: string;
    };
    expiresAt?: string;
  }> {
    try {
      console.log('🔍 Checking connection status for user:', userId);
      let tokens = await this.getTokens(userId);

      if (!tokens) {
        console.log('❌ No tokens found for user');
        return { connected: false };
      }

      // Proactively refresh if token is expired or expiring soon
      if (this.isTokenExpired(tokens)) {
        console.log('🔄 Token expired, attempting proactive refresh...');
        try {
          const refreshedTokens = await this.refreshTokens(tokens.refresh_token, userId);
          if (refreshedTokens) {
            tokens = refreshedTokens;
            console.log('✅ Token refreshed successfully');
          } else {
            console.log('⚠️ Token refresh returned null, using existing tokens');
          }
        } catch (refreshError) {
          console.warn('⚠️ Proactive token refresh failed:', refreshError);
          // Don't disconnect - the refresh token might still be valid for later
        }
      }

      const connected = await this.isConnected(userId);
      console.log(
        '🔗 Connection status:',
        connected,
        'expires at:',
        tokens.expires_at
      );

      return {
        connected,
        athlete: {
          id: tokens.strava_athlete_id,
          firstname: tokens.athlete_firstname,
          lastname: tokens.athlete_lastname,
          profile: tokens.athlete_profile,
        },
        expiresAt: tokens.expires_at,
      };
    } catch (error) {
      console.error('Error getting connection status:', error);
      return { connected: false };
    }
  }
}
