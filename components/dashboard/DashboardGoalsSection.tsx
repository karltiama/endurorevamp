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

interface DashboardGoalsSectionProps {
  userId: string;
}

export function DashboardGoalsSection({ userId }: DashboardGoalsSectionProps) {
  const { data: goalsData, isLoading } = useUserGoals();
  const { getDashboardGoals } = useGoalManagement();
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const dashboardGoals = getDashboardGoals();
  const hasGoals = dashboardGoals.length > 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Training Goals</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track your progress and stay motivated
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGoalSelector(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage
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