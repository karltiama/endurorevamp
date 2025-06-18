import { requireAuth } from '@/lib/auth/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { StravaConnectionStatus } from '@/components/strava/StravaConnectionStatus'
import SyncDashboard from '@/components/dashboard/SyncDashboard'
import LogoutButton from '@/components/LogoutButton'
import UnitPreferences from '@/components/settings/UnitPreferences'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd className="mt-1 text-sm">{user.email || 'No email'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">User ID</dt>
                <dd className="mt-1 text-sm font-mono text-xs">{user.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created At</dt>
                <dd className="mt-1 text-sm">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Provider</dt>
                <dd className="mt-1 text-sm">
                  {user.app_metadata?.provider || 'email'}
                </dd>
              </div>
            </dl>
            
            <div className="mt-6">
              <LogoutButton />
            </div>
          </CardContent>
        </Card>

        {/* Unit Preferences Section */}
        <Suspense fallback={<UnitPreferencesSkeleton />}>
          <UnitPreferences />
        </Suspense>

        {/* Strava Connection Section */}
        <Suspense fallback={<IntegrationSkeleton />}>
          <StravaConnectionStatus />
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
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UnitPreferencesSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SyncSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 