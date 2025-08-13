'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UserGoal, GoalProgress } from '@/types/goals';
import {
  Trophy,
  Award,
  Flame,
  Star,
  Target,
  Calendar,
  TrendingUp,
  Zap,
  Crown,
  Medal,
  Shield,
  Sparkles,
  PartyPopper,
  Gift,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'streak' | 'milestone' | 'performance' | 'consistency';
  points: number;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface AchievementSystemProps {
  goal: UserGoal;
  goalProgress: GoalProgress[];
  userGoals: UserGoal[];
}

export function AchievementSystem({
  goal,
  goalProgress,
  userGoals,
}: AchievementSystemProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  const achievements = calculateAchievements(goal, goalProgress);
  const stats = calculateUserStats(userGoals, goalProgress);

  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* User Stats Overview */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Your Achievement Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.totalPoints}
              </div>
              <div className="text-sm text-muted-foreground">
                Achievement Points
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.currentStreak}
              </div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.completedGoals}
              </div>
              <div className="text-sm text-muted-foreground">
                Goals Completed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.level}
              </div>
              <div className="text-sm text-muted-foreground">
                Achievement Level
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {achievements
              .filter(a => a.unlockedAt)
              .slice(0, 3)
              .map(achievement => (
                <div
                  key={achievement.id}
                  className={`
                  flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                  ${getRarityStyles(achievement.rarity).bg} ${getRarityStyles(achievement.rarity).border}
                `}
                >
                  <div
                    className={`p-2 rounded-full ${getRarityStyles(achievement.rarity).iconBg}`}
                  >
                    <achievement.icon
                      className={`h-5 w-5 ${getRarityStyles(achievement.rarity).iconColor}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{achievement.name}</span>
                      <Badge
                        variant={
                          getRarityStyles(achievement.rarity).badgeVariant
                        }
                      >
                        {achievement.rarity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        +{achievement.points} pts
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                    {achievement.unlockedAt && (
                      <p className="text-xs text-muted-foreground">
                        Unlocked {formatDate(achievement.unlockedAt)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={triggerCelebration}
                    className="ml-auto"
                  >
                    <PartyPopper className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Towards Next Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Next Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achievements
              .filter(a => !a.unlockedAt && a.progress !== undefined)
              .slice(0, 3)
              .map(achievement => (
                <div key={achievement.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <achievement.icon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{achievement.name}</span>
                      <Badge variant="outline" className="text-xs">
                        +{achievement.points} pts
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {achievement.progress}/{achievement.maxProgress}
                    </span>
                  </div>
                  <Progress
                    value={
                      ((achievement.progress || 0) /
                        (achievement.maxProgress || 1)) *
                      100
                    }
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {achievement.description}
                  </p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* All Achievements Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-500" />
            Achievement Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.map(achievement => (
              <div
                key={achievement.id}
                className={`
                  p-4 rounded-lg border-2 text-center transition-all hover:scale-105
                  ${
                    achievement.unlockedAt
                      ? `${getRarityStyles(achievement.rarity).bg} ${getRarityStyles(achievement.rarity).border}`
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }
                `}
              >
                <div
                  className={`
                  mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2
                  ${
                    achievement.unlockedAt
                      ? getRarityStyles(achievement.rarity).iconBg
                      : 'bg-gray-200'
                  }
                `}
                >
                  <achievement.icon
                    className={`
                    h-6 w-6 
                    ${
                      achievement.unlockedAt
                        ? getRarityStyles(achievement.rarity).iconColor
                        : 'text-gray-400'
                    }
                  `}
                  />
                </div>
                <h3 className="font-semibold text-sm mb-1">
                  {achievement.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {achievement.description}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Badge
                    variant={
                      achievement.unlockedAt
                        ? getRarityStyles(achievement.rarity).badgeVariant
                        : 'secondary'
                    }
                    className="text-xs"
                  >
                    {achievement.rarity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    +{achievement.points}
                  </span>
                </div>
                {achievement.progress !== undefined &&
                  !achievement.unlockedAt && (
                    <div className="mt-2">
                      <Progress
                        value={
                          ((achievement.progress || 0) /
                            (achievement.maxProgress || 1)) *
                          100
                        }
                        className="h-1"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {achievement.progress}/{achievement.maxProgress}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <Card className="p-6 text-center max-w-md">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
            <p className="text-muted-foreground mb-4">
              You&apos;ve earned points and unlocked a new achievement!
            </p>
            <Button onClick={() => setShowCelebration(false)}>
              <Gift className="h-4 w-4 mr-2" />
              Awesome!
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

function calculateAchievements(
  goal: UserGoal,
  goalProgress: GoalProgress[]
): Achievement[] {
  const achievements: Achievement[] = [];

  // Current progress stats
  const currentProgress = goal.current_progress;
  const targetValue = goal.target_value || 0;
  const progressPercentage =
    targetValue > 0 ? (currentProgress / targetValue) * 100 : 0;
  const streak = calculateCurrentStreak(goalProgress);
  const totalActivities = goalProgress.length;

  // Streak Achievements
  achievements.push(
    {
      id: 'first_step',
      name: 'First Step',
      description: 'Complete your first activity towards this goal',
      icon: Target,
      rarity: 'common',
      category: 'milestone',
      points: 10,
      unlockedAt:
        totalActivities >= 1 ? goalProgress[0]?.activity_date : undefined,
      progress: Math.min(1, totalActivities),
      maxProgress: 1,
    },
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day activity streak',
      icon: Flame,
      rarity: 'common',
      category: 'streak',
      points: 25,
      unlockedAt: streak >= 7 ? new Date().toISOString() : undefined,
      progress: Math.min(7, streak),
      maxProgress: 7,
    },
    {
      id: 'dedication_machine',
      name: 'Dedication Machine',
      description: 'Maintain a 30-day activity streak',
      icon: Shield,
      rarity: 'rare',
      category: 'streak',
      points: 100,
      unlockedAt: streak >= 30 ? new Date().toISOString() : undefined,
      progress: Math.min(30, streak),
      maxProgress: 30,
    },
    {
      id: 'unstoppable_force',
      name: 'Unstoppable Force',
      description: 'Maintain a 100-day activity streak',
      icon: Crown,
      rarity: 'legendary',
      category: 'streak',
      points: 500,
      unlockedAt: streak >= 100 ? new Date().toISOString() : undefined,
      progress: Math.min(100, streak),
      maxProgress: 100,
    }
  );

  // Milestone Achievements
  achievements.push(
    {
      id: 'quarter_way',
      name: 'Quarter Way There',
      description: 'Reach 25% of your goal target',
      icon: Star,
      rarity: 'common',
      category: 'milestone',
      points: 15,
      unlockedAt:
        progressPercentage >= 25 ? new Date().toISOString() : undefined,
      progress: Math.min(25, progressPercentage),
      maxProgress: 25,
    },
    {
      id: 'halfway_hero',
      name: 'Halfway Hero',
      description: 'Reach 50% of your goal target',
      icon: Medal,
      rarity: 'common',
      category: 'milestone',
      points: 30,
      unlockedAt:
        progressPercentage >= 50 ? new Date().toISOString() : undefined,
      progress: Math.min(50, progressPercentage),
      maxProgress: 50,
    },
    {
      id: 'home_stretch',
      name: 'Home Stretch',
      description: 'Reach 75% of your goal target',
      icon: TrendingUp,
      rarity: 'rare',
      category: 'milestone',
      points: 50,
      unlockedAt:
        progressPercentage >= 75 ? new Date().toISOString() : undefined,
      progress: Math.min(75, progressPercentage),
      maxProgress: 75,
    },
    {
      id: 'goal_crusher',
      name: 'Goal Crusher',
      description: 'Complete 100% of your goal target',
      icon: Trophy,
      rarity: 'epic',
      category: 'milestone',
      points: 150,
      unlockedAt: goal.is_completed ? goal.completed_at : undefined,
      progress: Math.min(100, progressPercentage),
      maxProgress: 100,
    }
  );

  // Performance Achievements
  achievements.push(
    {
      id: 'overachiever',
      name: 'Overachiever',
      description: 'Exceed your goal target by 25%',
      icon: Zap,
      rarity: 'rare',
      category: 'performance',
      points: 75,
      unlockedAt:
        progressPercentage >= 125 ? new Date().toISOString() : undefined,
      progress: Math.min(125, progressPercentage),
      maxProgress: 125,
    },
    {
      id: 'beyond_limits',
      name: 'Beyond Limits',
      description: 'Exceed your goal target by 50%',
      icon: Crown,
      rarity: 'epic',
      category: 'performance',
      points: 200,
      unlockedAt:
        progressPercentage >= 150 ? new Date().toISOString() : undefined,
      progress: Math.min(150, progressPercentage),
      maxProgress: 150,
    }
  );

  // Consistency Achievements
  const consistencyRate = calculateConsistencyRate(goalProgress);
  achievements.push({
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Maintain 80% weekly consistency for a month',
    icon: Calendar,
    rarity: 'rare',
    category: 'consistency',
    points: 100,
    unlockedAt: consistencyRate >= 80 ? new Date().toISOString() : undefined,
    progress: Math.min(80, consistencyRate),
    maxProgress: 80,
  });

  return achievements;
}

function calculateUserStats(
  userGoals: UserGoal[],
  allProgress: GoalProgress[]
) {
  const completedGoals = userGoals.filter(g => g.is_completed).length;
  const totalPoints = 0; // Would be calculated from unlocked achievements
  const currentStreak = calculateGlobalStreak(allProgress);
  const level = Math.floor(totalPoints / 100) + 1;

  return {
    completedGoals,
    totalPoints,
    currentStreak,
    level,
  };
}

function calculateCurrentStreak(progress: GoalProgress[]): number {
  if (progress.length === 0) return 0;

  const sortedProgress = progress.sort(
    (a, b) =>
      new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
  );

  let streak = 0;
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const p of sortedProgress) {
    const progressDate = new Date(p.activity_date);
    progressDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (currentDate.getTime() - progressDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysDiff === streak) {
      streak++;
    } else if (daysDiff > streak) {
      break;
    }
  }

  return streak;
}

function calculateGlobalStreak(allProgress: GoalProgress[]): number {
  // Calculate streak across all goals
  return calculateCurrentStreak(allProgress);
}

function calculateConsistencyRate(progress: GoalProgress[]): number {
  if (progress.length === 0) return 0;

  const last30Days = progress.filter(p => {
    const date = new Date(p.activity_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  });

  const uniqueDays = new Set(
    last30Days.map(p => new Date(p.activity_date).toDateString())
  ).size;

  return (uniqueDays / 30) * 100;
}

function getRarityStyles(rarity: Achievement['rarity']) {
  const styles = {
    common: {
      bg: 'bg-gray-50',
      border: 'border-gray-300',
      iconBg: 'bg-gray-200',
      iconColor: 'text-gray-600',
      badgeVariant: 'secondary' as const,
    },
    rare: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      iconBg: 'bg-blue-200',
      iconColor: 'text-blue-600',
      badgeVariant: 'default' as const,
    },
    epic: {
      bg: 'bg-purple-50',
      border: 'border-purple-300',
      iconBg: 'bg-purple-200',
      iconColor: 'text-purple-600',
      badgeVariant: 'secondary' as const,
    },
    legendary: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      iconBg: 'bg-yellow-200',
      iconColor: 'text-yellow-600',
      badgeVariant: 'destructive' as const,
    },
  };

  return styles[rarity];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
