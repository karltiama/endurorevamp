'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { 
  Dumbbell, 
  Clock, 
  TrendingUp, 
  Zap, 
  Heart, 
  Target, 
  Calendar,
  Info,
  Edit3,
  RotateCcw,
  Moon,
  Thermometer,
  CloudRain,
  Wind,
  Sun
} from 'lucide-react'
import { useEnhancedWorkoutPlanning, useWorkoutPlanManager, useWorkoutPlanAnalytics, useSynchronizedTodaysWorkout } from '@/hooks/useEnhancedWorkoutPlanning'
import { useQueryClient } from '@tanstack/react-query'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { useWeather } from '@/hooks/useWeather'
import { useLocation } from '@/hooks/useLocation'
import { WorkoutPlanEditorModal } from './WorkoutPlanEditorModal'
import { DynamicWorkoutContent } from '@/lib/training/dynamic-workout-content'
import { formatTemperature, formatWindSpeed } from '@/lib/utils'

import type { EnhancedWorkoutRecommendation, WeeklyWorkoutPlan } from '@/lib/training/enhanced-workout-planning'
import type { WeatherData, WeatherImpact } from '@/lib/weather/types'

interface EnhancedWorkoutPlanningDashboardProps {
  userId: string
  className?: string
}

interface WeatherWorkoutContextProps {
  weather: WeatherData
  impact: WeatherImpact | null
  optimalTime: { time: string; reason: string } | null
  workout: EnhancedWorkoutRecommendation
}

