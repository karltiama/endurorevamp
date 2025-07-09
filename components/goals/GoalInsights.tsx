'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserGoal, GoalProgress } from '@/types/goals';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Calendar,
  BarChart3,
  Award,
  Lightbulb,
  Activity,
  Clock
} from 'lucide-react';

interface GoalInsightsProps {
  goal: UserGoal;
  recentProgress?: GoalProgress[];
  weeklyData?: Array<{ week: string; value: number }>;
}

export function GoalInsights({ goal, recentProgress = [], weeklyData = [] }: GoalInsightsProps) {
  const insights = calculateDetailedInsights(goal, recentProgress, weeklyData);

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{insights.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{insights.weeklyAverage}</div>
              <div className="text-sm text-muted-foreground">Weekly Avg</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{insights.bestWeek}</div>
              <div className="text-sm text-muted-foreground">Best Week</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{insights.improvementRate}</div>
              <div className="text-sm text-muted-foreground">Improvement</div>
            </div>
          </div>

          {/* Trend Indicator */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {insights.trend === 'improving' ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : insights.trend === 'declining' ? (
                <TrendingDown className="h-5 w-5 text-red-500" />
              ) : (
                <BarChart3 className="h-5 w-5 text-gray-500" />
              )}
              <span className="font-medium">
                {insights.trend === 'improving' ? 'Improving Trend' : 
                 insights.trend === 'declining' ? 'Declining Trend' : 'Stable Performance'}
              </span>
            </div>
            <Badge variant={insights.trend === 'improving' ? 'default' : 'secondary'}>
              {insights.trendDescription}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Target Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Target Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current vs Target</span>
              <span className="font-medium">{insights.progressPercentage}% complete</span>
            </div>
            <Progress value={insights.progressPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Days Remaining</div>
              <div className="text-lg font-semibold">{insights.daysRemaining || 'Ongoing'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Required Weekly Rate</div>
              <div className="text-lg font-semibold">{insights.requiredWeeklyRate}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Projected Completion</div>
              <div className="text-lg font-semibold">{insights.projectedCompletion}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Success Probability</div>
              <div className={`text-lg font-semibold ${
                insights.successProbability >= 80 ? 'text-green-600' :
                insights.successProbability >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {insights.successProbability}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <rec.icon className={`h-5 w-5 mt-0.5 ${rec.color}`} />
              <div>
                <div className="font-medium text-sm">{rec.title}</div>
                <div className="text-sm text-muted-foreground">{rec.description}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Recent Contributions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentProgress.slice(0, 5).map((progress, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{formatDate(progress.activity_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      +{progress.contribution_amount} {goal.target_unit}
                    </span>
                    {progress.value_achieved && (
                      <Badge variant="outline" className="text-xs">
                        {progress.value_achieved} {goal.target_unit}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function calculateDetailedInsights(
  goal: UserGoal, 
  recentProgress: GoalProgress[], 
  weeklyData: Array<{ week: string; value: number }>
) {
  const now = new Date();
  const goalStartDate = new Date(goal.created_at);
  const daysActive = Math.max(1, Math.floor((now.getTime() - goalStartDate.getTime()) / (24 * 60 * 60 * 1000)));
  const weeksActive = Math.max(1, Math.floor(daysActive / 7));

  // Basic calculations
  const progressPercentage = goal.target_value 
    ? Math.min(100, (goal.current_progress / goal.target_value) * 100)
    : 0;

  const weeklyAverage = goal.current_progress / weeksActive;

  // Calculate streak
  const currentStreak = calculateStreak(recentProgress);

  // Calculate trend
  const trend = calculateTrend(weeklyData);

  // Best week calculation
  const bestWeek = weeklyData.length > 0 
    ? Math.max(...weeklyData.map(w => w.value))
    : weeklyAverage;

  // Improvement rate
  const improvementRate = calculateImprovementRate(weeklyData);

  // Days remaining (if target date exists)
  const daysRemaining = goal.target_date 
    ? Math.max(0, Math.floor((new Date(goal.target_date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
    : null;

  // Required weekly rate to achieve goal
  const remainingProgress = goal.target_value ? goal.target_value - goal.current_progress : 0;
  const remainingWeeks = daysRemaining ? Math.max(1, Math.floor(daysRemaining / 7)) : 52;
  const requiredWeeklyRate = remainingProgress / remainingWeeks;

  // Projected completion
  const projectedCompletion = weeklyAverage > 0 
    ? formatProjectedCompletion(remainingProgress / weeklyAverage * 7)
    : 'Unable to calculate';

  // Success probability
  const successProbability = calculateSuccessProbability(
    goal.current_progress,
    goal.target_value || 0,
    weeklyAverage,
    daysRemaining
  );

  // Generate recommendations
  const recommendations = generateRecommendations(goal, {
    progressPercentage,
    trend,
    weeklyAverage,
    requiredWeeklyRate,
    successProbability
  });

  return {
    currentStreak,
    weeklyAverage: `${weeklyAverage.toFixed(1)} ${goal.target_unit}`,
    bestWeek: `${bestWeek.toFixed(1)} ${goal.target_unit}`,
    improvementRate: `${improvementRate >= 0 ? '+' : ''}${improvementRate.toFixed(1)}%`,
    trend: trend.direction,
    trendDescription: trend.description,
    progressPercentage: Math.round(progressPercentage),
    daysRemaining,
    requiredWeeklyRate: `${requiredWeeklyRate.toFixed(1)} ${goal.target_unit}`,
    projectedCompletion,
    successProbability,
    recommendations
  };
}

function calculateStreak(recentProgress: GoalProgress[]): number {
  // Simplified streak calculation - count consecutive days with progress
  const sortedProgress = recentProgress
    .sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime());

  let streak = 0;
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const progress of sortedProgress) {
    const progressDate = new Date(progress.activity_date);
    progressDate.setHours(0, 0, 0, 0);

    if (progressDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function calculateTrend(weeklyData: Array<{ week: string; value: number }>) {
  if (weeklyData.length < 2) {
    return { direction: 'stable' as const, description: 'Need more data' };
  }

  const recent = weeklyData.slice(-3);
  const earlier = weeklyData.slice(-6, -3);

  if (recent.length === 0 || earlier.length === 0) {
    return { direction: 'stable' as const, description: 'Insufficient data' };
  }

  const recentAvg = recent.reduce((sum, w) => sum + w.value, 0) / recent.length;
  const earlierAvg = earlier.reduce((sum, w) => sum + w.value, 0) / earlier.length;

  const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;

  if (change > 10) {
    return { direction: 'improving' as const, description: `+${change.toFixed(1)}% vs previous period` };
  } else if (change < -10) {
    return { direction: 'declining' as const, description: `${change.toFixed(1)}% vs previous period` };
  } else {
    return { direction: 'stable' as const, description: 'Consistent performance' };
  }
}

function calculateImprovementRate(weeklyData: Array<{ week: string; value: number }>): number {
  if (weeklyData.length < 2) return 0;

  const first = weeklyData[0].value;
  const last = weeklyData[weeklyData.length - 1].value;

  return first > 0 ? ((last - first) / first) * 100 : 0;
}

function calculateSuccessProbability(
  currentProgress: number,
  targetValue: number,
  weeklyAverage: number,
  daysRemaining: number | null
): number {
  if (!targetValue || !daysRemaining) return 75; // Default for ongoing goals

  const remainingProgress = targetValue - currentProgress;
  const weeksRemaining = daysRemaining / 7;
  const requiredWeeklyRate = remainingProgress / weeksRemaining;

  if (weeklyAverage >= requiredWeeklyRate * 1.2) return 95;
  if (weeklyAverage >= requiredWeeklyRate) return 85;
  if (weeklyAverage >= requiredWeeklyRate * 0.8) return 70;
  if (weeklyAverage >= requiredWeeklyRate * 0.6) return 50;
  return 25;
}

function generateRecommendations(goal: UserGoal, metrics: {
  progressPercentage: number;
  trend: { direction: string };
  weeklyAverage: number;
  requiredWeeklyRate: number;
  successProbability: number;
}) {
  const recommendations = [];

  // Performance-based recommendations
  if (metrics.progressPercentage < 25) {
    recommendations.push({
      icon: Target,
      color: 'text-red-500',
      title: 'Start Small',
      description: 'Break this goal into smaller weekly targets to build momentum and consistency.'
    });
  }

  if (metrics.trend.direction === 'declining') {
    recommendations.push({
      icon: TrendingUp,
      color: 'text-orange-500',
      title: 'Reverse the Trend',
      description: 'Your progress has been declining. Consider adjusting your training schedule or reducing the target temporarily.'
    });
  }

  if (metrics.successProbability < 50) {
    recommendations.push({
      icon: Clock,
      color: 'text-yellow-500',
      title: 'Adjust Expectations',
      description: 'Based on current progress, consider extending the timeline or reducing the target to maintain motivation.'
    });
  }

  if (metrics.weeklyAverage > metrics.requiredWeeklyRate * 1.5) {
    recommendations.push({
      icon: Award,
      color: 'text-green-500',
      title: 'Ahead of Schedule',
      description: 'Great work! You\'re exceeding your target pace. Consider setting a more ambitious goal.'
    });
  }

  // Goal-specific recommendations
  if (goal.goal_type?.category === 'frequency') {
    recommendations.push({
      icon: Calendar,
      color: 'text-blue-500',
      title: 'Schedule Consistency',
      description: 'Plan your runs for specific days of the week to build a sustainable routine.'
    });
  }

  return recommendations.slice(0, 3); // Limit to 3 recommendations
}

function formatProjectedCompletion(daysToComplete: number): string {
  if (daysToComplete <= 0) return 'Already achieved';
  if (daysToComplete < 7) return `${Math.ceil(daysToComplete)} days`;
  if (daysToComplete < 30) return `${Math.ceil(daysToComplete / 7)} weeks`;
  return `${Math.ceil(daysToComplete / 30)} months`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
} 