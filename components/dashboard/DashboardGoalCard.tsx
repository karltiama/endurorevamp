'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserGoal } from '@/types/goals';
import {
  Target,
  TrendingUp,
  Calendar,
  Zap,
  Clock,
  Heart,
  Mountain,
  CheckCircle,
} from 'lucide-react';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import {
  formatDistance,
  formatPace,
  convertPace,
  type DistanceUnit,
  type PaceUnit,
} from '@/lib/utils';

interface DashboardGoalCardProps {
  goal: UserGoal;
  priority: number;
}

export function DashboardGoalCard({ goal, priority }: DashboardGoalCardProps) {
  const { preferences } = useUnitPreferences();

  const progressPercentage = goal.target_value
    ? Math.min(100, (goal.current_progress / goal.target_value) * 100)
    : 0;

  const isCompleted = goal.is_completed || progressPercentage >= 100;
  const isOnTrack = progressPercentage >= 50;

  const getGoalIcon = (category?: string) => {
    switch (category) {
      case 'distance':
        return Target;
      case 'pace':
        return Zap;
      case 'frequency':
        return Calendar;
      case 'duration':
        return Clock;
      case 'elevation':
        return Mountain;
      case 'heart_rate':
        return Heart;
      default:
        return TrendingUp;
    }
  };

  const formatGoalValue = (
    value: number,
    goal: UserGoal,
    unit: DistanceUnit
  ) => {
    if (goal.goal_type?.category === 'distance') {
      // Value is already in km from database, so convert to meters for formatDistance
      return formatDistance(value * 1000, unit);
    }
    if (goal.goal_type?.category === 'pace') {
      const convertedValue = convertPace(value, unit as PaceUnit);
      return formatPace(convertedValue, unit as PaceUnit);
    }
    return `${value} ${goal.target_unit}`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-blue-600';
    return 'text-orange-600';
  };

  const GoalIcon = getGoalIcon(goal.goal_type?.category);

  return (
    <Card
      className={`
      transition-all duration-200 hover:shadow-md cursor-pointer
      ${isCompleted ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : ''}
      ${!isCompleted && isOnTrack ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50' : ''}
      ${!isCompleted && !isOnTrack ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50' : ''}
    `}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`
              p-2 rounded-lg flex-shrink-0
              ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}
            `}
            >
              <GoalIcon className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">
                  {goal.goal_type?.display_name}
                </h3>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  #{priority}
                </Badge>
                {isCompleted && (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 text-xs flex-shrink-0"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Done
                  </Badge>
                )}
              </div>

              {goal.goal_data?.notes && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {goal.goal_data.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Target & Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Target</span>
              <span className="font-medium">
                {goal.target_value
                  ? formatGoalValue(
                      goal.target_value,
                      goal,
                      preferences.distance
                    )
                  : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span
                className={`font-medium ${getProgressColor(progressPercentage)}`}
              >
                {goal.target_value
                  ? formatGoalValue(
                      goal.current_progress,
                      goal,
                      preferences.distance
                    )
                  : '0'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <Progress
                value={progressPercentage}
                className={`h-2 ${isCompleted ? '[&>div]:bg-green-500' : ''}`}
              />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {Math.round(progressPercentage)}% complete
                </span>
                {goal.target_value &&
                  goal.target_value > goal.current_progress && (
                    <span className="text-muted-foreground">
                      {formatGoalValue(
                        goal.target_value - goal.current_progress,
                        goal,
                        preferences.distance
                      )}{' '}
                      left
                    </span>
                  )}
              </div>
            </div>
          </div>

          {/* Due Date */}
          {goal.target_date && (
            <div className="text-xs text-muted-foreground">
              Due: {new Date(goal.target_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
