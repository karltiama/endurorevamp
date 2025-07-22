'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useUserGoals, useUpdateGoal, useGoalManagement } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, Plus, Check, Settings } from 'lucide-react';
import { AddGoalModal } from '@/components/goals/AddGoalModal';
import { cn } from '@/lib/utils';
import { GoalCardSkeletonGrid } from '@/components/goals/GoalCardSkeleton';

interface DashboardGoalSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardGoalSelector({ open, onOpenChange }: DashboardGoalSelectorProps) {
  const { data: goalsData, isLoading } = useUserGoals();
  const updateGoalMutation = useUpdateGoal();
  const { toggleDashboardGoal, getDashboardGoals } = useGoalManagement();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  const activeGoals = goalsData?.goals?.filter(goal => goal.is_active) || [];
  const currentDashboardGoals = getDashboardGoals();

  // Initialize selected goals with current dashboard goals
  React.useEffect(() => {
    if (currentDashboardGoals.length > 0 && selectedGoals.length === 0) {
      setSelectedGoals(currentDashboardGoals.map(goal => goal.id));
    }
  }, [currentDashboardGoals, selectedGoals.length]);

  const handleGoalToggle = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(prev => prev.filter(id => id !== goalId));
    } else if (selectedGoals.length < 3) {
      setSelectedGoals(prev => [...prev, goalId]);
    }
  };

  const handleSave = async () => {
    setError('');
    
    try {
      // Update all goals to remove from dashboard first
      for (const goal of activeGoals) {
        if (goal.goal_data?.show_on_dashboard) {
          await toggleDashboardGoal(goal.id, false);
        }
      }

      // Then add selected goals to dashboard with priority
      for (let i = 0; i < selectedGoals.length; i++) {
        const goalId = selectedGoals[i];
        await toggleDashboardGoal(goalId, true, i + 1);
      }

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dashboard goals');
    }
  };

  const handleCancel = () => {
    setSelectedGoals(currentDashboardGoals.map(goal => goal.id));
    setError('');
    onOpenChange(false);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage Dashboard Goals
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Loading Goals...</h3>
                <GoalCardSkeletonGrid count={3} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage Dashboard Goals
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Select Goals for Dashboard</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose up to 3 goals to display on your dashboard. Goals will be shown in order of selection.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {activeGoals.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Active Goals</h3>
                  <div className="grid gap-4">
                    {activeGoals.map((goal) => {
                      const isSelected = selectedGoals.includes(goal.id);
                      const priority = selectedGoals.indexOf(goal.id) + 1;
                      const canSelect = isSelected || selectedGoals.length < 3;

                      return (
                        <Card
                          key={goal.id}
                          className={cn(
                            "cursor-pointer transition-all",
                            isSelected 
                              ? "ring-2 ring-primary bg-primary/5" 
                              : canSelect 
                                ? "hover:shadow-md hover:ring-1 hover:ring-primary/30" 
                                : "opacity-60 cursor-not-allowed"
                          )}
                          onClick={() => canSelect && handleGoalToggle(goal.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {isSelected && (
                                    <Badge variant="secondary" className="text-xs">
                                      #{priority}
                                    </Badge>
                                  )}
                                  <Target className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <h4 className="font-medium">{goal.goal_type?.display_name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {goal.target_value} {goal.target_unit}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {isSelected ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  <div className="h-4 w-4 border-2 border-muted-foreground rounded" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Goals</h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first goal to start tracking your progress on the dashboard.
                    </p>
                    <Button onClick={() => setShowAddModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Goal
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Quick Add Section */}
              {activeGoals.length > 0 && (
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Need more goals?</h4>
                      <p className="text-sm text-muted-foreground">
                        Create additional goals to choose from
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setShowAddModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Goal
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {activeGoals.length > 0 && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={updateGoalMutation.isPending}>
                    {updateGoalMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Goal Modal */}
      <AddGoalModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </>
  );
} 