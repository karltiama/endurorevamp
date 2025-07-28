import { requireAuth } from '@/lib/auth/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
// Removed unused import
import { PersonalBestsClient } from '@/components/analytics/PersonalBestsClient'
import { HistoricalTrendsClient } from '@/components/analytics/HistoricalTrendsClient'
import { HashScrollHandler } from '@/components/HashScrollHandler'
import { Suspense } from 'react'
import { AnalyticsSyncPrompt } from '@/components/analytics/AnalyticsSyncPrompt'

export default async function AnalyticsPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout user={user}>
      <HashScrollHandler />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into your training performance and achievements.
          </p>
        </div>

        {/* Sync Prompt - Shows when no activities */}
        <Suspense fallback={null}>
          <AnalyticsSyncPrompt userId={user.id} />
        </Suspense>

        {/* Historical Trends Section */}
        <div id="historical-trends" className="scroll-mt-20">
          <Suspense fallback={<HistoricalTrendsSkeleton />}>
            <HistoricalTrendsClient userId={user.id} />
          </Suspense>
        </div>

        {/* Personal Bests Section */}
        <div id="personal-bests" className="scroll-mt-20">
          <Suspense fallback={<PersonalBestsSkeleton />}>
            <PersonalBestsClient userId={user.id} />
          </Suspense>
        </div>



        {/* Activity Feed Section */}
        {/* Removed: Activity Feed is now on its own page */}
      </div>
    </DashboardLayout>
  )
}

function PersonalBestsSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-20 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-32 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HistoricalTrendsSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="flex gap-4 mb-6">
          <div className="h-8 bg-gray-200 rounded w-32"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
          <div className="h-8 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="h-80 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  )
}



// Removed unused function 