'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoalType } from '@/types/goals';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import { formatDistance, formatPace as formatPaceUtil } from '@/lib/utils';
import { 
  Brain,
  Target,
  TrendingUp,
  Zap,
  Shield,
  Star,
  Calculator,
  Lightbulb
} from 'lucide-react';

interface UserPerformanceData {
  weeklyDistance: number;
  monthlyDistance: number;
  averagePace: number; // seconds per km
  runFrequency: number; // runs per week
  longestRun: number;
  totalRunningExperience: number; // months
  recentInjuries: boolean;
}

interface SmartTargetRecommendationsProps {
  goalType: GoalType;
  userPerformance?: UserPerformanceData;
  onSelectTarget: (target: number, difficulty: string) => void;
}

export function SmartTargetRecommendations({ 
  goalType, 
  userPerformance, 
  onSelectTarget 
}: SmartTargetRecommendationsProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('moderate');
  const [customTarget, setCustomTarget] = useState<number | null>(null);
  const { preferences } = useUnitPreferences();

  const recommendations = generateSmartRecommendations(goalType, userPerformance);

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI-Powered Target Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Our AI analyzes your recent performance, training history, and injury patterns to suggest the optimal target for your goal. 
            Choose a difficulty level that matches your commitment and timeline.
          </p>
        </CardContent>
      </Card>

      {/* Performance Analysis */}
      {userPerformance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Your Current Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold">{formatDistance(userPerformance.weeklyDistance * 1000, preferences.distance)}</div>
                <div className="text-muted-foreground">Weekly Distance</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="font-semibold">{formatPaceUtil(userPerformance.averagePace, preferences.pace)}</div>
                <div className="text-muted-foreground">Average Pace</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="font-semibold">{userPerformance.runFrequency}/week</div>
                <div className="text-muted-foreground">Run Frequency</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="font-semibold">{formatDistance(userPerformance.longestRun * 1000, preferences.distance)}</div>
                <div className="text-muted-foreground">Longest Run</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Difficulty Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Challenge Level</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.difficulty}
                className={`
                  p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${selectedDifficulty === rec.difficulty 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => setSelectedDifficulty(rec.difficulty)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <rec.icon className={`h-6 w-6 ${rec.color}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{rec.title}</h3>
                        <Badge variant={rec.badgeVariant}>
                          {rec.target} {goalType.unit}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{rec.successRate}% Success Rate</div>
                    <div className="text-xs text-muted-foreground">{rec.timeframe}</div>
                  </div>
                </div>

                {/* Detailed Benefits */}
                <div className="mt-3 pl-9">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-3 w-3 text-yellow-500" />
                      <span className="text-muted-foreground">Benefits: {rec.benefits}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calculator className="h-3 w-3 text-blue-500" />
                      <span className="text-muted-foreground">Strategy: {rec.strategy}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Target Option */}
          <div className="border-t pt-4">
            <Label htmlFor="customTarget" className="text-sm font-medium">
              Or set a custom target
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="customTarget"
                type="number"
                placeholder={`Enter target in ${goalType.unit}`}
                value={customTarget || ''}
                onChange={(e) => setCustomTarget(parseFloat(e.target.value) || null)}
                className="flex-1"
              />
              <Button
                variant="outline"
                disabled={!customTarget}
                onClick={() => customTarget && onSelectTarget(customTarget, 'custom')}
              >
                Use Custom
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              className="flex-1"
              onClick={() => {
                const selected = recommendations.find(r => r.difficulty === selectedDifficulty);
                if (selected) {
                  onSelectTarget(selected.target, selected.difficulty);
                }
              }}
            >
              Use {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)} Target
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Target Guidance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Goal Achievement Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {getGoalTips(goalType, selectedDifficulty).map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">{tip}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function generateSmartRecommendations(goalType: GoalType, userPerformance?: UserPerformanceData) {
  const metricType = goalType.metric_type;

  // Default recommendations if no performance data
  if (!userPerformance) {
    return getDefaultRecommendations(goalType);
  }

  // Generate personalized recommendations based on user performance
  const recommendations = [];

  switch (metricType) {
    case 'total_distance':
      recommendations.push(...generateDistanceRecommendations(goalType, userPerformance));
      break;
    case 'run_count':
      recommendations.push(...generateFrequencyRecommendations(goalType, userPerformance));
      break;
    case 'average_pace':
      recommendations.push(...generatePaceRecommendations(goalType, userPerformance));
      break;
    case 'total_time':
      recommendations.push(...generateDurationRecommendations(goalType, userPerformance));
      break;
    default:
      return getDefaultRecommendations(goalType);
  }

  return recommendations;
}

