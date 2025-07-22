'use client'

import { useEnhancedWorkoutPlanning } from '@/hooks/useEnhancedWorkoutPlanning'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface WorkoutPlanDebuggerProps {
  userId: string
}

export function WorkoutPlanDebugger({ userId }: WorkoutPlanDebuggerProps) {
  const { 
    weeklyPlan, 
    isLoadingWeeklyPlan, 
    activities,
    trainingLoadData,
    goals,
    unitPreferences
  } = useEnhancedWorkoutPlanning({ userId })

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-sm">Workout Plan Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Weekly Plan ID:</strong> {weeklyPlan?.id || 'null'}
          </div>
          <div>
            <strong>Week Start:</strong> {weeklyPlan?.weekStart || 'null'}
          </div>
          <div>
            <strong>Loading:</strong> <Badge variant={isLoadingWeeklyPlan ? 'destructive' : 'default'}>{isLoadingWeeklyPlan ? 'Yes' : 'No'}</Badge>
          </div>
          <div>
            <strong>Workouts Count:</strong> {Object.values(weeklyPlan?.workouts || {}).filter(w => w !== null).length}
          </div>
        </div>
        
        <div className="border-t pt-2">
          <strong>Data Dependencies:</strong>
          <div className="grid grid-cols-2 gap-1 mt-1">
            <div>Activities: {activities?.length || 0}</div>
            <div>Goals: {goals?.length || 0}</div>
            <div>Training Load: {trainingLoadData?.metrics ? 'Yes' : 'No'}</div>
            <div>Unit Prefs: {unitPreferences ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div className="border-t pt-2">
          <strong>Weekly Plan Workouts:</strong>
          <div className="mt-1 space-y-1">
            {weeklyPlan?.workouts && Object.entries(weeklyPlan.workouts).map(([day, workout]) => (
              <div key={day} className="flex justify-between">
                <span>Day {day}:</span>
                <span>{workout ? `${(workout as any).type} ${(workout as any).sport} (${(workout as any).duration}min)` : 'Rest'}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 