'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/AuthProvider';
import { StravaAuth } from '@/lib/strava/auth';
import { Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface DebugStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any; // Debug data can have various shapes from different APIs
}

export function SyncDebugger() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<DebugStep[]>([
    { name: 'Authentication Check', status: 'pending' },
    { name: 'Token Validation', status: 'pending' },
    { name: 'Connection Status', status: 'pending' },
    { name: 'Strava API Test', status: 'pending' },
    { name: 'Sync Process', status: 'pending' },
  ]);

  const updateStep = (index: number, updates: Partial<DebugStep>) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    ));
  };

  const runDiagnostics = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setIsRunning(true);
    
    try {
      // Step 1: Authentication Check
      updateStep(0, { status: 'running' });
      if (!user) {
        updateStep(0, { status: 'error', message: 'No authenticated user' });
        return;
      }
      updateStep(0, { status: 'success', message: `User: ${user.id}`, data: { userId: user.id } });

      // Step 2: Token Validation
      updateStep(1, { status: 'running' });
      const stravaAuth = new StravaAuth(false);
      
      try {
        const tokens = await stravaAuth.getTokens(user.id);
        if (!tokens) {
          updateStep(1, { status: 'error', message: 'No Strava tokens found - account not connected' });
          return;
        }

        const accessToken = await stravaAuth.getValidAccessToken(user.id);
        if (!accessToken) {
          updateStep(1, { status: 'error', message: 'Invalid or expired tokens' });
          return;
        }

        updateStep(1, { 
          status: 'success', 
          message: 'Valid access token found',
          data: { 
            expiresAt: tokens.expires_at,
            athleteId: tokens.strava_athlete_id 
          }
        });

        // Step 3: Connection Status
        updateStep(2, { status: 'running' });
        const connectionStatus = await stravaAuth.getConnectionStatus(user.id);
        updateStep(2, { 
          status: connectionStatus.connected ? 'success' : 'error',
          message: connectionStatus.connected ? 'Connected to Strava' : 'Not connected to Strava',
          data: connectionStatus
        });

        // Step 4: Strava API Test
        updateStep(3, { status: 'running' });
        try {
          const response = await fetch('https://www.strava.com/api/v3/athlete', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) {
            updateStep(3, { 
              status: 'error', 
              message: `Strava API error: ${response.status} ${response.statusText}` 
            });
            return;
          }

          const athlete = await response.json();
          updateStep(3, { 
            status: 'success', 
            message: 'Strava API accessible',
            data: { 
              athleteName: `${athlete.firstname} ${athlete.lastname}`,
              athleteId: athlete.id
            }
          });

          // Step 5: Sync Process Test
          updateStep(4, { status: 'running' });
          try {
            console.log('🚀 Starting sync process test with access token:', accessToken ? 'Present' : 'Missing');
            
            // Test import first
            console.log('📦 Importing StravaActivitySync...');
            const { StravaActivitySync } = await import('@/lib/strava/sync-activities');
            console.log('✅ StravaActivitySync imported successfully');
            
            console.log('🏗️ Creating StravaActivitySync instance...');
            const stravaSync = new StravaActivitySync(user.id);
            console.log('✅ StravaActivitySync instance created successfully');
            
            console.log('🔄 Starting syncUserActivities operation...');
            const result = await stravaSync.syncUserActivities({
              maxActivities: 5, // Small test
              forceRefresh: false
            });
            console.log('🎉 Sync completed with result:', result);

            updateStep(4, { 
              status: result.success ? 'success' : 'error',
              message: result.success 
                ? `Sync completed: ${result.activitiesProcessed} activities processed (${result.newActivities} new, ${result.updatedActivities} updated)`
                : `Sync failed: ${result.errors.join(', ')}`,
              data: result
            });

          } catch (syncError) {
            console.error('❌ Detailed sync error:', syncError);
            console.error('❌ Error type:', typeof syncError);
            console.error('❌ Error constructor:', syncError?.constructor?.name);
            console.error('❌ Error stack:', syncError instanceof Error ? syncError.stack : 'No stack trace');
            
            const errorMessage = syncError instanceof Error 
              ? syncError.message 
              : `Unknown error: ${JSON.stringify(syncError)}`;
              
            updateStep(4, { 
              status: 'error', 
              message: `Sync error: ${errorMessage}`,
              data: {
                errorType: typeof syncError,
                errorConstructor: syncError?.constructor?.name,
                fullError: syncError
              }
            });
          }

        } catch (apiError) {
          updateStep(3, { 
            status: 'error', 
            message: `API test failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}` 
          });
        }

      } catch (authError) {
        updateStep(1, { 
          status: 'error', 
          message: `Auth error: ${authError instanceof Error ? authError.message : 'Unknown error'}` 
        });
      }

    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DebugStep['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: DebugStep['status']) => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Strava Sync Debugger</CardTitle>
        <CardDescription>
          Diagnose issues with your Strava connection and syncing process
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning || !user}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Running Diagnostics...
            </>
          ) : (
            'Run Diagnostics'
          )}
        </Button>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border transition-colors ${getStatusColor(step.status)}`}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(step.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{step.name}</span>
                    <Badge variant={step.status === 'success' ? 'default' : 'secondary'}>
                      {step.status}
                    </Badge>
                  </div>
                  {step.message && (
                    <p className="text-sm text-gray-600 mt-1">{step.message}</p>
                  )}
                </div>
              </div>
              
              {step.data && (
                <div className="mt-3 p-3 bg-white rounded border text-xs">
                  <details>
                    <summary className="cursor-pointer font-medium">View Details</summary>
                    <pre className="mt-2 overflow-auto text-xs">
                      {JSON.stringify(step.data, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This tool will help identify where your sync process is failing. Run diagnostics to see detailed information about each step.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
} 