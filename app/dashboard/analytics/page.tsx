import { requireAuth } from '@/lib/auth/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ActivityChartsClient } from '@/components/dashboard/ActivityChartsClient'
import { ActivityFeedClient } from '../../../components/analytics/ActivityFeedClient'
import { HashScrollHandler } from '@/components/HashScrollHandler'
import { Suspense } from 'react'

export default async function AnalyticsPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout user={user}>
      <HashScrollHandler />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Analysis</h1>
          <p className="text-muted-foreground">
            Detailed insights and analytics about your training activities.
          </p>
        </div>

        {/* Activity Charts Section */}
        <Suspense fallback={<ActivityChartsSkeleton />}>
          <ActivityChartsClient userId={user.id} />
        </Suspense>

        {/* Activity Feed Section */}
        <div id="activity-feed" className="bg-white rounded-lg shadow p-6 scroll-mt-20">
          <Suspense fallback={<ActivityFeedSkeletonFallback />}>
            <ActivityFeedClient userId={user.id} />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  )
}

function ActivityChartsSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="h-[400px] bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  )
}

function ActivityFeedSkeletonFallback() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 mb-3">
            <div className="flex justify-between">
              <div className="flex space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 