export function EnhancedWorkoutPlanningDashboard({ userId, className }: EnhancedWorkoutPlanningDashboardProps) {
  const queryClient = useQueryClient()
  
  // Use the synchronized hook to ensure today's workout always matches the weekly plan
  const { 
    todaysWorkout, 
    weeklyPlan, 
    isLoading: isLoadingTodaysWorkout, 
    hasData 
  } = useSynchronizedTodaysWorkout(userId)

  const { saveWorkoutPlan, resetToRecommended } = useWorkoutPlanManager(userId)
  const analytics = useWorkoutPlanAnalytics(weeklyPlan)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [, setIsResetting] = useState(false)

  // Weather integration
  const { location, isLoading: locationLoading } = useLocation()
  const { weather, impact, optimalTime, isLoading: weatherLoading } = useWeather({ 
    lat: location.lat, 
    lon: location.lon,
    enabled: !locationLoading
  })

  // Debug logging for weekly plan changes
  console.log('EnhancedWorkoutPlanningDashboard: weeklyPlan updated:', weeklyPlan?.id, weeklyPlan?.weekStart)
  console.log('EnhancedWorkoutPlanningDashboard: workouts count:', Object.values(weeklyPlan?.workouts || {}).filter(w => w !== null).length)
  console.log('EnhancedWorkoutPlanningDashboard: todaysWorkout:', todaysWorkout?.type, todaysWorkout?.sport, todaysWorkout?.duration)
  console.log('EnhancedWorkoutPlanningDashboard: isEditorOpen:', isEditorOpen)
  
  // Ensure today's workout matches the weekly plan
  const today = new Date().getDay()
  const expectedTodaysWorkout = weeklyPlan?.workouts[today]
  const todaysWorkoutMatchesPlan = todaysWorkout?.id === expectedTodaysWorkout?.id
  
  console.log('EnhancedWorkoutPlanningDashboard: Today is day', today, 'of week')
  console.log('EnhancedWorkoutPlanningDashboard: Expected today\'s workout:', expectedTodaysWorkout?.type, expectedTodaysWorkout?.sport)
  console.log('EnhancedWorkoutPlanningDashboard: Actual today\'s workout:', todaysWorkout?.type, todaysWorkout?.sport)
  console.log('EnhancedWorkoutPlanningDashboard: Workouts match:', todaysWorkoutMatchesPlan)

  if (!hasData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Workout Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No training data available</p>
              <p className="text-sm">Sync some activities and set goals to get personalized workout recommendations</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handlePlanUpdate = async (updatedPlan: WeeklyWorkoutPlan) => {
    try {
      console.log('handlePlanUpdate: Starting plan update')
      const result = await saveWorkoutPlan(updatedPlan)
      
      if (result.success) {
        console.log('handlePlanUpdate: Plan updated successfully')
        // The queries should be automatically invalidated by saveWorkoutPlan
        // You could add a toast notification here
      } else {
        console.error('handlePlanUpdate: Failed to update plan:', result.error)
        // You could add an error toast notification here
      }
    } catch (error) {
      console.error('handlePlanUpdate: Error updating plan:', error)
      // You could add an error toast notification here
    }
  }

  const handleResetToRecommended = async () => {
    setIsResetting(true)
    try {
      const result = await resetToRecommended()
      if (result.success) {
        // You could add a toast notification here
        console.log('Plan reset to recommended successfully')
        // Close the modal to ensure fresh data when reopened
        setIsEditorOpen(false)
        // React Query will automatically refetch the data after invalidation
        return result
      } else {
        console.error('Failed to reset plan:', result.error)
        return result
      }
    } catch (error) {
      console.error('Failed to reset plan:', error)
      return { success: false, error }
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>

        
        {/* Today's Workout Recommendation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Today&apos;s Workout
              </CardTitle>
              {weeklyPlan && todaysWorkout && !todaysWorkoutMatchesPlan && (
                <Badge variant="destructive" className="text-xs">
                  Plan Mismatch
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTodaysWorkout ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ) : todaysWorkout ? (
              <div className="space-y-4">
                {/* Weather Context Section */}
                {weather && !weatherLoading && (
                  <WeatherWorkoutContext 
                    weather={weather} 
                    impact={impact} 
                    optimalTime={optimalTime}
                    workout={todaysWorkout}
                  />
                )}
                
                <EnhancedTodaysWorkoutCard workout={todaysWorkout} />
              </div>
            ) : (
              <RecoveryDayCard />
            )}
          </CardContent>
        </Card>

        {/* Weekly Plan with Modal Editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Plan
              </CardTitle>
              {weeklyPlan && !isLoadingTodaysWorkout && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('EnhancedWorkoutPlanningDashboard: Opening editor with plan:', weeklyPlan.id)
                      setIsEditorOpen(true)
                    }}
                    className="flex items-center gap-1"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Plan
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTodaysWorkout ? (
              <div className="animate-pulse space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded" />
                  ))}
                </div>
              </div>
            ) : weeklyPlan ? (
              <WeeklyPlanGrid workouts={weeklyPlan.workouts} />
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <p>No weekly plan available</p>
                <p className="text-sm">Complete more activities to generate a weekly plan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Analytics */}
        {analytics.totalWorkouts > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Plan Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Workouts</p>
                  <p className="font-semibold">{analytics.totalWorkouts}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total TSS</p>
                  <p className="font-semibold">{Math.round(analytics.totalTSS)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Periodization</p>
                  <Badge variant="outline" className="capitalize">
                    {analytics.periodizationPhase}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Intensity Balance</p>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {('low' in analytics.intensityDistribution ? analytics.intensityDistribution.low : 0)} Low
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {('moderate' in analytics.intensityDistribution ? analytics.intensityDistribution.moderate : 0)} Mod
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {('high' in analytics.intensityDistribution ? analytics.intensityDistribution.high : 0)} High
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {analytics.recommendations.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-sm">Recommendations</h4>
                  {analytics.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        rec.type === 'warning' ? 'bg-orange-500' :
                        rec.type === 'success' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`} />
                      <p className="text-sm">{rec.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Workout Plan Editor Modal */}
        {weeklyPlan && (
          <WorkoutPlanEditorModal
            weeklyPlan={weeklyPlan}
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            onSave={handlePlanUpdate}
            onResetToRecommended={handleResetToRecommended}
          />
        )}
      </div>
    </TooltipProvider>
  )
}

function WeeklyPlanGrid({ workouts }: { workouts: { [dayOfWeek: number]: EnhancedWorkoutRecommendation | null } }) {
  const { preferences: unitPreferences } = useUnitPreferences()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date().getDay()

  return (
    <div className="grid grid-cols-7 gap-2">
      {dayNames.map((dayName, index) => {
        const workout = workouts[index]
        const isToday = index === today
        
        return (
          <div key={index} className="text-center">
            <div className="relative">
              <p className={`text-sm font-medium mb-2 ${isToday ? 'text-primary font-semibold' : ''}`}>
                {dayName}
              </p>
              {isToday && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                </div>
              )}
            </div>
            
            <div className={`p-2 border rounded-lg min-h-[80px] flex flex-col items-center justify-center ${
              isToday ? 'bg-primary/10 border-primary/20' : 'bg-card'
            }`}>
              {workout ? (
                <>
                  <div className="text-xs font-medium capitalize mb-1">
                    {workout.type}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {workout.duration}min
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {workout.sport}
                  </div>
                  {workout.distance && (
                    <div className="text-xs text-muted-foreground">
                      {unitPreferences.distance === 'miles' 
                        ? (() => {
                            const miles = workout.distance * 0.621371
                            return `${miles % 1 === 0 ? miles.toFixed(0) : miles.toFixed(1)} mi`
                          })()
                        : (() => {
                            const km = workout.distance
                            return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`
                          })()
                      }
                    </div>
                  )}
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Rest</span>
              )}
            </div>
          </div>
        )
      }      )}
    </div>
  )
}

