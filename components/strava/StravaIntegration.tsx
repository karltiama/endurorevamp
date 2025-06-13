'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Link2, Unlink, RefreshCw, User, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStravaConnection, STRAVA_CONNECTION_QUERY_KEY } from '@/hooks/strava/useStravaConnection';
import { useStravaSync } from '@/hooks/strava/useStravaSync';
import { useStravaAuth } from '@/hooks/use-strava-auth';
import { useStravaToken, STRAVA_TOKEN_QUERY_KEY } from '@/hooks/strava/useStravaToken';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { getStravaAuthUrl } from '@/lib/strava';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ActivitiesDashboard } from './ActivitiesDashboard';

export function StravaIntegration() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { connectionStatus, isLoading: isCheckingConnection, error: connectionError, refreshStatus, disconnect } = useStravaConnection();
  const { syncData, isLoading: isSyncing, lastSyncResult, error: syncError } = useStravaSync();
  const { mutate: exchangeToken, isPending: isAuthing } = useStravaAuth();
  const { accessToken } = useStravaToken();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Handle OAuth callback on dashboard - with race condition protection
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('🔍 Dashboard OAuth check:', { code: !!code, error, errorDescription });

    // Handle OAuth errors from Strava
    if (error) {
      console.error('❌ OAuth error from Strava:', { error, errorDescription });
      setAuthError(
        errorDescription || 
        (error === 'access_denied' ? 'Access denied by user' : 'Authorization failed')
      );
      
      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('code');
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('error_description');
      newUrl.searchParams.delete('state');
      newUrl.searchParams.delete('scope');
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
      return;
    }

    // Handle successful OAuth code with improved race condition protection
    if (code && !connectionStatus?.connected && !isAuthing) {
      console.log('🔄 Processing OAuth code...');
      setAuthError(null);
      
      // Clear URL parameters immediately to prevent re-processing
      const newUrl = new URL(window.location.href);
      const cleanedUrl = newUrl.pathname + newUrl.search.replace(/[?&]code=[^&]*/g, '').replace(/[?&]error=[^&]*/g, '').replace(/[?&]error_description=[^&]*/g, '').replace(/[?&]state=[^&]*/g, '').replace(/[?&]scope=[^&]*/g, '').replace(/^&/, '?').replace(/[?&]$/, '');
      router.replace(cleanedUrl, { scroll: false });
      
      exchangeToken(code, {
        onSuccess: async (data) => {
          console.log('✅ Successfully connected to Strava:', data);
          setAuthSuccess(true);
          
          // Set the connection status immediately in cache to prevent showing disconnected state
          queryClient.setQueryData(
            [STRAVA_CONNECTION_QUERY_KEY, user?.id],
            {
              connected: true,
              athlete: data.athlete ? {
                id: data.athlete.id,
                firstname: data.athlete.firstname,
                lastname: data.athlete.lastname,
                profile: data.athlete.profile,
              } : undefined,
            }
          );
          
          // Invalidate queries to ensure fresh data from server
          await Promise.all([
            queryClient.invalidateQueries({ 
              queryKey: [STRAVA_CONNECTION_QUERY_KEY, user?.id] 
            }),
            queryClient.invalidateQueries({ 
              queryKey: [STRAVA_TOKEN_QUERY_KEY, user?.id] 
            })
          ]);
          
          // Clear success message after a delay
          setTimeout(() => {
            setAuthSuccess(false);
          }, 3000);
        },
        onError: (error) => {
          console.error('❌ Failed to connect to Strava:', error);
          
          let errorMessage = 'Failed to connect to Strava';
          if (error instanceof Error) {
            if (error.message.includes('401')) {
              errorMessage = 'Invalid authorization code. Please try connecting again.';
            } else if (error.message.includes('403')) {
              errorMessage = 'Access forbidden. Please check your Strava permissions.';
            } else if (error.message.includes('429')) {
              errorMessage = 'Too many requests. Please wait a moment and try again.';
            } else if (error.message.includes('500')) {
              errorMessage = 'Server error. Please try again later.';
            } else {
              errorMessage = error.message;
            }
          }
          
          setAuthError(errorMessage);
        }
      });
    }
  }, [searchParams, connectionStatus?.connected, isAuthing, exchangeToken, router, queryClient, user?.id]);

  const handleConnect = () => {
    window.location.href = getStravaAuthUrl(window.location.origin);
  };

  const handleSync = async () => {
    try {
      await syncData({ forceRefresh: false, maxActivities: 50 });
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnect();
    } catch (error) {
      console.error('Disconnect failed:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isCheckingConnection || isAuthing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Strava Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isAuthing ? 'Connecting to Strava...' : 'Checking connection status...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-6 w-6 bg-orange-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          Strava Integration
        </CardTitle>
        <CardDescription>
          Connect your Strava account to sync activities and track your training progress.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            {connectionStatus?.connected ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Connected</p>
                  {connectionStatus.athlete && (
                    <p className="text-sm text-muted-foreground">
                      {connectionStatus.athlete.firstname} {connectionStatus.athlete.lastname}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Not Connected</p>
                  <p className="text-sm text-muted-foreground">Connect to start syncing your activities</p>
                </div>
              </>
            )}
          </div>
          <Badge variant={connectionStatus?.connected ? "default" : "secondary"}>
            {connectionStatus?.connected ? "Active" : "Disconnected"}
          </Badge>
        </div>

        {/* Success Message */}
        {authSuccess && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Successfully connected to Strava! Your account is now linked.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Messages */}
        {(connectionError || syncError || authError) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {authError || connectionError || syncError}
            </AlertDescription>
          </Alert>
        )}

        {/* Sync Results */}
        {lastSyncResult && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              {lastSyncResult.success ? (
                <>
                  Sync completed successfully! 
                  {lastSyncResult.activitiesProcessed > 0 && (
                    <> Processed {lastSyncResult.activitiesProcessed} activities.</>
                  )}
                  {lastSyncResult.profileUpdated && <> Profile updated.</>}
                </>
              ) : (
                <>Sync failed: {lastSyncResult.errors.join(', ')}</>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {connectionStatus?.connected ? (
            <>
              <Button onClick={handleSync} disabled={isSyncing} className="flex-1">
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Data
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDisconnect} 
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect} className="w-full">
              <Link2 className="h-4 w-4 mr-2" />
              Connect to Strava
            </Button>
          )}
        </div>

        {/* Connection Info */}
        {connectionStatus?.connected && connectionStatus.expiresAt && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              Token expires: {new Date(connectionStatus.expiresAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              Athlete ID: {connectionStatus.athlete?.id}
            </div>
          </div>
        )}

        {/* Benefits */}
        {!connectionStatus?.connected && (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Benefits of connecting:</p>
            <ul className="space-y-1 text-xs">
              <li>• Automatically sync your activities</li>
              <li>• Track performance metrics over time</li>
              <li>• Analyze training patterns and trends</li>
              <li>• Get detailed insights on your progress</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Wrapper component to include Activities Dashboard when connected
export function StravaIntegrationWithActivities() {
  const { connectionStatus } = useStravaConnection();
  const { accessToken } = useStravaToken();

  return (
    <div className="space-y-6">
      <StravaIntegration />
      
      {/* Show Activities Dashboard when connected and we have an access token */}
      {connectionStatus?.connected && accessToken && (
        <ActivitiesDashboard accessToken={accessToken} />
      )}
    </div>
  );
} 