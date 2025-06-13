import { requireAuth } from '@/lib/auth/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import ZoneAnalysisDashboard from '@/components/training/ZoneAnalysisDashboard'
import { Suspense } from 'react'

export default async function TrainingPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Load</h1>
          <p className="text-muted-foreground">
            Analyze your training zones and load distribution.
          </p>
        </div>

        {/* Zone Analysis Section */}
        <Suspense fallback={<ZoneAnalysisSkeleton />}>
          <ZoneAnalysisDashboard />
        </Suspense>

        {/* Future training load components would go here */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Coming Soon</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Training Stress Score (TSS) analysis</li>
            <li>• Chronic Training Load (CTL) tracking</li>
            <li>• Acute Training Load (ATL) monitoring</li>
            <li>• Training Load Balance insights</li>
            <li>• Recovery recommendations</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}

function ZoneAnalysisSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="h-64 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  )
} 