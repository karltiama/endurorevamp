'use client';

import { useState } from 'react';
import { useGoalTypes, useUserGoals } from '@/hooks/useGoals';
import { useDynamicGoals } from '@/hooks/useDynamicGoals';
import { useAuth } from '@/providers/AuthProvider';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Zap, 
  Sparkles,
  Brain,
  RefreshCw
} from 'lucide-react';
import { GoalCard } from '@/components/goals/GoalCard';
import { AddGoalModal } from '@/components/goals/AddGoalModal';
import { EditGoalModal } from '@/components/goals/EditGoalModal';
import { DynamicGoalSuggestions } from '@/components/goals/DynamicGoalSuggestions';
import { AutomaticGoalTracker } from '@/components/goals/AutomaticGoalTracker';
import { SmartGoalCard, SmartGoalCardCompact, SmartGoalCardSkeleton } from '@/components/goals/SmartGoalCard';
import { DynamicGoalSuggestion } from '@/lib/goals/dynamic-suggestions';

export function GoalsPageClient() {
  const { user } = useAuth();
  const { data: goalsData, isLoading: isLoadingGoals } = useUserGoals();
  const { data: goalTypes = [], isLoading: isLoadingTypes } = useGoalTypes();
  const { suggestions, isLoading: isLoadingSuggestions, refetch: refetchSuggestions } = useDynamicGoals(user?.id || '', { maxSuggestions: 6 });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<DynamicGoalSuggestion | null>(null);

  const goals = goalsData?.goals || [];
  const activeGoals = goals.filter(goal => goal.is_active);
  const completedGoals = goals.filter(goal => goal.is_completed);

  const handleCreateGoalFromSuggestion = (suggestion: DynamicGoalSuggestion) => {
    setSelectedSuggestion(suggestion);
    setShowAddModal(true);
  };

  const handleAddGoalModalClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedSuggestion(null);
    }
    setShowAddModal(isOpen);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Goals</h1>
          <p className="text-muted-foreground">
            Track your progress and achieve your running ambitions
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Goal
        </Button>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="goals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            My Goals
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Suggestions
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Auto Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeGoals.length}</div>
                <p className="text-xs text-muted-foreground">
                  Currently tracking
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedGoals.length}</div>
                <p className="text-xs text-muted-foreground">
                  Goals achieved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activeGoals.filter(goal => 
                    goal.goal_type?.name === 'weekly_distance'
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Weekly goals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {activeGoals.length > 0 
                    ? Math.round(
                        activeGoals.reduce((acc, goal) => {
                          const progress = goal.target_value 
                            ? (goal.current_progress / goal.target_value) * 100 
                            : 0;
                          return acc + Math.min(100, progress);
                        }, 0) / activeGoals.length
                      )
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all goals
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Active Goals */}
          {activeGoals.length > 0 ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Active Goals</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activeGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={() => setEditingGoal(goal)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Goals</h3>
                <p className="text-muted-foreground mb-6">
                  Start tracking your progress by adding your first goal.
                </p>
                <div className="flex justify-center">
                  <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Add Your First Goal with AI Help
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Completed Goals</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {completedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={() => setEditingGoal(goal)}
                      showCompleted
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          {/* AI Suggestions Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                AI Goal Suggestions
              </h2>
              <p className="text-sm text-muted-foreground">
                Personalized recommendations based on your running data and patterns
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchSuggestions()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* AI Suggestions Content */}
          {isLoadingSuggestions ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SmartGoalCardSkeleton key={i} />
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-6">
              {/* High Priority Suggestions */}
              {suggestions.filter(s => s.priority === 'high').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="destructive">High Priority</Badge>
                    <span className="text-sm text-muted-foreground">
                      Recommended for immediate attention
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {suggestions.filter(s => s.priority === 'high').map((suggestion) => (
                      <SmartGoalCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onSelect={handleCreateGoalFromSuggestion}
                        showFullDetails={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Medium Priority Suggestions */}
              {suggestions.filter(s => s.priority === 'medium').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">Medium Priority</Badge>
                    <span className="text-sm text-muted-foreground">
                      Good opportunities for growth
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {suggestions.filter(s => s.priority === 'medium').map((suggestion) => (
                      <SmartGoalCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onSelect={handleCreateGoalFromSuggestion}
                        showFullDetails={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Low Priority Suggestions */}
              {suggestions.filter(s => s.priority === 'low').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline">Low Priority</Badge>
                    <span className="text-sm text-muted-foreground">
                      Future considerations
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {suggestions.filter(s => s.priority === 'low').map((suggestion) => (
                      <SmartGoalCardCompact
                        key={suggestion.id}
                        suggestion={suggestion}
                        onSelect={handleCreateGoalFromSuggestion}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Suggestions Available</h3>
                <p className="text-muted-foreground mb-6">
                  We need more activity data to generate personalized suggestions. 
                  Try syncing your Strava activities first.
                </p>
                <Button variant="outline" onClick={() => refetchSuggestions()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tracking">
          <AutomaticGoalTracker />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddGoalModal
        open={showAddModal}
        onOpenChange={handleAddGoalModalClose}
        suggestion={selectedSuggestion || undefined}
      />

      {editingGoal && (
        <EditGoalModal
          goal={editingGoal}
          open={!!editingGoal}
          onOpenChange={(open: boolean) => !open && setEditingGoal(null)}
        />
      )}
    </div>
  );
} 