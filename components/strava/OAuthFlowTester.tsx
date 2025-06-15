'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { getStravaAuthUrl } from '@/lib/strava';
import { CheckCircle, AlertCircle, ArrowRight, Link2, Eye } from 'lucide-react';

export function OAuthFlowTester() {
  const searchParams = useSearchParams();
  const [flowState, setFlowState] = useState<{
    step: number;
    steps: Array<{
      name: string;
      status: 'pending' | 'active' | 'complete' | 'error';
      details?: string;
    }>;
  }>({
    step: 0,
    steps: [
      { name: 'Generate OAuth URL', status: 'pending' },
      { name: 'Redirect to Strava', status: 'pending' },
      { name: 'User Authorization', status: 'pending' },
      { name: 'Callback with Code', status: 'pending' },
      { name: 'Token Exchange', status: 'pending' },
      { name: 'Store Tokens', status: 'pending' },
    ]
  });

  useEffect(() => {
    // Check if we have OAuth parameters from test flow
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const state = searchParams.get('state');

    // Only process if this is from our test flow (has state=oauth-test)
    if (state === 'oauth-test') {
      if (code) {
        console.log('✅ OAuth test callback received with code:', code.substring(0, 12) + '...');
        setFlowState(prev => ({
          step: 4,
          steps: prev.steps.map((step, index) => ({
            ...step,
            status: index < 4 ? 'complete' : index === 4 ? 'active' : 'pending',
            details: index === 3 ? `Received code: ${code.substring(0, 12)}...` : step.details
          }))
        }));

        // Simulate token exchange step
        setTimeout(() => {
          console.log('🔄 Simulating token exchange...');
          setFlowState(prev => ({
            step: 5,
            steps: prev.steps.map((step, index) => ({
              ...step,
              status: index < 5 ? 'complete' : index === 5 ? 'active' : 'pending',
              details: index === 4 ? 'Exchanging code for tokens...' : step.details
            }))
          }));

          // Test the actual token exchange
          testTokenExchange(code);
        }, 1000);

      } else if (error) {
        console.error('❌ OAuth test callback received error:', error, errorDescription);
        setFlowState(prev => ({
          step: 3,
          steps: prev.steps.map((step, index) => ({
            ...step,
            status: index < 3 ? 'complete' : index === 3 ? 'error' : 'pending',
            details: index === 3 ? `Error: ${error} - ${errorDescription}` : step.details
          }))
        }));
      }

      // Clean up URL parameters after processing
      setTimeout(() => {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('code');
        newUrl.searchParams.delete('error');
        newUrl.searchParams.delete('error_description');
        newUrl.searchParams.delete('state');
        newUrl.searchParams.delete('scope');
        window.history.replaceState({}, '', newUrl.pathname + newUrl.search);
      }, 2000);
    }
  }, [searchParams]);

  const testTokenExchange = async (code: string) => {
    try {
      console.log('🔄 Testing token exchange with code:', code.substring(0, 12) + '...');
      
      const response = await fetch('/api/auth/strava/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      console.log('📡 Token exchange response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Token exchange successful:', result);
      
      setFlowState(prev => ({
        step: 6,
        steps: prev.steps.map((step, index) => ({
          ...step,
          status: index < 6 ? 'complete' : 'pending',
          details: index === 4 ? `Tokens received for athlete: ${result.athlete?.firstname} ${result.athlete?.lastname}` : 
                   index === 5 ? 'Tokens stored successfully' : step.details
        }))
      }));

    } catch (error) {
      console.error('❌ Token exchange failed:', error);
      setFlowState(prev => ({
        step: 5,
        steps: prev.steps.map((step, index) => ({
          ...step,
          status: index < 4 ? 'complete' : index === 4 ? 'error' : 'pending',
          details: index === 4 ? `Token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}` : step.details
        }))
      }));
    }
  };

  const startOAuthFlow = () => {
    console.log('🚀 Starting OAuth flow test...');
    
    // Step 1: Generate OAuth URL
    setFlowState(prev => ({
      step: 1,
      steps: prev.steps.map((step, index) => ({
        ...step,
        status: index === 0 ? 'active' : 'pending'
      }))
    }));

    setTimeout(() => {
      // Generate OAuth URL that redirects back to test page instead of dashboard
      const testRedirectUri = `${window.location.origin}/test-sync`;
      const authUrl = getTestStravaAuthUrl(testRedirectUri);
      console.log('🔗 Generated test OAuth URL:', authUrl);
      
      setFlowState(prev => ({
        step: 2,
        steps: prev.steps.map((step, index) => ({
          ...step,
          status: index === 0 ? 'complete' : index === 1 ? 'active' : 'pending',
          details: index === 0 ? `URL: ${authUrl.substring(0, 50)}...` : step.details
        }))
      }));

      // Step 2: Redirect to Strava
      setTimeout(() => {
        setFlowState(prev => ({
          step: 3,
          steps: prev.steps.map((step, index) => ({
            ...step,
            status: index < 2 ? 'complete' : index === 2 ? 'active' : 'pending'
          }))
        }));

        console.log('🔗 Redirecting to Strava...');
        window.location.href = authUrl;
      }, 1000);
    }, 500);
  };

  // Generate OAuth URL specifically for testing (redirects back to test page)
  const getTestStravaAuthUrl = (redirectUri: string) => {
    try {
      const url = new URL('https://www.strava.com/oauth/authorize');
      const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
      
      if (!clientId) {
        console.error('NEXT_PUBLIC_STRAVA_CLIENT_ID is not configured');
        return '#';
      }
      
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'read,activity:read_all');
      url.searchParams.set('approval_prompt', 'auto');
      url.searchParams.set('state', 'oauth-test'); // Add state to identify test flows
      
      return url.toString();
    } catch (error) {
      console.error('Error generating test Strava URL:', error);
      return '#';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getCurrentUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>🔄 OAuth Flow Tester</CardTitle>
        <CardDescription>
          Step-by-step testing of the Strava OAuth connection process
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Current URL Display */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4" />
            <span className="font-medium text-sm">Current URL:</span>
          </div>
          <div className="text-xs font-mono break-all text-gray-600">
            {getCurrentUrl()}
          </div>
        </div>

        {/* Flow Steps */}
        <div className="space-y-3">
          {flowState.steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              {getStepIcon(step.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{step.name}</span>
                  <Badge variant={step.status === 'complete' ? 'default' : 'secondary'}>
                    {step.status}
                  </Badge>
                </div>
                {step.details && (
                  <div className="text-sm text-gray-600 mt-1">{step.details}</div>
                )}
              </div>
              {index < flowState.steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {flowState.step === 0 ? (
            <Button onClick={startOAuthFlow} className="flex-1">
              <Link2 className="h-4 w-4 mr-2" />
              Test OAuth Flow
            </Button>
          ) : (
            <>
              <div className="flex-1">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    OAuth flow in progress. Check browser console for detailed logs.
                    {flowState.step === 3 && (
                      <div className="mt-2">
                        <strong>Next:</strong> User needs to authorize on Strava, then they'll be redirected back to this test page.
                      </div>
                    )}
                    {flowState.step >= 6 && (
                      <div className="mt-2">
                        <strong>✅ Test Complete!</strong> OAuth flow worked successfully.
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setFlowState({
                  step: 0,
                  steps: [
                    { name: 'Generate OAuth URL', status: 'pending' },
                    { name: 'Redirect to Strava', status: 'pending' },
                    { name: 'User Authorization', status: 'pending' },
                    { name: 'Callback with Code', status: 'pending' },
                    { name: 'Token Exchange', status: 'pending' },
                    { name: 'Store Tokens', status: 'pending' },
                  ]
                })}
              >
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>What this test does:</strong>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-sm">
              <li>Generates a test OAuth URL that redirects back to this page</li>
              <li>Redirects you to Strava for authorization</li>
              <li>Strava redirects back to this test page with authorization code</li>
              <li>Tests the token exchange API call with the received code</li>
              <li>Shows you the complete flow without interrupting your testing</li>
              <li><strong>Note:</strong> This stores real tokens in your database!</li>
            </ol>
            <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
              <strong>⚠️ Important:</strong> Make sure your Strava app's "Authorization Callback Domain" 
              includes <code className="bg-white px-1 rounded">localhost</code> for this test to work.
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
} 