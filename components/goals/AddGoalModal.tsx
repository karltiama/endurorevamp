'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useGoalTypes, useUnifiedGoalCreation } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoalFormData } from '@/types/goals';
import { DynamicGoalSuggestion } from '@/lib/goals/dynamic-suggestions';
import { Plus, Sparkles, Target, Award, TrendingUp } from 'lucide-react';

interface AddGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // New props for suggestion-based goal creation
  suggestion?: DynamicGoalSuggestion;
  title?: string;
  description?: string;
}

export function AddGoalModal({ 
  open, 
  onOpenChange, 
  suggestion, 
  title = "Add New Goal",
  description = "Choose a goal type and set your target to start tracking your progress"
}: AddGoalModalProps) {
  const { data: goalTypes = [], isLoading: isLoadingTypes } = useGoalTypes();
  const createGoalMutation = useUnifiedGoalCreation();
  
  const [selectedGoalType, setSelectedGoalType] = useState<string>('');
  const [formData, setFormData] = useState<Partial<GoalFormData>>({});
  const [error, setError] = useState<string>('');

  // Pre-populate data from suggestion
  useEffect(() => {
    if (suggestion && open) {
      // Find the goal type that matches the suggestion
      const matchingGoalType = goalTypes.find(gt => 
        gt.category === suggestion.category || 
        gt.name === suggestion.goalType.name ||
        gt.display_name === suggestion.goalType.display_name
      );
      
      if (matchingGoalType) {
        setSelectedGoalType(matchingGoalType.id);
        setFormData({
          targetValue: suggestion.suggestedTarget,
          targetUnit: suggestion.targetUnit,
          notes: `${suggestion.reasoning}\n\nStrategies: ${suggestion.strategies.join(', ')}`
        });
      }
    }
  }, [suggestion, goalTypes, open]);

  const handleReset = () => {
    setSelectedGoalType('');
    setFormData({});
    setError('');
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      handleReset();
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!selectedGoalType) {
      setError('Please select a goal type.');
      return;
    }

    const goalType = goalTypes.find(gt => gt.id === selectedGoalType);
    if (!goalType) {
      setError('Invalid goal type selected.');
      return;
    }

    // Validate required fields
    if (goalType.category === 'distance' && !formData.targetValue) {
      setError('Please enter a target value for distance goals.');
      return;
    }

    if (goalType.category === 'frequency' && !formData.targetValue) {
      setError('Please enter a target value for frequency goals.');
      return;
    }

    if (goalType.category === 'pace' && !formData.targetValue) {
      setError('Please enter a target pace for pace goals.');
      return;
    }

    if (goalType.category === 'duration' && !formData.targetValue) {
      setError('Please enter a target duration for duration goals.');
      return;
    }

    if (goalType.category === 'elevation' && !formData.targetValue) {
      setError('Please enter a target elevation for elevation goals.');
      return;
    }

    if (goalType.category === 'event' && !formData.targetDate) {
      setError('Please select a target date for event goals.');
      return;
    }

    setError('');

    try {
      // Create goal using unified creation system
      const goalData = {
        goalTypeId: selectedGoalType,
        targetValue: formData.targetValue,
        targetUnit: formData.targetUnit || goalType.unit,
        targetDate: formData.targetDate,
        notes: formData.notes || '',
        priority: 1,
        context: suggestion ? 'suggestion' as const : 'manual' as const,
        ...(suggestion && { suggestion })
      };

      await createGoalMutation.mutateAsync(goalData);

      handleClose(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal. Please try again.');
    }
  };

  const selectedGoal = goalTypes.find(gt => gt.id === selectedGoalType);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {suggestion ? (
              <Sparkles className="h-5 w-5 text-purple-500" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Suggestion Preview */}
          {suggestion && selectedGoalType && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI Suggestion Preview
                </CardTitle>
                <CardDescription>
                  {suggestion.description}
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-4 space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span>{suggestion.suggestedTarget} {suggestion.targetUnit}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-green-500" />
                    <span>{suggestion.successProbability}% success rate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span>{suggestion.difficulty} difficulty</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Why this goal:</strong> {suggestion.reasoning}
                </div>
              </div>
            </Card>
          )}

          {/* Goal Type Selection */}
          {!selectedGoalType && !suggestion ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Choose Your Goal Type</h3>
              
              {isLoadingTypes ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {goalTypes.map((goalType) => (
                    <Card 
                      key={goalType.id}
                      className="cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary/50"
                      onClick={() => {
                        setSelectedGoalType(goalType.id);
                        setFormData({
                          targetUnit: goalType.unit
                        });
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{goalType.display_name}</CardTitle>
                            <CardDescription className="mt-1 text-sm">
                              {goalType.description}
                            </CardDescription>
                          </div>
                          <Badge variant={goalType.category === 'distance' ? 'default' : 'secondary'}>
                            {goalType.category}
                          </Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : selectedGoalType ? (
            /* Goal Configuration */
            <div className="space-y-6">
              {!suggestion && (
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGoalType('')}
                  >
                    ← Back
                  </Button>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedGoal?.display_name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedGoal?.description}</p>
                  </div>
                </div>
              )}

              {suggestion && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <div>
                      <h3 className="text-lg font-semibold">{suggestion.title}</h3>
                      <p className="text-sm text-muted-foreground">Based on your performance analysis</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {selectedGoal?.category === 'distance' && (
                  <div>
                    <Label htmlFor="targetValue" className="text-sm font-medium">
                      Target {selectedGoal.unit === 'km' ? 'Kilometers' : 'Miles'} *
                    </Label>
                    <Input
                      id="targetValue"
                      type="number"
                      placeholder={selectedGoal.name.includes('weekly') ? '20' : '100'}
                      value={formData.targetValue || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        targetValue: parseFloat(e.target.value) || undefined
                      }))}
                      className="mt-1"
                    />
                  </div>
                )}

                {selectedGoal?.category === 'frequency' && (
                  <div>
                    <Label htmlFor="targetValue" className="text-sm font-medium">
                      Target {selectedGoal.unit === 'runs' ? 'Runs' : selectedGoal.unit || 'Activities'} *
                    </Label>
                    <Input
                      id="targetValue"
                      type="number"
                      placeholder={selectedGoal.name.includes('weekly') ? '3' : '12'}
                      value={formData.targetValue || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        targetValue: parseFloat(e.target.value) || undefined
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedGoal.name.includes('weekly') 
                        ? 'Number of runs per week you want to maintain'
                        : 'Number of runs per month you want to maintain'
                      }
                    </p>
                  </div>
                )}

                {selectedGoal?.category === 'pace' && (
                  <div>
                    <Label htmlFor="targetValue" className="text-sm font-medium">
                      Target Pace (minutes per km) *
                    </Label>
                    <Input
                      id="targetValue"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 5.5"
                      value={formData.targetValue || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        targetValue: parseFloat(e.target.value) || undefined
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter pace in minutes per kilometer (e.g., 5.5 for 5:30/km)
                    </p>
                  </div>
                )}

                {selectedGoal?.category === 'duration' && (
                  <div>
                    <Label htmlFor="targetValue" className="text-sm font-medium">
                      Target Minutes *
                    </Label>
                    <Input
                      id="targetValue"
                      type="number"
                      placeholder="e.g., 60"
                      value={formData.targetValue || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        targetValue: parseFloat(e.target.value) || undefined
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter duration in minutes
                    </p>
                  </div>
                )}

                {selectedGoal?.category === 'elevation' && (
                  <div>
                    <Label htmlFor="targetValue" className="text-sm font-medium">
                      Target Elevation *
                    </Label>
                    <Input
                      id="targetValue"
                      type="number"
                      placeholder="e.g., 1000 meters"
                      value={formData.targetValue || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        targetValue: parseFloat(e.target.value) || undefined
                      }))}
                      className="mt-1"
                    />
                  </div>
                )}

                {selectedGoal?.category === 'event' && (
                  <div>
                    <Label htmlFor="targetDate" className="text-sm font-medium">
                      Race Date *
                    </Label>
                    <Input
                      id="targetDate"
                      type="date"
                      value={formData.targetDate || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        targetDate: e.target.value
                      }))}
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes {suggestion ? '(Pre-filled from AI suggestion)' : '(optional)'}
                  </Label>
                  <textarea
                    id="notes"
                    placeholder="Any additional details about your goal..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    className="mt-1 w-full min-h-[80px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                  />
                  {suggestion && (
                    <p className="text-xs text-gray-500 mt-1">
                      The notes field has been pre-populated with AI insights. Feel free to modify or add your own notes.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={createGoalMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createGoalMutation.isPending}
                  className={suggestion ? "bg-purple-600 hover:bg-purple-700" : ""}
                >
                  {createGoalMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      {suggestion && <Sparkles className="h-4 w-4 mr-2" />}
                      Create Goal
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
} 