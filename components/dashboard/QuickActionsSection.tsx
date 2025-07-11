'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUserActivities } from '@/hooks/use-user-activities'
import { useMemo } from 'react'
import { 
  Plus,
  Heart,
  MapPin,
  Calendar,
  Target,
  TrendingUp,
  Activity,
  Clock,
  Users
} from 'lucide-react'
import { Activity as StravaActivity } from '@/lib/strava/types'
import { TrainingState } from '@/types'

interface QuickActionsSectionProps {
  userId: string
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  priority: 'high' | 'medium' | 'low'
  category: 'training' | 'recovery' | 'planning' | 'social'
  action: () => void
  disabled?: boolean
  badge?: string
}

// Helper functions moved above the component
const getDefaultActions = (): QuickAction[] => [
  {
    id: 'connect-strava',
    title: 'Connect Strava',
    description: 'Link your Strava account',
    icon: <Activity className="h-4 w-4" />,
    priority: 'high',
    category: 'training',
    action: () => console.log('Connect Strava'),
    badge: 'Start Here'
  },
  {
    id: 'set-first-goal',
    title: 'Set Your First Goal',
    description: 'Define training objectives',
    icon: <Target className="h-4 w-4" />,
    priority: 'high',
    category: 'planning',
    action: () => console.log('Set first goal'),
    badge: 'New'
  },
  {
    id: 'manual-entry',
    title: 'Log Workout',
    description: 'Add activity manually',
    icon: <Plus className="h-4 w-4" />,
    priority: 'medium',
    category: 'training',
    action: () => console.log('Manual entry')
  }
]

const estimateTSS = (activity: StravaActivity): number => {
  const durationHours = activity.moving_time / 3600
  const baseIntensity = activity.sport_type === 'Run' ? 70 : 60
  
  let intensityMultiplier = 1
  if (activity.average_heartrate) {
    intensityMultiplier = Math.max(0.5, Math.min(1.5, activity.average_heartrate / 140))
  }
  
  return durationHours * baseIntensity * intensityMultiplier
}

const calculateTrainingState = (recentActivities: StravaActivity[], activities: StravaActivity[]): TrainingState => {
  const totalTSS = recentActivities.reduce((sum, activity) => {
    const tss = (activity as any).training_stress_score || estimateTSS(activity)
    return sum + tss
  }, 0)

  const averageRPE = recentActivities.reduce((sum, activity) => {
    const rpe = (activity as any).perceived_exertion || 5
    return sum + rpe
  }, 0) / recentActivities.length

  const daysSinceLastWorkout = activities && activities.length > 0 
    ? Math.floor((Date.now() - new Date(activities[0].start_date).getTime()) / (24 * 60 * 60 * 1000))
    : 7

  return {
    weeklyTSS: totalTSS,
    averageRPE: averageRPE || 5,
    daysSinceLastWorkout,
    workoutCount: recentActivities.length,
    isRestNeeded: averageRPE > 7 || totalTSS > 500,
    isActiveRecovery: daysSinceLastWorkout === 1 && averageRPE > 6,
    isReadyForIntensity: daysSinceLastWorkout >= 2 && averageRPE < 6
  }
}

