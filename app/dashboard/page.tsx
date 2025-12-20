import { requireAuth } from '@/lib/auth/server';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TrainingCommandHero } from '@/components/dashboard/TrainingCommandHero';
import { ConsolidatedAnalyticsCard } from '@/components/dashboard/ConsolidatedAnalyticsCard';
import { WeeklyTrainingLoadWidget } from '@/components/dashboard/WeeklyTrainingLoadWidget';

import { WeatherWidgetEnhanced } from '@/components/weather/WeatherWidgetEnhanced';
import { QuickActionsSection } from '@/components/dashboard/QuickActionsSection';
import { DashboardGoalsSection } from '@/components/dashboard/DashboardGoalsSection';
import { StravaOAuthHandler } from '@/components/dashboard/StravaOAuthHandler';
import { DashboardStravaPrompt } from '@/components/dashboard/DashboardStravaPrompt';

import {
  TrainingReadinessSkeleton,
  TrainingLoadSkeleton,
  QuickActionsSkeleton,
  GoalsSkeleton,
} from '@/components/dashboard/DashboardSkeletons';
import {
  TrainingReadinessErrorFallback,
  TrainingLoadErrorFallback,
  QuickActionsErrorFallback,
  GoalsErrorFallback,
} from '@/components/dashboard/DashboardErrorFallbacks';
import {
  WeatherSkeleton,
  WeatherErrorFallback,
} from '@/components/dashboard/WeatherFallbacks';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Suspense } from 'react';

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <DashboardLayout user={user}>
      {/* Handle Strava OAuth callbacks */}
      <StravaOAuthHandler />

      <div className="space-y-6">
        {/* Strava Connection Prompt - Shows if not connected or no activities */}
        <DashboardStravaPrompt />

        {/* SECTION 1: Training Command Hero - "Am I ready to train today?" */}
        <ErrorBoundary fallback={TrainingReadinessErrorFallback}>
          <Suspense fallback={<TrainingReadinessSkeleton />}>
            <TrainingCommandHero userId={user.id} />
          </Suspense>
        </ErrorBoundary>

        {/* Main Content Grid: Left content (2/3) + Right Sidebar (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT COLUMN: Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            {/* SECTION 2: Key Metrics - "What's my current status?" */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Weekly Training Load */}
              <ErrorBoundary fallback={TrainingLoadErrorFallback}>
                <Suspense fallback={<TrainingLoadSkeleton />}>
                  <WeeklyTrainingLoadWidget userId={user.id} />
                </Suspense>
              </ErrorBoundary>

              {/* Consolidated Analytics */}
              <ErrorBoundary fallback={TrainingReadinessErrorFallback}>
                <Suspense fallback={<TrainingReadinessSkeleton />}>
                  <ConsolidatedAnalyticsCard userId={user.id} />
                </Suspense>
              </ErrorBoundary>
            </div>

            {/* SECTION 3: Goals - "What are my objectives?" */}
            <ErrorBoundary fallback={GoalsErrorFallback}>
              <Suspense fallback={<GoalsSkeleton />}>
                <DashboardGoalsSection />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* RIGHT SIDEBAR: Context & Actions (1/3 width) */}
          <div className="flex flex-col gap-4">
            {/* Weather - Contextual information */}
            <ErrorBoundary fallback={WeatherErrorFallback}>
              <Suspense fallback={<WeatherSkeleton />}>
                <WeatherWidgetEnhanced
                  showImpact={true}
                  showLocationPrompt={true}
                  showForecastTabs={false}
                />
              </Suspense>
            </ErrorBoundary>

            {/* Quick Actions - "What should I do next?" */}
            <ErrorBoundary fallback={QuickActionsErrorFallback}>
              <Suspense fallback={<QuickActionsSkeleton />}>
                <QuickActionsSection userId={user.id} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
