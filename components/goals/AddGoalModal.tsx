'use client';

import { useState, useEffect } from 'react';
import { useUnifiedGoalCreation } from '@/hooks/useGoals';
import { useDynamicGoals } from '@/hooks/useDynamicGoals';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
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
// import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { DynamicGoalSuggestion } from '@/lib/goals/dynamic-suggestions';
import { SmartGoalCard, SmartGoalCardSkeleton } from './SmartGoalCard';
import { GoalFormData } from '@/types/goals';
import { useAuth } from '@/providers/AuthProvider';

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
  title = "Smart Goal Suggestions",
  description = "AI-powered goal recommendations based on your running data"
}: AddGoalModalProps) {
  const { user } = useAuth();
  const { preferences } = useUnitPreferences();
  const { suggestions, isLoading: isLoadingSuggestions } = useDynamicGoals(user?.id || '');
  const createGoalMutation = useUnifiedGoalCreation();
  
  const [selectedSuggestion, setSelectedSuggestion] = useState<DynamicGoalSuggestion | null>(null);
  const [formData, setFormData] = useState<Partial<GoalFormData>>({});
  const [error, setError] = useState<string>('');

  // Pre-populate data from suggestion prop
  useEffect(() => {
    if (suggestion && open) {
      setSelectedSuggestion(suggestion);
      setFormData({
        targetValue: suggestion.suggestedTarget,
        targetUnit: suggestion.targetUnit || preferences.distance,
        notes: `${suggestion.reasoning}\n\nStrategies: ${suggestion.strategies.join(', ')}`
      });
    }
  }, [suggestion, open, preferences.distance]);

  const handleReset = () => {
    setSelectedSuggestion(null);
    setFormData({});
    setError('');
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      handleReset();
    }
    onOpenChange(isOpen);
  };

  // When user selects a suggestion, default to their preferred unit if not specified
  const handleSuggestionSelect = (suggestion: DynamicGoalSuggestion) => {
    setSelectedSuggestion(suggestion);
    setFormData({
      targetValue: suggestion.suggestedTarget,
      targetUnit: suggestion.targetUnit || preferences.distance,
      notes: suggestion.reasoning
    });
  };

  const handleSubmit = async () => {
    if (!selectedSuggestion) {
      setError('Please select a goal suggestion first.');
      return;
    }

    // Validate required fields based on goal category
    if (selectedSuggestion.goalType.category === 'distance' && !formData.targetValue) {
      setError('Target distance is required.');
      return;
    }

    if (selectedSuggestion.goalType.category === 'event' && !formData.targetDate) {
      setError('Target date is required for event goals.');
      return;
    }

    setError('');

    try {
      await createGoalMutation.mutateAsync({
        goalTypeId: selectedSuggestion.goalType.name,
        targetValue: formData.targetValue || selectedSuggestion.suggestedTarget,
        targetUnit: formData.targetUnit || selectedSuggestion.targetUnit,
        targetDate: formData.targetDate,
        notes: formData.notes,
        context: 'suggestion',
        suggestion: selectedSuggestion
      });

      handleClose(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="add-goal-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div id="add-goal-description" className="sr-only">
          AI-powered goal recommendations based on your running data
        </div>

        <div className="space-y-6">
          {!selectedSuggestion ? (
            /* Goal Selection */
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Choose Your Next Goal</h3>
              <p className="text-sm text-muted-foreground">
                These goals are personalized based on your running data, current fitness level, and activity patterns.
              </p>
              
              {isLoadingSuggestions ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <SmartGoalCardSkeleton key={i} />
                  ))}
                </div>
              ) : suggestions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {suggestions.map((suggestion) => (
                    <SmartGoalCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onSelect={handleSuggestionSelect}
                      isSelected={false}
                      showFullDetails={false}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">No Suggestions Available</CardTitle>
                    <CardDescription className="text-center">
                      We need more activity data to generate personalized suggestions. 
                      Try syncing your Strava activities first.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleClose(false)}
                    >
                      Close
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            /* Goal Configuration */
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSuggestion(null)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Suggestions
                </Button>
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    {selectedSuggestion.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Customize your goal details
                  </p>
                </div>
              </div>

              {/* Selected Goal Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-900">AI Recommendation</h4>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {selectedSuggestion.successProbability}% success rate
                  </Badge>
                </div>
                <p className="text-sm text-blue-800 mb-3">
                  {selectedSuggestion.reasoning}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Target:</span> {selectedSuggestion.suggestedTarget}{selectedSuggestion.targetUnit}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {selectedSuggestion.timeframe}
                  </div>
                  <div>
                    <span className="font-medium">Difficulty:</span> {selectedSuggestion.difficulty}
                  </div>
                  <div>
                    <span className="font-medium">Commitment:</span> {selectedSuggestion.requiredCommitment}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {selectedSuggestion.goalType.category === 'distance' && (
                  <div>
                    <Label htmlFor="targetValue" className="text-sm font-medium">
                      Target {selectedSuggestion.targetUnit === 'km' ? 'Kilometers' : 'Miles'} *
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="targetValue"
                        type="number"
                        min={0}
                        value={formData.targetValue ?? ''}
                        onChange={e => setFormData(f => ({ ...f, targetValue: e.target.valueAsNumber }))}
                        className="w-32"
                      />
                      <select
                        value={formData.targetUnit || preferences.distance}
                        onChange={e => setFormData(f => ({ ...f, targetUnit: e.target.value }))}
                        className="border rounded px-2 py-1 ml-2"
                      >
                        <option value="km">Kilometers</option>
                        <option value="miles">Miles</option>
                      </select>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      AI suggests: {selectedSuggestion.suggestedTarget}{selectedSuggestion.targetUnit}
                    </p>
                  </div>
                )}

                {selectedSuggestion.goalType.category === 'frequency' && (
                  <div>
                    <Label htmlFor="targetValue" className="text-sm font-medium">
                      Target {selectedSuggestion.targetUnit} *
                    </Label>
                    <Input
                      id="targetValue"
                      type="number"
                      value={formData.targetValue || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        targetValue: parseFloat(e.target.value) || undefined
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      AI suggests: {selectedSuggestion.suggestedTarget} {selectedSuggestion.targetUnit}
                    </p>
                  </div>
                )}

                {selectedSuggestion.goalType.category === 'pace' && (
                  <div>
                    <Label htmlFor="targetValue" className="text-sm font-medium">
                      Target Pace (minutes per km) *
                    </Label>
                    <Input
                      id="targetValue"
                      type="number"
                      step="0.1"
                      value={formData.targetValue || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        targetValue: parseFloat(e.target.value) || undefined
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      AI suggests: {Math.floor((selectedSuggestion.suggestedTarget || 0) / 60)}:{String(Math.floor((selectedSuggestion.suggestedTarget || 0) % 60)).padStart(2, '0')}/km
                    </p>
                  </div>
                )}

                {selectedSuggestion.goalType.category === 'duration' && (
                  <div>
                    <Label htmlFor="targetValue" className="text-sm font-medium">
                      Target Minutes *
                    </Label>
                    <Input
                      id="targetValue"
                      type="number"
                      value={formData.targetValue || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        targetValue: parseFloat(e.target.value) || undefined
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      AI suggests: {selectedSuggestion.suggestedTarget} minutes
                    </p>
                  </div>
                )}

                {selectedSuggestion.goalType.category === 'elevation' && (
                  <div>
                    <Label htmlFor="targetValue" className="text-sm font-medium">
                      Target Elevation *
                    </Label>
                    <Input
                      id="targetValue"
                      type="number"
                      value={formData.targetValue || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        targetValue: parseFloat(e.target.value) || undefined
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      AI suggests: {selectedSuggestion.suggestedTarget} meters
                    </p>
                  </div>
                )}

                {selectedSuggestion.goalType.category === 'event' && (
                  <div>
                    <Label htmlFor="targetDate" className="text-sm font-medium">
                      Event Date *
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
                    Notes (Optional)
                  </Label>
                  <textarea
                    id="notes"
                    placeholder="Add any additional notes about your goal..."
                    value={formData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    className="mt-1 w-full min-h-[80px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              {/* Strategies Section */}
              {selectedSuggestion.strategies && selectedSuggestion.strategies.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Recommended Strategies</h4>
                  <ul className="space-y-1 text-sm text-green-800">
                    {selectedSuggestion.strategies.map((strategy, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        {strategy}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings Section */}
              {selectedSuggestion.warnings && selectedSuggestion.warnings.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">Keep in Mind</h4>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    {selectedSuggestion.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-600">•</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSuggestion(null)}
                  className="flex-1"
                >
                  Back to Suggestions
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createGoalMutation.isPending}
                  className="flex-1"
                >
                  {createGoalMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Goal...
                    </>
                  ) : (
                    'Create Smart Goal'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 