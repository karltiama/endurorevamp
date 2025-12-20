'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useSynchronizedTodaysWorkout,
  useWorkoutPlanAnalytics,
} from '@/hooks/useEnhancedWorkoutPlanning';
import { useWeather } from '@/hooks/useWeather';
import { useLocation } from '@/hooks/useLocation';
import { useMemo } from 'react';
import {
  Calendar,
  Dumbbell,
  Target,
  Zap,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
} from 'lucide-react';
import { formatTemperature } from '@/lib/utils';

interface PlanningHeroProps {
  userId: string;
  onEditPlan?: () => void;
}

export function PlanningHero({ userId, onEditPlan }: PlanningHeroProps) {
  const { todaysWorkout, weeklyPlan, isLoading, hasData } =
    useSynchronizedTodaysWorkout(userId);
  const analytics = useWorkoutPlanAnalytics(weeklyPlan);

  // Weather integration
  const { location, isLoading: locationLoading } = useLocation();
  const { weather, impact, isLoading: weatherLoading } = useWeather({
    lat: location.lat,
    lon: location.lon,
    enabled: !locationLoading,
  });

  const summary = useMemo(() => {
    if (!weeklyPlan || !analytics) return null;

    const plannedWorkouts = Object.values(weeklyPlan.workouts).filter(
      w => w !== null
    ).length;
    const completedWorkouts = 0; // TODO: Track completed workouts

    const weekProgress = Math.round((completedWorkouts / plannedWorkouts) * 100);

    // Determine if plan is balanced
    const isBalanced =
      analytics.totalPlannedTSS >= analytics.recommendedTSS * 0.9 &&
      analytics.totalPlannedTSS <= analytics.recommendedTSS * 1.1;

    // Get status
    let status: 'optimal' | 'high' | 'low';
    let statusMessage: string;

    if (isBalanced) {
      status = 'optimal';
      statusMessage = 'Well-balanced weekly plan';
    } else if (analytics.totalPlannedTSS > analytics.recommendedTSS * 1.1) {
      status = 'high';
      statusMessage = 'High training load - monitor fatigue';
    } else {
      status = 'low';
      statusMessage = 'Below target - room to add volume';
    }

    return {
      plannedWorkouts,
      completedWorkouts,
      weekProgress,
      totalTSS: Math.round(analytics.totalPlannedTSS),
      targetTSS: Math.round(analytics.recommendedTSS),
      status,
      statusMessage,
      hasWorkouts: plannedWorkouts > 0,
    };
  }, [weeklyPlan, analytics]);

  if (isLoading) {
    return (
      <div className="h-[220px] w-full animate-pulse bg-muted rounded-xl" />
    );
  }

  // Show empty state only if truly no data exists
  if (!hasData && !weeklyPlan) {
    return (
      <Card className="overflow-hidden border-none shadow-lg bg-white">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Weekly Training Plan</h2>
              <p className="text-blue-100 text-sm">
                AI-powered workout recommendations and scheduling
              </p>
            </div>
          </div>
        </div>
        <CardContent className="pt-6 text-center py-10">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-blue-400 opacity-50" />
          <h3 className="text-xl font-bold mb-2">No Workout Plan</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get started with AI-powered workout recommendations based on your
            training data.
          </p>
          {onEditPlan && (
            <Button onClick={onEditPlan}>
              <Target className="h-4 w-4 mr-2" />
              Create Your Plan
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (displaySummary.status) {
      case 'optimal':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'low':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (displaySummary.status) {
      case 'optimal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getWeatherIcon = () => {
    if (weatherLoading || !weather || !weather.current?.condition) return <Sun className="h-4 w-4" />;
    
    const condition = weather.current.condition.toLowerCase();
    if (condition.includes('rain')) return <CloudRain className="h-4 w-4 text-blue-600" />;
    if (condition.includes('cloud')) return <Wind className="h-4 w-4 text-gray-600" />;
    return <Sun className="h-4 w-4 text-yellow-600" />;
  };

  const getTodaysWorkoutBadge = () => {
    if (!todaysWorkout) return { color: 'bg-gray-100 text-gray-800', label: 'Rest Day' };
    
    const type = todaysWorkout.type?.toLowerCase() || '';
    if (type.includes('rest') || type.includes('recovery')) {
      return { color: 'bg-green-100 text-green-800', label: 'Recovery' };
    }
    if (type.includes('easy') || type.includes('base')) {
      return { color: 'bg-blue-100 text-blue-800', label: 'Easy' };
    }
    if (type.includes('tempo') || type.includes('threshold')) {
      return { color: 'bg-orange-100 text-orange-800', label: 'Tempo' };
    }
    if (type.includes('interval') || type.includes('speed')) {
      return { color: 'bg-red-100 text-red-800', label: 'Intense' };
    }
    if (type.includes('long')) {
      return { color: 'bg-purple-100 text-purple-800', label: 'Long Run' };
    }
    return { color: 'bg-indigo-100 text-indigo-800', label: 'Workout' };
  };

  // Use summary or create default values
  const displaySummary = summary || {
    plannedWorkouts: 0,
    totalTSS: 0,
    targetTSS: 400,
    status: 'low' as const,
    statusMessage: 'No plan created yet',
    hasWorkouts: false,
  };

  const todayBadge = getTodaysWorkoutBadge();

  return (
    <Card className="overflow-hidden border-none shadow-lg bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Weekly Training Plan</h2>
            <p className="text-blue-100 text-sm">
              AI-powered workout recommendations and scheduling
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onEditPlan && (
              <Button
                onClick={onEditPlan}
                variant="secondary"
                size="sm"
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Target className="h-4 w-4 mr-2" />
                Edit Plan
              </Button>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Today's Workout Highlight */}
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Today's Workout</span>
            </div>
            <Badge className={`${todayBadge.color} border-none`}>
              {todayBadge.label}
            </Badge>
          </div>
          {todaysWorkout ? (
            <div>
              <div className="text-lg font-bold text-blue-900 mb-1">
                {todaysWorkout.title}
              </div>
              <div className="flex items-center gap-4 text-sm text-blue-700">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {todaysWorkout.duration} min
                </span>
                {todaysWorkout.distance && (
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {todaysWorkout.distance} km
                  </span>
                )}
                {todaysWorkout.estimatedTSS && (
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {Math.round(todaysWorkout.estimatedTSS)} TSS
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-blue-700">
              Rest day or no workout planned. Use this time to recover!
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Planned Workouts */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-900">
                This Week
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {displaySummary.plannedWorkouts}
            </div>
            <div className="text-xs text-blue-700 mt-1">Workouts planned</div>
          </div>

          {/* Weekly TSS */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-900">
                Weekly TSS
              </span>
            </div>
            <div className="text-2xl font-bold text-indigo-900">
              {displaySummary.totalTSS}
            </div>
            <div className="text-xs text-indigo-700 mt-1">
              Target: {displaySummary.targetTSS}
            </div>
          </div>

          {/* Load Balance */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-900">
                Load Balance
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {Math.round((displaySummary.totalTSS / displaySummary.targetTSS) * 100)}%
            </div>
            <div className="text-xs text-purple-700 mt-1">Of target</div>
          </div>

          {/* Weather Today */}
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-xl border border-cyan-200">
            <div className="flex items-center gap-2 mb-2">
              {getWeatherIcon()}
              <span className="text-xs font-medium text-cyan-900">Weather</span>
            </div>
            {weather?.current && !weatherLoading ? (
              <>
                <div className="text-2xl font-bold text-cyan-900">
                  {Math.round(weather.current.temp)}°
                </div>
                <div className="text-xs text-cyan-700 mt-1 truncate">
                  {weather.current.condition || 'N/A'}
                </div>
              </>
            ) : (
              <div className="text-sm text-cyan-700">Loading...</div>
            )}
          </div>
        </div>

        {/* Status Summary */}
        <div
          className={`p-3 rounded-lg border flex items-center justify-between ${getStatusColor()}`}
        >
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="text-sm font-semibold">Plan Status</div>
              <div className="text-xs">{displaySummary.statusMessage}</div>
            </div>
          </div>
          {impact && !weatherLoading && (
            <div className="text-right">
              <div className="text-xs font-medium">Training Impact</div>
              <div className="text-sm font-bold capitalize">
                {impact.overallImpact}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
