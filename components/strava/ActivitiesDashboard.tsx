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
import { useUserActivities } from '@/hooks/use-user-activities'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatDistance, formatStravaDateTime } from '@/lib/utils'
import { Activity } from '@/lib/strava/types'
import { Button } from '@/components/ui/button'

interface ActivitiesDashboardProps {
  userId: string // Changed from accessToken to userId for database queries
}

export function ActivitiesDashboard({ userId }: ActivitiesDashboardProps) {
  // Use database instead of API - much faster and no rate limits!
  const { 
    data: allActivities, 
    isLoading, 
    error,
    refetch,
    isRefetching 
  } = useUserActivities(userId)

  // Client-side filtering to get recent activities (last 10)
  const activities = allActivities?.slice(0, 10) || []

  // Format duration from seconds to readable format
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const { preferences } = useUnitPreferences()
  
  // Format distance from meters to km/miles
  const formatDistanceWithUnits = (meters: number): string => {
    return formatDistance(meters, preferences.distance)
  }

  // Format speed from m/s to km/h or mph
  const formatSpeed = (metersPerSecond: number): string => {
    const kmh = metersPerSecond * 3.6
    if (preferences.distance === 'miles') {
      const mph = kmh * 0.621371
      return `${mph.toFixed(1)} mph`
    }
    return `${kmh.toFixed(1)} km/h`
  }

  // Format date to readable format using proper timezone handling
  const formatDate = (dateString: string, timezone?: string): string => {
    return formatStravaDateTime(dateString, timezone)
  }

  // Get activity type color - handle both sport_type and activity_type
  const getActivityTypeColor = (activity: Activity): string => {
    const type = (activity.sport_type || activity.activity_type || '').toLowerCase()
    switch (type) {
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
            Loading your latest activities from database...
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
            Unable to load your activities from database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load activities from database'}
            </AlertDescription>
          </Alert>
          <div className="mt-4 space-y-2">
            <Button 
              variant="outline" 
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
            <p className="text-sm text-blue-600">
              💡 Try syncing your Strava data to populate the database.
            </p>
          </div>
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
            Your latest activities from database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ActivityIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <div className="space-y-2">
              <p className="text-gray-500">
                No activities found in your database.
              </p>
              <p className="text-sm text-blue-600">
                💡 Click &quot;Sync Strava Data&quot; to load your activities from Strava.
              </p>
            </div>
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
              Your latest {activities.length} activities from database
            </CardDescription>
            <div className="text-xs text-green-600 mt-1">
              📊 Database source ({allActivities?.length || 0} total activities)
            </div>
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
          {activities.map((activity) => {
            const activityType = activity.sport_type || activity.activity_type || 'Activity'
            
            return (
              <div key={activity.strava_activity_id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="secondary" className={getActivityTypeColor(activity)}>
                        {activityType}
                      </Badge>
                      <h3 className="font-semibold text-lg truncate">{activity.name}</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {/* Distance */}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{formatDistanceWithUnits(activity.distance)}</span>
                      </div>
                      
                      {/* Duration */}
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-gray-500" />
                        <span>{formatDuration(activity.moving_time)}</span>
                      </div>
                      
                      {/* Heart Rate */}
                      {activity.average_heartrate && (
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span>{Math.round(activity.average_heartrate)} bpm</span>
                        </div>
                      )}
                      
                      {/* Power */}
                      {activity.average_watts && (
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span>{Math.round(activity.average_watts)}w</span>
                        </div>
                      )}
                      
                      {/* Speed */}
                      {activity.average_speed && (
                        <div className="flex items-center gap-2">
                          <ActivityIcon className="h-4 w-4 text-blue-500" />
                          <span>{formatSpeed(activity.average_speed)}</span>
                        </div>
                      )}
                      
                      {/* Elevation */}
                      {activity.total_elevation_gain && activity.total_elevation_gain > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">↗</span>
                          <span>{activity.total_elevation_gain}m</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-gray-500 ml-4">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(activity.start_date_local)}</span>
                    </div>
                    {activity.kudos_count && activity.kudos_count > 0 && (
                      <div className="text-xs">❤️ {activity.kudos_count}</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 