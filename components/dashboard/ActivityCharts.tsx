import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity } from '@/lib/strava/types'
import { useMemo } from 'react'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { convertDistance, getDistanceUnit } from '@/lib/utils'
import {
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  ComposedChart,
  Line,
} from 'recharts'
import { ActivityContributionCalendar } from './ActivityContributionCalendar'
import { Button } from '@/components/ui/button'
import { Settings, Activity as ActivityIcon } from 'lucide-react'
import Link from 'next/link'

interface ActivityChartsProps {
  activities: Activity[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function ActivityCharts({ activities }: ActivityChartsProps) {
  const { preferences } = useUnitPreferences()
  
  console.log('ActivityCharts: Received activities prop', {
    activitiesCount: activities?.length || 0,
    sampleActivities: activities?.slice(0, 3).map(a => ({
      name: a.name,
      start_date: a.start_date,
      start_date_local: a.start_date_local
    }))
  })

  // Show empty state if no activities
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Analysis</CardTitle>
          <CardDescription>View your activity data in different ways</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              No Activity Data
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              To see your activity charts and analytics, you need to sync your activities from Strava. 
              Don&apos;t see your most recent activities? Make sure to sync in your settings.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard/settings">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Settings to Sync
                </Button>
              </Link>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <ActivityIcon className="h-4 w-4 inline mr-1" />
              Your activity charts will appear here once synced
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const weeklyData = useMemo(() => {
    if (!activities) return []

    const currentDate = new Date()
    const weeks = []
    
    // Generate last 16 weeks
    for (let i = 15; i >= 0; i--) {
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - (currentDate.getDay() + 7 * i))
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      let weeklyDistance = 0
      let weeklyCount = 0
      
      activities.forEach((activity: Activity) => {
        const activityDate = new Date(activity.start_date)
        if (activityDate >= weekStart && activityDate <= weekEnd) {
          weeklyDistance += activity.distance
          weeklyCount++
        }
      })
      
      weeks.push({
        week: `Week ${16 - i}`,
        weekStart: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weekEnd: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        distance: Math.round(convertDistance(weeklyDistance, preferences.distance)),
        count: weeklyCount,
        dateRange: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      })
    }
    
    return weeks
  }, [activities, preferences.distance])

  const activityTypeData = useMemo(() => {
    if (!activities) return []

    const typeCounts = activities.reduce((acc, activity) => {
      const type = activity.sport_type
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count
    }))
  }, [activities])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Analysis</CardTitle>
        <CardDescription>View your activity data in different ways</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Weekly Distance</TabsTrigger>
            <TabsTrigger value="types">Activity Types</TabsTrigger>
            <TabsTrigger value="frequency">Activity Frequency</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="mt-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="week" 
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}${getDistanceUnit(preferences.distance)}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-muted-foreground">
                                {data.dateRange}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Distance
                                  </span>
                                  <span className="font-bold text-muted-foreground">
                                    {data.distance}{getDistanceUnit(preferences.distance)}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Activities
                                  </span>
                                  <span className="font-bold text-muted-foreground">
                                    {data.count}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    dataKey="distance"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    className="fill-primary"
                    yAxisId="left"
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    yAxisId="right"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="types" className="mt-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityTypeData}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {activityTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {payload[0].name}
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {payload[0].value} activities
                              </span>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="frequency" className="mt-4">
            <ActivityContributionCalendar activities={activities || []} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 