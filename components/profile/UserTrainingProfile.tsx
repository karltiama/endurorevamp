'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Activity,
  MapPin,
  Award,
  CheckCircle,
  Sparkles,
  Trophy,
  Target as TargetIcon,
  AlertTriangle
} from 'lucide-react';
import { useUserActivities } from '@/hooks/use-user-activities';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import { formatDistance, formatPace } from '@/lib/utils';
import { Activity as StravaActivity } from '@/lib/strava/types';
import { ActivityWithTrainingData } from '@/types';

interface UserTrainingProfileProps {
  userId: string;
}

interface TrainingProfile {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  weeklyTSSTarget: number;
  preferredDistance: number;
  preferredPace: number;
  trainingFrequency: number;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
}

// Helper functions moved outside component
const estimateTSS = (activity: StravaActivity): number => {
  const durationHours = activity.moving_time / 3600;
  const baseIntensity = activity.sport_type === 'Run' ? 70 : 60;
  
  let intensityMultiplier = 1;
  if (activity.average_heartrate) {
    intensityMultiplier = Math.max(0.5, Math.min(1.5, activity.average_heartrate / 140));
  }
  
  return durationHours * baseIntensity * intensityMultiplier;
};

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

const analyzeTrainingProfile = (activities: StravaActivity[]): TrainingProfile => {
  if (!activities || activities.length === 0) {
    return {
      experienceLevel: 'beginner',
      weeklyTSSTarget: 200,
      preferredDistance: 5,
      preferredPace: 360,
      trainingFrequency: 3,
      strengths: ['Starting fresh'],
      areasForImprovement: ['Build consistency', 'Establish routine'],
      recommendations: ['Start with 3 runs per week', 'Focus on easy pace', 'Gradually increase distance']
    };
  }

  const weeklyDistance = calculateWeeklyDistance(activities);
  const averagePace = calculateAveragePace(activities);
  const weeklyTSS = activities.slice(0, 10).reduce((sum, activity) => {
    const tss = (activity as ActivityWithTrainingData).training_stress_score || estimateTSS(activity);
    return sum + tss;
  }, 0);

  // Determine experience level
  let experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  if (weeklyTSS < 300 && weeklyDistance < 20) {
    experienceLevel = 'beginner';
  } else if (weeklyTSS < 600 && weeklyDistance < 50) {
    experienceLevel = 'intermediate';
  } else {
    experienceLevel = 'advanced';
  }

  // Calculate preferred distance (most common distance)
  const distances = activities.map(a => a.distance / 1000);
  const preferredDistance = distances.length > 0 ? 
    distances.reduce((sum, d) => sum + d, 0) / distances.length : 5;

  // Calculate preferred pace
  const preferredPace = averagePace > 0 ? averagePace : 360;

  // Calculate training frequency
  const recentActivities = activities.filter(a => {
    const activityDate = new Date(a.start_date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return activityDate >= weekAgo;
  });
  const trainingFrequency = recentActivities.length;

  // Analyze strengths and areas for improvement
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];

  // Always provide positive feedback based on experience level
  if (experienceLevel === 'beginner') {
    // Beginner-friendly strengths
    if (trainingFrequency >= 1) {
      strengths.push('Getting started with running');
    }
    if (trainingFrequency >= 2) {
      strengths.push('Building a consistent routine');
    }
    if (trainingFrequency >= 3) {
      strengths.push('Great training frequency for a beginner');
    }
    if (weeklyDistance > 0) {
      strengths.push('Taking the first steps in your running journey');
    }
    if (weeklyDistance >= 5) {
      strengths.push('Building a solid foundation');
    }
    
    // Beginner-friendly areas for improvement
    if (trainingFrequency < 2) {
      areasForImprovement.push('Try to run 2-3 times per week');
    }
    if (weeklyDistance < 10) {
      areasForImprovement.push('Gradually increase your weekly distance');
    }
  } else if (experienceLevel === 'intermediate') {
    // Intermediate strengths
    if (trainingFrequency >= 4) {
      strengths.push('High training consistency');
    } else if (trainingFrequency >= 3) {
      strengths.push('Good training frequency');
    }
    if (averagePace < 300) {
      strengths.push('Good running pace');
    }
    if (weeklyDistance > 30) {
      strengths.push('Strong endurance base');
    } else if (weeklyDistance > 20) {
      strengths.push('Building endurance');
    }
    
    // Intermediate areas for improvement
    if (trainingFrequency < 4) {
      areasForImprovement.push('Increase training frequency');
    }
    if (averagePace >= 300) {
      areasForImprovement.push('Work on pace improvement');
    }
    if (weeklyDistance < 30) {
      areasForImprovement.push('Build distance gradually');
    }
  } else {
    // Advanced strengths
    if (trainingFrequency >= 5) {
      strengths.push('Elite training consistency');
    } else if (trainingFrequency >= 4) {
      strengths.push('High training consistency');
    }
    if (averagePace < 250) {
      strengths.push('Excellent running pace');
    } else if (averagePace < 300) {
      strengths.push('Good running pace');
    }
    if (weeklyDistance > 50) {
      strengths.push('Elite endurance base');
    } else if (weeklyDistance > 40) {
      strengths.push('Strong endurance base');
    }
    
    // Advanced areas for improvement
    if (trainingFrequency < 5) {
      areasForImprovement.push('Optimize training frequency');
    }
    if (averagePace >= 300) {
      areasForImprovement.push('Focus on pace improvement');
    }
    if (weeklyDistance < 40) {
      areasForImprovement.push('Increase weekly volume');
    }
  }

  // Ensure we always have at least one strength
  if (strengths.length === 0) {
    strengths.push('Starting your running journey');
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (experienceLevel === 'beginner') {
    recommendations.push('Focus on consistency over intensity');
    recommendations.push('Aim for 3-4 runs per week');
    recommendations.push('Keep most runs at easy pace');
  } else if (experienceLevel === 'intermediate') {
    recommendations.push('Add structured workouts');
    recommendations.push('Include long runs weekly');
    recommendations.push('Consider race-specific training');
  } else {
    recommendations.push('Optimize training load distribution');
    recommendations.push('Include advanced workouts');
    recommendations.push('Focus on race-specific preparation');
  }

  return {
    experienceLevel,
    weeklyTSSTarget: Math.round(weeklyTSS * 1.1), // 10% increase
    preferredDistance: Math.round(preferredDistance * 10) / 10,
    preferredPace: Math.round(preferredPace),
    trainingFrequency,
    strengths,
    areasForImprovement,
    recommendations
  };
};

export function UserTrainingProfile({ userId }: UserTrainingProfileProps) {
  const { data: activities, isLoading } = useUserActivities(userId);
  const { preferences } = useUnitPreferences();

  const profile = analyzeTrainingProfile(activities || []); // fallback, or refactor as needed

  if (isLoading) {
    return (
      <div className="space-y-4">
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
    <div className="space-y-6">
      {/* Experience Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Training Experience Level
            </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex items-center justify-between">
            <div>
              <Badge 
                variant={profile.experienceLevel === 'beginner' ? 'secondary' : 
                        profile.experienceLevel === 'intermediate' ? 'default' : 'destructive'}
                className="text-lg px-3 py-1"
              >
                {profile.experienceLevel.charAt(0).toUpperCase() + profile.experienceLevel.slice(1)}
                </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Based on your training volume and consistency
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {profile.weeklyTSSTarget} TSS
              </div>
              <div className="text-sm text-muted-foreground">Recent Training Capacity</div>
              <div className="text-xs text-muted-foreground mt-1">
                Based on recent activity
              </div>
                </div>
                  </div>
        </CardContent>
      </Card>

      {/* Training Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="h-5 w-5 text-blue-500" />
              <div>
                                  <div className="text-sm text-muted-foreground">Preferred Distance</div>
                  <div className="text-xl font-semibold">
                    {formatDistance(profile.preferredDistance * 1000, preferences.distance)}
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>

          <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                                  <div className="text-sm text-muted-foreground">Average Pace</div>
                  <div className="text-xl font-semibold">
                    {formatPace(profile.preferredPace, preferences.pace)}
                  </div>
              </div>
                </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="h-5 w-5 text-purple-500" />
                <div>
                <div className="text-sm text-muted-foreground">Weekly Frequency</div>
                <div className="text-xl font-semibold">
                  {profile.trainingFrequency} runs
                </div>
              </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Strengths and Areas for Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Your Strengths
            </CardTitle>
            </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {profile.strengths.map((strength, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <TargetIcon className="h-5 w-5" />
              Areas for Improvement
              </CardTitle>
            </CardHeader>
          <CardContent>
                <div className="space-y-2">
              {profile.areasForImprovement.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">{area}</span>
                </div>
              ))}
                    </div>
          </CardContent>
        </Card>
              </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profile.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Award className="h-4 w-4 text-blue-500 mt-0.5" />
                <span className="text-sm">{recommendation}</span>
              </div>
            ))}
          </div>
            </CardContent>
          </Card>
    </div>
  );
} 