function WeatherWorkoutContext({ weather, impact, optimalTime, workout }: WeatherWorkoutContextProps) {
  const { preferences } = useUnitPreferences()
  const { current } = weather

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun className="h-4 w-4 text-yellow-500" />
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-4 w-4 text-blue-500" />
      case 'snow':
        return <CloudRain className="h-4 w-4 text-blue-300" />
      case 'clouds':
        return <CloudRain className="h-4 w-4 text-gray-500" />
      default:
        return <Thermometer className="h-4 w-4" />
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const calculateRunningScore = (temp: number, humidity: number, wind: number, precip: number) => {
    let score = 100

    // Temperature scoring (optimal: 10-15°C)
    if (temp < 5 || temp > 25) {
      score -= 30
    } else if (temp < 10 || temp > 20) {
      score -= 15
    }

    // Humidity scoring (optimal: 40-60%)
    if (humidity > 80) {
      score -= 20
    } else if (humidity > 70) {
      score -= 10
    }

    // Wind scoring (optimal: < 15 km/h)
    if (wind > 25) {
      score -= 25
    } else if (wind > 15) {
      score -= 10
    }

    // Precipitation scoring
    if (precip > 2) {
      score -= 30
    } else if (precip > 0.5) {
      score -= 15
    }

    return Math.max(0, score)
  }

  const runningScore = calculateRunningScore(
    current.temperature,
    current.humidity,
    current.windSpeed,
    current.precipitation
  )

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // const getScoreText = (score: number) => {
  //   if (score >= 80) return 'Excellent'
  //   if (score >= 60) return 'Good'
  //   if (score >= 40) return 'Fair'
  //   return 'Poor'
  // }

  return (
    <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getWeatherIcon(current.weatherCondition)}
          <div>
            <h4 className="font-semibold text-blue-800">Weather Conditions</h4>
            <p className="text-sm text-blue-600">{weather.location.name}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${getScoreColor(runningScore)}`}>
            {runningScore}%
          </div>
          <div className="text-xs text-blue-600">Running Score</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-red-500" />
          <span className="text-sm">
            {formatTemperature(current.temperature, preferences.temperature)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <CloudRain className="h-4 w-4 text-blue-500" />
          <span className="text-sm">{current.humidity}%</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-gray-500" />
          <span className="text-sm">{formatWindSpeed(current.windSpeed, preferences.windSpeed)}</span>
        </div>
        
        {current.precipitation > 0 && (
          <div className="flex items-center gap-2">
            <CloudRain className="h-4 w-4 text-blue-500" />
            <span className="text-sm">{current.precipitation}mm</span>
          </div>
        )}
      </div>

      {/* Weather Impact on Workout */}
      {impact && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">Impact on {workout.sport}</span>
            <Badge variant="outline" className={getRiskColor(impact.risk)}>
              {impact.risk} risk
            </Badge>
          </div>
          
          {impact.recommendations.length > 0 && (
            <div className="space-y-1">
              {impact.recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-blue-700">{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Optimal Time Suggestion */}
      {optimalTime && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Best Time Today:</span>
            <span className="text-sm text-green-600">{optimalTime.time}</span>
          </div>
          <p className="text-xs text-green-600 mt-1">{optimalTime.reason}</p>
        </div>
      )}
    </div>
  )
}

function RecoveryDayCard() {
  // Get current time to suggest appropriate activities
  const now = new Date()
  const hour = now.getHours()
  
  // Suggest different activities based on time of day
  const getSuggestedActivity = () => {
    if (hour < 12) {
      return {
        activity: 'Morning Walk',
        duration: 20,
        description: 'Start your day with a gentle walk to boost energy and mood',
        icon: TrendingUp
      }
    } else if (hour < 17) {
      return {
        activity: 'Afternoon Stroll',
        duration: 30,
        description: 'Take a break and enjoy some light movement',
        icon: Heart
      }
    } else {
      return {
        activity: 'Evening Walk',
        duration: 25,
        description: 'Wind down with a relaxing evening walk',
        icon: Moon
      }
    }
  }
  
  const suggestedActivity = getSuggestedActivity()
  const ActivityIcon = suggestedActivity.icon

  return (
    <div className="space-y-4">
      {/* Recovery Day Header */}
      <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Recovery Day</h3>
              <p className="text-sm text-green-700">Your body needs rest to adapt and grow stronger</p>
            </div>
          </div>
          <Badge variant="outline" className="text-green-700 border-green-300">
            Rest Day
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-700 font-medium">Recovery Focus</p>
              <p className="text-sm text-green-600">Active rest & mobility</p>
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Energy Level</p>
              <p className="text-sm text-green-600">Low intensity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Light Activity */}
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5 text-blue-500" />
            <div>
              <h4 className="font-semibold">{suggestedActivity.activity}</h4>
              <p className="text-sm text-muted-foreground">{suggestedActivity.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {suggestedActivity.duration} min
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Benefits:</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6">
            <li>• Improves blood circulation</li>
            <li>• Reduces muscle stiffness</li>
            <li>• Promotes mental relaxation</li>
            <li>• Maintains daily movement habit</li>
          </ul>
        </div>
      </div>

      {/* Recovery Tips */}
      <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-purple-600" />
          <h4 className="font-medium text-purple-800">Recovery Tips</h4>
        </div>
        <div className="space-y-2 text-sm text-purple-700">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
            <span>Stay hydrated throughout the day</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
            <span>Consider gentle stretching or yoga</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
            <span>Focus on quality sleep tonight</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
            <span>Plan tomorrow&apos;s workout in advance</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function EnhancedTodaysWorkoutCard({ workout }: { workout: EnhancedWorkoutRecommendation }) {
  const { preferences: unitPreferences } = useUnitPreferences()

  // Generate dynamic content based on workout characteristics
  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
  }

  const dynamicContent = DynamicWorkoutContent.generateDynamicContent(workout, {
    timeOfDay: getTimeOfDay()
  })

  const getWorkoutTypeIcon = (type: string) => {
    switch (type) {
      case 'recovery': return Heart
      case 'easy': return TrendingUp
      case 'tempo': return Zap
      case 'threshold': return Target
      case 'long': return Clock
      case 'strength': return Dumbbell
      case 'interval': return Zap
      case 'fartlek': return TrendingUp
      case 'hill': return TrendingUp
      default: return Dumbbell
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50 border-green-200'
      case 'intermediate': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'advanced': return 'text-purple-600 bg-purple-50 border-purple-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const WorkoutIcon = getWorkoutTypeIcon(workout.type)

  return (
    <div className="space-y-4">
      {/* Main Workout */}
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <WorkoutIcon className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold capitalize">{workout.type} {workout.sport}</h3>
              <p className="text-sm text-muted-foreground">{workout.sport}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="capitalize">
              {workout.type}
            </Badge>
            <Badge variant="outline" className={`capitalize ${getDifficultyColor(workout.difficulty)}`}>
              {workout.difficulty}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-semibold">{workout.duration} min</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Intensity</p>
            <div className="flex items-center gap-2">
              <Progress value={workout.intensity * 10} className="flex-1" />
              <span className="text-sm font-medium">{workout.intensity}/10</span>
            </div>
          </div>
          {workout.distance && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Distance</p>
              <p className="font-semibold">
                {unitPreferences.distance === 'miles' 
                  ? (() => {
                      const miles = workout.distance * 0.621371
                      return `${miles % 1 === 0 ? miles.toFixed(0) : miles.toFixed(1)} mi`
                    })()
                  : (() => {
                      const km = workout.distance
                      return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`
                    })()
                }
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Energy Cost</p>
            <p className="font-semibold">{workout.energyCost}/10</p>
          </div>
        </div>



        {workout.goalAlignment && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="flex items-center gap-1 text-blue-700">
              <Target className="h-4 w-4" />
              <span className="font-medium">Goal Alignment:</span>
            </div>
            <p className="text-blue-600 mt-1">{workout.goalAlignment}</p>
          </div>
        )}

        {workout.weatherConsideration && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <div className="flex items-center gap-1 text-yellow-700">
              <Info className="h-4 w-4" />
              <span className="font-medium">Weather Note:</span>
            </div>
            <p className="text-yellow-600 mt-1">{workout.weatherConsideration}</p>
          </div>
        )}
      </div>

      {/* Dynamic Instructions and Tips */}
      {(dynamicContent.instructions.length > 0 || dynamicContent.tips.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Instructions */}
          {dynamicContent.instructions.length > 0 && (
            <div className="p-3 border rounded-lg bg-blue-50/50">
              <h4 className="font-medium mb-2 text-blue-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Instructions
              </h4>
              <div className="space-y-2">
                {dynamicContent.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-blue-800">{instruction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {dynamicContent.tips.length > 0 && (
            <div className="p-3 border rounded-lg bg-green-50/50">
              <h4 className="font-medium mb-2 text-green-700 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Pro Tips
              </h4>
              <div className="space-y-1">
                {dynamicContent.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    <p className="text-sm text-green-800">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Modifications */}
      {(dynamicContent.modifications.easier || dynamicContent.modifications.harder || 
        dynamicContent.modifications.shorter || dynamicContent.modifications.longer) && (
        <div className="p-3 border rounded-lg bg-orange-50/50">
          <h4 className="font-medium mb-2 text-orange-700 flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Modifications
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {dynamicContent.modifications.easier && (
              <div className="p-2 border rounded bg-green-50 border-green-200">
                <p className="font-medium text-green-700 text-xs">Easier</p>
                <p className="text-green-600 text-xs">{dynamicContent.modifications.easier}</p>
              </div>
            )}
            {dynamicContent.modifications.harder && (
              <div className="p-2 border rounded bg-red-50 border-red-200">
                <p className="font-medium text-red-700 text-xs">Harder</p>
                <p className="text-red-600 text-xs">{dynamicContent.modifications.harder}</p>
              </div>
            )}
            {dynamicContent.modifications.shorter && (
              <div className="p-2 border rounded bg-blue-50 border-blue-200">
                <p className="font-medium text-blue-700 text-xs">Shorter</p>
                <p className="text-blue-600 text-xs">{dynamicContent.modifications.shorter}</p>
              </div>
            )}
            {dynamicContent.modifications.longer && (
              <div className="p-2 border rounded bg-purple-50 border-purple-200">
                <p className="font-medium text-purple-700 text-xs">Longer</p>
                <p className="text-purple-600 text-xs">{dynamicContent.modifications.longer}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alternatives - Compact */}
      {workout.alternatives.length > 0 && (
        <div className="p-3 border rounded-lg bg-purple-50/50">
          <h4 className="font-medium mb-2 text-purple-700 flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Alternative Workouts
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {workout.alternatives.map((alt) => (
              <div key={alt.id} className="p-2 border rounded bg-white/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm">{alt.sport}</span>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {alt.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {alt.duration} min
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{alt.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 