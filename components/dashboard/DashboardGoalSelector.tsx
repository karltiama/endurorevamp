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
import { Target, Plus, Check } from 'lucide-react';
import { AddGoalModal } from '@/components/goals/AddGoalModal';
import { cn } from '@/lib/utils';

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

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your goals...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open && !showAddModal} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Choose Dashboard Goals
            </DialogTitle>
            <DialogDescription>
              Select up to 3 goals to track as key metrics on your dashboard. These will help you stay focused on your most important objectives.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Selection Counter */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Dashboard Goals</h4>
                  <p className="text-sm text-blue-700">
                    {selectedGoals.length}/3 goals selected for your dashboard
                  </p>
                </div>
                <div className="flex -space-x-1">
                  {[1, 2, 3].map((slot) => (
                    <div
                      key={slot}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium",
                        selectedGoals.length >= slot
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      )}
                    >
                      {selectedGoals.length >= slot ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        slot
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Goals Selection */}
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
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base flex items-center gap-2">
                                {goal.goal_type?.display_name}
                                {isSelected && (
                                  <Badge variant="default" className="text-xs">
                                    #{priority} on Dashboard
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {goal.goal_type?.description}
                              </CardDescription>
                              
                              {/* Goal Details */}
                              <div className="mt-2 space-y-1">
                                {goal.target_value && (
                                  <p className="text-sm text-muted-foreground">
                                    Target: {goal.target_value} {goal.target_unit}
                                    {goal.target_date && (
                                      <span> by {new Date(goal.target_date).toLocaleDateString()}</span>
                                    )}
                                  </p>
                                )}
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-muted-foreground">
                                    Progress: {Math.round((goal.current_progress / (goal.target_value || 1)) * 100)}%
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {goal.goal_type?.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            {isSelected && (
                              <div className="ml-4">
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </CardHeader>
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
              <div className="flex items-center justify-between pt-6 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateGoalMutation.isPending || selectedGoals.length === 0}
                >
                  {updateGoalMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    `Save Dashboard Goals (${selectedGoals.length})`
                  )}
                </Button>
              </div>
            )}
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