const generateContextualActions = (
  trainingState: TrainingState, 
  recentActivity: StravaActivity | undefined, 
  recentActivities: StravaActivity[]
): QuickAction[] => {
  const actions: QuickAction[] = []

  // Recovery-focused actions
  if (trainingState.isRestNeeded) {
    actions.push({
      id: 'log-recovery',
      title: 'Log Recovery Session',
      description: 'Track rest day activities',
      icon: <Heart className="h-4 w-4" />,
      priority: 'high',
      category: 'recovery',
      action: () => console.log('Log recovery'),
      badge: 'Recommended'
    })
  }

  // RPE logging if recent workout
  if (recentActivity && !(recentActivity as any).perceived_exertion) {
    actions.push({
      id: 'log-rpe',
      title: 'Log RPE',
      description: 'Rate your last workout',
      icon: <TrendingUp className="h-4 w-4" />,
      priority: 'high',
      category: 'training',
      action: () => console.log('Log RPE'),
      badge: 'Missing'
    })
  }

  // Training planning
  if (trainingState.isReadyForIntensity) {
    actions.push({
      id: 'plan-interval',
      title: 'Plan Interval Session',
      description: 'High intensity workout',
      icon: <Activity className="h-4 w-4" />,
      priority: 'high',
      category: 'planning',
      action: () => console.log('Plan interval'),
      badge: 'Ready'
    })
  } else if (trainingState.isActiveRecovery) {
    actions.push({
      id: 'plan-easy',
      title: 'Plan Easy Run',
      description: 'Active recovery session',
      icon: <MapPin className="h-4 w-4" />,
      priority: 'high',
      category: 'planning',
      action: () => console.log('Plan easy run'),
      badge: 'Recovery'
    })
  }

  // Goal setting if no recent goals activity
  actions.push({
    id: 'set-weekly-goal',
    title: 'Set Weekly Target',
    description: 'Plan your training week',
    icon: <Target className="h-4 w-4" />,
    priority: 'medium',
    category: 'planning',
    action: () => console.log('Set weekly goal')
  })

  // Social actions
  if (recentActivities.length > 0) {
    actions.push({
      id: 'share-progress',
      title: 'Share Progress',
      description: 'Update your training log',
      icon: <Users className="h-4 w-4" />,
      priority: 'low',
      category: 'social',
      action: () => console.log('Share progress')
    })
  }

  // Always available actions
  actions.push({
    id: 'quick-log',
    title: 'Quick Activity Log',
    description: 'Manual activity entry',
    icon: <Plus className="h-4 w-4" />,
    priority: 'medium',
    category: 'training',
    action: () => console.log('Quick log')
  })

  actions.push({
    id: 'view-calendar',
    title: 'Training Calendar',
    description: 'View planned workouts',
    icon: <Calendar className="h-4 w-4" />,
    priority: 'medium',
    category: 'planning',
    action: () => console.log('View calendar')
  })

  return actions.slice(0, 6) // Limit to 6 actions
}

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return 'border-red-200 bg-red-50'
    case 'medium': return 'border-blue-200 bg-blue-50'
    default: return 'border-gray-200 bg-gray-50'
  }
}

const getBadgeColor = (badge: string): string => {
  switch (badge) {
    case 'Recommended': return 'bg-green-100 text-green-800'
    case 'Missing': return 'bg-orange-100 text-orange-800'
    case 'Ready': return 'bg-blue-100 text-blue-800'
    case 'Recovery': return 'bg-purple-100 text-purple-800'
    case 'Start Here': return 'bg-red-100 text-red-800'
    case 'New': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function QuickActionsSection({ userId }: QuickActionsSectionProps) {
  const { data: activities, isLoading } = useUserActivities(userId)

  const contextualActions = useMemo((): QuickAction[] => {
    if (!activities || activities.length === 0) {
      return getDefaultActions()
    }

    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Check recent activity
    const recentActivity = activities.find(activity => 
      new Date(activity.start_date) >= yesterday
    )

    const recentActivities = activities.filter(activity => 
      new Date(activity.start_date) >= lastWeek
    )

    // Calculate training state
    const trainingState = calculateTrainingState(recentActivities, activities)

    return generateContextualActions(trainingState, recentActivity, recentActivities)
  }, [activities])



  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {contextualActions.map((action) => (
            <div
              key={action.id}
              className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(action.priority)}`}
              onClick={action.action}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {action.icon}
                </div>
                {action.badge && (
                  <Badge className={`text-xs ${getBadgeColor(action.badge)}`}>
                    {action.badge}
                  </Badge>
                )}
              </div>
              
              <h4 className="font-medium text-sm mb-1">{action.title}</h4>
              <p className="text-xs text-gray-600">{action.description}</p>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">
                {activities?.filter(a => new Date(a.start_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length || 0}
              </div>
              <div className="text-xs text-gray-600">This week</div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {activities ? Math.floor((Date.now() - new Date(activities[0]?.start_date || Date.now()).getTime()) / (24 * 60 * 60 * 1000)) : 0}
              </div>
              <div className="text-xs text-gray-600">Days since</div>
            </div>
            <div>
                             <div className="text-lg font-bold">
                 {activities?.length ? Math.round(activities.slice(0, 5).reduce((sum, a) => sum + ((a as any).perceived_exertion || 5), 0) / Math.min(5, activities.length)) : 5}
               </div>
              <div className="text-xs text-gray-600">Avg RPE</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 