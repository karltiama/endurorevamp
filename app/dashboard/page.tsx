import { requireAuth } from '@/lib/auth/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { KeyMetrics } from '@/components/dashboard/KeyMetrics'
import { LastActivityDeepDive } from '@/components/dashboard/LastActivityDeepDive'
import { StravaOAuthHandler } from '@/components/dashboard/StravaOAuthHandler'
import SyncDashboard from '@/components/dashboard/SyncDashboard'
import { DatabaseActivityChecker } from '@/components/debug/DatabaseActivityChecker'
import { SyncDebugger } from '@/components/debug/SyncDebugger'
import { DetailedSyncDebugger } from '@/components/debug/DetailedSyncDebugger'
import { Suspense } from 'react'

export default async function DashboardPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout user={user}>
      {/* Handle Strava OAuth callbacks */}
      <StravaOAuthHandler />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your training activity.
          </p>
        </div>

        {/* Key Metrics Section */}
        <Suspense fallback={<KeyMetricsSkeleton />}>
          <KeyMetrics userId={user.id} />
        </Suspense>

        {/* Last Activity Deep Dive Section */}
        <Suspense fallback={<LastActivitySkeleton />}>
          <LastActivityDeepDive userId={user.id} />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}

// Skeleton components

function KeyMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </div>
            <div className="mt-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LastActivitySkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="h-40 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  )
} 