'use client';

import { useState, useEffect } from 'react';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { useOnboardingStatus, useUserGoals } from '@/hooks/useGoals';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Dashboard component that automatically shows onboarding modal for new users
 */
export function DashboardOnboardingHandler() {
  const { user } = useAuth();
  const { onboarding, hasCompletedOnboarding, isLoading: onboardingLoading } = useOnboardingStatus();
  const { data: goalsData, isLoading: goalsLoading } = useUserGoals();
  const [showModal, setShowModal] = useState(false);

  // Extract additional data from goals response
  const existingGoals = goalsData?.goals || [];
  const userStats = goalsData?.userStats || { activityCount: 0, hasStravaConnection: false };
  const isLoading = onboardingLoading || goalsLoading;

  useEffect(() => {
    if (user && !isLoading) {
      // Comprehensive check for new vs existing users
      const hasAnyContent = 
        existingGoals.length > 0 || 
        userStats.activityCount > 0 || 
        userStats.hasStravaConnection;

      // User needs onboarding if:
      // 1. They haven't completed onboarding AND
      // 2. They don't have any existing content (goals, activities, or Strava connection)
      const needsOnboarding = !hasCompletedOnboarding && !hasAnyContent;
      
      if (needsOnboarding) {
        console.log('🎯 New user detected, showing onboarding modal', {
          hasOnboardingRecord: !!onboarding,
          isCompleted: hasCompletedOnboarding,
          existingGoalsCount: existingGoals.length,
          activityCount: userStats.activityCount,
          hasStravaConnection: userStats.hasStravaConnection,
          hasAnyContent,
          needsOnboarding
        });
        setShowModal(true);
      } else {
        console.log('👤 Existing user detected, skipping onboarding', {
          hasOnboardingRecord: !!onboarding,
          isCompleted: hasCompletedOnboarding,
          existingGoalsCount: existingGoals.length,
          activityCount: userStats.activityCount,
          hasStravaConnection: userStats.hasStravaConnection,
          hasAnyContent,
          needsOnboarding
        });
      }
    }
  }, [user, isLoading, onboarding, hasCompletedOnboarding, existingGoals.length, userStats.activityCount, userStats.hasStravaConnection]);

  const handleComplete = () => {
    console.log('✅ Onboarding completed successfully');
    setShowModal(false);
  };

  const handleOpenChange = (open: boolean) => {
    setShowModal(open);
  };

  // Don't render anything if user is not authenticated or still loading
  if (!user || isLoading) {
    return null;
  }

  return (
    <OnboardingModal 
      open={showModal}
      onOpenChange={handleOpenChange}
      onComplete={handleComplete}
    />
  );
} 