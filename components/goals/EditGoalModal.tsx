'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUpdateGoal, useDeleteGoal } from '@/hooks/useGoals';
import { UserGoal } from '@/types/goals';
import { Trash2 } from 'lucide-react';
import { CheckCircle, User, AlertCircle } from 'lucide-react';

interface EditGoalModalProps {
  goal: UserGoal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGoalModal({
  goal,
  open,
  onOpenChange,
}: EditGoalModalProps) {
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState({
    targetValue: goal.target_value || 0,
    targetDate: goal.target_date || '',
    notes: goal.goal_data?.notes || '',
    currentProgress: goal.current_progress || 0,
    isCompleted: goal.is_completed || false,
  });

  // Reset form when goal changes
  useEffect(() => {
    setFormData({
      targetValue: goal.target_value || 0,
      targetDate: goal.target_date || '',
      notes: goal.goal_data?.notes || '',
      currentProgress: goal.current_progress || 0,
      isCompleted: goal.is_completed || false,
    });
    setError('');
  }, [goal]);

  const handleClose = () => {
    setError('');
    onOpenChange(false);
  };

  const handleUpdate = async () => {
    setError('');

    try {
      await updateGoalMutation.mutateAsync({
        goalId: goal.id,
        updates: {
          target_value: formData.targetValue,
          target_date: formData.targetDate || undefined,
          goal_data: {
            notes: formData.notes,
          },
          current_progress: formData.currentProgress,
          is_completed: formData.isCompleted,
        },
      });

      handleClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update goal. Please try again.'
      );
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this goal? This action cannot be undone.'
      )
    ) {
      return;
    }

    setError('');

    try {
      await deleteGoalMutation.mutateAsync(goal.id);
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete goal. Please try again.'
      );
    }
  };

  const progressPercentage = formData.targetValue
    ? Math.min(100, (formData.currentProgress / formData.targetValue) * 100)
    : 0;

  const isUpdating = updateGoalMutation.isPending;
  const isDeleting = deleteGoalMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
          <DialogDescription>
            Update your goal details. Most goals update automatically from your
            activities.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Progress Type Indicator */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {goal.goal_type?.metric_type &&
              [
                'total_distance',
                'average_pace',
                'run_count',
                'total_time',
              ].includes(goal.goal_type.metric_type) ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Auto-Tracked Goal
                  </span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    Manual Goal
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-blue-700">
              {goal.goal_type?.metric_type &&
              [
                'total_distance',
                'average_pace',
                'run_count',
                'total_time',
              ].includes(goal.goal_type.metric_type)
                ? 'This goal updates automatically from your Strava activities. Manual updates are for corrections only.'
                : 'This goal type requires manual updates (e.g., race results, heart rate zones, weight tracking).'}
            </p>
          </div>

          {/* Goal Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{goal.goal_type?.display_name}</h3>
              <Badge variant="outline">{goal.goal_type?.category}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {goal.goal_type?.description}
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {goal.goal_type?.category === 'distance' && (
              <div>
                <Label htmlFor="targetValue" className="text-sm font-medium">
                  Target {goal.target_unit}
                </Label>
                <Input
                  id="targetValue"
                  type="number"
                  step="0.1"
                  value={formData.targetValue}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      targetValue: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            )}

            {goal.goal_type?.category === 'event' && (
              <div>
                <Label htmlFor="targetDate" className="text-sm font-medium">
                  Target Date
                </Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      targetDate: e.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="currentProgress" className="text-sm font-medium">
                Current Progress {goal.target_unit && `(${goal.target_unit})`}
              </Label>
              <Input
                id="currentProgress"
                type="number"
                step="0.1"
                value={formData.currentProgress}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    currentProgress: parseFloat(e.target.value) || 0,
                  }))
                }
                className="mt-1"
              />
              {formData.targetValue > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(progressPercentage)}% of target reached
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Input
                id="notes"
                placeholder="Any additional notes..."
                value={formData.notes}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="isCompleted"
                type="checkbox"
                checked={formData.isCompleted}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    isCompleted: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <Label htmlFor="isCompleted" className="text-sm font-medium">
                Mark as completed
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting || isUpdating}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-3 w-3" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUpdating || isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isUpdating || isDeleting}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Goal'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