function generateDistanceRecommendations(goalType: GoalType, userPerformance: UserPerformanceData) {
  const current = goalType.name.includes('weekly') 
    ? userPerformance.weeklyDistance 
    : userPerformance.monthlyDistance;

  const baseMultiplier = goalType.name.includes('weekly') ? 1 : 4;

  return [
    {
      difficulty: 'conservative',
      title: 'Safe Progress',
      target: Math.round(current * 1.1 * baseMultiplier),
      icon: Shield,
      color: 'text-green-500',
      badgeVariant: 'secondary' as const,
      description: '10% increase from your current average - safe and sustainable',
      benefits: 'Builds confidence, low injury risk',
      strategy: 'Gradual weekly increases, focus on consistency',
      successRate: 95,
      timeframe: '4-6 weeks'
    },
    {
      difficulty: 'moderate',
      title: 'Balanced Challenge',
      target: Math.round(current * 1.25 * baseMultiplier),
      icon: Target,
      color: 'text-blue-500',
      badgeVariant: 'default' as const,
      description: '25% increase - optimal balance of challenge and achievability',
      benefits: 'Meaningful fitness gains, improved endurance',
      strategy: 'Progressive overload with recovery weeks',
      successRate: 80,
      timeframe: '6-8 weeks'
    },
    {
      difficulty: 'ambitious',
      title: 'Push Your Limits',
      target: Math.round(current * 1.5 * baseMultiplier),
      icon: Zap,
      color: 'text-purple-500',
      badgeVariant: 'destructive' as const,
      description: '50% increase - significant challenge for experienced runners',
      benefits: 'Major fitness breakthrough, mental toughness',
      strategy: 'Structured training plan, careful monitoring',
      successRate: 60,
      timeframe: '8-12 weeks'
    }
  ];
}

function generateFrequencyRecommendations(goalType: GoalType, userPerformance: UserPerformanceData) {
  const current = userPerformance.runFrequency;
  const maxSafe = Math.min(6, current + 2);

  return [
    {
      difficulty: 'conservative',
      title: 'Steady Consistency',
      target: Math.min(maxSafe, current + 1),
      icon: Shield,
      color: 'text-green-500',
      badgeVariant: 'secondary' as const,
      description: 'Add one more run per week to build habit',
      benefits: 'Improved consistency, better recovery',
      strategy: 'Replace one rest day with easy run',
      successRate: 90,
      timeframe: '2-4 weeks'
    },
    {
      difficulty: 'moderate',
      title: 'Solid Routine',
      target: Math.min(maxSafe, current + 2),
      icon: Target,
      color: 'text-blue-500',
      badgeVariant: 'default' as const,
      description: 'Build a strong weekly running routine',
      benefits: 'Enhanced fitness, stronger habit formation',
      strategy: 'Schedule specific days, include variety',
      successRate: 75,
      timeframe: '4-6 weeks'
    },
    {
      difficulty: 'ambitious',
      title: 'Elite Consistency',
      target: Math.min(6, current + 3),
      icon: Star,
      color: 'text-purple-500',
      badgeVariant: 'destructive' as const,
      description: 'Train like a serious runner with frequent sessions',
      benefits: 'Elite-level consistency, rapid improvement',
      strategy: 'Include easy runs, cross-training, recovery',
      successRate: 55,
      timeframe: '6-10 weeks'
    }
  ];
}

function generatePaceRecommendations(goalType: GoalType, userPerformance: UserPerformanceData) {
  const currentPace = userPerformance.averagePace; // seconds per km
  
  return [
    {
      difficulty: 'conservative',
      title: 'Steady Improvement',
      target: currentPace - 10, // 10 seconds faster per km
      icon: Shield,
      color: 'text-green-500',
      badgeVariant: 'secondary' as const,
      description: '10 seconds per km improvement - sustainable pace gains',
      benefits: 'Noticeable improvement, manageable effort',
      strategy: 'Tempo runs once per week, easy runs for base',
      successRate: 85,
      timeframe: '6-8 weeks'
    },
    {
      difficulty: 'moderate',
      title: 'Significant Speed Gain',
      target: currentPace - 20, // 20 seconds faster per km
      icon: Target,
      color: 'text-blue-500',
      badgeVariant: 'default' as const,
      description: '20 seconds per km improvement - noticeable speed increase',
      benefits: 'Major speed improvement, enhanced efficiency',
      strategy: 'Interval training, tempo runs, speed work',
      successRate: 70,
      timeframe: '8-12 weeks'
    },
    {
      difficulty: 'ambitious',
      title: 'Elite Speed Development',
      target: currentPace - 30, // 30 seconds faster per km
      icon: Zap,
      color: 'text-purple-500',
      badgeVariant: 'destructive' as const,
      description: '30 seconds per km improvement - competitive level gains',
      benefits: 'Elite-level speed, race performance boost',
      strategy: 'Structured training plan, track work, coaching',
      successRate: 50,
      timeframe: '12-16 weeks'
    }
  ];
}

