'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Calendar, 
  Timer, 
  Activity as ActivityIcon, 
  MapPin, 
  Heart, 
  Zap,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useRecentActivities } from '@/hooks/use-athlete-activities'
import { StravaActivity } from '@/types/strava'
import { Button } from '@/components/ui/button'

interface ActivitiesDashboardProps {
  accessToken: string
}

export function ActivitiesDashboard({ accessToken }: ActivitiesDashboardProps) {
  const { 
    data: activities, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useRecentActivities(accessToken, 10)

  // Format duration from seconds to readable format
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Format distance from meters to km/miles
  const formatDistance = (meters: number): string => {
    const km = meters / 1000
    return `${km.toFixed(1)} km`
  }

  // Format speed from m/s to km/h
  const formatSpeed = (metersPerSecond: number): string => {
    const kmh = metersPerSecond * 3.6
    return `${kmh.toFixed(1)} km/h`
  }

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get activity type color
  const getActivityTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'ride':
      case 'virtualride':
        return 'bg-blue-100 text-blue-800'
      case 'run':
        return 'bg-green-100 text-green-800'
      case 'swim':
        return 'bg-cyan-100 text-cyan-800'
      case 'hike':
        return 'bg-orange-100 text-orange-800'
      case 'walk':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Recent Activities
          </CardTitle>
          <CardDescription>
            Loading your latest activities from Strava...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Recent Activities
          </CardTitle>
          <CardDescription>
            Unable to load your activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load activities'}
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Recent Activities
          </CardTitle>
          <CardDescription>
            Your latest activities from Strava
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ActivityIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-500">
              Start recording activities on Strava to see them here!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Success state with activities
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="h-5 w-5" />
              Recent Activities
            </CardTitle>
            <CardDescription>
              Your latest {activities.length} activities from Strava
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity: StravaActivity) => (
            <div 
              key={activity.id} 
              className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Activity Type Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <ActivityIcon className="h-6 w-6 text-orange-600" />
                </div>
              </div>

              {/* Activity Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {activity.name}
                  </h4>
                  <Badge className={getActivityTypeColor(activity.type)}>
                    {activity.type}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(activity.start_date_local)}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {formatDistance(activity.distance)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {formatDuration(activity.moving_time)}
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="flex-shrink-0 text-right">
                <div className="text-sm text-gray-900 font-medium">
                  {formatSpeed(activity.average_speed)}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  {activity.average_heartrate && (
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {Math.round(activity.average_heartrate)}
                    </div>
                  )}
                  {activity.average_watts && (
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {Math.round(activity.average_watts)}W
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 