import { requireAuth } from '@/lib/auth/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { TrainingReadinessCard } from '@/components/dashboard/TrainingReadinessCard'
import { WeeklyTrainingLoadWidget } from '@/components/dashboard/WeeklyTrainingLoadWidget'
import { PerformanceInsightsCard } from '@/components/dashboard/PerformanceInsightsCard'
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
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Suspense } from 'react'

export default async function DashboardPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout user={user}>
      {/* Handle Strava OAuth callbacks */}
      <StravaOAuthHandler />
      
      {/* Onboarding Modal for new users */}
      <DashboardOnboardingHandler />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Command Center</h1>
          <p className="text-muted-foreground">
            What should I do today? Your personalized training insights and recommendations.
          </p>
        </div>

        {/* Primary Training Readiness Widget */}
        <ErrorBoundary fallback={TrainingReadinessErrorFallback}>
          <Suspense fallback={<TrainingReadinessSkeleton />}>
            <TrainingReadinessCard userId={user.id} />
          </Suspense>
        </ErrorBoundary>

        {/* Two-column layout for secondary widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Training Load */}
          <ErrorBoundary fallback={TrainingLoadErrorFallback}>
            <Suspense fallback={<TrainingLoadSkeleton />}>
              <WeeklyTrainingLoadWidget userId={user.id} />
            </Suspense>
          </ErrorBoundary>

          {/* Performance Insights */}
          <ErrorBoundary fallback={PerformanceInsightsErrorFallback}>
            <Suspense fallback={<PerformanceInsightsSkeleton />}>
              <PerformanceInsightsCard userId={user.id} />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Dynamic Goals Section */}
        <ErrorBoundary fallback={GoalsErrorFallback}>
          <Suspense fallback={<GoalsSkeleton />}>
            <DashboardGoalsSection userId={user.id} />
          </Suspense>
        </ErrorBoundary>

        {/* Quick Actions */}
        <ErrorBoundary fallback={QuickActionsErrorFallback}>
          <Suspense fallback={<QuickActionsSkeleton />}>
            <QuickActionsSection userId={user.id} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </DashboardLayout>
  )
} 