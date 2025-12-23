'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGoalsContext } from '@/components/goals/GoalsProvider';
import { useMemo } from 'react';
import {
  Target,
  Trophy,
  TrendingUp,
  Calendar,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface GoalsHeroProps {
  onAddGoal: () => void;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}

export function GoalsHero({ onAddGoal, onRefresh, refreshing = false }: GoalsHeroProps) {
  const { activeGoals, completedGoals, isLoading } = useGoalsContext();

  const stats = useMemo(() => {
    if (!activeGoals && !completedGoals) return null;

    const totalGoals = activeGoals.length + completedGoals.length;
    const successRate =
      totalGoals > 0
        ? Math.round((completedGoals.length / totalGoals) * 100)
        : 0;

    const avgProgress =
      activeGoals.length > 0
        ? Math.round(
            activeGoals.reduce((sum, goal) => {
              const progress = goal.target_value
                ? (goal.current_progress / goal.target_value) * 100
                : 0;
              return sum + Math.min(100, progress);
            }, 0) / activeGoals.length
          )
        : 0;

    // Calculate goals by status
    const onTrack = activeGoals.filter(goal => {
      if (!goal.target_value) return false;
      const progress = (goal.current_progress / goal.target_value) * 100;
      
      // If it has a deadline, check if on pace
      if (goal.target_date) {
        const now = new Date();
        const deadline = new Date(goal.target_date);
        const totalTime = deadline.getTime() - new Date(goal.created_at).getTime();
        const elapsedTime = now.getTime() - new Date(goal.created_at).getTime();
        const expectedProgress = (elapsedTime / totalTime) * 100;
        return progress >= expectedProgress - 10; // 10% tolerance
      }
      
      // Otherwise, consider >50% as on track
      return progress >= 50;
    }).length;

    const needsAttention = activeGoals.filter(goal => {
      if (!goal.target_value) return false;
      const progress = (goal.current_progress / goal.target_value) * 100;
      
      if (goal.target_date) {
        const now = new Date();
        const deadline = new Date(goal.target_date);
        const totalTime = deadline.getTime() - new Date(goal.created_at).getTime();
        const elapsedTime = now.getTime() - new Date(goal.created_at).getTime();
        const expectedProgress = (elapsedTime / totalTime) * 100;
        return progress < expectedProgress - 10;
      }
      
      return progress < 50 && progress > 0;
    }).length;

    // Find closest deadline
    const goalsWithDeadlines = activeGoals.filter(g => g.target_date);
    const closestDeadline = goalsWithDeadlines.length > 0
      ? goalsWithDeadlines.reduce((closest, goal) => {
          const goalDate = new Date(goal.target_date!);
          const closestDate = new Date(closest.target_date!);
          return goalDate < closestDate ? goal : closest;
        })
      : null;

    const daysUntilDeadline = closestDeadline
      ? Math.ceil(
          (new Date(closestDeadline.target_date!).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    return {
      activeCount: activeGoals.length,
      completedCount: completedGoals.length,
      successRate,
      avgProgress,
      onTrack,
      needsAttention,
      closestDeadline: daysUntilDeadline,
      hasActiveGoals: activeGoals.length > 0,
    };
  }, [activeGoals, completedGoals]);

  if (isLoading) {
    return (
      <div className="h-[220px] w-full animate-pulse bg-muted rounded-xl" />
    );
  }

  if (!stats) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none shadow-md">
        <CardContent className="pt-6 text-center py-10">
          <Target className="h-12 w-12 mx-auto mb-4 text-purple-400 opacity-50" />
          <h2 className="text-xl font-bold mb-2">No Goals Yet</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Set your first goal to start tracking your training progress.
          </p>
          <Button onClick={onAddGoal}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Goal
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getProgressStatus = () => {
    if (stats.avgProgress >= 75) return { icon: <CheckCircle className="h-5 w-5 text-green-600" />, color: 'bg-green-100 text-green-800 border-green-200', label: 'Excellent' };
    if (stats.avgProgress >= 50) return { icon: <TrendingUp className="h-5 w-5 text-blue-600" />, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Good Progress' };
    if (stats.avgProgress >= 25) return { icon: <Clock className="h-5 w-5 text-yellow-600" />, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Getting Started' };
    return { icon: <AlertCircle className="h-5 w-5 text-orange-600" />, color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Needs Focus' };
  };

  const progressStatus = getProgressStatus();

  return (
    <Card className="overflow-hidden border-none shadow-lg bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Goals Dashboard</h2>
            <p className="text-blue-100 text-sm">
              Track your progress and achieve your targets
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
                className="text-white hover:bg-white/20 border-white/30"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                />
              </Button>
            )}
            <Button
              onClick={onAddGoal}
              variant="secondary"
              size="sm"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Active Goals */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-900">
                Active Goals
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {stats.activeCount}
            </div>
            <div className="text-xs text-blue-700 mt-1">
              {stats.onTrack > 0 && `${stats.onTrack} on track`}
              {stats.onTrack === 0 && stats.activeCount > 0 && 'Just started'}
            </div>
          </div>

          {/* Completed Goals */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-900">
                Completed
              </span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {stats.completedCount}
            </div>
            <div className="text-xs text-green-700 mt-1">
              Goals achieved
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-900">
                Success Rate
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {stats.successRate}%
            </div>
            <div className="text-xs text-purple-700 mt-1">
              Completion rate
            </div>
          </div>

          {/* Average Progress */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-900">
                Avg Progress
              </span>
            </div>
            <div className="text-2xl font-bold text-indigo-900">
              {stats.avgProgress}%
            </div>
            <div className="text-xs text-indigo-700 mt-1">
              Across active goals
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div
          className={`p-3 rounded-lg border flex items-center justify-between ${progressStatus.color}`}
        >
          <div className="flex items-center gap-3">
            {progressStatus.icon}
            <div>
              <div className="text-sm font-semibold">{progressStatus.label}</div>
              <div className="text-xs">
                {stats.needsAttention > 0 && `${stats.needsAttention} goal${stats.needsAttention > 1 ? 's' : ''} need${stats.needsAttention === 1 ? 's' : ''} attention`}
                {stats.needsAttention === 0 && stats.hasActiveGoals && 'All goals progressing well'}
                {!stats.hasActiveGoals && 'Create goals to start tracking'}
              </div>
            </div>
          </div>
          {stats.closestDeadline !== null && (
            <div className="text-right">
              <div className="text-xs font-medium">Next Deadline</div>
              <div className="text-lg font-bold">
                {stats.closestDeadline > 0
                  ? `${stats.closestDeadline}d`
                  : 'Today'}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
