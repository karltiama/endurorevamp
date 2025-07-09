'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UserGoal } from '@/types/goals';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Edit, 
  CheckCircle, 
  MoreHorizontal,
  Archive
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GoalCardProps {
  goal: UserGoal;
  onEdit: () => void;
  showCompleted?: boolean;
}

export function GoalCard({ goal, onEdit, showCompleted = false }: GoalCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const progressPercentage = goal.target_value 
    ? Math.min(100, (goal.current_progress / goal.target_value) * 100)
    : 0;

  const isCompleted = goal.is_completed || progressPercentage >= 100;
  const isOnTrack = progressPercentage >= 50; // Simple heuristic

  const handleToggleComplete = async () => {
    setIsUpdating(true);
    try {
      // TODO: Implement toggle completion API call
      console.log('Toggle completion for goal:', goal.id);
    } catch (error) {
      console.error('Failed to toggle goal completion:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getGoalIcon = () => {
    if (goal.goal_type?.category === 'distance') return Target;
    if (goal.goal_type?.category === 'event') return Calendar;
    return TrendingUp;
  };

  const GoalIcon = getGoalIcon();

  return (
    <Card className={`transition-all hover:shadow-md ${isCompleted ? 'border-green-200 bg-green-50/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
              <GoalIcon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{goal.goal_type?.display_name}</CardTitle>
              {goal.goal_data?.notes && (
                <p className="text-sm text-muted-foreground mt-1">
                  {goal.goal_data.notes}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isCompleted && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Goal
                </DropdownMenuItem>
                {!showCompleted && (
                  <DropdownMenuItem 
                    onClick={handleToggleComplete}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Target & Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Target</span>
            <span className="font-medium">
              {goal.target_value} {goal.target_unit}
              {goal.target_date && (
                <span className="text-muted-foreground ml-2">
                  by {formatDate(goal.target_date)}
                </span>
              )}
            </span>
          </div>

          {goal.target_value && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {goal.current_progress} / {goal.target_value} {goal.target_unit}
                </span>
              </div>
              
              <Progress 
                value={progressPercentage} 
                className={`h-2 ${isCompleted ? '[&>div]:bg-green-500' : ''}`}
              />
              
              <div className="flex items-center justify-between text-xs">
                <span className={`${isOnTrack ? 'text-green-600' : 'text-orange-600'}`}>
                  {Math.round(progressPercentage)}% complete
                </span>
                {goal.target_value > goal.current_progress && (
                  <span className="text-muted-foreground">
                    {(goal.target_value - goal.current_progress).toFixed(1)} {goal.target_unit} remaining
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Goal Type Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {goal.goal_type?.category}
          </Badge>
          
          {goal.last_progress_update && (
            <span className="text-xs text-muted-foreground">
              Updated {formatDate(goal.last_progress_update)}
            </span>
          )}
        </div>

        {/* Quick Actions */}
        {!showCompleted && !isCompleted && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="w-full"
            >
              <Edit className="h-3 w-3 mr-2" />
              Edit Goal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 