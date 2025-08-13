'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useOnboardingStatus, useUserGoals } from '@/hooks/useGoals';
import { Badge } from '@/components/ui/badge';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useStravaAuth } from '@/hooks/use-strava-auth';
import { useQueryClient } from '@tanstack/react-query';
import { STRAVA_CONNECTION_QUERY_KEY } from '@/hooks/strava/useStravaConnection';
import { STRAVA_TOKEN_QUERY_KEY } from '@/hooks/strava/useStravaToken';

function OnboardingDemoContent() {
  const [showModal, setShowModal] = useState(false);
  const { data: userGoalsData } = useUserGoals();
  const { onboarding, hasCompletedOnboarding, currentStep } =
    useOnboardingStatus();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { mutate: exchangeToken, isPending: isAuthing } = useStravaAuth();

  // Check if we're returning from Strava OAuth (redirected from dashboard)
  useEffect(() => {
    const fromStrava = searchParams.get('from_strava');
    const code = searchParams.get('code');

    if (fromStrava === 'true' && code) {
      console.log('🔄 Processing OAuth code redirected from dashboard...');

      // Clean URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('from_strava');
      newUrl.searchParams.delete('code');
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('error_description');
      newUrl.searchParams.delete('state');
      newUrl.searchParams.delete('scope');
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });

      // Process the OAuth code
      if (user && !isAuthing) {
        exchangeToken(code, {
          onSuccess: async data => {
            console.log(
              '✅ Successfully connected to Strava on onboarding demo:',
              data
            );

            // Update onboarding status to mark Strava as connected
            try {
              await fetch('/api/onboarding', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  strava_connected: true,
                  current_step: 'complete',
                }),
              });
            } catch (error) {
              console.warn('Failed to update onboarding status:', error);
            }

            // Update cache immediately
            queryClient.setQueryData([STRAVA_CONNECTION_QUERY_KEY, user.id], {
              connected: true,
              athlete: data.athlete
                ? {
                    id: data.athlete.id,
                    firstname: data.athlete.firstname,
                    lastname: data.athlete.lastname,
                    profile: data.athlete.profile,
                  }
                : undefined,
            });

            // Invalidate queries to ensure fresh data
            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: [STRAVA_CONNECTION_QUERY_KEY, user.id],
              }),
              queryClient.invalidateQueries({
                queryKey: [STRAVA_TOKEN_QUERY_KEY, user.id],
              }),
            ]);

            // Show success message
            alert(
              'Successfully connected to Strava! Your onboarding is now complete.'
            );
          },
          onError: error => {
            console.error('❌ Failed to connect to Strava:', error);
            alert('Failed to connect to Strava. Please try again.');
          },
        });
      }
    }
  }, [searchParams, user, isAuthing, router, queryClient, exchangeToken]);

  // Handle direct Strava OAuth callback (if somehow we get it directly)
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Strava OAuth error:', error);
      return;
    }

    // Only process if we have a code and no from_strava parameter (direct callback)
    if (code && !searchParams.get('from_strava') && user && !isAuthing) {
      console.log('🔄 Processing direct OAuth code on onboarding demo...');

      // Clean URL parameters immediately to prevent re-processing
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('code');
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('error_description');
      newUrl.searchParams.delete('state');
      newUrl.searchParams.delete('scope');
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });

      exchangeToken(code, {
        onSuccess: async data => {
          console.log(
            '✅ Successfully connected to Strava on onboarding demo:',
            data
          );

          // Update onboarding status to mark Strava as connected
          try {
            await fetch('/api/onboarding', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                strava_connected: true,
                current_step: 'complete',
              }),
            });
          } catch (error) {
            console.warn('Failed to update onboarding status:', error);
          }

          // Update cache immediately
          queryClient.setQueryData([STRAVA_CONNECTION_QUERY_KEY, user.id], {
            connected: true,
            athlete: data.athlete
              ? {
                  id: data.athlete.id,
                  firstname: data.athlete.firstname,
                  lastname: data.athlete.lastname,
                  profile: data.athlete.profile,
                }
              : undefined,
          });

          // Invalidate queries to ensure fresh data
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: [STRAVA_CONNECTION_QUERY_KEY, user.id],
            }),
            queryClient.invalidateQueries({
              queryKey: [STRAVA_TOKEN_QUERY_KEY, user.id],
            }),
          ]);

          // Show success message
          alert(
            'Successfully connected to Strava! Your onboarding is now complete.'
          );
        },
        onError: error => {
          console.error('❌ Failed to connect to Strava:', error);
          alert('Failed to connect to Strava. Please try again.');
        },
      });
    }
  }, [searchParams, user, isAuthing, router, queryClient, exchangeToken]);

  // Redirect to home in production
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Demo Not Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This demo page is only available in development mode.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Development Environment Warning */}
      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-orange-800">
            Development Environment
          </span>
        </div>
        <p className="text-sm text-orange-700 mt-1">
          This demo page is only available in development mode.
        </p>
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold">Onboarding Modal Demo</h1>
        <p className="text-gray-600 mt-2">
          Test the goal-setting onboarding flow
        </p>
      </div>

      {/* Onboarding Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Onboarding Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {onboarding ? (
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span>Goals Completed:</span>
                <Badge
                  variant={onboarding.goals_completed ? 'default' : 'secondary'}
                >
                  {onboarding.goals_completed ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Strava Connected:</span>
                <Badge
                  variant={
                    onboarding.strava_connected ? 'default' : 'secondary'
                  }
                >
                  {onboarding.strava_connected ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Current Step:</span>
                <Badge variant="outline">{currentStep}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Onboarding Complete:</span>
                <Badge
                  variant={hasCompletedOnboarding ? 'default' : 'secondary'}
                >
                  {hasCompletedOnboarding ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No onboarding record found</p>
          )}
        </CardContent>
      </Card>

      {/* User Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Current Goals</CardTitle>
        </CardHeader>
        <CardContent>
          {userGoalsData?.goals?.length ? (
            <div className="space-y-3">
              {userGoalsData.goals.map(goal => (
                <div key={goal.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        {goal.goal_type?.display_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Target: {goal.target_value} {goal.target_unit}
                        {goal.target_date && ` by ${goal.target_date}`}
                      </p>
                    </div>
                    <Badge variant={goal.is_active ? 'default' : 'secondary'}>
                      {goal.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {goal.current_progress > 0 && (
                    <div className="mt-2">
                      <div className="text-sm text-muted-foreground">
                        Progress: {goal.current_progress} / {goal.target_value}{' '}
                        {goal.target_unit}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (goal.current_progress / (goal.target_value || 1)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No goals set yet</p>
          )}
        </CardContent>
      </Card>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => setShowModal(true)}
            size="lg"
            className="w-full"
          >
            Open Onboarding Modal
          </Button>

          {/* Debug Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Debug Info:</h4>
            <div className="text-xs space-y-1">
              <div>
                Client ID:{' '}
                {process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
                  ? '✅ Set'
                  : '❌ Missing'}
              </div>
              <div>
                Redirect URI:{' '}
                {process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI ||
                  'http://localhost:3000/dashboard (default)'}
              </div>
              <div>Environment: {process.env.NODE_ENV}</div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Instructions:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Click &quot;Open Onboarding Modal&quot; to start the flow</li>
              <li>Select one or more goals and configure them</li>
              <li>Complete the goals step to proceed</li>
              <li>
                When you reach the Strava step, click &quot;Connect with
                Strava&quot;
              </li>
              <li>You&apos;ll be redirected to Strava for authorization</li>
              <li>
                After authorizing, you&apos;ll be redirected to the dashboard
                briefly
              </li>
              <li>
                The dashboard will automatically redirect you back to this demo
                page
              </li>
              <li>Check the status cards above to see your progress</li>
            </ol>
            <p className="mt-2 text-xs text-orange-600">
              <strong>Note:</strong> This uses the standard dashboard OAuth
              callback URL for security.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Modal */}
      <OnboardingModal
        open={showModal}
        onOpenChange={setShowModal}
        onComplete={() => {
          console.log('Onboarding completed!');
          // You could redirect to dashboard here
        }}
      />
    </div>
  );
}

export default function OnboardingDemoPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading demo page...</p>
            </div>
          </div>
        </div>
      }
    >
      <OnboardingDemoContent />
    </Suspense>
  );
}
