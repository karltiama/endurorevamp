'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserActivities } from '@/hooks/use-user-activities';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import { formatDistance } from '@/lib/utils';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  MapPin,
  Zap,
} from 'lucide-react';

interface ActivitiesHeroProps {
  userId: string;
}

export function ActivitiesHero({ userId }: ActivitiesHeroProps) {
  const { data: activities, isLoading } = useUserActivities(userId);
  const { preferences } = useUnitPreferences();
  const router = useRouter();

  const stats = useMemo(() => {
    if (!activities || activities.length === 0) return null;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // This month stats
    const thisMonthActivities = activities.filter(
      a => new Date(a.start_date) >= thisMonth
    );
    const lastMonthActivities = activities.filter(a => {
      const date = new Date(a.start_date);
      return date >= lastMonth && date < thisMonth;
    });
    const thisWeekActivities = activities.filter(
      a => new Date(a.start_date) >= thisWeek
    );

    const totalDistance = thisMonthActivities.reduce(
      (sum, a) => sum + a.distance,
      0
    );
    const totalTime = thisMonthActivities.reduce(
      (sum, a) => sum + a.moving_time,
      0
    );
    const lastMonthDistance = lastMonthActivities.reduce(
      (sum, a) => sum + a.distance,
      0
    );

    const distanceChange =
      lastMonthDistance > 0
        ? ((totalDistance - lastMonthDistance) / lastMonthDistance) * 100
        : 0;

    // Activity breakdown
    const activityTypes = thisMonthActivities.reduce(
      (acc, a) => {
        const type = a.sport_type || 'Other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostCommonType = Object.entries(activityTypes).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      totalActivities: activities.length,
      thisMonthCount: thisMonthActivities.length,
      thisWeekCount: thisWeekActivities.length,
      totalDistance: totalDistance / 1000, // Convert to km
      totalTime,
      distanceChange,
      mostCommonType: mostCommonType ? mostCommonType[0] : 'Activity',
      mostCommonCount: mostCommonType ? mostCommonType[1] : 0,
      lastActivity: activities[0],
    };
  }, [activities]);

  if (isLoading) {
    return (
      <div className="h-[200px] w-full animate-pulse bg-muted rounded-xl" />
    );
  }

  if (!stats) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow-md">
        <CardContent className="pt-6 text-center py-10">
          <Activity className="h-12 w-12 mx-auto mb-4 text-blue-400 opacity-50" />
          <h2 className="text-xl font-bold mb-2">No Activities Yet</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Connect your Strava account to see your activity feed and stats.
          </p>
          <Button onClick={() => router.push('/dashboard/settings')}>
            Connect Strava
          </Button>
        </CardContent>
      </Card>
    );
  }

  const lastActivityDate = stats.lastActivity
    ? new Date(stats.lastActivity.start_date)
    : null;
  const daysSinceLastActivity = lastActivityDate
    ? Math.floor((Date.now() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <Card className="overflow-hidden border-none shadow-lg bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Activity Feed</h2>
            <p className="text-blue-100 text-sm">
              Your complete training history and statistics
            </p>
          </div>
          <Badge className="bg-white/20 border-white/30 text-white px-3 py-1 text-xs font-bold uppercase backdrop-blur-sm">
            {stats.totalActivities} Total Activities
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* This Month */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-900">
                This Month
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {stats.thisMonthCount}
            </div>
            <div className="text-xs text-blue-700 mt-1">
              {stats.thisWeekCount} this week
            </div>
          </div>

          {/* Total Distance */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-900">
                Monthly Distance
              </span>
            </div>
            <div className="text-2xl font-bold text-indigo-900">
              {formatDistance(stats.totalDistance * 1000, preferences.distance)}
            </div>
            {stats.distanceChange !== 0 && (
              <div
                className={`text-xs font-bold mt-1 flex items-center gap-1 ${
                  stats.distanceChange > 0 ? 'text-green-700' : 'text-red-700'
                }`}
              >
                <TrendingUp
                  className={`h-3 w-3 ${stats.distanceChange < 0 ? 'rotate-180' : ''}`}
                />
                {Math.abs(Math.round(stats.distanceChange))}% vs last month
              </div>
            )}
          </div>

          {/* Total Time */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-900">
                Monthly Time
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {Math.round(stats.totalTime / 3600)}h
            </div>
            <div className="text-xs text-purple-700 mt-1">
              {Math.round(stats.totalTime / 60)} minutes
            </div>
          </div>

          {/* Most Common Activity */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-900">
                Most Common
              </span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {stats.mostCommonType}
            </div>
            <div className="text-xs text-green-700 mt-1">
              {stats.mostCommonCount} this month
            </div>
          </div>
        </div>

        {/* Last Activity Info */}
        {lastActivityDate && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Activity className="h-4 w-4 text-gray-500" />
                <span>
                  Last activity:{' '}
                  <span className="font-semibold">{stats.lastActivity.name}</span>
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                {daysSinceLastActivity === 0
                  ? 'Today'
                  : daysSinceLastActivity === 1
                    ? 'Yesterday'
                    : `${daysSinceLastActivity} days ago`}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
