'use client';

import React, { useState } from 'react';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useOnboardingStatus, useUserGoals } from '@/hooks/useGoals';
import { Badge } from '@/components/ui/badge';

export default function OnboardingDemoPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: userGoalsData } = useUserGoals();
  const { onboarding, hasCompletedOnboarding, currentStep } = useOnboardingStatus();

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
          <span className="font-medium text-orange-800">Development Environment</span>
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
                <Badge variant={onboarding.goals_completed ? 'default' : 'secondary'}>
                  {onboarding.goals_completed ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Strava Connected:</span>
                <Badge variant={onboarding.strava_connected ? 'default' : 'secondary'}>
                  {onboarding.strava_connected ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Current Step:</span>
                <Badge variant="outline">{currentStep}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Onboarding Complete:</span>
                <Badge variant={hasCompletedOnboarding ? 'default' : 'secondary'}>
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
              {userGoalsData.goals.map((goal) => (
                <div key={goal.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{goal.goal_type?.display_name}</h4>
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
                        Progress: {goal.current_progress} / {goal.target_value} {goal.target_unit}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (goal.current_progress / (goal.target_value || 1)) * 100)}%` 
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
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Click &quot;Open Onboarding Modal&quot; to start the flow</li>
              <li>Select one or more goals and configure them</li>
              <li>Complete the goals step to proceed</li>
              <li>The modal will guide you through each step</li>
              <li>Check the status cards above to see your progress</li>
            </ol>
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