'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TrendingUp,
  Activity,
  MapPin,
  Award,
  CheckCircle,
  Sparkles,
  Trophy,
  Target as TargetIcon,
  AlertTriangle,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { useUserActivities } from '@/hooks/use-user-activities';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import {
  formatDistance,
  formatPace,
  type DistanceUnit,
  type PaceUnit,
} from '@/lib/utils';
import { Activity as StravaActivity } from '@/lib/strava/types';
import { ActivityWithTrainingData } from '@/types';
import { AnalysisParametersService } from '@/lib/training/analysis-parameters-service';
import { useAuth } from '@/providers/AuthProvider';
import { useEffect, useState } from 'react';

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
    intensityMultiplier = Math.max(
      0.5,
      Math.min(1.5, activity.average_heartrate / 140)
    );
  }

  return durationHours * baseIntensity * intensityMultiplier;
};

// Default parameters moved outside component to avoid dependency issues
const defaultParams = {
  distance_beginner_threshold: 15,
  distance_intermediate_threshold: 30,
  distance_advanced_threshold: 50,
  pace_beginner_threshold: 360,
  pace_intermediate_threshold: 300,
  pace_advanced_threshold: 250,
  frequency_beginner_threshold: 3,
  frequency_intermediate_threshold: 5,
  frequency_advanced_threshold: 6,
  tss_beginner_threshold: 300,
  tss_intermediate_threshold: 600,
  tss_advanced_threshold: 900,
  distance_target_multiplier: 1.3,
  pace_target_multiplier: 0.9,
  frequency_target_multiplier: 1.2,
  tss_target_multiplier: 1.2,
  strength_threshold_percent: 30,
  improvement_threshold_percent: 20,
};

