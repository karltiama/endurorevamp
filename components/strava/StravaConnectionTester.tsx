'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/providers/AuthProvider';
import { useStravaConnection } from '@/hooks/strava/useStravaConnection';
import { useStravaToken } from '@/hooks/strava/useStravaToken';
import { createClient } from '@/lib/supabase/client';
import { getStravaAuthUrl } from '@/lib/strava';
import { Loader2, CheckCircle, AlertCircle, Link2, RefreshCw, Database } from 'lucide-react';

interface DatabaseTestResult {
  canRead: boolean;
  canWrite: boolean;
  hasExistingTokens: boolean;
  existingTokensData?: Record<string, unknown> | null;
  readError?: string;
  writeError?: string;
  error?: string;
}

export function StravaConnectionTester() {
  const { user } = useAuth();
  const { connectionStatus, isLoading: isCheckingConnection, error: connectionError, refreshStatus } = useStravaConnection();
  const { accessToken, isLoading: isLoadingToken, error: tokenError, refreshToken } = useStravaToken();
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<DatabaseTestResult | null>(null);

  // Test database connection and token storage
  const testDatabaseConnection = async () => {
    if (!user) return;

    setIsTestingDb(true);
    setDbTestResult(null);

    try {
      const supabase = createClient();
      
      console.log('🔍 Testing database connection...');
      
      // Test 1: Check if strava_tokens table exists and is accessible
      const { data: tokensData, error: tokensError } = await supabase
        .from('strava_tokens')
        .select('*')
        .eq('user_id', user.id);

      console.log('📊 Tokens query result:', { tokensData, tokensError });

      // Test 2: Check if we can write to the table (try to upsert a test record)
      const testRecord = {
        user_id: user.id,
        access_token: 'test_token_' + Date.now(),
        refresh_token: 'test_refresh_' + Date.now(),
        token_type: 'Bearer',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        expires_in: 21600,
        strava_athlete_id: 999999999,
        athlete_firstname: 'Test',
        athlete_lastname: 'User',
      };

      const { data: insertData, error: insertError } = await supabase
        .from('strava_tokens')
        .upsert(testRecord, { onConflict: 'user_id' })
        .select();

      console.log('✏️ Insert test result:', { insertData, insertError });

      // Clean up test record
      if (!insertError) {
        await supabase
          .from('strava_tokens')
          .delete()
          .eq('user_id', user.id)
          .eq('strava_athlete_id', 999999999);
      }

      setDbTestResult({
        canRead: !tokensError,
        canWrite: !insertError,
        hasExistingTokens: !!(tokensData && tokensData.length > 0),
        existingTokensData: tokensData?.[0] || null,
        readError: tokensError?.message,
        writeError: insertError?.message,
      });

    } catch (error) {
      console.error('Database test failed:', error);
      setDbTestResult({
        canRead: false,
        canWrite: false,
        hasExistingTokens: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleConnect = () => {
    const authUrl = getStravaAuthUrl(window.location.origin);
    console.log('🔗 Redirecting to Strava auth:', authUrl);
    window.location.href = authUrl;
  };

  const handleRefreshAll = async () => {
    console.log('🔄 Refreshing all connection data...');
    await Promise.all([
      refreshStatus(),
      refreshToken(),
      testDatabaseConnection()
    ]);
  };

  const getStatusIcon = (status: boolean | undefined, isLoading: boolean) => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (status === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === false) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <AlertCircle className="h-4 w-4 text-gray-400" />;
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>🔗 Strava Connection Tester</CardTitle>
        <CardDescription>
          Comprehensive testing of your Strava OAuth connection and token storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Connection Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(connectionStatus?.connected, isCheckingConnection)}
              <span className="font-medium">Strava Connection</span>
            </div>
            <div className="text-sm text-gray-600">
              {connectionStatus?.connected ? 
                `Connected as ${connectionStatus.athlete?.firstname} ${connectionStatus.athlete?.lastname}` :
                'Not connected to Strava'
              }
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(!!accessToken, isLoadingToken)}
              <span className="font-medium">Access Token</span>
            </div>
            <div className="text-sm text-gray-600">
              {accessToken ? 
                `Valid token (${accessToken.substring(0, 12)}...)` :
                'No valid access token'
              }
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(dbTestResult?.hasExistingTokens, isTestingDb)}
              <span className="font-medium">Database Storage</span>
            </div>
            <div className="text-sm text-gray-600">
              {dbTestResult?.hasExistingTokens ? 
                'Tokens stored in database' :
                'No tokens in database'
              }
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {!connectionStatus?.connected ? (
            <Button onClick={handleConnect} className="flex-1">
              <Link2 className="h-4 w-4 mr-2" />
              Connect to Strava
            </Button>
          ) : (
            <Button onClick={handleRefreshAll} disabled={isCheckingConnection || isLoadingToken}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={testDatabaseConnection} 
            disabled={isTestingDb || !user}
          >
            {isTestingDb ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Test Database
          </Button>
        </div>

        {/* Error Messages */}
        {(connectionError || tokenError) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Connection Error:</strong> {connectionError || tokenError}
            </AlertDescription>
          </Alert>
        )}

        {/* Database Test Results */}
        {dbTestResult && (
          <div className="space-y-3">
            <h3 className="font-medium">Database Test Results:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {dbTestResult.canRead ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span>Can read from strava_tokens table</span>
              </div>
              
              <div className="flex items-center gap-2">
                {dbTestResult.canWrite ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span>Can write to strava_tokens table</span>
              </div>
              
              <div className="flex items-center gap-2">
                {dbTestResult.hasExistingTokens ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
                <span>Has existing Strava tokens</span>
              </div>
            </div>

            {dbTestResult.existingTokensData && (
              <details className="mt-3">
                <summary className="cursor-pointer font-medium">View Token Details</summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                  {JSON.stringify({
                    athleteId: dbTestResult.existingTokensData.strava_athlete_id,
                    athleteName: `${dbTestResult.existingTokensData.athlete_firstname} ${dbTestResult.existingTokensData.athlete_lastname}`,
                    expiresAt: dbTestResult.existingTokensData.expires_at,
                    tokenType: dbTestResult.existingTokensData.token_type,
                    hasAccessToken: !!dbTestResult.existingTokensData.access_token,
                    hasRefreshToken: !!dbTestResult.existingTokensData.refresh_token,
                    createdAt: dbTestResult.existingTokensData.created_at,
                    updatedAt: dbTestResult.existingTokensData.updated_at,
                  }, null, 2)}
                </pre>
              </details>
            )}

            {(dbTestResult.readError || dbTestResult.writeError || dbTestResult.error) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Database Errors:</strong>
                  <ul className="mt-1">
                    {dbTestResult.readError && <li>Read: {dbTestResult.readError}</li>}
                    {dbTestResult.writeError && <li>Write: {dbTestResult.writeError}</li>}
                    {dbTestResult.error && <li>General: {dbTestResult.error}</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Troubleshooting Steps:</strong>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-sm">
              <li>First, test the database connection to make sure tokens can be stored</li>
              <li>If database works, try connecting to Strava using the button above</li>
              <li>Check browser console for OAuth errors during connection</li>
              <li>After connecting, refresh status to see if tokens were stored properly</li>
              <li>If connection shows as successful but tokens aren&apos;t found, there&apos;s an issue with the OAuth callback handling</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
} 