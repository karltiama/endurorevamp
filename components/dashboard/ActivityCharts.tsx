import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity } from '@/lib/strava/types'
import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
} from 'recharts'
import { ActivityContributionCalendar } from './ActivityContributionCalendar'

interface ActivityChartsProps {
  activities: Activity[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function ActivityCharts({ activities }: ActivityChartsProps) {
  console.log('ActivityCharts: Received activities prop', {
    activitiesCount: activities?.length || 0,
    sampleActivities: activities?.slice(0, 3).map(a => ({
      name: a.name,
      start_date: a.start_date,
      start_date_local: a.start_date_local
    }))
  })

  const monthlyData = useMemo(() => {
    if (!activities) return []

    const currentYear = new Date().getFullYear()
    const monthlyTotals = new Array(12).fill(0)
    const monthlyCounts = new Array(12).fill(0)

    activities.forEach((activity: Activity) => {
      const date = new Date(activity.start_date)
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth()
        monthlyTotals[month] += activity.distance
        monthlyCounts[month]++
      }
    })

    return monthlyTotals.map((distance, index) => ({
      month: new Date(2024, index, 1).toLocaleString('default', { month: 'short' }),
      distance: Math.round(distance / 1000), // Convert to kilometers
      count: monthlyCounts[index]
    }))
  }, [activities])

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
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">Monthly Distance</TabsTrigger>
            <TabsTrigger value="types">Activity Types</TabsTrigger>
            <TabsTrigger value="frequency">Activity Frequency</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="mt-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}km`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Distance
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {payload[0].value}km
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Activities
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {payload[0].payload.count}
                                </span>
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
                  />
                </BarChart>
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