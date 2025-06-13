import { requireAuth } from '@/lib/auth/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ActivityChartsClient } from '@/components/dashboard/ActivityChartsClient'
import { Suspense } from 'react'

export default async function AnalyticsPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout user={user}>
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