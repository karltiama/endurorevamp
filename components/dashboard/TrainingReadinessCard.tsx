'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUserActivities } from '@/hooks/use-user-activities'
import { usePersonalizedTSSTarget } from '@/hooks/useTrainingProfile'
import { useMemo } from 'react'
import { 
  Battery, 
  Heart, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  Info
} from 'lucide-react'
import { ActivityWithTrainingData } from '@/types'

interface TrainingReadinessCardProps {
  userId: string
}

interface TrainingReadiness {
  recoveryScore: number        // 0-100
  readinessLevel: 'low' | 'medium' | 'high'
  recommendation: string
  lastRPE?: number
  tssBalance: number          // Positive = fresh, negative = fatigued
  daysSinceLastWorkout: number
  weeklyTSSTarget: number
  weeklyTSSCurrent: number
}

// Helper functions moved outside the component
const estimateTSS = (activity: ActivityWithTrainingData): number => {
  // Simple TSS estimation based on duration and sport type
  const durationHours = activity.moving_time / 3600
  const baseIntensity = activity.sport_type === 'Run' ? 70 : 60 // TSS per hour
  
  // Adjust for heart rate if available
  let intensityMultiplier = 1
  if (activity.average_heartrate) {
    // Assume max HR around 190, adjust based on average HR
    intensityMultiplier = Math.max(0.5, Math.min(1.5, activity.average_heartrate / 140))
  }
  
  return Math.round(durationHours * baseIntensity * intensityMultiplier)
}

