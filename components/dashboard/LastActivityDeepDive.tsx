'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useUserActivities } from '@/hooks/use-user-activities'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatDistance, formatPace } from '@/lib/utils'
import { useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Timer,
  MapPin,
  Heart,
  Zap,
  TrendingUp,
  Trophy,
  Target,
  Activity as ActivityIcon,
  Clock,
  Mountain,
  ArrowRight
} from 'lucide-react'

interface LastActivityDeepDiveProps {
  userId: string
}

export function LastActivityDeepDive({ userId }: LastActivityDeepDiveProps) {
  const { data: activities, isLoading, error } = useUserActivities(userId)
  const { preferences } = useUnitPreferences()

  const lastActivity = useMemo(() => {
    if (!activities || activities.length === 0) return null
    return activities.sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    )[0]
  }, [activities])

  const activityAnalysis = useMemo(() => {
    if (!lastActivity || !activities) return null

    // Compare with previous activities of same type
    const sameTypeActivities = activities
      .filter(a => a.sport_type === lastActivity.sport_type)
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

    const previousActivity = sameTypeActivities[1] // Second most recent of same type
    const avgDistance = sameTypeActivities.reduce((sum, a) => sum + a.distance, 0) / sameTypeActivities.length

    // Performance analysis
    const currentPace = lastActivity.moving_time / (lastActivity.distance / 1000) // seconds per km
    const paceImprovement = previousActivity ? ((previousActivity.moving_time / (previousActivity.distance / 1000)) - currentPace) : 0
    const distanceImprovement = previousActivity ? (lastActivity.distance - previousActivity.distance) : 0

    // Effort zones (simplified)
    const avgSpeed = lastActivity.distance / lastActivity.moving_time // m/s
    const maxSpeed = lastActivity.max_speed || avgSpeed * 1.5
    const effortLevel = Math.min(100, (avgSpeed / (maxSpeed * 0.8)) * 100)

    return {
      previousActivity,
      avgDistance,
      currentPace,
      paceImprovement,
      distanceImprovement,
      effortLevel,
      isPersonalBest: lastActivity.distance > avgDistance * 1.1,
      totalActivitiesOfType: sameTypeActivities.length
    }
  }, [lastActivity, activities])

  // Helper functions
  const formatDistanceWithUnits = (meters: number): string => {
    return formatDistance(meters, preferences.distance)
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatPaceWithUnits = (secondsPerKm: number): string => {
    return formatPace(secondsPerKm, preferences.pace)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getActivityIcon = (sportType: string) => {
    switch (sportType.toLowerCase()) {
      case 'run': return '🏃‍♂️'
      case 'ride': return '🚴‍♂️'
      case 'swim': return '🏊‍♂️'
      case 'hike': return '🥾'
      case 'walk': return '🚶‍♂️'
      default: return '💪'
    }
  }

  const getActivityColor = (sportType: string): string => {
    switch (sportType.toLowerCase()) {
      case 'run': return 'bg-green-100 text-green-800 border-green-200'
      case 'ride': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'swim': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      case 'hike': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'walk': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Last Activity Deep Dive</CardTitle>
          <CardDescription>Loading your latest activity analysis...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-100 rounded-lg"></div>
            <div className="h-40 bg-gray-100 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !lastActivity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Last Activity Deep Dive</CardTitle>
          <CardDescription>
            {error ? 'Error loading activity data' : 'No activities found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <ActivityIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Connect your Strava account to see detailed activity insights</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{getActivityIcon(lastActivity.sport_type)}</span>
              Last Activity Deep Dive
            </CardTitle>
            <CardDescription>
              Detailed analysis of your most recent workout
            </CardDescription>
          </div>
          <Link href="/dashboard/analytics#activity-feed" scroll={true}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ActivityIcon className="h-4 w-4" />
              View All Activities
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Activity Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{lastActivity.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge className={getActivityColor(lastActivity.sport_type)}>
                    {lastActivity.sport_type}
                  </Badge>
                  {activityAnalysis?.isPersonalBest && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Trophy className="h-3 w-3 mr-1" />
                      Personal Best!
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(lastActivity.start_date)}
                </div>
              </div>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Distance</span>
                </div>
                <div className="text-2xl font-bold">{formatDistanceWithUnits(lastActivity.distance)}</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Duration</span>
                </div>
                <div className="text-2xl font-bold">{formatDuration(lastActivity.moving_time)}</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Avg Pace</span>
                </div>
                <div className="text-2xl font-bold">
                  {activityAnalysis ? formatPaceWithUnits(activityAnalysis.currentPace) : 'N/A'}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Mountain className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Elevation</span>
                </div>
                <div className="text-2xl font-bold">{Math.round(lastActivity.total_elevation_gain || 0)}m</div>
              </div>
            </div>

            {/* Additional Stats */}
            {(lastActivity.average_heartrate || lastActivity.average_watts) && (
              <div className="grid grid-cols-2 gap-4">
                {lastActivity.average_heartrate && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700">Heart Rate</span>
                    </div>
                    <div className="text-xl font-bold text-red-800">
                      {Math.round(lastActivity.average_heartrate)} bpm
                    </div>
                    {lastActivity.max_heartrate && (
                      <div className="text-sm text-red-600">
                        Max: {Math.round(lastActivity.max_heartrate)} bpm
                      </div>
                    )}
                  </div>
                )}

                {lastActivity.average_watts && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-700">Power</span>
                    </div>
                    <div className="text-xl font-bold text-yellow-800">
                      {Math.round(lastActivity.average_watts)}W
                    </div>
                    {lastActivity.max_watts && (
                      <div className="text-sm text-yellow-600">
                        Max: {Math.round(lastActivity.max_watts)}W
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {activityAnalysis && (
              <>
                {/* Performance Comparison */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Performance vs Previous {lastActivity.sport_type}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Distance Change</span>
                        <TrendingUp className={`h-4 w-4 ${activityAnalysis.distanceImprovement >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                      </div>
                      <div className={`text-lg font-bold ${activityAnalysis.distanceImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {activityAnalysis.distanceImprovement >= 0 ? '+' : ''}{formatDistanceWithUnits(activityAnalysis.distanceImprovement)}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Pace Change</span>
                        <TrendingUp className={`h-4 w-4 ${activityAnalysis.paceImprovement >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                      </div>
                      <div className={`text-lg font-bold ${activityAnalysis.paceImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {activityAnalysis.paceImprovement >= 0 ? 'Faster' : 'Slower'} by {Math.abs(activityAnalysis.paceImprovement).toFixed(0)}s/km
                      </div>
                    </div>
                  </div>
                </div>

                {/* Effort Level */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Effort Level</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Estimated Effort</span>
                      <span>{Math.round(activityAnalysis.effortLevel)}%</span>
                    </div>
                    <Progress value={activityAnalysis.effortLevel} className="h-2" />
                    <div className="text-xs text-gray-500">
                      Based on your average speed relative to estimated maximum
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {activityAnalysis && (
              <>
                {/* Activity Insights */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Activity Insights</h4>
                  
                  <div className="grid gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-blue-800">Activity Summary</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        This was your {activityAnalysis.totalActivitiesOfType === 1 ? 'first' : `${activityAnalysis.totalActivitiesOfType}${getOrdinalSuffix(activityAnalysis.totalActivitiesOfType)}`} {lastActivity.sport_type.toLowerCase()} activity.
                        {activityAnalysis.distanceImprovement > 1000 && ' Great distance improvement!'}
                        {activityAnalysis.paceImprovement > 10 && ' Nice pace improvement!'}
                        {activityAnalysis.isPersonalBest && ' This is a new personal best for distance!'}
                      </p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-green-800">Recommendations</span>
                      </div>
                      <ul className="text-sm text-green-700 space-y-1">
                        {activityAnalysis.effortLevel > 80 && (
                          <li>• Consider a recovery day after this high-intensity session</li>
                        )}
                        {activityAnalysis.effortLevel < 50 && (
                          <li>• This was a good recovery/easy pace session</li>
                        )}
                        {activityAnalysis.distanceImprovement > 2000 && (
                          <li>• Great distance increase! Monitor how you feel for recovery</li>
                        )}
                        {lastActivity.total_elevation_gain && lastActivity.total_elevation_gain > 500 && (
                          <li>• Solid elevation gain - great for building strength</li>
                        )}
                        <li>• Keep up the consistent training!</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Recovery Suggestion */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-orange-800">Recovery Time</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    Based on this activity&apos;s intensity, consider waiting{' '}
                    {activityAnalysis.effortLevel > 80 ? '24-48 hours' : 
                     activityAnalysis.effortLevel > 60 ? '12-24 hours' : '6-12 hours'}{' '}
                    before your next high-intensity session.
                  </p>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Helper function for ordinal numbers
function getOrdinalSuffix(num: number): string {
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) return 'st'
  if (j === 2 && k !== 12) return 'nd'
  if (j === 3 && k !== 13) return 'rd'
  return 'th'
} 