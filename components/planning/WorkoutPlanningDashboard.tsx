'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Dumbbell,
  Clock,
  TrendingUp,
  Zap,
  Heart,
  Target,
  Calendar,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useWorkoutPlanning } from '@/hooks/useWorkoutPlanning';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import type { WorkoutRecommendation } from '@/lib/training/workout-planning';

interface WorkoutPlanningDashboardProps {
  userId: string;
  className?: string;
}

export function WorkoutPlanningDashboard({
  userId,
  className,
}: WorkoutPlanningDashboardProps) {
  const {
    todaysWorkout,
    weeklyPlan,
    isLoadingTodaysWorkout,
    isLoadingWeeklyPlan,
    hasData,
  } = useWorkoutPlanning({ userId });

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
              <p className="text-sm">
                Sync some activities to get personalized workout recommendations
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>
        {/* Today&apos;s Workout Recommendation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Today&apos;s Workout
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTodaysWorkout ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ) : todaysWorkout ? (
              <TodaysWorkoutCard workout={todaysWorkout} />
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Unable to generate workout recommendation</p>
                <p className="text-sm">
                  Check your training data and try again
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingWeeklyPlan ? (
              <div className="animate-pulse space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded" />
                  ))}
                </div>
              </div>
            ) : weeklyPlan && weeklyPlan.length > 0 ? (
              <WeeklyPlanGrid workouts={weeklyPlan} />
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <p>No weekly plan available</p>
                <p className="text-sm">
                  Complete more activities to generate a weekly plan
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

function TodaysWorkoutCard({ workout }: { workout: WorkoutRecommendation }) {
  const { preferences: unitPreferences } = useUnitPreferences();

  const getWorkoutTypeIcon = (type: string) => {
    switch (type) {
      case 'recovery':
        return Heart;
      case 'easy':
        return TrendingUp;
      case 'tempo':
        return Zap;
      case 'threshold':
        return Target;
      case 'long':
        return Clock;
      case 'strength':
        return Dumbbell;
      default:
        return Dumbbell;
    }
  };

  const WorkoutIcon = getWorkoutTypeIcon(workout.type);

  return (
    <div className="space-y-4">
      {/* Main Workout */}
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <WorkoutIcon className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold capitalize">
                {workout.type} {workout.sport}
              </h3>
              <p className="text-sm text-muted-foreground">{workout.sport}</p>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {workout.type}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-semibold">{workout.duration} min</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Intensity</p>
            <div className="flex items-center gap-2">
              <Progress value={workout.intensity * 10} className="flex-1" />
              <span className="text-sm font-medium">
                {workout.intensity}/10
              </span>
            </div>
          </div>
          {workout.distance && (
            <div>
              <p className="text-sm text-muted-foreground">Distance</p>
              <p className="font-semibold">
                {unitPreferences.distance === 'miles'
                  ? (() => {
                      const miles = workout.distance * 0.621371;
                      return `${miles % 1 === 0 ? miles.toFixed(0) : miles.toFixed(1)} mi`;
                    })()
                  : (() => {
                      const km = workout.distance;
                      return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`;
                    })()}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Why this workout?</p>
          <p className="text-sm">{workout.reasoning}</p>
        </div>

        {workout.weatherConsideration && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="flex items-center gap-1 text-blue-700">
              <Info className="h-4 w-4" />
              <span className="font-medium">Weather Note:</span>
            </div>
            <p className="text-blue-600 mt-1">{workout.weatherConsideration}</p>
          </div>
        )}
      </div>

      {/* Alternatives */}
      {workout.alternatives.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Alternative Workouts</h4>
          <div className="space-y-2">
            {workout.alternatives.map(alt => (
              <div key={alt.id} className="p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{alt.sport}</span>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {alt.type}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {alt.duration} min
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{alt.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WeeklyPlanGrid({ workouts }: { workouts: WorkoutRecommendation[] }) {
  // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();

  // Convert to Monday-based week (0 = Monday, 1 = Tuesday, etc.)
  const mondayBasedDay = today === 0 ? 6 : today - 1;

  // Always show Monday-Sunday order, but highlight today
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Find which position today should be in the Monday-Sunday order
  const todayPosition = mondayBasedDay;

  return (
    <div className="grid grid-cols-7 gap-2">
      {dayNames.map((dayName, index) => {
        // Calculate the workout index for this day
        // If today is Wednesday (index 2), and we're showing Monday (index 0),
        // we need workout index 2 (today's position - current day position)
        const workoutIndex = (todayPosition - index + 7) % 7;
        const workout = workouts[workoutIndex];
        const isToday = index === todayPosition;

        return (
          <div key={index} className="text-center">
            <div className="relative">
              <p
                className={`text-sm font-medium mb-2 ${isToday ? 'text-primary font-semibold' : ''}`}
              >
                {dayName}
              </p>
              {isToday && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                </div>
              )}
            </div>
            {workout ? (
              <div
                className={`p-2 border rounded-lg min-h-[80px] flex flex-col items-center justify-center ${
                  isToday ? 'bg-primary/10 border-primary/20' : 'bg-card'
                }`}
              >
                <div className="text-xs font-medium capitalize mb-1">
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
              <div
                className={`p-2 border rounded-lg min-h-[80px] flex items-center justify-center ${
                  isToday ? 'bg-primary/10 border-primary/20' : 'bg-muted/30'
                }`}
              >
                <span className="text-xs text-muted-foreground">Rest</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
