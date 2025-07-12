'use client';

import React, { useState } from 'react';
import { useUserGoals, useGoalTypes } from '@/hooks/useGoals';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoalCard } from '@/components/goals/GoalCard';
import { AddGoalModal } from '@/components/goals/AddGoalModal';
import { EditGoalModal } from '@/components/goals/EditGoalModal';
import { DynamicGoalSuggestions } from '@/components/goals/DynamicGoalSuggestions';
import { AutomaticGoalTracker } from '@/components/goals/AutomaticGoalTracker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserGoal } from '@/types/goals';
import { Target, Plus, TrendingUp, Calendar, Trophy, Zap } from 'lucide-react';

export function GoalsPageClient() {
  const { user } = useAuth();
  const { data: goalsData, isLoading, error } = useUserGoals();
  const { data: goalTypes = [] } = useGoalTypes();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null);

  const activeGoals = goalsData?.goals?.filter(goal => goal.is_active) || [];
  const completedGoals = goalsData?.goals?.filter(goal => goal.is_completed) || [];

  const handleCreateGoalFromSuggestion = (suggestion?: any) => {
    // This function is called when suggestions want to create a goal
    // The DynamicGoalSuggestions component now handles this internally
    setShowAddModal(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-muted animate-pulse rounded"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            Failed to load goals. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            My Goals
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and achieve your running objectives
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            My Goals
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

      {/* Dynamic Goal Suggestions */}
      {user && (
        <DynamicGoalSuggestions 
          userId={user.id} 
          onCreateGoal={handleCreateGoalFromSuggestion}
        />
      )}

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
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Goal
            </Button>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common goal types to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {goalTypes.slice(0, 6).map((goalType) => (
              <Button
                key={goalType.id}
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-3 w-3" />
                {goalType.display_name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

        {/* Modals */}
        <AddGoalModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
        />

        {editingGoal && (
          <EditGoalModal
            goal={editingGoal}
            open={!!editingGoal}
            onOpenChange={(open: boolean) => !open && setEditingGoal(null)}
          />
        )}
        </TabsContent>

        <TabsContent value="tracking">
          <AutomaticGoalTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
} 