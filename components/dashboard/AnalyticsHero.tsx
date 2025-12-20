'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserActivities } from '@/hooks/use-user-activities';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import { formatDistance, formatPace } from '@/lib/utils';
import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Zap,
  BarChart3,
  Activity,
  Minus,
} from 'lucide-react';

interface AnalyticsHeroProps {
  userId: string;
}

export function AnalyticsHero({ userId }: AnalyticsHeroProps) {
  const { data: activities, isLoading } = useUserActivities(userId);
  const { preferences } = useUnitPreferences();

  const analytics = useMemo(() => {
    if (!activities || activities.length === 0) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Current period (last 30 days)
    const currentPeriod = activities.filter(
      a => new Date(a.start_date) >= thirtyDaysAgo
    );

    // Previous period (30-60 days ago)
    const previousPeriod = activities.filter(a => {
      const date = new Date(a.start_date);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    // Calculate metrics for current period
    const currentDistance = currentPeriod.reduce((sum, a) => sum + a.distance, 0);
    const currentActivities = currentPeriod.length;
    const currentTime = currentPeriod.reduce((sum, a) => sum + a.moving_time, 0);

    // Calculate metrics for previous period
    const previousDistance = previousPeriod.reduce(
      (sum, a) => sum + a.distance,
      0
    );
    const previousActivities = previousPeriod.length;
    const previousTime = previousPeriod.reduce(
      (sum, a) => sum + a.moving_time,
      0
    );

    // Calculate changes
    const distanceChange =
      previousDistance > 0
        ? ((currentDistance - previousDistance) / previousDistance) * 100
        : 0;
    const activityChange =
      previousActivities > 0
        ? ((currentActivities - previousActivities) / previousActivities) * 100
        : 0;
    const timeChange =
      previousTime > 0 ? ((currentTime - previousTime) / previousTime) * 100 : 0;

    // Calculate average pace for runs
    const runs = currentPeriod.filter(a => a.sport_type === 'Run');
    const avgPace =
      runs.length > 0
        ? runs.reduce((sum, a) => {
            const pace = a.moving_time / (a.distance / 1000); // seconds per km
            return sum + pace;
          }, 0) / runs.length
        : 0;

    const previousRuns = previousPeriod.filter(a => a.sport_type === 'Run');
    const prevAvgPace =
      previousRuns.length > 0
        ? previousRuns.reduce((sum, a) => {
            const pace = a.moving_time / (a.distance / 1000);
            return sum + pace;
          }, 0) / previousRuns.length
        : 0;

    const paceChange =
      prevAvgPace > 0 ? ((prevAvgPace - avgPace) / prevAvgPace) * 100 : 0; // Positive = improvement

    // Personal records in last 30 days
    const longestRun = Math.max(
      ...currentPeriod.map(a => (a.sport_type === 'Run' ? a.distance : 0))
    );
    const longestActivity = currentPeriod.find(
      a => a.distance === Math.max(...currentPeriod.map(a => a.distance))
    );

    return {
      currentDistance: currentDistance / 1000,
      distanceChange,
      currentActivities,
      activityChange,
      currentTime,
      timeChange,
      avgPace,
      paceChange,
      longestRun: longestRun / 1000,
      longestActivity,
      hasData: currentPeriod.length > 0,
    };
  }, [activities]);

  if (isLoading) {
    return (
      <div className="h-[220px] w-full animate-pulse bg-muted rounded-xl" />
    );
  }

  if (!analytics || !analytics.hasData) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-none shadow-md">
        <CardContent className="pt-6 text-center py-10">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-purple-400 opacity-50" />
          <h2 className="text-xl font-bold mb-2">No Analytics Data</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Start tracking activities to see your performance trends and insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (change: number) => {
    if (change > 2)
      return <TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />;
    if (change < -2)
      return <TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />;
    return <Minus className="h-3 w-3 text-gray-600 flex-shrink-0" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 2) return 'text-green-700';
    if (change < -2) return 'text-red-700';
    return 'text-gray-700';
  };

  return (
    <Card className="overflow-hidden border-none shadow-lg bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Performance Analytics</h2>
            <p className="text-blue-100 text-sm">
              Last 30 days compared to previous period
            </p>
          </div>
          <Badge className="bg-white/20 border-white/30 text-white px-3 py-1 text-xs font-bold uppercase backdrop-blur-sm">
            30-Day Insights
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Distance */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-900">
                Total Distance
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formatDistance(analytics.currentDistance * 1000, preferences.distance)}
            </div>
            <div
              className={`text-xs font-bold mt-1 flex items-center gap-1 ${getTrendColor(analytics.distanceChange)}`}
            >
              {getTrendIcon(analytics.distanceChange)}
              {Math.abs(Math.round(analytics.distanceChange))}% vs previous
            </div>
          </div>

          {/* Activity Count */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-900">
                Activities
              </span>
            </div>
            <div className="text-2xl font-bold text-indigo-900">
              {analytics.currentActivities}
            </div>
            <div
              className={`text-xs font-bold mt-1 flex items-center gap-1 ${getTrendColor(analytics.activityChange)}`}
            >
              {getTrendIcon(analytics.activityChange)}
              {Math.abs(Math.round(analytics.activityChange))}% vs previous
            </div>
          </div>

          {/* Training Time */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-900">
                Training Time
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {Math.round(analytics.currentTime / 3600)}h
            </div>
            <div
              className={`text-xs font-bold mt-1 flex items-center gap-1 ${getTrendColor(analytics.timeChange)}`}
            >
              {getTrendIcon(analytics.timeChange)}
              {Math.abs(Math.round(analytics.timeChange))}% vs previous
            </div>
          </div>

          {/* Average Pace */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-900">Avg Pace</span>
            </div>
            {analytics.avgPace > 0 ? (
              <>
                <div className="text-2xl font-bold text-green-900">
                  {formatPace(analytics.avgPace, preferences.distance)}
                </div>
                <div
                  className={`text-xs font-bold mt-1 flex items-center gap-1 ${getTrendColor(analytics.paceChange)}`}
                >
                  {getTrendIcon(analytics.paceChange)}
                  {analytics.paceChange > 0 ? 'Faster' : analytics.paceChange < 0 ? 'Slower' : 'Steady'}
                </div>
              </>
            ) : (
              <div className="text-sm text-green-700">No runs yet</div>
            )}
          </div>
        </div>

        {/* Recent Achievement */}
        {analytics.longestActivity && (
          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-yellow-900">
                  Recent Achievement
                </div>
                <div className="text-xs text-yellow-800">
                  Longest activity:{' '}
                  <span className="font-semibold">
                    {analytics.longestActivity.name}
                  </span>{' '}
                  -{' '}
                  {formatDistance(
                    analytics.longestActivity.distance,
                    preferences.distance
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
