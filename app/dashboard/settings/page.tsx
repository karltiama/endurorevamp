import { requireAuth } from '@/lib/auth/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { StravaIntegrationWithActivities } from '@/components/strava/StravaIntegration'
import SyncDashboard from '@/components/dashboard/SyncDashboard'
import LogoutButton from '@/components/LogoutButton'
import { Suspense } from 'react'

export default async function SettingsPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and integrations.
          </p>
        </div>

        {/* User Information Section */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              User Information
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email || 'No email'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Provider</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.app_metadata?.provider || 'email'}
                </dd>
              </div>
            </dl>
            
            <div className="mt-6">
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Strava Integration Section */}
        <Suspense fallback={<IntegrationSkeleton />}>
          <StravaIntegrationWithActivities />
        </Suspense>

        {/* Sync Dashboard Section */}
        <Suspense fallback={<SyncSkeleton />}>
          <SyncDashboard />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}

function IntegrationSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  )
}

function SyncSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  )
} 