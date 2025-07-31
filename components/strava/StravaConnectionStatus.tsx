'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Link2, Unlink, CheckCircle2, AlertCircle, Activity } from 'lucide-react';
import { useStravaConnection } from '@/hooks/strava/useStravaConnection';
import { useStravaAuth } from '@/hooks/use-strava-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { getStravaAuthUrl } from '@/lib/strava';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export function StravaConnectionStatus() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { connectionStatus, isLoading: isCheckingConnection, error: connectionError, disconnect } = useStravaConnection();
  const { mutate: exchangeToken, isPending: isAuthing } = useStravaAuth();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('🔍 OAuth check:', { code: !!code, error, errorDescription });

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

    // Handle successful OAuth code
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
          
          // Invalidate queries to ensure fresh data
          await queryClient.invalidateQueries({ 
            queryKey: ['strava', 'connection'] 
          });
          
          // Clear success message after delay
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
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-5 w-5 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            Strava Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isAuthing ? 'Connecting to Strava...' : 'Checking connection status...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConnected = connectionStatus?.connected;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="h-5 w-5 bg-orange-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          Strava Connection
        </CardTitle>
        <CardDescription className="text-sm">
          Connect your Strava account to sync activities and track your training progress.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Success Message */}
        {authSuccess && (
          <Alert className="border-green-200 bg-green-50 py-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800">
              Successfully connected to Strava!
            </AlertDescription>
          </Alert>
        )}

        {/* Error Messages */}
        {(connectionError || authError) && (
          <Alert className="border-red-200 bg-red-50 py-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800">
              {authError || connectionError}
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Status */}
        <div className={`rounded-lg p-3 border-2 ${
          isConnected 
            ? 'border-green-200 bg-green-50' 
            : 'border-orange-200 bg-orange-50'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
              )}
              <div>
                <h3 className={`font-semibold text-sm ${
                  isConnected ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {isConnected ? 'Connected to Strava' : 'Not Connected'}
                </h3>
                {isConnected && connectionStatus.athlete ? (
                  <p className="text-xs text-green-700 mt-0.5">
                    {connectionStatus.athlete.firstname} {connectionStatus.athlete.lastname}
                  </p>
                ) : (
                  <p className="text-xs text-orange-700 mt-0.5">
                    Connect to start syncing your activities
                  </p>
                )}
              </div>
            </div>
            {isConnected && connectionStatus.expiresAt && (
              <div className="text-right">
                <div className="text-xs text-green-700 font-medium">Expires</div>
                <div className="text-xs text-green-600">
                  {new Date(connectionStatus.expiresAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          {isConnected ? (
            <Button 
              size="sm"
              variant="outline" 
              onClick={handleDisconnect} 
              disabled={isDisconnecting}
              className="w-full border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect from Strava
                </>
              )}
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={handleConnect} 
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Connect to Strava
            </Button>
          )}
        </div>

        {/* Benefits Section */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <h4 className="text-xs font-medium text-gray-900">What you get</h4>
          </div>
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span className="text-xs text-gray-600">Automatic activity synchronization</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span className="text-xs text-gray-600">Performance metrics tracking</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span className="text-xs text-gray-600">Training pattern analysis</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 