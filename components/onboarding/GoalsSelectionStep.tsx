'use client';

import { useState } from 'react';
import { useCreateMultipleGoals } from '@/hooks/useGoals';
import { useDynamicGoals } from '@/hooks/useDynamicGoals';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { SmartGoalCard, SmartGoalCardCompact, SmartGoalCardSkeleton } from '@/components/goals/SmartGoalCard';
import { DynamicGoalSuggestion } from '@/lib/goals/dynamic-suggestions';
import { cn } from '@/lib/utils';

interface GoalsSelectionStepProps {
  onComplete: () => void;
}

export function GoalsSelectionStep({ onComplete }: GoalsSelectionStepProps) {
  const { user } = useAuth();
  const { suggestions, isLoading: isLoadingSuggestions } = useDynamicGoals(user?.id || '', { 
    maxSuggestions: 8,
    experienceOverride: 'beginner' // Start with beginner-friendly suggestions for onboarding
  });
  const createGoalsMutation = useCreateMultipleGoals();
  
  const [selectedSuggestions, setSelectedSuggestions] = useState<DynamicGoalSuggestion[]>([]);
  const [dashboardGoals, setDashboardGoals] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  const handleSuggestionToggle = (suggestion: DynamicGoalSuggestion) => {
    const isSelected = selectedSuggestions.some(s => s.id === suggestion.id);
    
    if (isSelected) {
      setSelectedSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      setDashboardGoals(prev => prev.filter(id => id !== suggestion.id));
    } else {
      setSelectedSuggestions(prev => [...prev, suggestion]);
      
      // Auto-select high priority suggestions for dashboard
      if (suggestion.priority === 'high' && dashboardGoals.length < 3) {
        setDashboardGoals(prev => [...prev, suggestion.id]);
      }
    }
  };

  const handleDashboardToggle = (suggestionId: string) => {
    const isOnDashboard = dashboardGoals.includes(suggestionId);
    
    if (isOnDashboard) {
      setDashboardGoals(prev => prev.filter(id => id !== suggestionId));
    } else if (dashboardGoals.length < 3) {
      setDashboardGoals(prev => [...prev, suggestionId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedSuggestions.length === 0) {
      setError('Please select at least one goal to continue.');
      return;
    }

    if (dashboardGoals.length === 0) {
      setError('Please select at least one goal to track on your dashboard.');
      return;
    }

    setError('');

    try {
      const goalsToCreate = selectedSuggestions.map((suggestion, index) => ({
        goal_type_id: suggestion.goalType.id,
        target_value: suggestion.suggestedTarget,
        target_unit: suggestion.targetUnit,
        goal_data: {
          notes: suggestion.reasoning,
          show_on_dashboard: dashboardGoals.includes(suggestion.id),
          dashboard_priority: dashboardGoals.indexOf(suggestion.id) + 1,
          creation_context: 'onboarding' as const,
          is_onboarding_goal: true,
          
          // AI suggestion metadata
          from_suggestion: true,
          suggestion_id: suggestion.id,
          suggestion_title: suggestion.title,
          suggestion_reasoning: suggestion.reasoning,
          suggestion_strategies: suggestion.strategies,
          suggestion_benefits: suggestion.benefits,
          difficulty_level: suggestion.difficulty === 'conservative' ? 'beginner' as const : 
                           suggestion.difficulty === 'moderate' ? 'intermediate' as const : 
                           'advanced' as const,
          success_probability: suggestion.successProbability,
          required_commitment: suggestion.requiredCommitment,
          warnings: suggestion.warnings
        },
        priority: suggestion.priority === 'high' ? 1 : suggestion.priority === 'medium' ? 2 : 3
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

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          AI-Powered Goal Suggestions
        </h2>
        <p className="text-muted-foreground">
          Based on typical beginner runners, here are personalized goals to help you get started.
          Select the ones that resonate with you!
        </p>
      </div>

      {/* Progress Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {selectedSuggestions.length} goal{selectedSuggestions.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700">
              {dashboardGoals.length}/3 dashboard goals
            </span>
            <Badge variant="secondary">
              {dashboardGoals.length} dashboard
            </Badge>
          </div>
        </div>
        {selectedSuggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedSuggestions.map((suggestion) => (
              <Badge 
                key={suggestion.id}
                variant={dashboardGoals.includes(suggestion.id) ? "default" : "outline"}
                className="text-xs"
              >
                {suggestion.title}
                {dashboardGoals.includes(suggestion.id) && (
                  <span className="ml-1">📊</span>
                )}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Goal Suggestions */}
      {isLoadingSuggestions ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SmartGoalCardSkeleton key={i} />
          ))}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((suggestion) => {
            const isSelected = selectedSuggestions.some(s => s.id === suggestion.id);
            const isOnDashboard = dashboardGoals.includes(suggestion.id);

            return (
              <div key={suggestion.id} className="relative">
                <SmartGoalCard
                  suggestion={suggestion}
                  onSelect={() => handleSuggestionToggle(suggestion)}
                  isSelected={isSelected}
                  showFullDetails={false}
                />
                
                {/* Dashboard Toggle */}
                {isSelected && (
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      variant={isOnDashboard ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDashboardToggle(suggestion.id);
                      }}
                      className="h-8 px-2 text-xs"
                      disabled={!isOnDashboard && dashboardGoals.length >= 3}
                    >
                      {isOnDashboard ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Dashboard
                        </>
                      ) : (
                        <>
                          📊 Add to Dashboard
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Welcome to Your Running Journey!</CardTitle>
            <CardDescription className="text-center">
              We're preparing personalized goal suggestions for you. This usually takes just a moment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <div className="animate-pulse">
                <Sparkles className="h-8 w-8 text-purple-500 mx-auto" />
              </div>
              <p className="text-sm text-muted-foreground">
                Analyzing your profile to create the perfect goals...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-green-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              How to Choose Your Goals
            </h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Select 2-4 goals that excite and challenge you</li>
              <li>• Choose up to 3 goals to track on your dashboard</li>
              <li>• Look for high success probability (green) goals to build confidence</li>
              <li>• Mix different types: distance, consistency, and pace goals work well together</li>
              <li>• Don't worry - you can always adjust or add more goals later!</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {selectedSuggestions.length > 0 ? (
            <>
              Selected {selectedSuggestions.length} goal{selectedSuggestions.length !== 1 ? 's' : ''} • 
              {dashboardGoals.length} on dashboard
            </>
          ) : (
            'Select at least one goal to continue'
          )}
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={selectedSuggestions.length === 0 || dashboardGoals.length === 0 || createGoalsMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {createGoalsMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Goals...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Create My Smart Goals ({selectedSuggestions.length})
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 