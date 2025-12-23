'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUserActivities } from '@/hooks/use-user-activities';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import { formatDistance } from '@/lib/utils';
import { useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  Zap,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { ActivityWithTrainingData } from '@/types';
import { Button } from '@/components/ui/button';
import { getCurrentWeekBoundaries } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ConsolidatedAnalyticsCardProps {
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
  return durationHours * baseIntensity * intensityMultiplier;
};

const calculateDailyTSS = (activities: ActivityWithTrainingData[], weekStart: Date) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyTSS: { day: string; tss: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);
    dayDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(dayDate);
    nextDay.setDate(dayDate.getDate() + 1);
    const dayActivities = activities.filter(a => {
      const d = new Date(a.start_date);
      return d >= dayDate && d < nextDay;
    });
    const dayTSS = dayActivities.reduce((sum, a) => sum + (a.training_stress_score || estimateTSS(a)), 0);
    dailyTSS.push({ day: days[i], tss: Math.round(dayTSS) });
  }
  return dailyTSS;
};

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
    distribution[zone as keyof typeof distribution] = totalTime > 0 ? Math.round((distribution[zone as keyof typeof distribution] / totalTime) * 100) : 0;
  });
  return distribution;
};

export function ConsolidatedAnalyticsCard({ userId }: ConsolidatedAnalyticsCardProps) {
  const { data: activities, isLoading } = useUserActivities(userId);
  const { preferences } = useUnitPreferences();
  const router = useRouter();

  const metrics = useMemo(() => {
    if (!activities || activities.length === 0) return null;

    const { start: weekStart } = getCurrentWeekBoundaries();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekActivities = activities.filter(a => new Date(a.start_date) >= weekStart);
    const recentActivities = activities.filter(a => new Date(a.start_date) >= sevenDaysAgo);
    const previousActivities = activities.filter(a => {
      const d = new Date(a.start_date);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    });

    const dailyTSS = calculateDailyTSS(thisWeekActivities as ActivityWithTrainingData[], weekStart);
    const zoneDistribution = calculateZoneDistribution(thisWeekActivities as ActivityWithTrainingData[]);

    // Simple performance trends
    const recentDistance = recentActivities.reduce((sum, a) => sum + a.distance, 0) / 1000;
    const prevDistance = previousActivities.reduce((sum, a) => sum + a.distance, 0) / 1000;
    const distanceChange = prevDistance > 0 ? ((recentDistance - prevDistance) / prevDistance) * 100 : 0;

    const recentLoad = recentActivities.reduce((sum, a) => sum + ((a as ActivityWithTrainingData).training_load_score || estimateTSS(a as ActivityWithTrainingData)), 0) / Math.max(1, recentActivities.length);
    const prevLoad = previousActivities.reduce((sum, a) => sum + ((a as ActivityWithTrainingData).training_load_score || estimateTSS(a as ActivityWithTrainingData)), 0) / Math.max(1, previousActivities.length);
    const loadTrend = recentLoad > prevLoad * 1.05 ? 'increasing' : recentLoad < prevLoad * 0.95 ? 'decreasing' : 'stable';

    return {
      dailyTSS,
      zoneDistribution,
      weeklyDistance: {
        current: Math.round(recentDistance * 10) / 10,
        change: Math.round(distanceChange)
      },
      trainingLoad: {
        value: Math.round(recentLoad),
        trend: loadTrend
      }
    };
  }, [activities]);

  if (isLoading) return <div className="h-[400px] w-full animate-pulse bg-muted rounded-xl" />;
  if (!metrics) return null;

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Training Insights
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/analytics')} className="text-xs text-blue-600">
            Full Analytics
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Distribution Chart */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Daily TSS Distribution
          </h4>
          <div className="flex items-end justify-between h-32 gap-1.5 px-2">
            {metrics.dailyTSS.map((day, i) => {
              const maxTSS = Math.max(...metrics.dailyTSS.map(d => d.tss), 1);
              const heightPercent = maxTSS > 0 ? (day.tss / maxTSS) * 100 : 0;
              // Use pixel-based minimum heights for better visibility
              const minHeightPx = day.tss > 0 ? 12 : 4; // 12px for days with data, 4px for empty days
              const maxHeightPx = 120; // Container is 128px (h-32)
              const calculatedHeight = (heightPercent / 100) * maxHeightPx;
              const finalHeight = day.tss > 0 ? Math.max(minHeightPx, calculatedHeight) : minHeightPx;
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={`w-full rounded-t transition-colors relative group ${
                      day.tss > 0 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300'
                    }`}
                    style={{ height: `${finalHeight}px` }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {day.tss} TSS
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-500">{day.day[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Zone Distribution */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1">
              <Zap className="h-3 w-3" /> Intensity Zones
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Aerobic (Z1/Z2)</span>
                <span className="font-semibold">{metrics.zoneDistribution.zone1 + metrics.zoneDistribution.zone2}%</span>
              </div>
              <Progress value={metrics.zoneDistribution.zone1 + metrics.zoneDistribution.zone2} className="h-2 bg-gray-100" />
              
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-600">Threshold+ (Z4/Z5)</span>
                <span className="font-semibold">{metrics.zoneDistribution.zone4 + metrics.zoneDistribution.zone5}%</span>
              </div>
              <Progress value={metrics.zoneDistribution.zone4 + metrics.zoneDistribution.zone5} className="h-2 bg-gray-100" />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="text-xs font-medium text-indigo-900">Weekly Dist.</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-indigo-900">
                  {formatDistance(metrics.weeklyDistance.current * 1000, preferences.distance)}
                </div>
                <div className={`text-[10px] font-bold ${metrics.weeklyDistance.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.weeklyDistance.change >= 0 ? '↑' : '↓'} {Math.abs(metrics.weeklyDistance.change)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-xs font-medium text-blue-900">Avg. Load</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-blue-900">{metrics.trainingLoad.value}</div>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
                  {metrics.trainingLoad.trend}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

