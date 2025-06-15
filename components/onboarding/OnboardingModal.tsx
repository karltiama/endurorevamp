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

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function OnboardingModal({ 
  open, 
  onOpenChange, 
  onComplete 
}: OnboardingModalProps) {
  const { user } = useAuth();
  const { onboarding, currentStep, hasCompletedOnboarding } = useOnboardingStatus();
  const [internalStep, setInternalStep] = useState<string>('goals');

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

  const handleStepComplete = (step: string) => {
    console.log(`Step completed: ${step}`);
    
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
      title: 'You\'re All Set!',
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold">
            Welcome to Your Running Journey! 🏃‍♂️
          </DialogTitle>
          <DialogDescription className="text-lg">
            Let&apos;s set up your account to help you achieve your running goals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Progress indicator */}
          <OnboardingProgress steps={steps} currentStep={internalStep} />

          {/* Step content */}
          <div className="min-h-[400px]">
            {internalStep === 'goals' && (
              <GoalsSelectionStep onComplete={() => handleStepComplete('goals')} />
            )}
            
            {internalStep === 'strava' && (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-4">
                  Connect Your Strava Account
                </h3>
                <p className="text-muted-foreground mb-6">
                  Connect Strava to automatically sync your runs and track your progress toward your goals.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      // This will integrate with your existing Strava OAuth flow
                      window.location.href = '/api/auth/strava';
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
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-green-600 mb-2">
                    You&apos;re All Set! 🎉
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Your account is configured and ready to help you achieve your running goals.
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 