function generateDurationRecommendations(goalType: GoalType, userPerformance: UserPerformanceData) {
  const estimatedWeeklyHours = (userPerformance.weeklyDistance / 10) * (userPerformance.averagePace / 60); // rough estimate
  
  return [
    {
      difficulty: 'conservative',
      title: 'Time Builder',
      target: Math.round(estimatedWeeklyHours * 1.2),
      icon: Shield,
      color: 'text-green-500',
      badgeVariant: 'secondary' as const,
      description: 'Gradually increase time on feet for endurance',
      benefits: 'Better endurance, aerobic base development',
      strategy: 'Extend easy runs by 5-10 minutes',
      successRate: 90,
      timeframe: '4-6 weeks'
    },
    {
      difficulty: 'moderate',
      title: 'Endurance Focus',
      target: Math.round(estimatedWeeklyHours * 1.5),
      icon: Target,
      color: 'text-blue-500',
      badgeVariant: 'default' as const,
      description: 'Significant time increase for aerobic development',
      benefits: 'Enhanced aerobic capacity, fat burning',
      strategy: 'Add longer easy runs, maintain easy effort',
      successRate: 75,
      timeframe: '6-8 weeks'
    },
    {
      difficulty: 'ambitious',
      title: 'Volume Training',
      target: Math.round(estimatedWeeklyHours * 2),
      icon: Star,
      color: 'text-purple-500',
      badgeVariant: 'destructive' as const,
      description: 'High-volume training for serious endurance goals',
      benefits: 'Elite endurance, marathon preparation level',
      strategy: 'Multiple runs per day, careful recovery',
      successRate: 60,
      timeframe: '8-12 weeks'
    }
  ];
}

function getDefaultRecommendations(goalType: GoalType) {
  // Fallback recommendations when no user data is available
  const guidance = goalType.target_guidance || '';
  const matches = guidance.match(/(\d+)-?(\d+)?/g) || [];
  
  const baseTarget = matches.length > 0 ? parseInt(matches[0] || '20') : 20;
  
  return [
    {
      difficulty: 'conservative',
      title: 'Beginner Friendly',
      target: Math.round(baseTarget * 0.8),
      icon: Shield,
      color: 'text-green-500',
      badgeVariant: 'secondary' as const,
      description: 'A safe starting point for building the habit',
      benefits: 'Builds confidence and consistency',
      strategy: 'Focus on completion, not speed',
      successRate: 90,
      timeframe: '4-6 weeks'
    },
    {
      difficulty: 'moderate',
      title: 'Balanced Target',
      target: baseTarget,
      icon: Target,
      color: 'text-blue-500',
      badgeVariant: 'default' as const,
      description: 'A well-rounded goal for regular runners',
      benefits: 'Meaningful improvement and challenge',
      strategy: 'Progressive training with variety',
      successRate: 75,
      timeframe: '6-8 weeks'
    },
    {
      difficulty: 'ambitious',
      title: 'Challenge Mode',
      target: Math.round(baseTarget * 1.4),
      icon: Zap,
      color: 'text-purple-500',
      badgeVariant: 'destructive' as const,
      description: 'For experienced runners seeking a challenge',
      benefits: 'Significant fitness gains and achievement',
      strategy: 'Structured training plan required',
      successRate: 60,
      timeframe: '8-12 weeks'
    }
  ];
}

function getGoalTips(goalType: GoalType, difficulty: string = 'moderate'): string[] {
  const baseTips = {
    distance: [
      'Increase distance gradually - no more than 10% per week',
      'Include one long run per week to build endurance',
      'Listen to your body and take rest days when needed',
      'Focus on time on feet rather than speed for distance goals'
    ],
    pace: [
      'Include interval training once per week for speed',
      'Do most of your runs at an easy, conversational pace',
      'Track your progress with a GPS watch or phone app',
      'Race shorter distances to practice your target pace'
    ],
    frequency: [
      'Schedule your runs like appointments in your calendar',
      'Start with easy runs to build the habit consistently',
      'Include at least one rest day between hard efforts',
      'Consider alternate activities on non-running days'
    ],
    duration: [
      'Build time gradually - add 5-10 minutes per week',
      'Keep most runs at an easy, sustainable effort',
      'Stay hydrated and fuel properly for longer sessions',
      'Focus on enjoying the process, not just the outcome'
    ]
  };

  const difficultyTips = {
    conservative: ['Prioritize consistency over intensity', 'Celebrate small wins along the way'],
    moderate: ['Include one challenging workout per week', 'Monitor your energy levels and adjust as needed'],
    ambitious: ['Consider working with a coach or structured plan', 'Pay extra attention to recovery and nutrition']
  };

  const category = (goalType.category || 'distance') as keyof typeof baseTips;
  const categoryTips = baseTips[category] || baseTips.distance;
  const levelTips = difficultyTips[(difficulty || 'moderate') as keyof typeof difficultyTips] || [];

  return [...categoryTips.slice(0, 3), ...levelTips];
}

