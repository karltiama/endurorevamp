'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity } from '@/lib/strava/types'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { convertDistance, formatDuration, formatPace, getDistanceUnit } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar, Filter } from 'lucide-react'

interface HistoricalTrendsProps {
  activities: Activity[]
}

interface TrendData {
  date: string
  distance: number
  duration: number
  pace: number
  speed: number
  elevation: number
  heartRate: number
  power: number
  count: number
}

export function HistoricalTrends({ activities }: HistoricalTrendsProps) {
  const { preferences } = useUnitPreferences()
  const [timeRange, setTimeRange] = useState('12w')
  const [metric, setMetric] = useState('distance')
  const [groupBy, setGroupBy] = useState('week')

  const trendData = useMemo(() => {
    if (!activities || activities.length === 0) return []

    const validActivities = activities.filter(activity => 
      activity.distance > 0 && activity.moving_time > 0
    )

    if (validActivities.length === 0) return []

    // Calculate date range based on selection
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case '4w':
        startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000)
        break
      case '8w':
        startDate = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000)
        break
      case '12w':
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000)
        break
      case '6m':
        startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000)
    }

    // Filter activities within date range
    const filteredActivities = validActivities.filter(activity => 
      new Date(activity.start_date) >= startDate
    )

    if (filteredActivities.length === 0) return []

    // Group activities by time period
    const groupedData: Record<string, Activity[]> = {}

    filteredActivities.forEach(activity => {
      const activityDate = new Date(activity.start_date)
      let periodKey: string

      if (groupBy === 'week') {
        // Get week start (Monday)
        const dayOfWeek = activityDate.getDay()
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        const weekStart = new Date(activityDate)
        weekStart.setDate(activityDate.getDate() - daysToMonday)
        weekStart.setHours(0, 0, 0, 0)
        periodKey = weekStart.toISOString().split('T')[0]
      } else if (groupBy === 'month') {
        periodKey = `${activityDate.getFullYear()}-${String(activityDate.getMonth() + 1).padStart(2, '0')}`
      } else {
        // Daily
        periodKey = activityDate.toISOString().split('T')[0]
      }

      if (!groupedData[periodKey]) {
        groupedData[periodKey] = []
      }
      groupedData[periodKey].push(activity)
    })

    // Calculate metrics for each period
    const trendData: TrendData[] = Object.entries(groupedData).map(([periodKey, periodActivities]) => {
      const totalDistance = periodActivities.reduce((sum, activity) => sum + activity.distance, 0)
      const totalDuration = periodActivities.reduce((sum, activity) => sum + activity.moving_time, 0)
      const totalElevation = periodActivities.reduce((sum, activity) => 
        sum + (activity.total_elevation_gain || 0), 0
      )
      
      // Calculate average pace (seconds per km)
      const averagePace = totalDistance > 0 ? (totalDuration / totalDistance) * 1000 : 0
      
      // Calculate average speed (km/h)
      const averageSpeed = totalDistance > 0 ? (totalDistance / 1000) / (totalDuration / 3600) : 0
      
      // Calculate average heart rate
      const hrActivities = periodActivities.filter(activity => activity.average_heartrate)
      const averageHR = hrActivities.length > 0 
        ? hrActivities.reduce((sum, activity) => sum + activity.average_heartrate!, 0) / hrActivities.length
        : 0

      // Calculate average power
      const powerActivities = periodActivities.filter(activity => activity.average_watts)
      const averagePower = powerActivities.length > 0
        ? powerActivities.reduce((sum, activity) => sum + activity.average_watts!, 0) / powerActivities.length
        : 0

      return {
        date: periodKey,
        distance: totalDistance,
        duration: totalDuration,
        pace: averagePace,
        speed: averageSpeed,
        elevation: totalElevation,
        heartRate: averageHR,
        power: averagePower,
        count: periodActivities.length
      }
    })

    // Sort by date
    return trendData.sort((a, b) => a.date.localeCompare(b.date))
  }, [activities, timeRange, groupBy])

  const formatTooltipValue = (value: number, metric: string) => {
    switch (metric) {
      case 'distance':
        return `${convertDistance(value, preferences.distance).toFixed(1)} ${getDistanceUnit(preferences.distance)}`
      case 'duration':
        return formatDuration(value)
      case 'pace':
        return formatPace(value, preferences.pace)
      case 'speed':
        const speedKmh = value
        if (preferences.distance === 'miles') {
          const speedMph = speedKmh * 0.621371
          return `${speedMph.toFixed(1)} mph`
        } else {
          return `${speedKmh.toFixed(1)} km/h`
        }
      case 'elevation':
        return `${value.toFixed(0)} m`
      case 'heartRate':
        return `${value.toFixed(0)} BPM`
      case 'power':
        return `${value.toFixed(0)} W`
      case 'count':
        return `${value} activities`
      default:
        return value.toString()
    }
  }

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'distance':
        return 'Distance'
      case 'duration':
        return 'Duration'
      case 'pace':
        return 'Average Pace'
      case 'speed':
        return 'Average Speed'
      case 'elevation':
        return 'Elevation Gain'
      case 'heartRate':
        return 'Average Heart Rate'
      case 'power':
        return 'Average Power'
      case 'count':
        return 'Activity Count'
      default:
        return metric
    }
  }

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'distance':
        return '#3b82f6'
      case 'duration':
        return '#10b981'
      case 'pace':
        return '#f59e0b'
      case 'speed':
        return '#06b6d4'
      case 'elevation':
        return '#8b5cf6'
      case 'heartRate':
        return '#ef4444'
      case 'power':
        return '#06b6d4'
      case 'count':
        return '#6b7280'
      default:
        return '#3b82f6'
    }
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Historical Trends
          </CardTitle>
          <CardDescription>
            Track your performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No activities found to analyze trends</p>
            <p className="text-sm">Sync your activities from Strava to see your progress</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Historical Trends
        </CardTitle>
                 <CardDescription>
           Track your performance over time with interactive charts
         </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4w">4 Weeks</SelectItem>
                <SelectItem value="8w">8 Weeks</SelectItem>
                <SelectItem value="12w">12 Weeks</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
                             <SelectContent>
                 <SelectItem value="distance">Distance</SelectItem>
                 <SelectItem value="duration">Duration</SelectItem>
                 <SelectItem value="pace">Average Pace</SelectItem>
                 <SelectItem value="speed">Average Speed</SelectItem>
                 <SelectItem value="elevation">Elevation</SelectItem>
                 <SelectItem value="heartRate">Heart Rate</SelectItem>
                 <SelectItem value="power">Power</SelectItem>
                 <SelectItem value="count">Activity Count</SelectItem>
               </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => {
                  if (groupBy === 'week') {
                    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  } else if (groupBy === 'month') {
                    return new Date(value + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                  } else {
                    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }
                }}
              />
                             <YAxis 
                 tickFormatter={(value) => {
                   // For pace, show only the numeric value without units to prevent cutoff
                   if (metric === 'pace') {
                     return formatPace(value, preferences.pace).replace(/[^\d:]/g, '')
                   }
                   return formatTooltipValue(value, metric)
                 }}
                 domain={metric === 'pace' ? ['dataMin', 'dataMax'] : [0, 'dataMax']}
               />
              <Tooltip 
                labelFormatter={(value) => {
                  if (groupBy === 'week') {
                    return `Week of ${new Date(value).toLocaleDateString()}`
                  } else if (groupBy === 'month') {
                    return new Date(value + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  } else {
                    return new Date(value).toLocaleDateString()
                  }
                }}
                formatter={(value: number) => [formatTooltipValue(value, metric), getMetricLabel(metric)]}
              />
              <Line 
                type="monotone" 
                dataKey={metric} 
                stroke={getMetricColor(metric)}
                strokeWidth={2}
                dot={{ fill: getMetricColor(metric), strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: getMetricColor(metric), strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        {trendData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {trendData.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {groupBy === 'week' ? 'Weeks' : groupBy === 'month' ? 'Months' : 'Days'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {trendData.reduce((sum, data) => sum + data.count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatTooltipValue(
                  trendData.reduce((sum, data) => sum + data.distance, 0),
                  'distance'
                )}
              </div>
              <div className="text-sm text-muted-foreground">Total Distance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatTooltipValue(
                  trendData.reduce((sum, data) => sum + data.duration, 0),
                  'duration'
                )}
              </div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 