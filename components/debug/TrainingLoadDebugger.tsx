'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useTrainingLoad,
  useTrainingLoadTrends,
} from '@/hooks/useTrainingLoad';
import { useUserActivities } from '@/hooks/use-user-activities';
import { useAuth } from '@/providers/AuthProvider';

interface DateAnalysis {
  date: string;
  count: number;
  activities: Array<{
    id: string;
    name: string;
    start_date_local: string | null;
    sport_type: string;
  }>;
}

interface TrendAnalysis {
  date: string;
  dailyLoad: number;
  ctl: number;
  atl: number;
}

export function TrainingLoadDebugger() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dateAnalysis, setDateAnalysis] = useState<DateAnalysis[]>([]);
  const [trendsAnalysis, setTrendsAnalysis] = useState<TrendAnalysis[]>([]);
  const { user } = useAuth();

  const { data: activities = [] } = useUserActivities(user?.id || '');
  const { data: trainingLoadData } = useTrainingLoad(user?.id || '', {
    days: 90,
  });
  const { data: trends } = useTrainingLoadTrends(user?.id || '', 90);

  const analyzeDates = () => {
    if (!user?.id) return;

    setIsAnalyzing(true);

    try {
      // Analyze activities by date
      const dateMap = new Map<string, DateAnalysis>();

      activities.forEach(activity => {
        const date = (
          activity.start_date_local ||
          activity.start_date ||
          ''
        ).split('T')[0]; // Get just the date part
        const existing = dateMap.get(date);

        if (existing) {
          existing.count++;
          existing.activities.push({
            id: activity.id || '',
            name: activity.name,
            start_date_local: activity.start_date_local || null,
            sport_type: activity.sport_type,
          });
        } else {
          dateMap.set(date, {
            date,
            count: 1,
            activities: [
              {
                id: activity.id || '',
                name: activity.name,
                start_date_local: activity.start_date_local || null,
                sport_type: activity.sport_type,
              },
            ],
          });
        }
      });

      // Convert to array and sort by count (descending)
      const analysis = Array.from(dateMap.values())
        .filter(item => item.count > 1) // Only show dates with multiple activities
        .sort((a, b) => b.count - a.count);

      setDateAnalysis(analysis);

      // Analyze trends data
      if (trends) {
        const trendsWithDuplicates = trends.filter((trend, index, array) => {
          const currentDate = trend.date;
          const firstIndex = array.findIndex(t => t.date === currentDate);
          return firstIndex !== index;
        });

        setTrendsAnalysis(trendsWithDuplicates);
      }
    } catch (error) {
      console.error('Date analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Training Load Date Analysis</CardTitle>
          <p className="text-sm text-gray-600">
            Investigate double dates and data processing issues
          </p>
        </CardHeader>
        <CardContent>
          <Button onClick={analyzeDates} disabled={isAnalyzing}>
            {isAnalyzing ? 'Analyzing...' : 'Analyze Dates'}
          </Button>

          {dateAnalysis.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-red-600">
                ⚠️ Found {dateAnalysis.length} dates with multiple activities:
              </h4>

              {dateAnalysis.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="destructive">{item.count} activities</Badge>
                    <span className="font-mono text-sm">{item.date}</span>
                  </div>

                  <div className="space-y-2">
                    {item.activities.map((activity, actIndex) => (
                      <div
                        key={actIndex}
                        className="text-sm bg-white p-2 rounded border"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{activity.name}</span>
                          <Badge variant="outline">{activity.sport_type}</Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {activity.start_date_local}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {trendsAnalysis.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-orange-600">
                ⚠️ Found {trendsAnalysis.length} duplicate dates in trends:
              </h4>

              {trendsAnalysis.map((trend, index) => (
                <div key={index} className="border rounded-lg p-4 bg-orange-50">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">{trend.date}</span>
                    <Badge variant="outline">
                      Load: {trend.dailyLoad}, CTL: {trend.ctl}, ATL:{' '}
                      {trend.atl}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {dateAnalysis.length === 0 &&
            trendsAnalysis.length === 0 &&
            !isAnalyzing && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">
                  ✅ No Issues Found
                </h4>
                <p className="text-sm text-green-700">
                  No duplicate dates detected in your training data.
                </p>
              </div>
            )}

          {/* Raw Data Analysis */}
          <div className="mt-6 space-y-4">
            <h4 className="font-medium">📊 Data Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium">Total Activities</div>
                <div className="text-2xl font-bold">{activities.length}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium">Training Load Points</div>
                <div className="text-2xl font-bold">
                  {trainingLoadData?.loadPoints?.length || 0}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium">Trends Data Points</div>
                <div className="text-2xl font-bold">{trends?.length || 0}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium">Unique Dates</div>
                <div className="text-2xl font-bold">
                  {
                    new Set(
                      activities.map(a => a.start_date_local.split('T')[0])
                    ).size
                  }
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
