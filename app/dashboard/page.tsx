import { requireAuth } from '@/lib/auth/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { TrainingReadinessCard } from '@/components/dashboard/TrainingReadinessCard'
import { WeeklyTrainingLoadWidget } from '@/components/dashboard/WeeklyTrainingLoadWidget'
import { PerformanceInsightsCard } from '@/components/dashboard/PerformanceInsightsCard'
import { QuickActionsSection } from '@/components/dashboard/QuickActionsSection'
import { DashboardOnboardingHandler } from '@/components/dashboard/DashboardOnboardingHandler'

import { StravaOAuthHandler } from '@/components/dashboard/StravaOAuthHandler'
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
        <Suspense fallback={<TrainingReadinessSkeleton />}>
          <TrainingReadinessCard userId={user.id} />
        </Suspense>

        {/* Two-column layout for secondary widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Training Load */}
          <Suspense fallback={<TrainingLoadSkeleton />}>
            <WeeklyTrainingLoadWidget userId={user.id} />
          </Suspense>

          {/* Performance Insights */}
          <Suspense fallback={<PerformanceInsightsSkeleton />}>
            <PerformanceInsightsCard userId={user.id} />
          </Suspense>
        </div>

        {/* Enhanced Goals Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Training Goals</h2>
          <p className="text-gray-600 text-sm mb-4">
            Your goal widgets will appear here. Visit the{' '}
            <a href="/dashboard/goals" className="text-blue-600 hover:underline">
              Goals page
            </a>{' '}
            to set up and manage your training objectives.
          </p>
          <div className="flex items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">No dashboard goals configured yet</p>
          </div>
        </div>

        {/* Quick Actions */}
        <Suspense fallback={<QuickActionsSkeleton />}>
          <QuickActionsSection userId={user.id} />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}

// Skeleton components

function TrainingReadinessSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-100 rounded-lg mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  )
}

function TrainingLoadSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded-lg mb-4"></div>
        <div className="h-16 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  )
}

function PerformanceInsightsSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="h-16 bg-gray-100 rounded-lg"></div>
          <div className="h-16 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="h-12 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  )
}

function QuickActionsSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  )
} 