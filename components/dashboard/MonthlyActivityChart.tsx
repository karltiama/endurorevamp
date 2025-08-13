'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUserActivities } from '@/hooks/use-user-activities';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import { Activity } from '@/lib/strava/types';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { convertDistance, getDistanceUnit } from '@/lib/utils';

interface MonthlyActivityChartProps {
  userId: string;
}

export function MonthlyActivityChart({ userId }: MonthlyActivityChartProps) {
  const { data: activities, isLoading, error } = useUserActivities(userId);
  const { preferences } = useUnitPreferences();

  const monthlyData = useMemo(() => {
    if (!activities) return [];

    const currentYear = new Date().getFullYear();
    const monthlyTotals = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);

    activities.forEach((activity: Activity) => {
      const date = new Date(activity.start_date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        monthlyTotals[month] += activity.distance;
        monthlyCounts[month]++;
      }
    });

    return monthlyTotals.map((distance, index) => ({
      month: new Date(2024, index, 1).toLocaleString('default', {
        month: 'short',
      }),
      distance: Math.round(convertDistance(distance, preferences.distance)), // Convert based on user preference
      count: monthlyCounts[index],
    }));
  }, [activities, preferences.distance]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Activity</CardTitle>
          <CardDescription>Loading activity data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-gray-100 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Activity</CardTitle>
          <CardDescription>Error loading activity data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            {error instanceof Error
              ? error.message
              : 'Failed to load activity data'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Activity</CardTitle>
        <CardDescription>
          Your activity distance by month this year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={value =>
                  `${value}${getDistanceUnit(preferences.distance)}`
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Distance
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {payload[0].value}
                              {getDistanceUnit(preferences.distance)}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Activities
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {payload[0].payload.count}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="distance"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
