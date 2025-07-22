'use client'

import { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { 
  Clock, 
  TrendingUp, 
  Zap, 
  Heart, 
  Target, 
  Dumbbell,
  Edit3,
  Save,
  Trash2,
  Loader2,
  RotateCcw,
  Info
} from 'lucide-react'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { convertDistance } from '@/lib/utils'
import type { EnhancedWorkoutRecommendation, WeeklyWorkoutPlan } from '@/lib/training/enhanced-workout-planning'

// Fallback plan creation function
function createFallbackWeeklyPlan(): WeeklyWorkoutPlan {
  const weekStart = new Date().toISOString().split('T')[0]
  const workouts: { [dayOfWeek: number]: EnhancedWorkoutRecommendation | null } = {}
  
  // Create a basic weekly plan with 3-4 workouts
  for (let day = 0; day < 7; day++) {
    if (day === 0 || day === 3 || day === 5) {
      // Monday, Thursday, Saturday - workout days
      workouts[day] = {
        id: `fallback-${day}-${Date.now()}`,
        type: 'easy',
        sport: 'Run',
        duration: 30,
        intensity: 4,
        distance: 5,
        difficulty: 'beginner',
        energyCost: 4,
        recoveryTime: 12,
        reasoning: 'Basic training session to maintain fitness.',
        alternatives: [],
        instructions: [
          'Start with 5 minutes of walking',
          'Gradually increase to easy jogging',
          'Keep pace comfortable and conversational',
          'Finish with 5 minutes of walking'
        ],
        tips: [
          'Focus on consistency over intensity',
          'Listen to your body',
          'Stay hydrated throughout'
        ]
      }
    } else {
      // Rest days
      workouts[day] = null
    }
  }

  return {
    id: `fallback-week-${weekStart}`,
    weekStart,
    workouts,
    totalTSS: 120,
    totalDistance: 15,
    totalTime: 90,
    periodizationPhase: 'base',
    isEditable: true
  }
}

interface WorkoutPlanEditorModalProps {
  weeklyPlan: WeeklyWorkoutPlan
  isOpen: boolean
  onClose: () => void
  onSave: (updatedPlan: WeeklyWorkoutPlan) => void
  onResetToRecommended?: () => Promise<{ success: boolean; result?: unknown; newPlan?: WeeklyWorkoutPlan | null; error?: unknown }>
}

const WORKOUT_TYPES = [
  { value: 'recovery', label: 'Recovery', icon: Heart, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'easy', label: 'Easy', icon: TrendingUp, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'tempo', label: 'Tempo', icon: Zap, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'threshold', label: 'Threshold', icon: Target, color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'long', label: 'Long', icon: Clock, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'strength', label: 'Strength', icon: Dumbbell, color: 'text-gray-600 bg-gray-50 border-gray-200' },
  { value: 'interval', label: 'Interval', icon: Zap, color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'fartlek', label: 'Fartlek', icon: TrendingUp, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'hill', label: 'Hill', icon: TrendingUp, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' }
]

const SPORTS = [
  { value: 'Run', label: 'Running' },
  { value: 'WeightTraining', label: 'Weight Training' }
]

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Helper functions for dynamic field visibility
function shouldShowDistanceField(workoutType: string, sport: string): boolean {
  return sport === 'Run' && !['strength'].includes(workoutType)
}

function shouldShowIntensityField(workoutType: string, sport: string): boolean {
  return sport === 'Run'
}

function shouldShowEnergyCostField(): boolean {
  return true // Always show for now
}

function getDefaultDuration(workoutType: string, sport: string): number {
  if (sport === 'WeightTraining') return 60
  switch (workoutType) {
    case 'recovery': return 30
    case 'easy': return 45
    case 'tempo': return 60
    case 'threshold': return 45
    case 'long': return 90
    case 'strength': return 45
    case 'interval': return 60
    case 'fartlek': return 45
    case 'hill': return 60
    default: return 45
  }
}

function getDefaultIntensity(workoutType: string, sport: string): number {
  if (sport === 'WeightTraining') return 7
  switch (workoutType) {
    case 'recovery': return 3
    case 'easy': return 4
    case 'tempo': return 7
    case 'threshold': return 8
    case 'long': return 5
    case 'strength': return 6
    case 'interval': return 9
    case 'fartlek': return 6
    case 'hill': return 7
    default: return 5
  }
}

function getDefaultDistance(workoutType: string, sport: string): number | undefined {
  if (sport === 'WeightTraining') return undefined
  switch (workoutType) {
    case 'recovery': return 3
    case 'easy': return 5
    case 'tempo': return 8
    case 'threshold': return 10
    case 'long': return 15
    case 'strength': return undefined
    case 'interval': return 6
    case 'fartlek': return 7
    case 'hill': return 8
    default: return 5
  }
}

export function WorkoutPlanEditorModal({ 
  weeklyPlan, 
  isOpen, 
  onClose, 
  onSave, 
  onResetToRecommended
}: WorkoutPlanEditorModalProps) {
  const [plan, setPlan] = useState<WeeklyWorkoutPlan>(weeklyPlan)
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetConfirmation, setShowResetConfirmation] = useState(false)
  const { preferences: unitPreferences } = useUnitPreferences()

  // Update plan when weeklyPlan prop changes
  useEffect(() => {
    console.log('WorkoutPlanEditorModal: weeklyPlan prop changed:', weeklyPlan?.id, weeklyPlan?.weekStart)
    setPlan(weeklyPlan)
    setEditingDay(null) // Reset editing state when plan changes
  }, [weeklyPlan])

  // Debug logging for modal states
  useEffect(() => {
    console.log('WorkoutPlanEditorModal: Modal state - editingDay:', editingDay, 'isResetting:', isResetting, 'showResetConfirmation:', showResetConfirmation)
  }, [editingDay, isResetting, showResetConfirmation])

  const handleWorkoutUpdate = useCallback((dayIndex: number, workout: EnhancedWorkoutRecommendation | null) => {
    const updatedPlan = { ...plan }
    updatedPlan.workouts[dayIndex] = workout

    // Recalculate totals
    updatedPlan.totalTSS = calculateWeeklyTSS(updatedPlan.workouts)
    updatedPlan.totalDistance = calculateWeeklyDistance(updatedPlan.workouts)
    updatedPlan.totalTime = calculateWeeklyTime(updatedPlan.workouts)

    if (!updatedPlan.periodizationPhase) {
      updatedPlan.periodizationPhase = 'base'
    }

    setPlan(updatedPlan)
    setEditingDay(null)
  }, [plan])

  const handleSave = useCallback(() => {
    console.log('WorkoutPlanEditorModal: handleSave called')
    console.log('WorkoutPlanEditorModal: Saving plan with workouts:', Object.values(plan.workouts).filter(w => w !== null).length)
    onSave(plan)
    onClose()
  }, [plan, onSave, onClose])

  const handleReset = useCallback(() => {
    setPlan(weeklyPlan)
    setEditingDay(null)
  }, [weeklyPlan])

  const handleResetToRecommended = useCallback(async () => {
    if (!onResetToRecommended) return
    
    setIsResetting(true)
    
    // Close any open nested modal first
    setEditingDay(null)
    
    try {
      console.log('handleResetToRecommended: Starting reset')
      const resetResult = await onResetToRecommended()
      
      if (resetResult?.success) {
        if (resetResult?.newPlan) {
          console.log('handleResetToRecommended: Loading new plan into modal')
          setPlan(resetResult.newPlan)
        } else {
          console.log('handleResetToRecommended: Using fallback plan')
          const fallbackPlan = createFallbackWeeklyPlan()
          setPlan(fallbackPlan)
        }
        setShowResetConfirmation(false)
      } else {
        console.error('handleResetToRecommended: Reset failed:', resetResult?.error)
        // Use fallback plan on failure
        const fallbackPlan = createFallbackWeeklyPlan()
        setPlan(fallbackPlan)
        setShowResetConfirmation(false)
      }
    } catch (error) {
      console.error('Failed to reset to recommended:', error)
      // Still show fallback plan
      const fallbackPlan = createFallbackWeeklyPlan()
      setPlan(fallbackPlan)
      setShowResetConfirmation(false)
    } finally {
      setIsResetting(false)
    }
  }, [onResetToRecommended])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="workout-editor-description">
        <div className="sr-only" id="workout-editor-description">
          Edit your weekly workout plan. You can modify individual workouts, add new workouts, or reset to AI recommendations.
        </div>
        
        <DialogHeader>
          <DialogTitle>Edit Weekly Workout Plan</DialogTitle>
          <DialogDescription>
            Customize your weekly workout plan. Click on any day to edit the workout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Week Overview */}
          <div className="grid grid-cols-7 gap-2">
            {DAY_NAMES.map((dayName) => (
              <div key={dayName} className="text-center font-medium text-sm">
                {dayName}
              </div>
            ))}
            {Array.from({ length: 7 }, (_, index) => {
              const workout = plan.workouts[index]
              return (
                <div
                  key={index}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    workout
                      ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => setEditingDay(index)}
                >
                  {workout ? (
                    <div className="space-y-1">
                      <div className="font-medium text-sm capitalize">
                        {workout.type}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {workout.duration}min
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {workout.sport}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm">
                      Rest
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Weekly Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{calculateWeeklyTSS(plan.workouts)}</div>
              <div className="text-sm text-muted-foreground">Total TSS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {unitPreferences.distance === 'miles' ? 
                  (() => {
                    const miles = convertDistance(calculateWeeklyDistance(plan.workouts) * 1000, 'miles')
                    return miles % 1 === 0 ? miles.toFixed(0) : miles.toFixed(1)
                  })() : 
                  (() => {
                    const km = calculateWeeklyDistance(plan.workouts)
                    return km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)
                  })()
                }
              </div>
              <div className="text-sm text-muted-foreground">
                Distance ({unitPreferences.distance === 'miles' ? 'mi' : 'km'})
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{calculateWeeklyTime(plan.workouts)}</div>
              <div className="text-sm text-muted-foreground">Time (min)</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset Changes
            </Button>
            {onResetToRecommended && (
              <Button 
                variant="outline" 
                onClick={() => setShowResetConfirmation(true)}
                disabled={isResetting || editingDay !== null}
                title={editingDay !== null ? "Close the workout editor first" : "Reset to recommended plan"}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Recommended
                  </>
                )}
              </Button>
            )}
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>

          {/* Simple Reset Confirmation Dialog */}
          {showResetConfirmation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background p-6 rounded-lg max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">Reset to Recommended Plan?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  This will replace your current plan with AI-generated recommendations. 
                  You can review and edit the new plan before saving.
                </p>
                {editingDay !== null && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Please close the workout editor first to avoid conflicts.
                    </p>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowResetConfirmation(false)}
                    disabled={isResetting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={handleResetToRecommended}
                    disabled={isResetting || editingDay !== null}
                    data-testid="confirm-reset-to-recommended"
                  >
                    {isResetting ? 'Resetting...' : 'Confirm Reset'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Workout Editor Modal */}
        {editingDay !== null && (
          <WorkoutEditorModal
            dayName={DAY_NAMES[editingDay]}
            workout={plan.workouts[editingDay]}
            onSave={(workout) => handleWorkoutUpdate(editingDay, workout)}
            onCancel={() => setEditingDay(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface WorkoutEditorModalProps {
  dayName: string
  workout: EnhancedWorkoutRecommendation | null
  onSave: (workout: EnhancedWorkoutRecommendation | null) => void
  onCancel: () => void
}

function WorkoutEditorModal({
  dayName,
  workout,
  onSave,
  onCancel
}: WorkoutEditorModalProps) {
  const [editingWorkout, setEditingWorkout] = useState<EnhancedWorkoutRecommendation | null>(workout)
  const [isCreating, setIsCreating] = useState(!workout)
  const { preferences: unitPreferences } = useUnitPreferences()

  const handleSave = useCallback(() => {
    onSave(editingWorkout)
  }, [editingWorkout, onSave])

  const handleDelete = useCallback(() => {
    onSave(null)
  }, [onSave])

  const handleUpdateField = useCallback((field: keyof EnhancedWorkoutRecommendation, value: unknown) => {
    if (!editingWorkout) return
    setEditingWorkout({ ...editingWorkout, [field]: value })
  }, [editingWorkout])

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="workout-editor-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            {isCreating ? `Add Workout for ${dayName}` : `Edit ${dayName} Workout`}
          </DialogTitle>
        </DialogHeader>

        <div id="workout-editor-description" className="sr-only">
          {isCreating ? `Add a new workout for ${dayName}` : `Edit the workout for ${dayName}`}
        </div>

        <div className="space-y-6">
          {isCreating ? (
            <div className="space-y-4">
              <div>
                <Label>Choose Sport</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 mb-4">
                  {SPORTS.map((sport) => (
                    <Button
                      key={sport.value}
                      variant="outline"
                      className="h-auto p-4 flex-col gap-2"
                      onClick={() => {
                        // Show workout types for selected sport
                        setEditingWorkout({
                          id: `temp-${Date.now()}`,
                          type: 'easy',
                          sport: sport.value as "Run" | "WeightTraining",
                          duration: getDefaultDuration('easy', sport.value),
                          intensity: getDefaultIntensity('easy', sport.value),
                          distance: getDefaultDistance('easy', sport.value),
                          difficulty: 'intermediate',
                          energyCost: 5,
                          recoveryTime: 24,
                          reasoning: '',
                          alternatives: [],
                          instructions: [],
                          tips: []
                        })
                        setIsCreating(false)
                      }}
                    >
                      <span className="text-sm font-medium">{sport.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {sport.value === 'Run' ? 'Cardio & Endurance' : 'Strength & Power'}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : editingWorkout ? (
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Workout Type</Label>
                  <Select 
                    value={editingWorkout.type} 
                    onValueChange={(value) => {
                      handleUpdateField('type', value)
                      // Auto-update related fields when workout type changes
                      const newDuration = getDefaultDuration(value, editingWorkout.sport)
                      const newIntensity = getDefaultIntensity(value, editingWorkout.sport)
                      const newDistance = getDefaultDistance(value, editingWorkout.sport)
                      
                      setEditingWorkout(prev => prev ? {
                        ...prev,
                        type: value as "easy" | "tempo" | "threshold" | "long" | "recovery" | "strength" | "cross-training" | "interval" | "fartlek" | "hill",
                        duration: newDuration,
                        intensity: newIntensity,
                        distance: newDistance
                      } : null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKOUT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sport</Label>
                  <Select 
                    value={editingWorkout.sport} 
                    onValueChange={(value) => {
                      handleUpdateField('sport', value)
                      // Auto-update related fields when sport changes
                      const newDuration = getDefaultDuration(editingWorkout.type, value)
                      const newIntensity = getDefaultIntensity(editingWorkout.type, value)
                      const newDistance = getDefaultDistance(editingWorkout.type, value)
                      
                      setEditingWorkout(prev => prev ? {
                        ...prev,
                        sport: value as "Run" | "WeightTraining",
                        duration: newDuration,
                        intensity: newIntensity,
                        distance: newDistance
                      } : null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPORTS.map((sport) => (
                        <SelectItem key={sport.value} value={sport.value}>
                          {sport.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={editingWorkout.duration}
                    onChange={(e) => handleUpdateField('duration', parseInt(e.target.value))}
                    min="10"
                    max="300"
                  />
                </div>
                {shouldShowIntensityField(editingWorkout.type, editingWorkout.sport) && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label>Intensity (1-10)</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <div className="space-y-2">
                              <p className="font-medium">Intensity (RPE Scale)</p>
                              <p className="text-sm">How hard the workout feels subjectively:</p>
                              <ul className="text-xs space-y-1">
                                <li><strong>1-3:</strong> Very Easy (walking, light stretching)</li>
                                <li><strong>4-5:</strong> Easy (jogging, light resistance)</li>
                                <li><strong>6-7:</strong> Moderate (comfortable but challenging)</li>
                                <li><strong>8-9:</strong> Hard (breathing heavily, pushing limits)</li>
                                <li><strong>10:</strong> Maximum (all-out effort)</li>
                              </ul>
                              <p className="text-xs text-muted-foreground mt-2">
                                Used for real-time pacing and workout guidance.
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      type="number"
                      value={editingWorkout.intensity}
                      onChange={(e) => handleUpdateField('intensity', parseInt(e.target.value))}
                      min="1"
                      max="10"
                    />
                  </div>
                )}
                <div>
                  <Label>Difficulty</Label>
                  <Select 
                    value={editingWorkout.difficulty} 
                    onValueChange={(value) => handleUpdateField('difficulty', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {shouldShowDistanceField(editingWorkout.type, editingWorkout.sport) && (
                  <div>
                    <Label>Distance ({unitPreferences.distance === 'miles' ? 'mi' : 'km'})</Label>
                    <Input
                      type="number"
                      value={editingWorkout.distance ? 
                        (unitPreferences.distance === 'miles' ? 
                          (() => {
                            const miles = convertDistance(editingWorkout.distance * 1000, 'miles')
                            return miles % 1 === 0 ? miles.toFixed(0) : miles.toFixed(1)
                          })() : 
                          (() => {
                            const km = editingWorkout.distance
                            return km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)
                          })()
                        ) : ''
                      }
                      onChange={(e) => {
                        const inputValue = e.target.value ? parseFloat(e.target.value) : undefined
                        if (inputValue !== undefined) {
                          // Convert back to km for storage if user is in miles
                          const distanceInKm = unitPreferences.distance === 'miles' ? 
                            convertDistance(inputValue * 1609.34, 'km') / 1000 : 
                            inputValue
                          handleUpdateField('distance', distanceInKm)
                        } else {
                          handleUpdateField('distance', undefined)
                        }
                      }}
                      step="0.1"
                    />
                  </div>
                )}
                {shouldShowEnergyCostField() && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label>Energy Cost (1-10)</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <div className="space-y-2">
                              <p className="font-medium">Energy Cost (Metabolic Load)</p>
                              <p className="text-sm">The actual physiological demand and calories burned:</p>
                              <ul className="text-xs space-y-1">
                                <li><strong>1-3:</strong> Low (walking, light stretching)</li>
                                <li><strong>4-6:</strong> Moderate (jogging, moderate resistance)</li>
                                <li><strong>7-8:</strong> High (running, heavy lifting)</li>
                                <li><strong>9-10:</strong> Very High (sprinting, max effort)</li>
                              </ul>
                              <p className="text-xs text-muted-foreground mt-2">
                                Used for training load calculation and recovery planning.
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      type="number"
                      value={editingWorkout.energyCost}
                      onChange={(e) => handleUpdateField('energyCost', parseInt(e.target.value))}
                      min="1"
                      max="10"
                    />
                  </div>
                )}
              </div>

                             <div>
                 <Label>Reasoning</Label>
                 <textarea
                   value={editingWorkout.reasoning}
                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdateField('reasoning', e.target.value)}
                   rows={3}
                   className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                 />
               </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4">
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Workout
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Workout
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Utility functions

function calculateWeeklyTSS(workouts: { [dayOfWeek: number]: EnhancedWorkoutRecommendation | null }): number {
  return Math.round(Object.values(workouts)
    .filter(workout => workout !== null)
    .reduce((total, workout) => {
      const tss = (workout!.duration / 60) * (workout!.intensity / 10) * 100
      return total + tss
    }, 0))
}

function calculateWeeklyDistance(workouts: { [dayOfWeek: number]: EnhancedWorkoutRecommendation | null }): number {
  return Math.round(Object.values(workouts)
    .filter(workout => workout !== null)
    .reduce((total, workout) => total + (workout!.distance || 0), 0) * 100) / 100 // Round to 2 decimal places
}

function calculateWeeklyTime(workouts: { [dayOfWeek: number]: EnhancedWorkoutRecommendation | null }): number {
  return Math.round(Object.values(workouts)
    .filter(workout => workout !== null)
    .reduce((total, workout) => total + workout!.duration, 0)) // Round to nearest integer
} 