'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Settings, 
  Plus
} from 'lucide-react';
import { useUserGoals } from '@/hooks/useGoals';
import { useGoalManagement } from '@/hooks/useGoals';
import { DashboardGoalSelector } from './DashboardGoalSelector';
import { AddGoalModal } from '@/components/goals/AddGoalModal';
import { DashboardGoalCard } from './DashboardGoalCard';
import { GoalCardSkeletonGrid } from '@/components/goals/GoalCardSkeleton';

export function DashboardGoalsSection() {
  const { isLoading } = useUserGoals();
  const { getDashboardGoals } = useGoalManagement();
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const dashboardGoals = getDashboardGoals();
  const hasGoals = dashboardGoals.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Dashboard Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GoalCardSkeletonGrid count={3} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Dashboard Goals
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGoalSelector(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasGoals ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardGoals.map((goal, index) => (
                <DashboardGoalCard
                  key={goal.id}
                  goal={goal}
                  priority={index + 1}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Dashboard Goals</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Set up goals to track your training progress. You can add up to 3 goals to your dashboard for quick access.
              </p>
              <div className="flex justify-center gap-3">
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
                <Button variant="outline" onClick={() => setShowGoalSelector(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Goals
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Management Modal */}
      <DashboardGoalSelector
        open={showGoalSelector}
        onOpenChange={setShowGoalSelector}
      />

      {/* Add Goal Modal */}
      <AddGoalModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </>
  );
} 