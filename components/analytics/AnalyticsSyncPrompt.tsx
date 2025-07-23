'use client'

import { useUserActivities } from '@/hooks/use-user-activities'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Settings, Activity, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useStravaToken } from '@/hooks/strava/useStravaToken'
import { getStravaAuthUrl } from '@/lib/strava'

interface AnalyticsSyncPromptProps {
  userId: string
}

export function AnalyticsSyncPrompt({ userId }: AnalyticsSyncPromptProps) {
  const { data: activities, isLoading } = useUserActivities(userId)
  const { refreshToken } = useStravaToken()

  // Don't show anything while loading or if there are activities
  if (isLoading || (activities && activities.length > 0)) {
    return null
  }

  return (
    <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <Activity className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <strong>No Activities Found</strong> - To see your activity analytics, you need to sync your activities from Strava. 
            Don&apos;t see your most recent activities? Make sure to sync in your settings.
          </div>
          <div className="flex gap-2 ml-4">
            <Link href="/dashboard/settings">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Settings className="h-3 w-3 mr-1" />
                Go to Settings
              </Button>
            </Link>
            <Button 
              size="sm"
              variant="outline" 
              onClick={async () => {
                try {
                  await refreshToken()
                } catch (error) {
                  console.error('Failed to refresh token:', error)
                  const authUrl = getStravaAuthUrl(window.location.origin)
                  window.location.href = authUrl
                }
              }}
              className="text-blue-600 border-blue-200 hover:bg-blue-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reconnect
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
} 