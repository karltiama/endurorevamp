'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUserActivities } from '@/hooks/use-user-activities'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { TrainingState, ActivityWithTrainingData } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

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

// Quick Log Modal Component
function QuickLogModal({ open, onOpenChange }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    sport_type: 'Run',
    duration: '',
    distance: '',
    notes: '',
    rpe: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const activityData = {
        user_id: user.id,
        name: formData.name,
        sport_type: formData.sport_type,
        moving_time: parseInt(formData.duration) * 60, // Convert minutes to seconds
        distance: formData.distance ? parseFloat(formData.distance) * 1000 : null, // Convert km to meters
        start_date: new Date().toISOString(),
        start_date_local: new Date().toISOString(),
        manual: true,
        description: formData.notes,
        perceived_exertion: formData.rpe ? parseInt(formData.rpe) : null
      }

      const { error } = await supabase
        .from('activities')
        .insert([activityData])

      if (error) throw error

      // Reset form and close modal
      setFormData({ name: '', sport_type: 'Run', duration: '', distance: '', notes: '', rpe: '' })
      onOpenChange(false)
    } catch (error) {
      console.error('Error logging activity:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Activity Log</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Activity Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Morning Run"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="sport_type">Activity Type</Label>
            <Select value={formData.sport_type} onValueChange={(value) => setFormData({ ...formData, sport_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Run">Run</SelectItem>
                <SelectItem value="Ride">Ride</SelectItem>
                <SelectItem value="Walk">Walk</SelectItem>
                <SelectItem value="Workout">Workout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="30"
                required
              />
            </div>
            <div>
              <Label htmlFor="distance">Distance (km)</Label>
              <Input
                id="distance"
                type="number"
                step="0.1"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                placeholder="5.0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="rpe">RPE (1-10)</Label>
            <Input
              id="rpe"
              type="number"
              min="1"
              max="10"
              value={formData.rpe}
              onChange={(e) => setFormData({ ...formData, rpe: e.target.value })}
              placeholder="6"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="How did it feel?"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging...' : 'Log Activity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// RPE Logging Modal Component
function RPELoggingModal({ open, onOpenChange, activity }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  activity?: StravaActivity;
}) {
  const [rpe, setRpe] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activity) return
    
    setIsSubmitting(true)
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('activities')
        .update({ perceived_exertion: parseInt(rpe) })
        .eq('id', activity.id)

      if (error) throw error

      setRpe('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating RPE:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Workout</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              How hard was your {activity?.name || 'workout'}?
            </p>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={rpe === value.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRpe(value.toString())}
                  className="h-12"
                >
                  {value}
                </Button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Very Easy</span>
              <span>Very Hard</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!rpe || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save RPE'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Helper functions moved above the component
const getDefaultActions = (router: ReturnType<typeof useRouter>, openQuickLog: () => void): QuickAction[] => [
  {
    id: 'connect-strava',
    title: 'Connect Strava',
    description: 'Link your Strava account',
    icon: <Activity className="h-4 w-4" />,
    priority: 'high',
    category: 'training',
    action: () => router.push('/dashboard/settings'),
    badge: 'Start Here'
  },
  {
    id: 'set-first-goal',
    title: 'Set Your First Goal',
    description: 'Define training objectives',
    icon: <Target className="h-4 w-4" />,
    priority: 'high',
    category: 'planning',
    action: () => router.push('/dashboard/goals'),
    badge: 'New'
  },
  {
    id: 'manual-entry',
    title: 'Log Workout',
    description: 'Add activity manually',
    icon: <Plus className="h-4 w-4" />,
    priority: 'medium',
    category: 'training',
    action: openQuickLog
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
    const tss = (activity as ActivityWithTrainingData).training_stress_score || estimateTSS(activity)
    return sum + tss
  }, 0)

  const averageRPE = recentActivities.reduce((sum, activity) => {
    const rpe = (activity as ActivityWithTrainingData).perceived_exertion || 5
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
  recentActivities: StravaActivity[],
  router: ReturnType<typeof useRouter>,
  openQuickLog: () => void,
  openRPELog: () => void
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
      action: openQuickLog,
      badge: 'Recommended'
    })
  }

  // RPE logging if recent workout
  if (recentActivity && !(recentActivity as ActivityWithTrainingData).perceived_exertion) {
    actions.push({
      id: 'log-rpe',
      title: 'Log RPE',
      description: 'Rate your last workout',
      icon: <TrendingUp className="h-4 w-4" />,
      priority: 'high',
      category: 'training',
      action: openRPELog,
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
      action: () => router.push('/dashboard/planning'),
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
      action: () => router.push('/dashboard/planning'),
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
    action: () => router.push('/dashboard/goals')
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
      action: () => router.push('/dashboard/analytics')
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
    action: openQuickLog
  })

  actions.push({
    id: 'view-calendar',
    title: 'Training Calendar',
    description: 'View planned workouts',
    icon: <Calendar className="h-4 w-4" />,
    priority: 'medium',
    category: 'planning',
    action: () => router.push('/dashboard/planning')
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
  const router = useRouter()
  const { data: activities, isLoading } = useUserActivities(userId)
  const [showQuickLog, setShowQuickLog] = useState(false)
  const [showRPELog, setShowRPELog] = useState(false)

  const openQuickLog = () => setShowQuickLog(true)
  const openRPELog = () => setShowRPELog(true)

  const contextualActions = useMemo((): QuickAction[] => {
    if (!activities || activities.length === 0) {
      return getDefaultActions(router, openQuickLog)
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

    return generateContextualActions(trainingState, recentActivity, recentActivities, router, openQuickLog, openRPELog)
  }, [activities, router])

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {contextualActions.map((action) => (
              <div
                key={action.id}
                className={`p-2 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(action.priority)}`}
                onClick={action.action}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="p-1 bg-white rounded-lg shadow-sm">
                    {action.icon}
                  </div>
                  {action.badge && (
                    <Badge className={`text-xs ${getBadgeColor(action.badge)}`}>
                      {action.badge}
                    </Badge>
                  )}
                </div>
                
                <h4 className="font-medium text-xs mb-1">{action.title}</h4>
                <p className="text-xs text-gray-600">{action.description}</p>
              </div>
            ))}
          </div>

          {/* Quick Stats - Compact */}
          <div className="mt-4 pt-3 border-t">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-sm font-bold">
                  {activities?.filter(a => new Date(a.start_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length || 0}
                </div>
                <div className="text-xs text-gray-600">Workouts this week</div>
              </div>
              <div>
                <div className="text-sm font-bold">
                  {activities && activities.length > 0 
                    ? Math.floor((Date.now() - new Date(activities[0].start_date).getTime()) / (24 * 60 * 60 * 1000))
                    : 'N/A'
                  }
                </div>
                <div className="text-xs text-gray-600">Days since last workout</div>
              </div>
              <div>
                <div className="text-sm font-bold">
                  {activities?.length ? Math.round(activities.slice(0, 5).reduce((sum, a) => sum + ((a as ActivityWithTrainingData).perceived_exertion || 5), 0) / Math.min(5, activities.length)) : 5}
                </div>
                <div className="text-xs text-gray-600">Avg RPE (last 5)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <QuickLogModal 
        open={showQuickLog} 
        onOpenChange={setShowQuickLog}
      />
      
      <RPELoggingModal 
        open={showRPELog} 
        onOpenChange={setShowRPELog}
        activity={activities?.find(a => new Date(a.start_date) >= new Date(Date.now() - 24 * 60 * 60 * 1000))}
      />
    </>
  )
} 