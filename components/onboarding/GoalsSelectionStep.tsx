'use client';

import React, { useState } from 'react';
import { useGoalTypes, useCreateMultipleGoals, useUnifiedGoalCreation } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoalFormData } from '@/types/goals';
import { cn } from '@/lib/utils';

interface GoalsSelectionStepProps {
  onComplete: () => void;
}

export function GoalsSelectionStep({ onComplete }: GoalsSelectionStepProps) {
  const { data: goalTypes = [], isLoading: isLoadingTypes } = useGoalTypes();
  const createGoalsMutation = useCreateMultipleGoals();
  
  const [selectedGoals, setSelectedGoals] = useState<GoalFormData[]>([]);
  const [dashboardGoals, setDashboardGoals] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  const handleGoalToggle = (goalTypeId: string) => {
    const isSelected = selectedGoals.some(g => g.goalTypeId === goalTypeId);
    
    if (isSelected) {
      setSelectedGoals(prev => prev.filter(g => g.goalTypeId !== goalTypeId));
      setDashboardGoals(prev => prev.filter(id => id !== goalTypeId));
    } else {
      const goalType = goalTypes.find(gt => gt.id === goalTypeId);
      if (goalType) {
        setSelectedGoals(prev => [...prev, {
          goalTypeId,
          targetUnit: goalType.unit,
          priority: prev.length + 1
        }]);
      }
    }
  };

  const handleDashboardToggle = (goalTypeId: string) => {
    const isOnDashboard = dashboardGoals.includes(goalTypeId);
    
    if (isOnDashboard) {
      setDashboardGoals(prev => prev.filter(id => id !== goalTypeId));
    } else if (dashboardGoals.length < 3) {
      setDashboardGoals(prev => [...prev, goalTypeId]);
    }
  };

  const handleGoalUpdate = (goalTypeId: string, updates: Partial<GoalFormData>) => {
    setSelectedGoals(prev => 
      prev.map(goal => 
        goal.goalTypeId === goalTypeId 
          ? { ...goal, ...updates }
          : goal
      )
    );
  };

  const handleSubmit = async () => {
    if (selectedGoals.length === 0) {
      setError('Please select at least one goal to continue.');
      return;
    }

    if (dashboardGoals.length === 0) {
      setError('Please select at least one goal to track on your dashboard.');
      return;
    }

    // Validate goals with required values
    const invalidGoals = selectedGoals.filter(goal => {
      const goalType = goalTypes.find(gt => gt.id === goal.goalTypeId);
      if (goalType?.category === 'distance' && !goal.targetValue) {
        return true;
      }
      if (goalType?.category === 'event' && !goal.targetDate) {
        return true;
      }
      return false;
    });

    if (invalidGoals.length > 0) {
      setError('Please fill in all required fields for your selected goals.');
      return;
    }

    setError('');

    try {
      const goalsToCreate = selectedGoals.map(goal => ({
        goal_type_id: goal.goalTypeId,
        target_value: goal.targetValue,
        target_unit: goal.targetUnit,
        target_date: goal.targetDate,
        goal_data: {
          notes: goal.notes,
          show_on_dashboard: dashboardGoals.includes(goal.goalTypeId),
          dashboard_priority: dashboardGoals.indexOf(goal.goalTypeId) + 1,
          creation_context: 'onboarding' as const,
          is_onboarding_goal: true
        },
        priority: goal.priority
      }));

      await createGoalsMutation.mutateAsync(goalsToCreate);
      
      // Mark goals as completed in onboarding
      await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals_completed: true,
          current_step: 'strava'
        })
      });

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goals. Please try again.');
    }
  };

  if (isLoadingTypes) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading goal options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">What do you want to achieve?</h3>
        <p className="text-muted-foreground mb-4">
          Select your goals and choose up to 3 to track on your dashboard
        </p>
        {dashboardGoals.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-700">
              🎯 Dashboard Goals ({dashboardGoals.length}/3): These will appear as key metrics on your dashboard
            </p>
          </div>
        )}
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goalTypes.map((goalType) => {
          const isSelected = selectedGoals.some(g => g.goalTypeId === goalType.id);
          const selectedGoal = selectedGoals.find(g => g.goalTypeId === goalType.id);
          const isOnDashboard = dashboardGoals.includes(goalType.id);

          return (
            <Card 
              key={goalType.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected ? "ring-2 ring-primary" : "",
                isOnDashboard ? "bg-blue-50 border-blue-200" : ""
              )}
              onClick={() => handleGoalToggle(goalType.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {goalType.display_name}
                      {isOnDashboard && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          Dashboard #{dashboardGoals.indexOf(goalType.id) + 1}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {goalType.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant={goalType.category === 'distance' ? 'default' : 'secondary'}>
                      {goalType.category}
                    </Badge>
                    {isSelected && (
                      <Button
                        variant={isOnDashboard ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        disabled={!isOnDashboard && dashboardGoals.length >= 3}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDashboardToggle(goalType.id);
                        }}
                      >
                        {isOnDashboard ? "On Dashboard" : "Add to Dashboard"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {isSelected && (
                <CardContent className="pt-0" onClick={e => e.stopPropagation()}>
                  <div className="space-y-3 border-t pt-3">
                    {goalType.category === 'distance' && (
                      <div>
                        <Label htmlFor={`goal-${goalType.id}-value`} className="text-sm">
                          Target {goalType.unit === 'km' ? 'kilometers' : 'miles'}
                        </Label>
                        <Input
                          id={`goal-${goalType.id}-value`}
                          type="number"
                          placeholder={goalType.name.includes('weekly') ? '20' : '100'}
                          value={selectedGoal?.targetValue || ''}
                          onChange={(e) => handleGoalUpdate(goalType.id, {
                            targetValue: parseFloat(e.target.value) || undefined
                          })}
                          className="mt-1"
                        />
                      </div>
                    )}

                    {goalType.category === 'event' && (
                      <div>
                        <Label htmlFor={`goal-${goalType.id}-date`} className="text-sm">
                          Race Date
                        </Label>
                        <Input
                          id={`goal-${goalType.id}-date`}
                          type="date"
                          value={selectedGoal?.targetDate || ''}
                          onChange={(e) => handleGoalUpdate(goalType.id, {
                            targetDate: e.target.value
                          })}
                          className="mt-1"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor={`goal-${goalType.id}-notes`} className="text-sm">
                        Notes (optional)
                      </Label>
                      <Input
                        id={`goal-${goalType.id}-notes`}
                        placeholder="Any additional details..."
                        value={selectedGoal?.notes || ''}
                        onChange={(e) => handleGoalUpdate(goalType.id, {
                          notes: e.target.value
                        })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {selectedGoals.length > 0 && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-sm text-muted-foreground">
                You can always add or modify goals later
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={createGoalsMutation.isPending}
              size="lg"
            >
              {createGoalsMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setting up goals...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 