const analyzeTrainingProfile = (
  activities: StravaActivity[],
  analysisParams: Record<string, number>,
  preferences: { distance: DistanceUnit; pace: PaceUnit }
): TrainingProfile => {
  if (!activities || activities.length === 0) {
    return {
      experienceLevel: 'beginner',
      weeklyTSSTarget: 200,
      preferredDistance: 5,
      preferredPace: 360,
      trainingFrequency: 3,
      strengths: ['Starting fresh'],
      areasForImprovement: ['Build consistency', 'Establish routine'],
      recommendations: [
        'Start with 3 runs per week',
        'Focus on easy pace',
        'Gradually increase distance',
      ],
    };
  }

  // Calculate training frequency and filter recent activities (last 7 days)
  const recentActivities = activities.filter(a => {
    const activityDate = new Date(a.start_date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return activityDate >= weekAgo;
  });
  const trainingFrequency = recentActivities.length;

  // Calculate weekly distance from recent activities only
  const weeklyDistance =
    recentActivities.reduce((sum, activity) => sum + activity.distance, 0) /
    1000; // Convert to km

  // Calculate average pace from recent running activities
  const recentRunningActivities = recentActivities.filter(
    a => a.sport_type === 'Run'
  );
  const averagePace =
    recentRunningActivities.length > 0
      ? recentRunningActivities.reduce((sum, activity) => {
          const pace = activity.moving_time / (activity.distance / 1000); // seconds per km
          return sum + pace;
        }, 0) / recentRunningActivities.length
      : 0;

  // Calculate weekly TSS from recent activities
  const weeklyTSS = recentActivities.reduce((sum, activity) => {
    const tss =
      (activity as ActivityWithTrainingData).training_stress_score ||
      estimateTSS(activity);
    return sum + tss;
  }, 0);

  // DYNAMIC ANALYSIS: Use personalized parameters
  const metricAnalysis = {
    // Distance analysis
    distance: {
      value: weeklyDistance,
      level:
        weeklyDistance < analysisParams.distance_beginner_threshold
          ? 'beginner'
          : weeklyDistance < analysisParams.distance_intermediate_threshold
            ? 'intermediate'
            : 'advanced',
      target:
        weeklyDistance < analysisParams.distance_beginner_threshold
          ? weeklyDistance * analysisParams.distance_target_multiplier
          : weeklyDistance < analysisParams.distance_intermediate_threshold
            ? analysisParams.distance_intermediate_threshold *
              analysisParams.distance_target_multiplier
            : analysisParams.distance_advanced_threshold *
              analysisParams.distance_target_multiplier,
      improvement:
        weeklyDistance < analysisParams.distance_beginner_threshold
          ? `Build weekly distance to ${formatDistance(analysisParams.distance_beginner_threshold * 1000, preferences.distance)}-${formatDistance(analysisParams.distance_intermediate_threshold * 1000, preferences.distance)}`
          : weeklyDistance < analysisParams.distance_intermediate_threshold
            ? `Increase to ${formatDistance(analysisParams.distance_intermediate_threshold * 1000, preferences.distance)}-${formatDistance(analysisParams.distance_advanced_threshold * 1000, preferences.distance)} per week`
            : `Consider ${formatDistance(analysisParams.distance_advanced_threshold * 1000, preferences.distance)}+ for elite training`,
    },

    // Pace analysis
    pace: {
      value: averagePace,
      level:
        averagePace > analysisParams.pace_beginner_threshold
          ? 'beginner'
          : averagePace > analysisParams.pace_intermediate_threshold
            ? 'intermediate'
            : 'advanced',
      target:
        averagePace > analysisParams.pace_beginner_threshold
          ? averagePace * analysisParams.pace_target_multiplier
          : averagePace > analysisParams.pace_intermediate_threshold
            ? analysisParams.pace_intermediate_threshold *
              analysisParams.pace_target_multiplier
            : analysisParams.pace_advanced_threshold *
              analysisParams.pace_target_multiplier,
      improvement:
        averagePace > analysisParams.pace_beginner_threshold
          ? 'Focus on easy pace to build endurance'
          : averagePace > analysisParams.pace_intermediate_threshold
            ? 'Work on pace through structured workouts'
            : 'Fine-tune pace for race-specific training',
    },

    // Frequency analysis
    frequency: {
      value: trainingFrequency,
      level:
        trainingFrequency < analysisParams.frequency_beginner_threshold
          ? 'beginner'
          : trainingFrequency < analysisParams.frequency_intermediate_threshold
            ? 'intermediate'
            : 'advanced',
      target:
        trainingFrequency < analysisParams.frequency_beginner_threshold
          ? analysisParams.frequency_beginner_threshold *
            analysisParams.frequency_target_multiplier
          : trainingFrequency < analysisParams.frequency_intermediate_threshold
            ? analysisParams.frequency_intermediate_threshold *
              analysisParams.frequency_target_multiplier
            : analysisParams.frequency_advanced_threshold *
              analysisParams.frequency_target_multiplier,
      improvement:
        trainingFrequency < analysisParams.frequency_beginner_threshold
          ? `Aim for ${analysisParams.frequency_beginner_threshold}-${analysisParams.frequency_intermediate_threshold} runs per week`
          : trainingFrequency < analysisParams.frequency_intermediate_threshold
            ? `Increase to ${analysisParams.frequency_intermediate_threshold}-${analysisParams.frequency_advanced_threshold} runs per week`
            : `Consider ${analysisParams.frequency_advanced_threshold}+ runs for elite training`,
    },

    // TSS analysis
    tss: {
      value: weeklyTSS,
      level:
        weeklyTSS < analysisParams.tss_beginner_threshold
          ? 'beginner'
          : weeklyTSS < analysisParams.tss_intermediate_threshold
            ? 'intermediate'
            : 'advanced',
      target:
        weeklyTSS < analysisParams.tss_beginner_threshold
          ? analysisParams.tss_beginner_threshold *
            analysisParams.tss_target_multiplier
          : weeklyTSS < analysisParams.tss_intermediate_threshold
            ? analysisParams.tss_intermediate_threshold *
              analysisParams.tss_target_multiplier
            : analysisParams.tss_advanced_threshold *
              analysisParams.tss_target_multiplier,
      improvement:
        weeklyTSS < analysisParams.tss_beginner_threshold
          ? 'Build training load gradually'
          : weeklyTSS < analysisParams.tss_intermediate_threshold
            ? 'Increase training intensity'
            : 'Optimize training load distribution',
    },
  };

  // Determine overall experience level (weighted average)
  const levels = { beginner: 1, intermediate: 2, advanced: 3 };
  const levelScores = {
    distance: levels[metricAnalysis.distance.level as keyof typeof levels],
    pace: levels[metricAnalysis.pace.level as keyof typeof levels],
    frequency: levels[metricAnalysis.frequency.level as keyof typeof levels],
    tss: levels[metricAnalysis.tss.level as keyof typeof levels],
  };

  const averageScore =
    (levelScores.distance +
      levelScores.pace +
      levelScores.frequency +
      levelScores.tss) /
    4;

  let experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  if (averageScore < 1.5) {
    experienceLevel = 'beginner';
  } else if (averageScore < 2.5) {
    experienceLevel = 'intermediate';
  } else {
    experienceLevel = 'advanced';
  }

  // Calculate preferred distance and pace
  const distances = activities.map(a => a.distance / 1000);
  const preferredDistance =
    distances.length > 0
      ? distances.reduce((sum, d) => sum + d, 0) / distances.length
      : 5;
  const preferredPace = averagePace > 0 ? averagePace : 360;

  // DYNAMIC STRENGTHS: Based on your best metrics
  const strengths: string[] = [];

  // Find your strongest metrics (closest to next level)
  const metricGaps = {
    distance: metricAnalysis.distance.target - metricAnalysis.distance.value,
    pace: metricAnalysis.pace.value - metricAnalysis.pace.target, // Lower is better for pace
    frequency: metricAnalysis.frequency.target - metricAnalysis.frequency.value,
    tss: metricAnalysis.tss.target - metricAnalysis.tss.value,
  };

  // Sort metrics by how close they are to the next level
  const sortedMetrics = Object.entries(metricGaps).sort((a, b) => {
    const aGap = a[0] === 'pace' ? a[1] : a[1]; // Pace is inverted
    const bGap = b[0] === 'pace' ? b[1] : b[1];
    return aGap - bGap;
  });

  // Add strengths based on your best performing metrics
  sortedMetrics.slice(0, 2).forEach(([metric, gap]) => {
    const analysis = metricAnalysis[metric as keyof typeof metricAnalysis];
    if (
      gap <
      (analysis.target * analysisParams.strength_threshold_percent) / 100
    ) {
      // Use personalized threshold
      switch (metric) {
        case 'distance':
          strengths.push(
            `Strong weekly distance (${formatDistance(analysis.value * 1000, preferences.distance)})`
          );
          break;
        case 'pace':
          strengths.push(
            `Good running pace (${formatPace(analysis.value, preferences.pace)})`
          );
          break;
        case 'frequency':
          strengths.push(`Consistent training (${analysis.value} runs/week)`);
          break;
        case 'tss':
          strengths.push(
            `Good training load (${analysis.value.toFixed(0)} TSS)`
          );
          break;
      }
    }
  });

  // Add general strengths based on experience level
  if (experienceLevel === 'beginner') {
    if (trainingFrequency >= 1) strengths.push('Getting started with running');
    if (weeklyDistance > 0)
      strengths.push('Taking the first steps in your running journey');
  } else if (experienceLevel === 'intermediate') {
    if (trainingFrequency >= 3)
      strengths.push('Building a solid training routine');
    if (weeklyDistance > 20) strengths.push('Developing endurance base');
  } else {
    if (trainingFrequency >= 4) strengths.push('High training consistency');
    if (weeklyDistance > 40) strengths.push('Strong endurance foundation');
  }

  // DYNAMIC AREAS FOR IMPROVEMENT: Based on your weakest metrics
  const areasForImprovement: string[] = [];

  // Focus on the metrics furthest from their targets
  const improvementPriorities = sortedMetrics.slice(-2).reverse();

  improvementPriorities.forEach(([metric]) => {
    const analysis = metricAnalysis[metric as keyof typeof metricAnalysis];
    const gapPercent =
      metric === 'pace'
        ? ((analysis.value - analysis.target) / analysis.target) * 100
        : ((analysis.target - analysis.value) / analysis.target) * 100;

    if (gapPercent > analysisParams.improvement_threshold_percent) {
      // Use personalized threshold
      areasForImprovement.push(analysis.improvement);
    }
  });

  // Add cross-metric insights
  if (
    metricAnalysis.frequency.level === 'beginner' &&
    metricAnalysis.distance.level === 'intermediate'
  ) {
    areasForImprovement.push(
      'Increase training frequency to support your distance goals'
    );
  }
  if (
    metricAnalysis.pace.level === 'beginner' &&
    metricAnalysis.tss.level === 'intermediate'
  ) {
    areasForImprovement.push(
      'Focus on easy pace to build endurance before increasing intensity'
    );
  }
  if (
    metricAnalysis.distance.level === 'advanced' &&
    metricAnalysis.frequency.level === 'beginner'
  ) {
    areasForImprovement.push(
      'Add more runs per week to distribute your high volume better'
    );
  }

  // Ensure we always have at least one improvement
  if (areasForImprovement.length === 0) {
    // Find the metric with the biggest gap
    const biggestGap = sortedMetrics[sortedMetrics.length - 1];
    const analysis =
      metricAnalysis[biggestGap[0] as keyof typeof metricAnalysis];
    areasForImprovement.push(analysis.improvement);
  }

  // Ensure we always have at least one strength
  if (strengths.length === 0) {
    strengths.push('Starting your running journey');
  }

  // DYNAMIC RECOMMENDATIONS: Based on your specific profile
  const recommendations: string[] = [];

  // Primary recommendation based on biggest gap
  const primaryGap = sortedMetrics[sortedMetrics.length - 1];

  switch (primaryGap[0]) {
    case 'distance':
      recommendations.push('Gradually increase weekly distance by 10-15%');
      break;
    case 'pace':
      recommendations.push('Include structured workouts to improve pace');
      break;
    case 'frequency':
      recommendations.push('Add one more run per week to build consistency');
      break;
    case 'tss':
      recommendations.push('Increase training intensity through tempo runs');
      break;
  }

  // Secondary recommendations based on experience level
  if (experienceLevel === 'beginner') {
    recommendations.push('Focus on consistency over intensity');
    recommendations.push('Keep most runs at easy pace');
  } else if (experienceLevel === 'intermediate') {
    recommendations.push('Add structured workouts to your routine');
    recommendations.push('Include one long run per week');
  } else {
    recommendations.push('Optimize training load distribution');
    recommendations.push('Include advanced workouts for peak performance');
  }

  return {
    experienceLevel,
    weeklyTSSTarget: Math.round(weeklyTSS * 1.1), // 10% increase
    preferredDistance: Math.round(preferredDistance * 10) / 10,
    preferredPace: Math.round(preferredPace),
    trainingFrequency,
    strengths,
    areasForImprovement,
    recommendations,
  };
};

export function UserTrainingProfile({ userId }: UserTrainingProfileProps) {
  const { data: activities, isLoading } = useUserActivities(userId);
  const { preferences } = useUnitPreferences();
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysisParams, setAnalysisParams] = useState<any>(null);

  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    const loadAnalysisParams = async () => {
      if (user?.id) {
        try {
          // Get user's training profile from the actual database table
          const response = await fetch(`/api/user-training-profile/${user.id}`);
          if (response.ok) {
            const profile = await response.json();
            // Use the user's experience level to get appropriate analysis parameters
            const experienceLevel = profile?.experience_level || 'intermediate';
            const params =
              AnalysisParametersService.getDefaultParameters(experienceLevel);
            setAnalysisParams(params);
          } else {
            // Fall back to default parameters
            setAnalysisParams(defaultParams);
          }
        } catch (error) {
          console.error('Error loading training profile:', error);
          // Fall back to default parameters
          setAnalysisParams(defaultParams);
        }
      }
    };
    loadAnalysisParams();
  }, [user?.id]);

  // Initialize name value when user data loads
  useEffect(() => {
    if (user) {
      setNameValue(user.user_metadata?.full_name || user.email || '');
    }
  }, [user]);

  const handleEditName = () => {
    setIsEditingName(true);
  };

  const handleCancelEdit = () => {
    setNameValue(user?.user_metadata?.full_name || user?.email || '');
    setIsEditingName(false);
  };

  const handleSaveName = async () => {
    if (!user) return;

    setIsSavingName(true);
    try {
      const response = await fetch('/api/user/update-name', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: nameValue }),
      });

      if (response.ok) {
        setIsEditingName(false);
        // Optionally refresh the page or update the user context
        window.location.reload();
      } else {
        console.error('Failed to update name');
      }
    } catch (error) {
      console.error('Error updating name:', error);
    } finally {
      setIsSavingName(false);
    }
  };

  const profile = analyzeTrainingProfile(
    activities || [],
    analysisParams || defaultParams,
    preferences
  );

  if (isLoading || !profile) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
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
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-3xl font-bold tracking-tight">Training Profile</h1>
        <div className="flex items-center gap-3 mt-2">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                placeholder="Enter your name"
                className="w-64"
                disabled={isSavingName}
              />
              <Button
                size="sm"
                onClick={handleSaveName}
                disabled={isSavingName || !nameValue.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-3 w-3 mr-1" />
                {isSavingName ? 'Saving...' : 'Save'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSavingName}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {user?.user_metadata?.full_name
                  ? `${user.user_metadata.full_name}'s`
                  : 'Your'}{' '}
                personalized training analysis and recommendations.
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEditName}
                className="h-6 w-6 p-0"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

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
                variant={
                  profile.experienceLevel === 'beginner'
                    ? 'secondary'
                    : profile.experienceLevel === 'intermediate'
                      ? 'default'
                      : 'destructive'
                }
                className="text-lg px-3 py-1"
              >
                {profile.experienceLevel.charAt(0).toUpperCase() +
                  profile.experienceLevel.slice(1)}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Based on your training volume and consistency
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {profile.weeklyTSSTarget} TSS
              </div>
              <div className="text-sm text-muted-foreground">
                Recent Training Capacity
              </div>
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
                <div className="text-sm text-muted-foreground">
                  Preferred Distance
                </div>
                <div className="text-xl font-semibold">
                  {formatDistance(
                    profile.preferredDistance * 1000,
                    preferences.distance
                  )}
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
                <div className="text-sm text-muted-foreground">
                  Average Pace
                </div>
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
                <div className="text-sm text-muted-foreground">
                  Weekly Frequency
                </div>
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
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
              >
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
