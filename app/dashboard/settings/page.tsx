import { requireAuth } from '@/lib/auth/server'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { StravaConnectionStatus } from '@/components/strava/StravaConnectionStatus'
import SyncDashboard from '@/components/dashboard/SyncDashboard'
import UnitPreferences from '@/components/settings/UnitPreferences'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Suspense } from 'react'
import Link from 'next/link'
import { User, Settings2, MapPin } from 'lucide-react'

export default async function SettingsPage() {
  const user = await requireAuth()

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header with User Info */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account settings and integrations.
            </p>
          </div>
          
          {/* User Info Section */}
          <div className="text-right space-y-1">
            <div className="text-sm">
              <span className="font-medium">{user.email || 'No email'}</span>
              <span className="text-muted-foreground ml-2">•</span>
              <span className="text-muted-foreground ml-2 text-xs">
                {user.app_metadata?.provider || 'email'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Member since {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
        </div>

        {/* Main Content Grid - More compact layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Strava Integration */}
          <div className="xl:col-span-2 space-y-6">
            {/* Strava Connection and Sync - Side by side on larger screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<IntegrationSkeleton />}>
                <StravaConnectionStatus />
              </Suspense>

              <Suspense fallback={<SyncSkeleton />}>
                <SyncDashboard />
              </Suspense>
            </div>

            {/* Training Profile and Location Settings - Side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Training Profile Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Training Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Manage your training thresholds, targets, and preferences.
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>• Personalized TSS targets based on experience</div>
                    <div>• Heart rate and power threshold estimation</div>
                    <div>• Training zone generation</div>
                  </div>
                  <Link href="/dashboard/settings/profile">
                    <Button size="sm" className="w-full">
                      <Settings2 className="h-3 w-3 mr-2" />
                      Manage Training Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Location Settings Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Manage location preferences for weather data and recommendations.
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>• Save multiple locations (Home, Work, Gym)</div>
                    <div>• GPS location with permission controls</div>
                    <div>• Privacy-focused data handling</div>
                  </div>
                  <Link href="/dashboard/settings/location">
                    <Button size="sm" className="w-full">
                      <MapPin className="h-3 w-3 mr-2" />
                      Manage Location Settings
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Unit Preferences */}
          <div className="xl:col-span-1">
            <Suspense fallback={<UnitPreferencesSkeleton />}>
              <UnitPreferences />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function IntegrationSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-6 bg-muted rounded w-1/3"></div>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </CardContent>
    </Card>
  )
}

function UnitPreferencesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-6 bg-muted rounded w-1/3"></div>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </CardContent>
    </Card>
  )
}

function SyncSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-6 bg-muted rounded w-1/3"></div>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </CardContent>
    </Card>
  )
} 