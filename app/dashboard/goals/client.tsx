'use client';

import { useState } from 'react';

import { useDynamicGoals } from '@/hooks/useDynamicGoals';
import { useAuth } from '@/providers/AuthProvider';
import { useGoalsContext } from '@/components/goals/GoalsProvider';
import { GoalsHero } from '@/components/dashboard/GoalsHero';
import { UserGoal } from '@/types/goals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  Zap,
  Sparkles,
  Brain,
  RefreshCw,
} from 'lucide-react';
import { GoalCard } from '@/components/goals/GoalCard';
import { AddGoalModal } from '@/components/goals/AddGoalModal';
import { EditGoalModal } from '@/components/goals/EditGoalModal';
import { GoalCardSkeletonGrid } from '@/components/goals/GoalCardSkeleton';

import { AutomaticGoalTracker } from '@/components/goals/AutomaticGoalTracker';
import {
  SmartGoalCard,
  SmartGoalCardSkeleton,
} from '@/components/goals/SmartGoalCard';
import { DynamicGoalSuggestion } from '@/lib/goals/dynamic-suggestions';
import { toast } from 'sonner';

export function GoalsPageClient() {
  const { user } = useAuth();
  const { activeGoals, completedGoals, isLoading, refreshGoals } =
    useGoalsContext();

  const {
    suggestions,
    isLoading: isLoadingSuggestions,
    refetch: refetchSuggestions,
  } = useDynamicGoals(user?.id || '', { maxSuggestions: 6 });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<DynamicGoalSuggestion | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleCreateGoalFromSuggestion = (
    suggestion: DynamicGoalSuggestion
  ) => {
    setSelectedSuggestion(suggestion);
    setShowAddModal(true);
  };

  const handleAddGoalModalClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedSuggestion(null);
    }
    setShowAddModal(isOpen);
  };

  async function handleRefreshGoals() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/goals/update-progress', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Goals refreshed! ${data.goalsUpdated} updated.`);
        // Invalidate the React Query cache to refresh the UI
        refreshGoals();
      } else {
        toast.error(data.error || 'Failed to refresh goals');
      }
    } catch {
      toast.error('Failed to refresh goals');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <GoalsHero
        onAddGoal={() => setShowAddModal(true)}
        onRefresh={handleRefreshGoals}
        refreshing={refreshing}
      />

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
          {/* Active Goals Section */}
          {isLoading ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Active Goals</h2>
                <GoalCardSkeletonGrid count={3} />
              </div>
            </div>
          ) : activeGoals.length > 0 ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Active Goals</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activeGoals.map(goal => (
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
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2"
                  >
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
                  {completedGoals.map(goal => (
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
                Personalized recommendations based on your running data and
                patterns
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
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <SmartGoalCardSkeleton key={i} />
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {suggestions.map(suggestion => (
                <SmartGoalCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onSelect={handleCreateGoalFromSuggestion}
                  isSelected={false}
                  showFullDetails={true}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Suggestions Available
                </h3>
                <p className="text-muted-foreground mb-6">
                  We need more activity data to generate personalized
                  suggestions. Try syncing your Strava activities first.
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
