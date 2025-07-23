import { requireAuth } from '@/lib/auth/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { TrainingReadinessCard } from '@/components/dashboard/TrainingReadinessCard'
import { WeeklyTrainingLoadWidget } from '@/components/dashboard/WeeklyTrainingLoadWidget'
import { PerformanceInsightsCard } from '@/components/dashboard/PerformanceInsightsCard'
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

export default async function DashboardPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout user={user}>
      {/* Handle Strava OAuth callbacks */}
      <StravaOAuthHandler />
      
      {/* Onboarding Modal for new users */}
      <DashboardOnboardingHandler />
      
      <div className="space-y-4">
        {/* Header - More compact */}
        <div className="pb-2">
          <h1 className="text-2xl font-bold tracking-tight">Training Command Center</h1>
          <p className="text-sm text-muted-foreground">
            Your personalized training insights and recommendations.
          </p>
        </div>

        {/* Primary Training Readiness - Full width for emphasis */}
        <ErrorBoundary fallback={TrainingReadinessErrorFallback}>
          <Suspense fallback={<TrainingReadinessSkeleton />}>
            <TrainingReadinessCard userId={user.id} />
          </Suspense>
        </ErrorBoundary>

        {/* Compact three-column layout for secondary widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Weekly Training Load - Condensed */}
          <ErrorBoundary fallback={TrainingLoadErrorFallback}>
            <Suspense fallback={<TrainingLoadSkeleton />}>
              <WeeklyTrainingLoadWidget userId={user.id} />
            </Suspense>
          </ErrorBoundary>

          {/* Performance Insights - Condensed */}
          <ErrorBoundary fallback={PerformanceInsightsErrorFallback}>
            <Suspense fallback={<PerformanceInsightsSkeleton />}>
              <PerformanceInsightsCard userId={user.id} />
            </Suspense>
          </ErrorBoundary>

          {/* Weather Widget - Condensed */}
          <ErrorBoundary fallback={WeatherErrorFallback}>
            <Suspense fallback={<WeatherSkeleton />}>
              <WeatherWidgetEnhanced 
                showImpact={true} 
                showLocationPrompt={true}
                showForecastTabs={true}
              />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Two-column layout for goals and actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Dynamic Goals Section - More compact */}
          <ErrorBoundary fallback={GoalsErrorFallback}>
            <Suspense fallback={<GoalsSkeleton />}>
              <DashboardGoalsSection />
            </Suspense>
          </ErrorBoundary>

          {/* Quick Actions - More compact */}
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