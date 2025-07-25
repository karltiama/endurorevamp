'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity } from '@/lib/strava/types'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { convertDistance, formatDuration, getDistanceUnit } from '@/lib/utils'
import { Trophy, TrendingUp, Clock, Zap, Heart, Mountain } from 'lucide-react'

interface PersonalBestsProps {
  activities: Activity[]
}

interface PersonalBest {
  value: number
  activity: Activity
  date: string
  metric: string
  unit: string
}

export function PersonalBests({ activities }: PersonalBestsProps) {
  const { preferences } = useUnitPreferences()

  const personalBests = useMemo(() => {
    if (!activities || activities.length === 0) return {}

    const pbs: Record<string, PersonalBest[]> = {
      distance: [],
      pace: [],
      speed: [],
      duration: [],
      elevation: [],
      heartRate: [],
      power: []
    }

    // Filter out activities without proper data
    const validActivities = activities.filter(activity => 
      activity.distance > 0 && activity.moving_time > 0
    )

    if (validActivities.length === 0) return pbs

    // Distance PBs (by activity type)
    const distanceByType = validActivities.reduce((acc, activity) => {
      if (!acc[activity.sport_type]) {
        acc[activity.sport_type] = []
      }
      acc[activity.sport_type].push({
        value: activity.distance,
        activity,
        date: activity.start_date,
        metric: 'Longest Distance',
        unit: getDistanceUnit(preferences.distance)
      })
      return acc
    }, {} as Record<string, PersonalBest[]>)

    // Get the longest distance for each sport type
    Object.entries(distanceByType).forEach(([, activities]) => {
      const longest = activities.reduce((max, current) => 
        current.value > max.value ? current : max
      )
      pbs.distance.push(longest)
    })

    // Pace PBs (fastest pace for each sport type)
    const paceByType = validActivities.reduce((acc, activity) => {
      if (!acc[activity.sport_type]) {
        acc[activity.sport_type] = []
      }
      if (activity.average_speed && activity.average_speed > 0) {
        const paceSecondsPerKm = 1000 / activity.average_speed // Convert m/s to seconds per km
        acc[activity.sport_type].push({
          value: paceSecondsPerKm,
          activity,
          date: activity.start_date,
          metric: 'Fastest Average Pace',
          unit: 'min/km'
        })
      }
      return acc
    }, {} as Record<string, PersonalBest[]>)

    Object.entries(paceByType).forEach(([, activities]) => {
      if (activities.length > 0) {
        const fastest = activities.reduce((min, current) => 
          current.value < min.value ? current : min
        )
        pbs.pace.push(fastest)
      }
    })

    // Speed PBs (max speed)
    const speedActivities = validActivities.filter(activity => 
      activity.max_speed && activity.max_speed > 0
    )
    if (speedActivities.length > 0) {
      const maxSpeed = speedActivities.reduce((max, activity) => 
        activity.max_speed! > max.max_speed! ? activity : max
      )
      pbs.speed.push({
        value: maxSpeed.max_speed!,
        activity: maxSpeed,
        date: maxSpeed.start_date,
        metric: 'Max Speed',
        unit: 'm/s'
      })
    }

    // Duration PBs (longest activity)
    const longestActivity = validActivities.reduce((max, activity) => 
      activity.moving_time > max.moving_time ? activity : max
    )
    pbs.duration.push({
      value: longestActivity.moving_time,
      activity: longestActivity,
      date: longestActivity.start_date,
      metric: 'Longest Duration',
      unit: 'seconds'
    })

    // Elevation PBs
    const elevationActivities = validActivities.filter(activity => 
      activity.total_elevation_gain && activity.total_elevation_gain > 0
    )
    if (elevationActivities.length > 0) {
      const maxElevation = elevationActivities.reduce((max, activity) => 
        activity.total_elevation_gain! > max.total_elevation_gain! ? activity : max
      )
      pbs.elevation.push({
        value: maxElevation.total_elevation_gain!,
        activity: maxElevation,
        date: maxElevation.start_date,
        metric: 'Most Elevation Gain',
        unit: 'm'
      })
    }

    // Heart Rate PBs
    const hrActivities = validActivities.filter(activity => 
      activity.max_heartrate && activity.max_heartrate > 0
    )
    if (hrActivities.length > 0) {
      const maxHR = hrActivities.reduce((max, activity) => 
        activity.max_heartrate! > max.max_heartrate! ? activity : max
      )
      pbs.heartRate.push({
        value: maxHR.max_heartrate!,
        activity: maxHR,
        date: maxHR.start_date,
        metric: 'Max Heart Rate',
        unit: 'BPM'
      })
    }

    // Power PBs
    const powerActivities = validActivities.filter(activity => 
      activity.max_watts && activity.max_watts > 0
    )
    if (powerActivities.length > 0) {
      const maxPower = powerActivities.reduce((max, activity) => 
        activity.max_watts! > max.max_watts! ? activity : max
      )
      pbs.power.push({
        value: maxPower.max_watts!,
        activity: maxPower,
        date: maxPower.start_date,
        metric: 'Max Power',
        unit: 'W'
      })
    }

    return pbs
  }, [activities, preferences.distance])

  const formatValue = (pb: PersonalBest) => {
    switch (pb.metric) {
      case 'Longest Distance':
        return `${convertDistance(pb.value, preferences.distance).toFixed(1)} ${pb.unit}`
      case 'Fastest Average Pace':
        return formatDuration(pb.value)
      case 'Max Speed':
        return `${(pb.value * 3.6).toFixed(1)} km/h` // Convert m/s to km/h
      case 'Longest Duration':
        return formatDuration(pb.value)
      case 'Most Elevation Gain':
        return `${pb.value.toFixed(0)} ${pb.unit}`
      case 'Max Heart Rate':
        return `${pb.value} ${pb.unit}`
      case 'Max Power':
        return `${pb.value} ${pb.unit}`
      default:
        return `${pb.value} ${pb.unit}`
    }
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'Longest Distance':
        return <TrendingUp className="h-4 w-4" />
      case 'Fastest Average Pace':
        return <Clock className="h-4 w-4" />
      case 'Max Speed':
        return <Zap className="h-4 w-4" />
      case 'Longest Duration':
        return <Clock className="h-4 w-4" />
      case 'Most Elevation Gain':
        return <Mountain className="h-4 w-4" />
      case 'Max Heart Rate':
        return <Heart className="h-4 w-4" />
      case 'Max Power':
        return <Zap className="h-4 w-4" />
      default:
        return <Trophy className="h-4 w-4" />
    }
  }

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'Longest Distance':
        return 'bg-blue-100 text-blue-800'
      case 'Fastest Average Pace':
        return 'bg-green-100 text-green-800'
      case 'Max Speed':
        return 'bg-purple-100 text-purple-800'
      case 'Longest Duration':
        return 'bg-orange-100 text-orange-800'
      case 'Most Elevation Gain':
        return 'bg-yellow-100 text-yellow-800'
      case 'Max Heart Rate':
        return 'bg-red-100 text-red-800'
      case 'Max Power':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Personal Bests
          </CardTitle>
          <CardDescription>
            Your best performances across different metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No activities found to calculate personal bests</p>
            <p className="text-sm">Sync your activities from Strava to see your records</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const allPBs = Object.values(personalBests).flat()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Personal Bests
        </CardTitle>
        <CardDescription>
          Your best performances across different metrics and activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Records</TabsTrigger>
            <TabsTrigger value="distance">Distance</TabsTrigger>
            <TabsTrigger value="pace">Pace</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allPBs.map((pb, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getMetricIcon(pb.metric)}
                      <span className="text-sm font-medium">{pb.metric}</span>
                    </div>
                    <Badge variant="secondary" className={getMetricColor(pb.metric)}>
                      {pb.activity.sport_type}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {formatValue(pb)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {pb.activity.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(pb.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="distance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {personalBests.distance.map((pb, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">{pb.metric}</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {pb.activity.sport_type}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {formatValue(pb)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {pb.activity.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(pb.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pace" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {personalBests.pace.map((pb, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">{pb.metric}</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {pb.activity.sport_type}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {formatValue(pb)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {pb.activity.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(pb.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="other" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                ...personalBests.speed,
                ...personalBests.duration,
                ...personalBests.elevation,
                ...personalBests.heartRate,
                ...personalBests.power
              ].map((pb, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getMetricIcon(pb.metric)}
                      <span className="text-sm font-medium">{pb.metric}</span>
                    </div>
                    <Badge variant="secondary" className={getMetricColor(pb.metric)}>
                      {pb.activity.sport_type}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {formatValue(pb)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {pb.activity.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(pb.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 