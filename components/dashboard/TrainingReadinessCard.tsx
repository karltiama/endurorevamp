'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
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
  TrendingUp,
  TrendingDown,
  Activity
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

    // Get activities from last 7 days, sorted by date
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const recentActivities = activities
      .filter(a => new Date(a.start_date) >= lastWeek)
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

    const lastActivity = recentActivities[0]
    const daysSinceLastWorkout = lastActivity 
      ? Math.floor((now.getTime() - new Date(lastActivity.start_date).getTime()) / (1000 * 60 * 60 * 24))
      : 7

         // Calculate weekly TSS (use training_stress_score if available, otherwise estimate)
     const weeklyTSSCurrent = recentActivities.reduce((sum, activity) => {
       // Use actual TSS if available, otherwise estimate based on duration and intensity
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
  }, [activities])





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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Heart className="h-4 w-4" />
              Last RPE
            </div>
            <div className="text-lg font-semibold">
              {trainingReadiness.lastRPE ? `${trainingReadiness.lastRPE}/10` : 'N/A'}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Zap className="h-4 w-4" />
              TSS Balance
            </div>
            <div className={`text-lg font-semibold flex items-center gap-1 ${
              trainingReadiness.tssBalance > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trainingReadiness.tssBalance > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(trainingReadiness.tssBalance)}
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Weekly TSS Progress</span>
            <span>{trainingReadiness.weeklyTSSCurrent} / {trainingReadiness.weeklyTSSTarget}</span>
          </div>
          <Progress 
            value={(trainingReadiness.weeklyTSSCurrent / trainingReadiness.weeklyTSSTarget) * 100} 
            className="h-2"
          />
        </div>

        {/* Recommendation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Recommendation</h4>
          <p className="text-sm text-blue-800">
            {trainingReadiness.recommendation}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            Log RPE
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Plan Workout
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 