const calculateRecoveryScore = (factors: {
  daysSinceLastWorkout: number
  lastRPE?: number
  tssBalance: number
  lastActivity: ActivityWithTrainingData
}): number => {
  let score = 50 // Base score

  // Days since last workout (recovery benefit)
  score += Math.min(30, factors.daysSinceLastWorkout * 8)

  // RPE impact (high RPE = need more recovery)
  if (factors.lastRPE) {
    score -= (factors.lastRPE - 5) * 5 // RPE of 5 is neutral
  }

  // TSS balance (negative balance = fatigue)
  if (factors.tssBalance < -100) {
    score -= 20 // Heavy fatigue
  } else if (factors.tssBalance < -50) {
    score -= 10 // Moderate fatigue
  } else if (factors.tssBalance > 50) {
    score += 10 // Well rested
  }

  // Recovery time field if available
  if (factors.lastActivity?.recovery_time) {
    const hoursRecovered = (Date.now() - new Date(factors.lastActivity.start_date).getTime()) / (1000 * 60 * 60)
    const recoveryNeeded = factors.lastActivity.recovery_time
    
    if (hoursRecovered >= recoveryNeeded) {
      score += 15 // Fully recovered
    } else {
      score -= 10 // Still recovering
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

const getReadinessAssessment = (factors: {
  recoveryScore: number
  daysSinceLastWorkout: number
  tssBalance: number
  lastRPE?: number
}): { readinessLevel: 'low' | 'medium' | 'high', recommendation: string } => {
  
  if (factors.recoveryScore >= 80) {
    return {
      readinessLevel: 'high',
      recommendation: factors.daysSinceLastWorkout >= 2 
        ? "Ready for a hard workout! Consider intervals or tempo run."
        : "Good energy - perfect for a quality training session."
    }
  }
  
  if (factors.recoveryScore >= 60) {
    return {
      readinessLevel: 'medium',
      recommendation: factors.tssBalance < -50
        ? "Moderate fatigue - try an easy run or cross-training."
        : "Good for moderate training - steady pace or hills."
    }
  }
  
  return {
    readinessLevel: 'low',
    recommendation: factors.daysSinceLastWorkout >= 3
      ? "Long break detected - ease back with a gentle run."
      : "High fatigue - consider rest day or easy recovery activity."
  }
}

const getReadinessIcon = (level: string) => {
  switch (level) {
    case 'high': return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'medium': return <Clock className="h-5 w-5 text-yellow-600" />
    case 'low': return <AlertTriangle className="h-5 w-5 text-red-600" />
    default: return <Activity className="h-5 w-5 text-gray-600" />
  }
}

const getReadinessColor = (level: string) => {
  switch (level) {
    case 'high': return 'text-green-800 bg-green-100 border-green-200'
    case 'medium': return 'text-yellow-800 bg-yellow-100 border-yellow-200'
    case 'low': return 'text-red-800 bg-red-100 border-red-200'
    default: return 'text-gray-800 bg-gray-100 border-gray-200'
  }
}

export function TrainingReadinessCard({ userId }: TrainingReadinessCardProps) {
  const { data: activities, isLoading, error } = useUserActivities(userId)
  const { data: personalizedTSSTarget } = usePersonalizedTSSTarget(userId)

  const trainingReadiness = useMemo((): TrainingReadiness | null => {
    if (!activities || activities.length === 0) return null

    // Get current week activities (Monday to Sunday)
    const now = new Date()
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
    currentWeekStart.setHours(0, 0, 0, 0)
    const currentWeekEnd = new Date(currentWeekStart)
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6) // Sunday
    currentWeekEnd.setHours(23, 59, 59, 999)

    // Filter activities for current week
    const thisWeekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.start_date)
      return activityDate >= currentWeekStart && activityDate <= currentWeekEnd
    })

    const lastActivity = thisWeekActivities[0]
    const daysSinceLastWorkout = lastActivity 
      ? Math.floor((now.getTime() - new Date(lastActivity.start_date).getTime()) / (1000 * 60 * 60 * 24))
      : 7

    // Calculate weekly TSS (use training_stress_score if available, otherwise estimate)
    const weeklyTSSCurrent = thisWeekActivities.reduce((sum, activity) => {
      const tss = (activity as ActivityWithTrainingData).training_stress_score || estimateTSS(activity)
      return sum + tss
    }, 0)

    // Weekly TSS target (personalized based on user profile)
    const weeklyTSSTarget = personalizedTSSTarget || 400

    // TSS balance (negative = accumulated fatigue)
    const tssBalance = weeklyTSSTarget - weeklyTSSCurrent

    // Get last RPE (perceived exertion)
    const lastRPE = (lastActivity as ActivityWithTrainingData)?.perceived_exertion

    // Calculate recovery score based on multiple factors
    const recoveryScore = calculateRecoveryScore({
      daysSinceLastWorkout,
      lastRPE,
      tssBalance,
      lastActivity
    })

    // Determine readiness level and recommendation
    const { readinessLevel, recommendation } = getReadinessAssessment({
      recoveryScore,
      daysSinceLastWorkout,
      tssBalance,
      lastRPE
    })

    return {
      recoveryScore,
      readinessLevel,
      recommendation,
      lastRPE,
      tssBalance,
      daysSinceLastWorkout,
      weeklyTSSTarget,
      weeklyTSSCurrent
    }
  }, [activities, personalizedTSSTarget])





  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Battery className="h-5 w-5" />
            Training Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-100 rounded-lg"></div>
            <div className="h-16 bg-gray-100 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !trainingReadiness) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Battery className="h-5 w-5" />
            Training Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Battery className="h-5 w-5" />
          Training Readiness
          <Badge variant="outline" className="ml-auto">
            Today
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recovery Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getReadinessIcon(trainingReadiness.readinessLevel)}
              <span className="font-medium">Recovery Score</span>
            </div>
            <span className="text-2xl font-bold">
              {trainingReadiness.recoveryScore}%
            </span>
          </div>
          
          <Progress 
            value={trainingReadiness.recoveryScore} 
            className="h-3"
          />
          
          <Badge 
            variant="outline" 
            className={`w-fit ${getReadinessColor(trainingReadiness.readinessLevel)}`}
          >
            {trainingReadiness.readinessLevel.toUpperCase()} READINESS
          </Badge>
        </div>

        {/* Key Metrics */}
        <TooltipProvider>
          <div className="grid grid-cols-2 gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1 cursor-help">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Heart className="h-4 w-4" />
                    Last RPE
                    <Info className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="text-lg font-semibold">
                    {trainingReadiness.lastRPE ? `${trainingReadiness.lastRPE}/10` : 'N/A'}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-64">
                <div className="space-y-1">
                  <p className="font-medium text-sm">Rate of Perceived Exertion</p>
                  <p className="text-xs text-gray-600">
                    How hard your last workout felt (1-10 scale). Higher = more recovery needed.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1 cursor-help">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Zap className="h-4 w-4" />
                    TSS Balance
                    <Info className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className={`text-lg font-semibold flex items-center gap-1 ${
                    trainingReadiness.tssBalance > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trainingReadiness.tssBalance > 0 ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {Math.abs(trainingReadiness.tssBalance)}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-64">
                <div className="space-y-1">
                  <p className="font-medium text-sm">TSS Balance</p>
                  <p className="text-xs text-gray-600">
                    {trainingReadiness.tssBalance > 0 
                      ? `${Math.abs(trainingReadiness.tssBalance)} points under target - well rested` 
                      : trainingReadiness.tssBalance < 0 
                        ? `${Math.abs(trainingReadiness.tssBalance)} points over target - accumulating fatigue`
                        : 'On target - balanced'
                    }
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Weekly Progress */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="space-y-2 cursor-help">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Weekly TSS Progress</span>
                <span>{trainingReadiness.weeklyTSSCurrent} / {trainingReadiness.weeklyTSSTarget}</span>
              </div>
              <Progress 
                value={(trainingReadiness.weeklyTSSCurrent / trainingReadiness.weeklyTSSTarget) * 100} 
                className="h-2"
              />
              <div className="text-xs text-gray-500">
                Based on your personalized training target
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-64">
            <div className="space-y-1">
              <p className="font-medium text-sm">Personalized TSS Target</p>
              <p className="text-xs text-gray-600">
                Your weekly target is calculated based on your experience level and training preferences from your profile.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Recommendation & Workout Planning */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Recommended Workout</h4>
          <p className="text-sm text-blue-800 mb-3">
            {trainingReadiness.recommendation}
          </p>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => {
              // This would open workout planning when the feature is implemented
              alert('Workout planning feature coming soon! For now, check your Activity Feed for workout ideas.')
            }}
          >
            Plan Workout
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 