import { requireAuth } from '@/lib/auth/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { TrainingReadinessCard } from '@/components/dashboard/TrainingReadinessCard'
import { WeeklyTrainingLoadWidget } from '@/components/dashboard/WeeklyTrainingLoadWidget'
import { PerformanceInsightsCard } from '@/components/dashboard/PerformanceInsightsCard'
import { ActivityFrequencyWidgetClient } from '@/components/dashboard/ActivityFrequencyWidgetClient'
import { WeatherWidgetEnhanced } from '@/components/weather/WeatherWidgetEnhanced'
import { QuickActionsSection } from '@/components/dashboard/QuickActionsSection'
import { DashboardOnboardingHandler } from '@/components/dashboard/DashboardOnboardingHandler'
import { DashboardGoalsSection } from '@/components/dashboard/DashboardGoalsSection'
import { StravaOAuthHandler } from '@/components/dashboard/StravaOAuthHandler'
import { 
  TrainingReadinessSkeleton,
  TrainingLoadSkeleton,
  PerformanceInsightsSkeleton,
  QuickActionsSkeleton,
  GoalsSkeleton
} from '@/components/dashboard/DashboardSkeletons'
import { 
  TrainingReadinessErrorFallback,
  TrainingLoadErrorFallback,
  PerformanceInsightsErrorFallback,
  QuickActionsErrorFallback,
  GoalsErrorFallback
} from '@/components/dashboard/DashboardErrorFallbacks'
import { WeatherSkeleton, WeatherErrorFallback } from '@/components/dashboard/WeatherFallbacks'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Suspense } from "react"
import ActivityFrequencyErrorFallback from '@/components/dashboard/ActivityFrequencyErrorFallback'

export default async function DashboardPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout user={user}>
      {/* Handle Strava OAuth callbacks */}
      <StravaOAuthHandler />
      
      {/* Onboarding Modal for new users */}
      <DashboardOnboardingHandler />
      
      <div className="space-y-6">
        {/* Header - More compact */}
        <div className="pb-2">
          <h1 className="text-2xl font-bold tracking-tight">Training Command Center</h1>
          <p className="text-sm text-muted-foreground">
            What should you do today? Your personalized training insights.
          </p>
        </div>

        {/* Primary Training Readiness - Full width for emphasis */}
        <ErrorBoundary fallback={TrainingReadinessErrorFallback}>
          <Suspense fallback={<TrainingReadinessSkeleton />}>
            <TrainingReadinessCard userId={user.id} />
          </Suspense>
        </ErrorBoundary>

        {/* Simplified three-column layout for quick status check */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Weekly Progress - Simplified */}
          <div className="flex flex-col h-full min-h-[200px]">
            <ErrorBoundary fallback={TrainingLoadErrorFallback}>
              <Suspense fallback={<TrainingLoadSkeleton />}> 
                <WeeklyTrainingLoadWidget userId={user.id} />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Performance Status - Simplified */}
          <div className="flex flex-col h-full min-h-[200px]">
            <ErrorBoundary fallback={PerformanceInsightsErrorFallback}>
              <Suspense fallback={<PerformanceInsightsSkeleton />}> 
                <PerformanceInsightsCard userId={user.id} />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Weather Conditions - Simplified */}
          <div className="flex flex-col h-full min-h-[200px]">
            <ErrorBoundary fallback={WeatherErrorFallback}>
              <Suspense fallback={<WeatherSkeleton />}> 
                <WeatherWidgetEnhanced 
                  showImpact={true} 
                  showLocationPrompt={true}
                  showForecastTabs={false}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>

        {/* Activity Frequency - Simplified and more scannable */}
        <ErrorBoundary fallback={ActivityFrequencyErrorFallback}>
          <Suspense fallback={<div className="animate-pulse bg-white rounded-lg shadow p-6"><div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div><div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div></div>}>
            <ActivityFrequencyWidgetClient userId={user.id} />
          </Suspense>
        </ErrorBoundary>

        {/* Goals and Actions - Combined in single row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Dynamic Goals Section */}
          <ErrorBoundary fallback={GoalsErrorFallback}>
            <Suspense fallback={<GoalsSkeleton />}>
              <DashboardGoalsSection />
            </Suspense>
          </ErrorBoundary>

          {/* Quick Actions */}
          <ErrorBoundary fallback={QuickActionsErrorFallback}>
            <Suspense fallback={<QuickActionsSkeleton />}>
              <QuickActionsSection userId={user.id} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </DashboardLayout>
  )
} 