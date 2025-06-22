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
        const { createClient: createBrowserClient } = await import('@/lib/supabase/client');
        this.supabaseClient = createBrowserClient();
      }
    }
    return this.supabaseClient;
  }

  /**
   * Store tokens after successful OAuth exchange
   */
  async storeTokens(userId: string, authResponse: StravaAuthResponse): Promise<void> {
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

    const { error } = await supabase
      .from('strava_tokens')
      .upsert(tokenData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
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
   * Check if user is connected to Strava and tokens are valid
   */
  async isConnected(userId: string): Promise<boolean> {
    try {
      const tokens = await this.getTokens(userId);
      if (!tokens) return false;

      // Check if tokens are expired
      const expiresAt = new Date(tokens.expires_at);
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

      return expiresAt.getTime() > (now.getTime() + bufferTime);
    } catch (error) {
      console.error('Error checking Strava connection:', error);
      return false;
    }
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
      const bufferTime = 10 * 60 * 1000; // 10 minutes buffer

      if (expiresAt.getTime() <= (now.getTime() + bufferTime)) {
        // Token expired or expiring soon, refresh it
        const refreshedTokens = await this.refreshTokens(tokens.refresh_token, userId);
        return refreshedTokens?.access_token || null;
      }

      return tokens.access_token;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Refresh expired tokens
   */
  private async refreshTokens(refreshToken: string, userId: string): Promise<StravaTokens | null> {
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }

      const authResponse: StravaAuthResponse = await response.json();
      
      // Store the refreshed tokens
      await this.storeTokens(userId, authResponse);
      
      // Return the updated tokens
      return await this.getTokens(userId);
    } catch (error) {
      console.error('Error refreshing Strava tokens:', error);
      
      // If refresh fails, remove the invalid tokens
      await this.disconnectUser(userId);
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
      const tokens = await this.getTokens(userId);
      
      if (!tokens) {
        console.log('❌ No tokens found for user');
        return { connected: false };
      }

      console.log('✅ Tokens found, checking if connected...');
      const connected = await this.isConnected(userId);
      console.log('🔗 Connection status:', connected, 'expires at:', tokens.expires_at);
      
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