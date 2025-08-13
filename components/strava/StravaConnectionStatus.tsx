'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { useStravaConnection } from '@/hooks/strava/useStravaConnection';
import { getStravaAuthUrl } from '@/lib/strava';
import { useState } from 'react';

export function StravaConnectionStatus() {
  const {
    connectionStatus,
    isLoading: isCheckingConnection,
    error: connectionError,
    disconnect,
  } = useStravaConnection();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Note: OAuth code processing has been moved to StravaOAuthHandler to prevent race conditions
  // This component now only handles connection status display and manual actions

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

  if (isCheckingConnection) {
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
              Checking connection status...
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
          Connect your Strava account to sync activities and track your training
          progress.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Error Messages */}
        {connectionError && (
          <Alert className="border-red-200 bg-red-50 py-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800">
              {connectionError}
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Status */}
        <div
          className={`rounded-lg p-3 border-2 ${
            isConnected
              ? 'border-green-200 bg-green-50'
              : 'border-orange-200 bg-orange-50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
              )}
              <div>
                <h3
                  className={`font-semibold text-sm ${
                    isConnected ? 'text-green-800' : 'text-orange-800'
                  }`}
                >
                  {isConnected ? 'Connected to Strava' : 'Not Connected'}
                </h3>
                {isConnected && connectionStatus.athlete ? (
                  <p className="text-xs text-green-700 mt-0.5">
                    {connectionStatus.athlete.firstname}{' '}
                    {connectionStatus.athlete.lastname}
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
                <div className="text-xs text-green-700 font-medium">
                  Expires
                </div>
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
              <span className="text-xs text-gray-600">
                Automatic activity synchronization
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span className="text-xs text-gray-600">
                Performance metrics tracking
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <span className="text-xs text-gray-600">
                Training pattern analysis
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
