'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { GoalsSelectionStep } from './GoalsSelectionStep';
import { OnboardingProgress } from './OnboardingProgress';
import { useOnboardingStatus } from '@/hooks/useGoals';
import { useAuth } from '@/providers/AuthProvider';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getStravaAuthUrl } from '@/lib/strava';

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  stravaRedirectUrl?: string; // Custom redirect URL for Strava OAuth
}

export function OnboardingModal({
  open,
  onOpenChange,
  onComplete,
  stravaRedirectUrl,
}: OnboardingModalProps) {
  const { user } = useAuth();
  const {
    onboarding,
    currentStep,
    hasCompletedOnboarding,
    isLoading,
    error: onboardingError,
  } = useOnboardingStatus();
  const [internalStep, setInternalStep] = useState<string>('goals');
  const [error, setError] = useState<string | null>(null);

  // Update internal step based on onboarding status
  useEffect(() => {
    if (onboarding) {
      setInternalStep(currentStep);
    }
  }, [currentStep, onboarding]);

  // Close modal if onboarding is complete
  useEffect(() => {
    if (hasCompletedOnboarding) {
      onOpenChange(false);
      onComplete?.();
    }
  }, [hasCompletedOnboarding, onOpenChange, onComplete]);

  // Handle onboarding status errors
  useEffect(() => {
    if (onboardingError) {
      setError('Failed to load onboarding status. Please refresh the page.');
    }
  }, [onboardingError]);

  const handleStepComplete = (step: string) => {
    console.log(`Step completed: ${step}`);
    setError(null); // Clear any previous errors

    // For now, we're just handling the goals step
    // Later steps will be implemented as the app grows
    switch (step) {
      case 'goals':
        setInternalStep('strava');
        break;
      case 'strava':
        setInternalStep('complete');
        break;
      default:
        break;
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleRetry = () => {
    setError(null);
    // Force a refresh of the onboarding status
    window.location.reload();
  };

  const steps = [
    {
      id: 'goals',
      title: 'Set Your Goals',
      description: 'Tell us what you want to achieve',
      isCompleted: onboarding?.goals_completed ?? false,
      isActive: internalStep === 'goals',
    },
    {
      id: 'strava',
      title: 'Connect Strava',
      description: 'Sync your running data',
      isCompleted: onboarding?.strava_connected ?? false,
      isActive: internalStep === 'strava',
    },
    {
      id: 'complete',
      title: "You're All Set!",
      description: 'Start tracking your progress',
      isCompleted: hasCompletedOnboarding,
      isActive: internalStep === 'complete',
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-describedby="onboarding-description"
      >
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold">
            Welcome to Your Running Journey! 🏃‍♂️
          </DialogTitle>
          <DialogDescription className="text-lg">
            Let&apos;s set up your account to help you achieve your running
            goals
          </DialogDescription>
        </DialogHeader>

        <div id="onboarding-description" className="sr-only">
          Welcome to your running journey. Set up your account to help you
          achieve your running goals.
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
              <button
                onClick={handleRetry}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Progress indicator */}
          <OnboardingProgress steps={steps} />

          {/* Step content */}
          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading onboarding...</span>
                </div>
              </div>
            ) : (
              <>
                {internalStep === 'goals' && (
                  <GoalsSelectionStep
                    onComplete={() => handleStepComplete('goals')}
                    onGoalsSelected={goals => {
                      console.log('Goals selected:', goals);
                      handleStepComplete('goals');
                    }}
                    onError={handleError}
                    selectedGoals={[]}
                  />
                )}

                {internalStep === 'strava' && (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold mb-4">
                      Connect Your Strava Account
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Connect Strava to automatically sync your runs and track
                      your progress toward your goals.
                    </p>
                    <div className="space-y-4">
                      <button
                        onClick={() => {
                          console.log('🔄 Strava connection button clicked');

                          // Set flag to indicate user came from onboarding demo
                          if (typeof window !== 'undefined') {
                            sessionStorage.setItem(
                              'from_onboarding_demo',
                              'true'
                            );
                            console.log('✅ Session storage flag set');
                          } else {
                            console.error('❌ Window is undefined');
                          }

                          // Use the proper Strava OAuth URL with custom redirect if provided
                          const stravaUrl = stravaRedirectUrl
                            ? getStravaAuthUrl(stravaRedirectUrl)
                            : getStravaAuthUrl();

                          console.log('🔗 Generated Strava URL:', stravaUrl);

                          if (stravaUrl && stravaUrl !== '#') {
                            console.log('✅ Redirecting to Strava...');
                            try {
                              // Try using window.open first, then fallback to location.href
                              const newWindow = window.open(stravaUrl, '_self');
                              if (!newWindow) {
                                console.log(
                                  'Window.open failed, trying location.href'
                                );
                                window.location.href = stravaUrl;
                              }
                            } catch (error) {
                              console.error('❌ Redirect failed:', error);
                              handleError(
                                'Failed to redirect to Strava. Please try again.'
                              );
                            }
                          } else {
                            console.error(
                              '❌ Failed to generate Strava OAuth URL'
                            );
                            handleError(
                              'Failed to connect to Strava. Please check your environment variables.'
                            );
                          }
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Connect with Strava
                      </button>
                      <div>
                        <button
                          onClick={() => handleStepComplete('strava')}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Skip for now
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {internalStep === 'complete' && (
                  <div className="text-center py-12">
                    <div className="mb-6">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-green-600 mb-2">
                        You&apos;re All Set! 🎉
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Your account is configured and ready to help you achieve
                        your running goals.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onOpenChange(false);
                        onComplete?.();
                      }}
                      className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
