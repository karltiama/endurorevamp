"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  Award,
  Smartphone,
  Zap,
  Calendar,
  Heart,
  MapPin,
  Clock,
  Trophy,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react"
import { useState } from "react"

// Mock data for the live preview
const mockActivityData = [
  { date: 'Mon', distance: 5.2, pace: '8:30', heartRate: 145 },
  { date: 'Tue', distance: 0, pace: '0:00', heartRate: 0 },
  { date: 'Wed', distance: 6.1, pace: '8:15', heartRate: 152 },
  { date: 'Thu', distance: 0, pace: '0:00', heartRate: 0 },
  { date: 'Fri', distance: 4.8, pace: '8:45', heartRate: 138 },
  { date: 'Sat', distance: 8.2, pace: '8:00', heartRate: 158 },
  { date: 'Sun', distance: 0, pace: '0:00', heartRate: 0 },
]

const mockWeeklyMetrics = {
  totalDistance: 24.3,
  totalTime: '3h 22m',
  averagePace: '8:18',
  totalCalories: 1847,
  trainingLoad: 72,
  recoveryScore: 85,
}

const mockGoals = [
  { name: 'Weekly Distance', target: 30, current: 24.3, unit: 'miles', progress: 81 },
  { name: 'Long Run', target: 10, current: 8.2, unit: 'miles', progress: 82 },
  { name: 'Consistency', target: 5, current: 4, unit: 'days', progress: 80 },
]

export default function LiveDashboardPreview() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentMetric, setCurrentMetric] = useState(0)

  const metrics = [
    { label: 'Weekly Distance', value: `${mockWeeklyMetrics.totalDistance}`, unit: 'miles', icon: MapPin, color: 'text-blue-600' },
    { label: 'Training Load', value: mockWeeklyMetrics.trainingLoad, unit: 'TSS', icon: BarChart3, color: 'text-indigo-600' },
    { label: 'Recovery Score', value: mockWeeklyMetrics.recoveryScore, unit: '%', icon: Heart, color: 'text-green-600' },
    { label: 'Avg Pace', value: mockWeeklyMetrics.averagePace, unit: '/mile', icon: Clock, color: 'text-purple-600' },
  ]

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const resetPreview = () => {
    setIsPlaying(false)
    setCurrentMetric(0)
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 shadow-xl border">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Dashboard Header */}
        <div className="bg-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Live Dashboard Preview</h3>
            <div className="flex items-center space-x-3">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayback}
                  className="text-white hover:bg-indigo-700 h-8 w-8 p-0"
                  aria-label={isPlaying ? "Pause preview" : "Play preview"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetPreview}
                  className="text-white hover:bg-indigo-700 h-8 w-8 p-0"
                  aria-label="Reset preview"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <Card key={metric.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${metric.color.replace('text-', 'bg-')} bg-opacity-10`}>
                    <metric.icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                  <div className="text-sm text-gray-500">{metric.unit}</div>
                  <div className="text-xs text-gray-400 mt-1">{metric.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Weekly Activity Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Weekly Activity</CardTitle>
              <CardDescription>Your running activity over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockActivityData.map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Activity className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{day.date}</div>
                        {day.distance > 0 ? (
                          <div className="text-sm text-gray-500">{day.distance} miles • {day.pace}/mile</div>
                        ) : (
                          <div className="text-sm text-gray-400">Rest day</div>
                        )}
                      </div>
                    </div>
                    {day.distance > 0 && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{day.heartRate} bpm</div>
                        <div className="text-xs text-green-600">Active</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Goals Progress */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Goal Progress</CardTitle>
              <CardDescription>Track your progress toward running goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockGoals.map((goal) => (
                  <div key={goal.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-900">{goal.name}</span>
                      <span className="text-gray-600">{goal.current}/{goal.target} {goal.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">{goal.progress}% complete</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Training Load & Recovery */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Training Load</CardTitle>
                <CardDescription>Weekly training stress balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">{mockWeeklyMetrics.trainingLoad}</div>
                  <div className="text-sm text-gray-600">Training Stress Score</div>
                  <div className="mt-3">
                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                      Optimal Range
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recovery Status</CardTitle>
                <CardDescription>How ready you are for your next run</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{mockWeeklyMetrics.recoveryScore}%</div>
                  <div className="text-sm text-gray-600">Recovery Score</div>
                  <div className="mt-3">
                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                      Ready to Run
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
