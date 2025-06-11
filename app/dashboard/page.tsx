import { requireAuth } from '@/lib/auth/server'
import LogoutButton from '@/components/LogoutButton'
import { StravaIntegrationWithActivities } from '@/components/strava/StravaIntegration'
import SyncDashboard from '@/components/dashboard/SyncDashboard'
import ZoneAnalysisDashboard from '@/components/training/ZoneAnalysisDashboard'
import { KeyMetrics } from '@/components/dashboard/KeyMetrics'
import { Suspense } from 'react'

export default async function DashboardPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Welcome to your Dashboard!
            </h1>
            
            {/* Key Metrics Section */}
            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
            }>
              <KeyMetrics userId={user.id} />
            </Suspense>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  User Information
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created At</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(user.created_at!).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Provider</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.app_metadata.provider || 'email'}
                    </dd>
                  </div>
                </dl>
                
                <div className="mt-6">
                  <LogoutButton />
                </div>
              </div>
            </div>
            
            {/* Strava Integration Section */}
            <div className="mt-8">
              <Suspense fallback={
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              }>
                <StravaIntegrationWithActivities />
              </Suspense>
            </div>

            {/* Sync Dashboard Section */}
            <div className="mt-8">
              <Suspense fallback={
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              }>
                <SyncDashboard />
              </Suspense>
            </div>

            {/* Zone Analysis Dashboard Section */}
            <div className="mt-8">
              <Suspense fallback={
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              }>
                <ZoneAnalysisDashboard />
              </Suspense>
            </div>
            
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-blue-900 mb-2">Next Steps</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Set up your training goals</li>
                <li>• Import your activity history</li>
                <li>• Explore training insights</li>
                <li>• Analyze your heart rate zones</li>
                <li>• Plan zone-based workouts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 