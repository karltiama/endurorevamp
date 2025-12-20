'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserActivities } from '@/hooks/use-user-activities';
import { usePersonalizedTSSTarget } from '@/hooks/useTrainingProfile';
import { useMemo } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Minus,
} from 'lucide-react';
import { ActivityWithTrainingData } from '@/types';
import { getCurrentWeekBoundaries } from '@/lib/utils';

interface TrainingHeroProps {
  userId: string;
}

export function TrainingHero({ userId }: TrainingHeroProps) {
  const { data: activities, isLoading } = useUserActivities(userId);
  const { data: personalizedTSSTarget } = usePersonalizedTSSTarget(userId);

  const trainingData = useMemo(() => {
    if (!activities || activities.length === 0) return null;

    const { start: currentWeekStart, end: currentWeekEnd } =
      getCurrentWeekBoundaries();
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(currentWeekStart);

    // Current week activities
    const currentWeekActivities = activities.filter(a => {
      const date = new Date(a.start_date);
      return date >= currentWeekStart && date <= currentWeekEnd;
    });

    // Last week activities
    const lastWeekActivities = activities.filter(a => {
      const date = new Date(a.start_date);
      return date >= lastWeekStart && date < lastWeekEnd;
    });

    // Calculate TSS
    const estimateTSS = (activity: ActivityWithTrainingData): number => {
      const durationHours = activity.moving_time / 3600;
      const baseIntensity = activity.sport_type === 'Run' ? 70 : 60;
      let intensityMultiplier = 1;
      if (activity.average_heartrate) {
        intensityMultiplier = Math.max(
          0.5,
          Math.min(1.5, activity.average_heartrate / 140)
        );
      }
      return durationHours * baseIntensity * intensityMultiplier;
    };

    const currentWeekTSS = currentWeekActivities.reduce(
      (sum, a) =>
        sum +
        ((a as ActivityWithTrainingData).training_stress_score ||
          estimateTSS(a as ActivityWithTrainingData)),
      0
    );

    const lastWeekTSS = lastWeekActivities.reduce(
      (sum, a) =>
        sum +
        ((a as ActivityWithTrainingData).training_stress_score ||
          estimateTSS(a as ActivityWithTrainingData)),
      0
    );

    const tssChange =
      lastWeekTSS > 0 ? ((currentWeekTSS - lastWeekTSS) / lastWeekTSS) * 100 : 0;

    // Zone distribution for current week
    const calculateZoneDistribution = (activities: ActivityWithTrainingData[]) => {
      const distribution = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
      activities.forEach(a => {
        const duration = a.moving_time / 60;
        if (a.average_heartrate) {
          const hrPercent = a.average_heartrate / 190;
          if (hrPercent < 0.6) distribution.zone1 += duration;
          else if (hrPercent < 0.7) distribution.zone2 += duration;
          else if (hrPercent < 0.8) distribution.zone3 += duration;
          else if (hrPercent < 0.9) distribution.zone4 += duration;
          else distribution.zone5 += duration;
        } else {
          distribution.zone2 += duration;
        }
      });
      const totalTime = Object.values(distribution).reduce((sum, t) => sum + t, 0);
      Object.keys(distribution).forEach(zone => {
        distribution[zone as keyof typeof distribution] =
          totalTime > 0
            ? Math.round(
                (distribution[zone as keyof typeof distribution] / totalTime) * 100
              )
            : 0;
      });
      return distribution;
    };

    const zoneDistribution = calculateZoneDistribution(
      currentWeekActivities as ActivityWithTrainingData[]
    );

    // Training balance assessment
    const weeklyTarget = personalizedTSSTarget || 400;
    const tssBalance = currentWeekTSS - weeklyTarget;
    const aerobicPercent = zoneDistribution.zone1 + zoneDistribution.zone2;
    const intensityPercent = zoneDistribution.zone4 + zoneDistribution.zone5;

    // Determine training status
    let status: 'optimal' | 'high' | 'low' | 'unbalanced';
    let statusMessage: string;

    if (Math.abs(tssBalance) < 50) {
      if (aerobicPercent >= 70 && intensityPercent <= 20) {
        status = 'optimal';
        statusMessage = 'Well-balanced training load and intensity';
      } else if (intensityPercent > 30) {
        status = 'unbalanced';
        statusMessage = 'High intensity - consider more aerobic work';
      } else {
        status = 'optimal';
        statusMessage = 'Good training balance';
      }
    } else if (tssBalance > 50) {
      status = 'high';
      statusMessage = 'High training load - monitor for fatigue';
    } else {
      status = 'low';
      statusMessage = 'Below target - room to increase volume';
    }

    return {
      currentWeekTSS: Math.round(currentWeekTSS),
      lastWeekTSS: Math.round(lastWeekTSS),
      tssChange,
      weeklyTarget,
      tssBalance: Math.round(tssBalance),
      currentWeekActivities: currentWeekActivities.length,
      zoneDistribution,
      aerobicPercent,
      intensityPercent,
      status,
      statusMessage,
    };
  }, [activities, personalizedTSSTarget]);

  if (isLoading) {
    return (
      <div className="h-[220px] w-full animate-pulse bg-muted rounded-xl" />
    );
  }

  if (!trainingData) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-none shadow-md">
        <CardContent className="pt-6 text-center py-10">
          <Activity className="h-12 w-12 mx-auto mb-4 text-orange-400 opacity-50" />
          <h2 className="text-xl font-bold mb-2">No Training Data</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Start tracking activities to analyze your training load and zones.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (trainingData.status) {
      case 'optimal':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'low':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'unbalanced':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (trainingData.status) {
      case 'optimal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'unbalanced':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 5)
      return <TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />;
    if (change < -5)
      return <TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />;
    return <Minus className="h-3 w-3 text-gray-600 flex-shrink-0" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 5) return 'text-green-700';
    if (change < -5) return 'text-red-700';
    return 'text-gray-700';
  };

  return (
    <Card className="overflow-hidden border-none shadow-lg bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Training Overview</h2>
            <p className="text-blue-100 text-sm">
              Weekly training stress and zone distribution
            </p>
          </div>
          <Badge
            className={`${getStatusColor()} border backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase`}
          >
            <span className="flex items-center gap-1">
              {getStatusIcon()}
              {trainingData.status}
            </span>
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Current Week TSS */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-900">
                This Week TSS
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {trainingData.currentWeekTSS}
            </div>
            <div
              className={`text-xs font-bold mt-1 flex items-center gap-1 ${getTrendColor(trainingData.tssChange)}`}
            >
              {getTrendIcon(trainingData.tssChange)}
              {Math.abs(Math.round(trainingData.tssChange))}% vs last week
            </div>
          </div>

          {/* Weekly Target */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-900">
                Weekly Target
              </span>
            </div>
            <div className="text-2xl font-bold text-indigo-900">
              {trainingData.weeklyTarget}
            </div>
            <div className="text-xs text-indigo-700 mt-1">
              {trainingData.currentWeekActivities} activities
            </div>
          </div>

          {/* Aerobic Base */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-900">
                Aerobic (Z1/Z2)
              </span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {trainingData.aerobicPercent}%
            </div>
            <div className="text-xs text-green-700 mt-1">
              {trainingData.aerobicPercent >= 70 ? 'Excellent' : 'Need more'}
            </div>
          </div>

          {/* High Intensity */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-900">
                Intense (Z4/Z5)
              </span>
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {trainingData.intensityPercent}%
            </div>
            <div className="text-xs text-orange-700 mt-1">
              {trainingData.intensityPercent <= 20 ? 'Balanced' : 'High'}
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div
          className={`p-3 rounded-lg border flex items-center gap-3 ${getStatusColor()}`}
        >
          {getStatusIcon()}
          <div className="flex-1">
            <div className="text-sm font-semibold">Training Status</div>
            <div className="text-xs">{trainingData.statusMessage}</div>
          </div>
          {trainingData.tssBalance !== 0 && (
            <div className="text-right">
              <div className="text-xs font-medium">TSS Balance</div>
              <div
                className={`text-lg font-bold ${trainingData.tssBalance > 0 ? 'text-red-800' : 'text-blue-800'}`}
              >
                {trainingData.tssBalance > 0 ? '+' : ''}
                {trainingData.tssBalance}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
