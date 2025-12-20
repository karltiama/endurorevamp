'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserActivities } from '@/hooks/use-user-activities';
import { usePersonalizedTSSTarget } from '@/hooks/useTrainingProfile';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Battery,
  Heart,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Info,
  Target,
  BarChart3,
} from 'lucide-react';
import { ActivityWithTrainingData } from '@/types';
import { getCurrentWeekBoundaries } from '@/lib/utils';

interface TrainingCommandHeroProps {
  userId: string;
}

// Helper functions (kept from original components)
const estimateTSS = (activity: ActivityWithTrainingData): number => {
  const durationHours = activity.moving_time / 3600;
  const baseIntensity = activity.sport_type === 'Run' ? 70 : 60;
  let intensityMultiplier = 1;
  if (activity.average_heartrate) {
    intensityMultiplier = Math.max(0.5, Math.min(1.5, activity.average_heartrate / 140));
  }
  return Math.round(durationHours * baseIntensity * intensityMultiplier);
};

const calculateRecoveryScore = (factors: {
  daysSinceLastWorkout: number;
  lastRPE?: number;
  tssBalance: number;
  lastActivity: ActivityWithTrainingData;
}): number => {
  let score = 50;
  score += Math.min(30, factors.daysSinceLastWorkout * 8);
  if (factors.lastRPE) score -= (factors.lastRPE - 5) * 5;
  if (factors.tssBalance < -100) score -= 20;
  else if (factors.tssBalance < -50) score -= 10;
  else if (factors.tssBalance > 50) score += 10;
  if (factors.lastActivity?.recovery_time) {
    const hoursRecovered = (Date.now() - new Date(factors.lastActivity.start_date).getTime()) / (1000 * 60 * 60);
    const recoveryNeeded = factors.lastActivity.recovery_time;
    if (hoursRecovered >= recoveryNeeded) score += 15;
    else score -= 10;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
};

const getReadinessAssessment = (factors: {
  recoveryScore: number;
  daysSinceLastWorkout: number;
  tssBalance: number;
}) => {
  if (factors.recoveryScore >= 80) {
    return {
      level: 'high' as const,
      recommendation: factors.daysSinceLastWorkout >= 2 
        ? 'Ready for a hard workout! Consider intervals or tempo run.' 
        : 'Good energy - perfect for a quality training session.',
    };
  }
  if (factors.recoveryScore >= 60) {
    return {
      level: 'medium' as const,
      recommendation: factors.tssBalance < -50 
        ? 'Moderate fatigue - try an easy run or cross-training.' 
        : 'Good for moderate training - steady pace or hills.',
    };
  }
  return {
    level: 'low' as const,
    recommendation: factors.daysSinceLastWorkout >= 3 
      ? 'Long break detected - ease back with a gentle run.' 
      : 'High fatigue - consider rest day or easy recovery activity.',
  };
};

const getReadinessStyles = (level: string) => {
  switch (level) {
    case 'high': return { icon: <CheckCircle className="h-5 w-5 text-green-600" />, color: 'text-green-800 bg-green-100 border-green-200' };
    case 'medium': return { icon: <Clock className="h-5 w-5 text-yellow-600" />, color: 'text-yellow-800 bg-yellow-100 border-yellow-200' };
    case 'low': return { icon: <AlertTriangle className="h-5 w-5 text-red-600" />, color: 'text-red-800 bg-red-100 border-red-200' };
    default: return { icon: <Activity className="h-5 w-5 text-gray-600" />, color: 'text-gray-800 bg-gray-100 border-gray-200' };
  }
};

export function TrainingCommandHero({ userId }: TrainingCommandHeroProps) {
  const { data: activities, isLoading } = useUserActivities(userId);
  const { data: personalizedTSSTarget } = usePersonalizedTSSTarget(userId);
  const router = useRouter();

  const data = useMemo(() => {
    if (!activities || activities.length === 0) return null;

    const { start: weekStart, end: weekEnd } = getCurrentWeekBoundaries();
    const thisWeekActivities = activities.filter(a => {
      const d = new Date(a.start_date);
      return d >= weekStart && d <= weekEnd;
    });

    const lastActivity = activities[0];
    const now = new Date();
    const daysSinceLastWorkout = Math.floor((now.getTime() - new Date(lastActivity.start_date).getTime()) / (1000 * 60 * 60 * 24));
    
    const weeklyTSSCurrent = thisWeekActivities.reduce((sum, a) => sum + ((a as ActivityWithTrainingData).training_stress_score || estimateTSS(a as ActivityWithTrainingData)), 0);
    const weeklyTSSTarget = personalizedTSSTarget || 400;
    const tssBalance = weeklyTSSTarget - weeklyTSSCurrent;
    const lastRPE = (lastActivity as ActivityWithTrainingData).perceived_exertion;
    const recoveryScore = calculateRecoveryScore({ daysSinceLastWorkout, lastRPE, tssBalance, lastActivity: lastActivity as ActivityWithTrainingData });
    const readiness = getReadinessAssessment({ recoveryScore, daysSinceLastWorkout, tssBalance });

    return {
      recoveryScore,
      readiness,
      lastRPE,
      tssBalance,
      daysSinceLastWorkout,
      weeklyTSSCurrent,
      weeklyTSSTarget,
      progressPercentage: Math.round((weeklyTSSCurrent / weeklyTSSTarget) * 100),
      workoutsCompleted: thisWeekActivities.length,
    };
  }, [activities, personalizedTSSTarget]);

  if (isLoading) return <div className="h-[300px] w-full animate-pulse bg-muted rounded-xl" />;

  if (!data) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow-md">
        <CardContent className="pt-6 text-center py-10">
          <Activity className="h-12 w-12 mx-auto mb-4 text-blue-400 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Welcome to Training Command</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">Connect your Strava account to see your readiness, recovery scores, and weekly progress.</p>
          <Button onClick={() => router.push('/dashboard/settings')}>Connect Strava</Button>
        </CardContent>
      </Card>
    );
  }

  const styles = getReadinessStyles(data.readiness.level);

  return (
    <Card className="overflow-hidden border-none shadow-lg bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Training Command Center</h2>
            <p className="text-blue-100 text-sm">Your personalized recovery and progress summary</p>
          </div>
          <Badge className={`${styles.color} border-none px-3 py-1 text-xs font-bold uppercase`}>
            {data.readiness.level} Readiness
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Readiness & Recovery */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-end gap-4">
              <div className="relative">
                <svg className="h-24 w-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-100"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * data.recoveryScore) / 100}
                    strokeLinecap="round"
                    className={data.readiness.level === 'high' ? 'text-green-500' : data.readiness.level === 'medium' ? 'text-yellow-500' : 'text-red-500'}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{data.recoveryScore}%</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {styles.icon}
                  <span className="font-semibold">Recovery Score</span>
                </div>
                <p className="text-sm text-gray-600 leading-tight">
                  {data.readiness.recommendation}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                  <Heart className="h-3 w-3" /> Last RPE
                </div>
                <div className="text-lg font-bold">{data.lastRPE ? `${data.lastRPE}/10` : 'N/A'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                  <Battery className="h-3 w-3" /> Rest Days
                </div>
                <div className="text-lg font-bold">{data.daysSinceLastWorkout} days</div>
              </div>
            </div>
          </div>

          {/* Right Column: Weekly Progress */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-semibold">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Weekly Progress
              </div>
              <div className="text-sm font-medium">
                {data.weeklyTSSCurrent} / {data.weeklyTSSTarget} <span className="text-gray-500 font-normal">TSS</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Goal Achievement</span>
                <span className="font-bold text-blue-600">{data.progressPercentage}%</span>
              </div>
              <Progress value={Math.min(100, data.progressPercentage)} className="h-4" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{data.workoutsCompleted}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Workouts</div>
              </div>
              <div className="text-center border-x border-gray-100">
                <div className={`text-xl font-bold ${data.tssBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(data.tssBalance)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">TSS Balance</div>
              </div>
              <div className="text-center">
                <Button variant="ghost" size="sm" className="h-auto p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => router.push('/dashboard/planning')}>
                  <div className="flex flex-col items-center">
                    <Target className="h-5 w-5 mb-1" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Plan Next</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

