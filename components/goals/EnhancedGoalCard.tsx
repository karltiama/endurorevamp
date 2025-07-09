'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UserGoal } from '@/types/goals';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Edit, 
  MoreHorizontal,
  Archive,
  Trophy,
  Flame,
  Award,
  BarChart3,
  Clock,
  Zap,
  Heart,
  Mountain
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EnhancedGoalCardProps {
  goal: UserGoal;
  onEdit: () => void;
  showCompleted?: boolean;
}

export function EnhancedGoalCard({ goal, onEdit, showCompleted = false }: EnhancedGoalCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const progressPercentage = goal.target_value 
    ? Math.min(100, (goal.current_progress / goal.target_value) * 100)
    : 0;

  const isCompleted = goal.is_completed || progressPercentage >= 100;
  const isOnTrack = progressPercentage >= 50;

  // Calculate goal insights
  const insights = calculateGoalInsights(goal, progressPercentage);
  const achievements = getGoalAchievements(goal, progressPercentage);
  const difficulty = getGoalDifficulty(goal);
  const benefits = getGoalBenefits(goal.goal_type?.category);

  const getGoalIcon = () => {
    switch (goal.goal_type?.category) {
      case 'distance': return Target;
      case 'pace': return Zap;
      case 'frequency': return Calendar;
      case 'duration': return Clock;
      case 'elevation': return Mountain;
      case 'heart_rate': return Heart;
      default: return TrendingUp;
    }
  };

  const GoalIcon = getGoalIcon();

  return (
    <TooltipProvider>
      <Card className={`
        transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer
        ${isCompleted ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : ''}
        ${!isCompleted && isOnTrack ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50' : ''}
        ${!isCompleted && !isOnTrack ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50' : ''}
      `}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={`
                p-3 rounded-xl shadow-sm
                ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}
              `}>
                <GoalIcon className="h-5 w-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg leading-tight">{goal.goal_type?.display_name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {goal.goal_type?.category}
                  </Badge>
                  {difficulty && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant={difficulty.variant} className="text-xs">
                          {difficulty.level}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{difficulty.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                
                {goal.goal_data?.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {goal.goal_data.notes}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Achievement Badges */}
              {achievements.map((achievement, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger>
                    <div className="p-1">
                      <achievement.icon className={`h-4 w-4 ${achievement.color}`} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              
              {isCompleted && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <Trophy className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Goal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDetails(!showDetails)}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {showDetails ? 'Hide Details' : 'Show Details'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Target</span>
              <span className="font-semibold">
                {goal.target_value} {goal.target_unit}
                {goal.target_date && (
                  <span className="text-muted-foreground ml-2">
                    by {formatDate(goal.target_date)}
                  </span>
                )}
              </span>
            </div>

            {goal.target_value && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {goal.current_progress} / {goal.target_value} {goal.target_unit}
                  </span>
                </div>
                
                {/* Enhanced Progress Bar */}
                <div className="relative">
                  <Progress 
                    value={progressPercentage} 
                    className={`h-3 ${isCompleted ? '[&>div]:bg-green-500' : isOnTrack ? '[&>div]:bg-blue-500' : '[&>div]:bg-orange-500'}`}
                  />
                  {progressPercentage > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white drop-shadow-sm">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className={`flex items-center gap-1 ${isOnTrack ? 'text-green-600' : 'text-orange-600'}`}>
                    {isOnTrack ? (
                      <>
                        <TrendingUp className="h-3 w-3" />
                        On track
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        Needs attention
                      </>
                    )}
                  </span>
                  {insights.prediction && (
                    <span className="text-muted-foreground">
                      {insights.prediction}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Insights Section (Expandable) */}
          {showDetails && (
            <div className="space-y-4 pt-4 border-t">
              {/* Goal Benefits */}
              {benefits && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    Why This Matters
                  </h4>
                  <p className="text-sm text-muted-foreground">{benefits}</p>
                </div>
              )}

              {/* Performance Insights */}
              {insights.weeklyAverage && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    Your Performance
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Weekly Average:</span>
                      <div className="font-medium">{insights.weeklyAverage}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Best Result:</span>
                      <div className="font-medium">{goal.best_result || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {insights.recommendation && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <Target className="h-4 w-4 text-green-500" />
                    Recommendation
                  </h4>
                  <p className="text-sm text-muted-foreground">{insights.recommendation}</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          {!showCompleted && !isCompleted && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="w-full"
              >
                <Edit className="h-3 w-3 mr-2" />
                Update Progress
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// Helper functions
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function calculateGoalInsights(goal: UserGoal, progressPercentage: number) {
  const insights: {
    weeklyAverage?: string;
    prediction?: string;
    recommendation?: string;
  } = {};

  // Calculate weekly average for cumulative goals
  if (goal.goal_type?.metric_type?.includes('total')) {
    const weeksActive = Math.max(1, Math.floor((Date.now() - new Date(goal.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)));
    insights.weeklyAverage = `${(goal.current_progress / weeksActive).toFixed(1)} ${goal.target_unit}/week`;
  }

  // Prediction logic
  if (goal.target_value && goal.current_progress > 0) {
    const remainingProgress = goal.target_value - goal.current_progress;
    const currentRate = goal.current_progress / Math.max(1, Math.floor((Date.now() - new Date(goal.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)));
    
    if (currentRate > 0) {
      const weeksToComplete = Math.ceil(remainingProgress / currentRate);
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + (weeksToComplete * 7));
      
      if (weeksToComplete <= 4) {
        insights.prediction = `Est. completion: ${completionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
    }
  }

  // Recommendations based on progress
  if (progressPercentage < 25) {
    insights.recommendation = "Consider breaking this goal into smaller weekly targets to build momentum.";
  } else if (progressPercentage < 50) {
    insights.recommendation = "You're making progress! Try to maintain consistency in your training.";
  } else if (progressPercentage < 75) {
    insights.recommendation = "Great progress! You're on track to achieve this goal.";
  } else if (!goal.is_completed) {
    insights.recommendation = "You're so close! Push through to complete this goal.";
  }

  return insights;
}

function getGoalAchievements(goal: UserGoal, progressPercentage: number) {
  const achievements = [];

  // Consistency streak
  if (goal.streak_count >= 7) {
    achievements.push({
      icon: Flame,
      name: '7-Day Streak',
      description: 'Consistent for a full week',
      color: 'text-orange-500'
    });
  }

  // Progress milestones
  if (progressPercentage >= 50 && progressPercentage < 100) {
    achievements.push({
      icon: Award,
      name: 'Halfway There',
      description: '50% progress achieved',
      color: 'text-blue-500'
    });
  }

  // Completion
  if (goal.is_completed) {
    achievements.push({
      icon: Trophy,
      name: 'Goal Achieved',
      description: 'Congratulations!',
      color: 'text-gold-500'
    });
  }

  return achievements;
}

function getGoalDifficulty(goal: UserGoal) {
  const target = goal.target_value;
  const category = goal.goal_type?.category;

  if (!target) return null;

  // Define difficulty thresholds by category
  const thresholds = {
    distance: {
      weekly: { easy: 20, moderate: 40, hard: 60 },
      monthly: { easy: 80, moderate: 160, hard: 250 }
    },
    frequency: {
      weekly: { easy: 3, moderate: 4, hard: 6 },
      monthly: { easy: 12, moderate: 16, hard: 24 }
    },
    duration: {
      weekly: { easy: 3, moderate: 6, hard: 10 } // hours
    }
  };

  const period = goal.time_period || 'weekly';
  const categoryThresholds = thresholds[category as keyof typeof thresholds];
  
  if (!categoryThresholds) return null;

  const periodThresholds = categoryThresholds[period as keyof typeof categoryThresholds];
  if (!periodThresholds) return null;

  if (target <= periodThresholds.easy) {
    return {
      level: 'Beginner',
      variant: 'secondary' as const,
      description: 'A great starting point for building habits'
    };
  } else if (target <= periodThresholds.moderate) {
    return {
      level: 'Intermediate',
      variant: 'default' as const,
      description: 'A solid challenge for regular runners'
    };
  } else {
    return {
      level: 'Advanced',
      variant: 'destructive' as const,
      description: 'An ambitious goal for experienced athletes'
    };
  }
}

function getGoalBenefits(category?: string) {
  const benefits = {
    distance: "Building weekly distance improves cardiovascular endurance, strengthens your aerobic base, and increases your ability to run longer without fatigue.",
    pace: "Improving your pace enhances running efficiency, builds speed endurance, and helps you run faster with less effort over time.",
    frequency: "Consistent running frequency builds the habit, improves recovery between sessions, and creates the foundation for all other running improvements.",
    duration: "Time-based goals develop mental toughness, improve fat-burning efficiency, and build the aerobic base essential for endurance.",
    elevation: "Hill training builds leg strength, improves running economy, and enhances your ability to handle varied terrain with confidence.",
    heart_rate: "Heart rate zone training optimizes your effort distribution, improves aerobic capacity, and ensures you're training at the right intensity."
  };

  return benefits[category as keyof typeof benefits];
} 