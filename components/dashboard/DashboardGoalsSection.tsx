'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Settings, Plus, Eye } from 'lucide-react';
import { useUserGoals } from '@/hooks/useGoals';
import { useGoalManagement } from '@/hooks/useGoals';
import { DashboardGoalSelector } from './DashboardGoalSelector';
import { AddGoalModal } from '@/components/goals/AddGoalModal';
import { DashboardGoalCard } from './DashboardGoalCard';
import { GoalCardSkeletonGrid } from '@/components/goals/GoalCardSkeleton';
import { useRouter } from 'next/navigation';

export function DashboardGoalsSection() {
  const { isLoading } = useUserGoals();
  const { getDashboardGoals } = useGoalManagement();
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();

  const dashboardGoals = getDashboardGoals();
  const hasGoals = dashboardGoals.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              Dashboard Goals
            </CardTitle>
          </div>
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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              Dashboard Goals
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGoalSelector(true)}
                className="text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Manage
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Goal
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasGoals ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {dashboardGoals.map((goal, index) => (
                  <DashboardGoalCard
                    key={goal.id}
                    goal={goal}
                    priority={index + 1}
                  />
                ))}
              </div>

              {/* View All Goals Link */}
              <div className="pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard/goals')}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View All Goals
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-medium mb-2">No Dashboard Goals</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto text-sm">
                Set up goals to track your training progress. You can add up to
                3 goals to your dashboard for quick access.
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                <Button onClick={() => setShowAddModal(true)} size="sm">
                  <Plus className="h-3 w-3 mr-1" />
                  Create Your First Goal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/goals')}
                  size="sm"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View All Goals
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowGoalSelector(true)}
                  size="sm"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Manage Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showGoalSelector && (
        <DashboardGoalSelector
          open={showGoalSelector}
          onOpenChange={setShowGoalSelector}
        />
      )}

      {showAddModal && (
        <AddGoalModal open={showAddModal} onOpenChange={setShowAddModal} />
      )}
    </>
  );
}
