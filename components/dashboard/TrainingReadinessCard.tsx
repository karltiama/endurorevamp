'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUserActivities } from '@/hooks/use-user-activities'
import { usePersonalizedTSSTarget } from '@/hooks/useTrainingProfile'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Battery, 
  Heart, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  Info,
  Target
} from 'lucide-react'
import { ActivityWithTrainingData } from '@/types'
import { getCurrentWeekBoundaries } from '@/lib/utils'

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
    case 'high': return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />
    case 'low': return <AlertTriangle className="h-4 w-4 text-red-600" />
    default: return <Activity className="h-4 w-4 text-gray-600" />
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
  const router = useRouter()

  const trainingReadiness = useMemo((): TrainingReadiness | null => {
    if (!activities || activities.length === 0) return null

    // Get current week activities (Monday to Sunday)
    const { start: currentWeekStart, end: currentWeekEnd } = getCurrentWeekBoundaries()

    // Filter activities for current week
    const thisWeekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.start_date)
      return activityDate >= currentWeekStart && activityDate <= currentWeekEnd
    })

    // Get the most recent activity from ALL activities (not just this week)
    // This ensures Last RPE shows the actual last workout, not just this week's last workout
    const lastActivity = activities[0] // Activities are already sorted by date descending
    const now = new Date()
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
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Battery className="h-5 w-5" />
            Training Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-100 rounded-lg"></div>
            <div className="h-12 bg-gray-100 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !trainingReadiness) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Battery className="h-5 w-5" />
            Training Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No recent activity data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Battery className="h-5 w-5" />
          Training Readiness
          <Badge variant="outline" className="ml-auto">
            Today
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Readiness Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getReadinessIcon(trainingReadiness.readinessLevel)}
            <div>
              <div className="font-semibold text-lg">
                {trainingReadiness.recoveryScore}%
              </div>
              <div className="text-sm text-gray-600">Recovery Score</div>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`${getReadinessColor(trainingReadiness.readinessLevel)}`}
          >
            {trainingReadiness.readinessLevel.toUpperCase()} READINESS
          </Badge>
        </div>
        
        <Progress 
          value={trainingReadiness.recoveryScore} 
          className="h-2"
        />

        {/* Compact Metrics Grid */}
        <TooltipProvider>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                <Heart className="h-3 w-3" />
                Last RPE
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-64">
                    <p className="text-xs">Rate of Perceived Exertion from your last workout</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-lg font-semibold">
                {trainingReadiness.lastRPE ? `${trainingReadiness.lastRPE}/10` : 'N/A'}
              </div>
            </div>
            
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                <Zap className="h-3 w-3" />
                TSS Balance
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-64">
                    <p className="text-xs">
                      {trainingReadiness.tssBalance > 0 
                        ? 'Points under target - well rested' 
                        : trainingReadiness.tssBalance < 0 
                          ? 'Points over target - accumulating fatigue'
                          : 'On target - balanced'
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className={`text-lg font-semibold flex items-center justify-center gap-1 ${
                trainingReadiness.tssBalance > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trainingReadiness.tssBalance > 0 ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {Math.abs(trainingReadiness.tssBalance)}
              </div>
            </div>

            <div className="text-center p-2 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                <Target className="h-3 w-3" />
                Weekly Progress
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-64">
                    <p className="text-xs">Your weekly TSS progress vs personalized target</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-lg font-semibold">
                {Math.round((trainingReadiness.weeklyTSSCurrent / trainingReadiness.weeklyTSSTarget) * 100)}%
              </div>
            </div>
          </div>
        </TooltipProvider>

        {/* Recommendation & Action */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-1 text-sm">Recommended Workout</h4>
          <p className="text-sm text-blue-800 mb-2">
            {trainingReadiness.recommendation}
          </p>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => {
              router.push('/dashboard/planning')
            }}
          >
            Plan Workout
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 