'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface SupabaseTestResult {
  authWorking: boolean;
  tokensFound: boolean;
  tokensData: {
    athleteId: string;
    expiresAt: string;
    hasAccessToken: boolean;
  } | null;
  activitiesCount: number;
  syncStateExists: boolean;
  syncStateData: {
    lastSync: string;
    requestsToday: number;
    syncEnabled: boolean;
  } | null;
}

export function SupabaseTestButton() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SupabaseTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testSupabaseAccess = async () => {
    if (!user) {
      setError('No authenticated user');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const supabase = createClient();

      console.log('🔍 Testing Supabase client access...');

      // Test 1: Check auth
      const {
        data: { user: supabaseUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw new Error(`Auth error: ${authError.message}`);

      console.log('✅ Auth check passed:', supabaseUser?.id);

      // Test 2: Check Strava tokens table access
      const { data: tokens, error: tokensError } = await supabase
        .from('strava_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (tokensError && tokensError.code !== 'PGRST116') {
        throw new Error(`Tokens query error: ${tokensError.message}`);
      }

      console.log(
        '✅ Strava tokens query:',
        tokens ? 'Found tokens' : 'No tokens'
      );

      // Test 3: Check activities table access
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, name, start_date')
        .eq('user_id', user.id)
        .limit(5);

      if (activitiesError) {
        throw new Error(`Activities query error: ${activitiesError.message}`);
      }

      console.log(
        '✅ Activities query:',
        activities?.length || 0,
        'activities found'
      );

      // Test 4: Check sync_state table access
      const { data: syncState, error: syncError } = await supabase
        .from('sync_state')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (syncError && syncError.code !== 'PGRST116') {
        throw new Error(`Sync state query error: ${syncError.message}`);
      }

      console.log(
        '✅ Sync state query:',
        syncState ? 'Found sync state' : 'No sync state'
      );

      setResult({
        authWorking: true,
        tokensFound: !!tokens,
        tokensData: tokens
          ? {
              athleteId: tokens.strava_athlete_id,
              expiresAt: tokens.expires_at,
              hasAccessToken: !!tokens.access_token,
            }
          : null,
        activitiesCount: activities?.length || 0,
        syncStateExists: !!syncState,
        syncStateData: syncState
          ? {
              lastSync: syncState.last_activity_sync,
              requestsToday: syncState.sync_requests_today,
              syncEnabled: syncState.sync_enabled,
            }
          : null,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Supabase test failed:', err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>
          Test database access for sync functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={testSupabaseAccess}
          disabled={isLoading || !user}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Testing...
            </>
          ) : (
            'Test Database Access'
          )}
        </Button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <strong>Database Error:</strong>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="h-4 w-4" />
              <strong>Database Test Results:</strong>
            </div>
            <div className="space-y-1 text-xs">
              <div>
                ✅ Authentication: {result.authWorking ? 'Working' : 'Failed'}
              </div>
              <div>
                🔑 Strava Tokens: {result.tokensFound ? 'Found' : 'Not found'}
              </div>
              <div>📊 Activities: {result.activitiesCount} found</div>
              <div>
                🔄 Sync State: {result.syncStateExists ? 'Exists' : 'Missing'}
              </div>
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer font-medium">
                View Details
              </summary>
              <pre className="mt-2 bg-white p-2 rounded border text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
