'use client'

import { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  TrendingUp, 
  Calendar,
  Activity,
  Clock,
  MapPin
} from 'lucide-react';
import { useUserActivities } from '@/hooks/use-user-activities';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import { useAuth } from '@/providers/AuthProvider';
import { Activity as StravaActivity } from '@/lib/strava/types';

interface DynamicGoalSuggestionsProps {
  onGoalCreated?: () => void;
}

interface GoalSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'distance' | 'frequency' | 'duration' | 'intensity';
  target: number;
  unit: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
}

// Helper functions moved outside component

const calculateWeeklyDistance = (activities: StravaActivity[]): number => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return activities
    .filter(activity => {
      const activityDate = new Date(activity.start_date);
      return activityDate >= weekStart && activityDate <= weekEnd;
    })
    .reduce((sum, activity) => sum + activity.distance, 0) / 1000; // Convert to km
};

const calculateAveragePace = (activities: StravaActivity[]): number => {
  const runningActivities = activities.filter(a => a.sport_type === 'Run');
  if (runningActivities.length === 0) return 0;
  
  const totalPace = runningActivities.reduce((sum, activity) => {
    const pace = activity.moving_time / (activity.distance / 1000); // seconds per km
    return sum + pace;
  }, 0);
  
  return totalPace / runningActivities.length;
};

export function DynamicGoalSuggestions({ onGoalCreated }: DynamicGoalSuggestionsProps) {
  const { user } = useAuth();
  const { data: activities, isLoading } = useUserActivities(user?.id || '');
  const { preferences } = useUnitPreferences();

  const generateSuggestions = useCallback((activities: StravaActivity[], preferences: { distance: 'km' | 'miles' }): GoalSuggestion[] => {
    if (!activities || activities.length === 0) {
      return [
        {
          id: 'first-activity',
          title: 'Start Your Journey',
          description: 'Complete your first activity',
          type: 'frequency',
          target: 1,
          unit: 'activity',
          icon: <Activity className="h-5 w-5" />,
          priority: 'high',
          reasoning: 'Begin your training journey with your first activity'
        }
      ];
    }

    const suggestions: GoalSuggestion[] = [];
    const weeklyDistance = calculateWeeklyDistance(activities);
    const averagePace = calculateAveragePace(activities);
    const recentActivities = activities.slice(0, 10);

    // Distance-based suggestions
    if (weeklyDistance > 0) {
      const currentWeekly = weeklyDistance;
      const targetWeekly = Math.round(currentWeekly * 1.2 * 10) / 10; // 20% increase
      
      suggestions.push({
        id: 'weekly-distance',
        title: 'Increase Weekly Distance',
        description: `Build endurance gradually`,
        type: 'distance',
        target: targetWeekly,
        unit: preferences.distance,
        icon: <MapPin className="h-5 w-5" />,
        priority: 'high',
        reasoning: `Current weekly average: ${currentWeekly.toFixed(1)}${preferences.distance === 'km' ? 'km' : 'mi'}`
      });
    }

    // Frequency-based suggestions
    const weeklyFrequency = recentActivities.filter(activity => {
      const activityDate = new Date(activity.start_date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return activityDate >= weekAgo;
    }).length;

    if (weeklyFrequency < 3) {
      suggestions.push({
        id: 'weekly-frequency',
        title: 'Build Consistency',
        description: 'Establish regular training habits',
        type: 'frequency',
        target: Math.min(weeklyFrequency + 1, 5),
        unit: 'activities/week',
        icon: <Calendar className="h-5 w-5" />,
        priority: 'high',
        reasoning: `Currently averaging ${weeklyFrequency} activities per week`
      });
    }

    // Pace-based suggestions
    if (averagePace > 0) {
      const currentPace = averagePace;
      const targetPace = Math.round(currentPace * 0.95); // 5% improvement
      
      suggestions.push({
        id: 'pace-improvement',
        title: 'Improve Running Pace',
        description: 'Focus on speed development',
        type: 'intensity',
        target: targetPace,
        unit: 'seconds/km',
        icon: <TrendingUp className="h-5 w-5" />,
        priority: 'medium',
        reasoning: `Current average pace: ${Math.round(currentPace)}s/km`
      });
    }

    // Duration-based suggestions
    const averageDuration = recentActivities.reduce((sum, activity) => 
      sum + activity.moving_time, 0) / recentActivities.length / 60; // minutes

    if (averageDuration > 0) {
      const targetDuration = Math.round(averageDuration * 1.15); // 15% increase
      
      suggestions.push({
        id: 'duration-increase',
        title: 'Extend Workout Duration',
        description: 'Build endurance and stamina',
        type: 'duration',
        target: targetDuration,
        unit: 'minutes',
        icon: <Clock className="h-5 w-5" />,
        priority: 'medium',
        reasoning: `Current average: ${Math.round(averageDuration)} minutes per workout`
      });
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }, []);

  const suggestions = generateSuggestions(activities || [], preferences);

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="loading-skeleton">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {suggestion.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                      <Badge 
                        variant={suggestion.priority === 'high' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {suggestion.priority === 'high' ? 'Recommended' : 'Optional'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">{suggestion.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <strong>Target:</strong> {suggestion.target} {suggestion.unit}
                      </div>
                      <Button 
                        size="sm" 
                        className="ml-4"
                        onClick={onGoalCreated}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Set Goal
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {suggestion.reasoning}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Goal Modal would go here */}
    </>
  );
} 