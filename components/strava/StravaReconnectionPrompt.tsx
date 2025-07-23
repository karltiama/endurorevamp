'use client'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getStravaAuthUrl } from '@/lib/strava'
import { Link2, RefreshCw, AlertCircle, Info } from 'lucide-react'

interface StravaReconnectionPromptProps {
  error?: string | null
  onRefresh?: () => Promise<void>
  title?: string
  className?: string
}

export function StravaReconnectionPrompt({ 
  error, 
  onRefresh, 
  title = "Strava Connection Issue",
  className = ""
}: StravaReconnectionPromptProps) {
  const handleReconnect = () => {
    const authUrl = getStravaAuthUrl(window.location.origin)
    window.location.href = authUrl
  }

  const handleRefresh = async () => {
    if (!onRefresh) {
      handleReconnect()
      return
    }

    try {
      await onRefresh()
    } catch (err) {
      console.error('Failed to refresh token:', err)
      // If refresh fails, redirect to full OAuth flow
      handleReconnect()
    }
  }

  // Determine the type of error and show appropriate messaging
  const isTokenExpired = error?.includes('expired') || error?.includes('401') || error?.includes('invalid')
  const isNetworkError = error?.includes('network') || error?.includes('fetch')
  
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 text-center ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="flex-shrink-0">
          <AlertCircle className="h-6 w-6 text-orange-500" />
        </div>
        <div className="space-y-4 max-w-md">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isTokenExpired ? 'Strava Connection Expired' : title}
            </h3>
            
            {isTokenExpired ? (
              <div className="space-y-3">
                <p className="text-gray-600">
                  Your Strava connection has expired. This is normal and happens periodically for security reasons.
                </p>
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Quick fix:</strong> Click &quot;Reconnect to Strava&quot; below to restore access to your activities and continue viewing your data.
                  </AlertDescription>
                </Alert>
              </div>
            ) : isNetworkError ? (
              <div className="space-y-3">
                <p className="text-gray-600">
                  There&apos;s a temporary connection issue with Strava. This usually resolves itself quickly.
                </p>
                <Alert className="bg-yellow-50 border-yellow-200">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Try refreshing your connection first, or reconnect if the issue persists.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-600">
                  Unable to connect to Strava. This might be due to an expired connection or configuration issue.
                </p>
                {error && (
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded border">
                    <strong>Error details:</strong> {error}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRefresh && (isNetworkError || !isTokenExpired) && (
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Connection
              </Button>
            )}
            
            <Button
              onClick={handleReconnect}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
            >
              <Link2 className="h-4 w-4" />
              {isTokenExpired ? 'Reconnect to Strava' : 'Connect to Strava'}
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            <p className="font-medium mb-1">After reconnecting, you&apos;ll be able to:</p>
            <ul className="space-y-1 text-xs ml-4">
              <li>• View your recent activity data and analytics</li>
              <li>• Sync new activities automatically</li>
              <li>• Access detailed performance metrics</li>
              <li>• Track your training progress over time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 