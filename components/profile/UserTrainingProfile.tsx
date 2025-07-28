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

const analyzeTrainingProfile = (
  activities: StravaActivity[], 
  analysisParams: Record<string, number>
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
      recommendations: ['Start with 3 runs per week', 'Focus on easy pace', 'Gradually increase distance']
    };
  }

  const weeklyDistance = calculateWeeklyDistance(activities);
  const averagePace = calculateAveragePace(activities);
  const weeklyTSS = activities.slice(0, 10).reduce((sum, activity) => {
    const tss = (activity as ActivityWithTrainingData).training_stress_score || estimateTSS(activity);
    return sum + tss;
  }, 0);

  // Calculate training frequency
  const recentActivities = activities.filter(a => {
    const activityDate = new Date(a.start_date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return activityDate >= weekAgo;
  });
  const trainingFrequency = recentActivities.length;

  // DYNAMIC ANALYSIS: Use personalized parameters
  const metricAnalysis = {
    // Distance analysis
    distance: {
      value: weeklyDistance,
      level: weeklyDistance < analysisParams.distance_beginner_threshold ? 'beginner' : 
             weeklyDistance < analysisParams.distance_intermediate_threshold ? 'intermediate' : 'advanced',
      target: weeklyDistance < analysisParams.distance_beginner_threshold ? 
              weeklyDistance * analysisParams.distance_target_multiplier :
              weeklyDistance < analysisParams.distance_intermediate_threshold ? 
              analysisParams.distance_intermediate_threshold * analysisParams.distance_target_multiplier :
              analysisParams.distance_advanced_threshold * analysisParams.distance_target_multiplier,
      improvement: weeklyDistance < analysisParams.distance_beginner_threshold ? 
                  `Build weekly distance to ${analysisParams.distance_beginner_threshold}-${analysisParams.distance_intermediate_threshold}km` :
                  weeklyDistance < analysisParams.distance_intermediate_threshold ? 
                  `Increase to ${analysisParams.distance_intermediate_threshold}-${analysisParams.distance_advanced_threshold}km per week` :
                  `Consider ${analysisParams.distance_advanced_threshold}+km for elite training`
    },
    
    // Pace analysis
    pace: {
      value: averagePace,
      level: averagePace > analysisParams.pace_beginner_threshold ? 'beginner' : 
             averagePace > analysisParams.pace_intermediate_threshold ? 'intermediate' : 'advanced',
      target: averagePace > analysisParams.pace_beginner_threshold ? 
              averagePace * analysisParams.pace_target_multiplier :
              averagePace > analysisParams.pace_intermediate_threshold ? 
              analysisParams.pace_intermediate_threshold * analysisParams.pace_target_multiplier :
              analysisParams.pace_advanced_threshold * analysisParams.pace_target_multiplier,
      improvement: averagePace > analysisParams.pace_beginner_threshold ? 
                  'Focus on easy pace to build endurance' :
                  averagePace > analysisParams.pace_intermediate_threshold ? 
                  'Work on pace through structured workouts' :
                  'Fine-tune pace for race-specific training'
    },
    
    // Frequency analysis
    frequency: {
      value: trainingFrequency,
      level: trainingFrequency < analysisParams.frequency_beginner_threshold ? 'beginner' : 
             trainingFrequency < analysisParams.frequency_intermediate_threshold ? 'intermediate' : 'advanced',
      target: trainingFrequency < analysisParams.frequency_beginner_threshold ? 
              analysisParams.frequency_beginner_threshold * analysisParams.frequency_target_multiplier :
              trainingFrequency < analysisParams.frequency_intermediate_threshold ? 
              analysisParams.frequency_intermediate_threshold * analysisParams.frequency_target_multiplier :
              analysisParams.frequency_advanced_threshold * analysisParams.frequency_target_multiplier,
      improvement: trainingFrequency < analysisParams.frequency_beginner_threshold ? 
                  `Aim for ${analysisParams.frequency_beginner_threshold}-${analysisParams.frequency_intermediate_threshold} runs per week` :
                  trainingFrequency < analysisParams.frequency_intermediate_threshold ? 
                  `Increase to ${analysisParams.frequency_intermediate_threshold}-${analysisParams.frequency_advanced_threshold} runs per week` :
                  `Consider ${analysisParams.frequency_advanced_threshold}+ runs for elite training`
    },
    
    // TSS analysis
    tss: {
      value: weeklyTSS,
      level: weeklyTSS < analysisParams.tss_beginner_threshold ? 'beginner' : 
             weeklyTSS < analysisParams.tss_intermediate_threshold ? 'intermediate' : 'advanced',
      target: weeklyTSS < analysisParams.tss_beginner_threshold ? 
              analysisParams.tss_beginner_threshold * analysisParams.tss_target_multiplier :
              weeklyTSS < analysisParams.tss_intermediate_threshold ? 
              analysisParams.tss_intermediate_threshold * analysisParams.tss_target_multiplier :
              analysisParams.tss_advanced_threshold * analysisParams.tss_target_multiplier,
      improvement: weeklyTSS < analysisParams.tss_beginner_threshold ? 
                  'Build training load gradually' :
                  weeklyTSS < analysisParams.tss_intermediate_threshold ? 
                  'Increase training intensity' :
                  'Optimize training load distribution'
    }
  };

  // Determine overall experience level (weighted average)
  const levels = { beginner: 1, intermediate: 2, advanced: 3 };
  const levelScores = {
    distance: levels[metricAnalysis.distance.level as keyof typeof levels],
    pace: levels[metricAnalysis.pace.level as keyof typeof levels],
    frequency: levels[metricAnalysis.frequency.level as keyof typeof levels],
    tss: levels[metricAnalysis.tss.level as keyof typeof levels]
  };
  
  const averageScore = (levelScores.distance + levelScores.pace + levelScores.frequency + levelScores.tss) / 4;
  
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
  const preferredDistance = distances.length > 0 ? 
    distances.reduce((sum, d) => sum + d, 0) / distances.length : 5;
  const preferredPace = averagePace > 0 ? averagePace : 360;

  // DYNAMIC STRENGTHS: Based on your best metrics
  const strengths: string[] = [];
  
  // Find your strongest metrics (closest to next level)
  const metricGaps = {
    distance: metricAnalysis.distance.target - metricAnalysis.distance.value,
    pace: metricAnalysis.pace.value - metricAnalysis.pace.target, // Lower is better for pace
    frequency: metricAnalysis.frequency.target - metricAnalysis.frequency.value,
    tss: metricAnalysis.tss.target - metricAnalysis.tss.value
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
    if (gap < (analysis.target * analysisParams.strength_threshold_percent / 100)) { // Use personalized threshold
      switch (metric) {
        case 'distance':
          strengths.push(`Strong weekly distance (${analysis.value.toFixed(1)}km)`);
          break;
        case 'pace':
          strengths.push(`Good running pace (${(analysis.value / 60).toFixed(1)} min/km)`);
          break;
        case 'frequency':
          strengths.push(`Consistent training (${analysis.value} runs/week)`);
          break;
        case 'tss':
          strengths.push(`Good training load (${analysis.value.toFixed(0)} TSS)`);
          break;
      }
    }
  });

  // Add general strengths based on experience level
  if (experienceLevel === 'beginner') {
    if (trainingFrequency >= 1) strengths.push('Getting started with running');
    if (weeklyDistance > 0) strengths.push('Taking the first steps in your running journey');
  } else if (experienceLevel === 'intermediate') {
    if (trainingFrequency >= 3) strengths.push('Building a solid training routine');
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
    const gapPercent = metric === 'pace' ? 
      ((analysis.value - analysis.target) / analysis.target) * 100 :
      ((analysis.target - analysis.value) / analysis.target) * 100;
    
    if (gapPercent > analysisParams.improvement_threshold_percent) { // Use personalized threshold
      areasForImprovement.push(analysis.improvement);
    }
  });

  // Add cross-metric insights
  if (metricAnalysis.frequency.level === 'beginner' && metricAnalysis.distance.level === 'intermediate') {
    areasForImprovement.push('Increase training frequency to support your distance goals');
  }
  if (metricAnalysis.pace.level === 'beginner' && metricAnalysis.tss.level === 'intermediate') {
    areasForImprovement.push('Focus on easy pace to build endurance before increasing intensity');
  }
  if (metricAnalysis.distance.level === 'advanced' && metricAnalysis.frequency.level === 'beginner') {
    areasForImprovement.push('Add more runs per week to distribute your high volume better');
  }

  // Ensure we always have at least one improvement
  if (areasForImprovement.length === 0) {
    // Find the metric with the biggest gap
    const biggestGap = sortedMetrics[sortedMetrics.length - 1];
    const analysis = metricAnalysis[biggestGap[0] as keyof typeof metricAnalysis];
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
    recommendations
  };
};

export function UserTrainingProfile({ userId }: UserTrainingProfileProps) {
  const { data: activities, isLoading } = useUserActivities(userId);
  const { preferences } = useUnitPreferences();
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysisParams, setAnalysisParams] = useState<any>(null);

  useEffect(() => {
    const loadAnalysisParams = async () => {
      if (user?.id) {
        const params = await AnalysisParametersService.getAnalysisParameters(user.id);
        setAnalysisParams(params);
      }
    };
    loadAnalysisParams();
  }, [user?.id]);

  // Use default parameters if user's parameters aren't loaded yet
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
    improvement_threshold_percent: 20
  };

  const profile = analyzeTrainingProfile(activities || [], analysisParams || defaultParams);

  // Calculate debug metrics
  const debugMetrics = activities && activities.length > 0 ? {
    weeklyDistance: calculateWeeklyDistance(activities),
    averagePace: calculateAveragePace(activities),
    weeklyTSS: activities.slice(0, 10).reduce((sum, activity) => {
      const tss = (activity as ActivityWithTrainingData).training_stress_score || estimateTSS(activity);
      return sum + tss;
    }, 0),
    trainingFrequency: activities.filter(a => {
      const activityDate = new Date(a.start_date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return activityDate >= weekAgo;
    }).length,
    totalActivities: activities.length,
    runningActivities: activities.filter(a => a.sport_type === 'Run').length
  } : null;

  // Calculate dynamic analysis for debug display
  const dynamicAnalysis = debugMetrics ? {
    distance: {
      value: debugMetrics.weeklyDistance,
      level: debugMetrics.weeklyDistance < 15 ? 'beginner' : debugMetrics.weeklyDistance < 30 ? 'intermediate' : 'advanced',
      target: debugMetrics.weeklyDistance < 15 ? 20 : debugMetrics.weeklyDistance < 30 ? 40 : 60
    },
    pace: {
      value: debugMetrics.averagePace,
      level: debugMetrics.averagePace > 360 ? 'beginner' : debugMetrics.averagePace > 300 ? 'intermediate' : 'advanced',
      target: debugMetrics.averagePace > 360 ? 330 : debugMetrics.averagePace > 300 ? 280 : 250
    },
    frequency: {
      value: debugMetrics.trainingFrequency,
      level: debugMetrics.trainingFrequency < 3 ? 'beginner' : debugMetrics.trainingFrequency < 5 ? 'intermediate' : 'advanced',
      target: debugMetrics.trainingFrequency < 3 ? 3 : debugMetrics.trainingFrequency < 5 ? 5 : 6
    },
    tss: {
      value: debugMetrics.weeklyTSS,
      level: debugMetrics.weeklyTSS < 300 ? 'beginner' : debugMetrics.weeklyTSS < 600 ? 'intermediate' : 'advanced',
      target: debugMetrics.weeklyTSS < 300 ? 400 : debugMetrics.weeklyTSS < 600 ? 700 : 900
    }
  } : null;

  if (isLoading || !profile) {
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
      {/* Debug Metrics - Only show if you have activities */}
      {debugMetrics && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 text-sm">🔍 Dynamic Analysis Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Metrics */}
              <div className="space-y-3">
                <h4 className="font-medium text-blue-700 text-xs">📊 Current Metrics</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="font-medium text-blue-700">Weekly Distance</div>
                    <div className="text-blue-600">{debugMetrics.weeklyDistance.toFixed(1)} km</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-700">Average Pace</div>
                    <div className="text-blue-600">{debugMetrics.averagePace.toFixed(0)} s/km</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-700">Weekly TSS</div>
                    <div className="text-blue-600">{debugMetrics.weeklyTSS.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-700">Training Frequency</div>
                    <div className="text-blue-600">{debugMetrics.trainingFrequency} runs/week</div>
                  </div>
                </div>
                <div className="text-xs text-blue-600">
                  Based on {debugMetrics.totalActivities} total activities ({debugMetrics.runningActivities} runs)
                </div>
              </div>

              {/* Dynamic Analysis */}
              {dynamicAnalysis && (
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-700 text-xs">🎯 Individual Metric Levels</h4>
                  <div className="space-y-2 text-xs">
                    {Object.entries(dynamicAnalysis).map(([metric, data]) => (
                      <div key={metric} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{metric}</span>
                          <Badge 
                            variant={
                              data.level === 'beginner' ? 'secondary' : 
                              data.level === 'intermediate' ? 'default' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {data.level}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-600">{data.value.toFixed(1)}</div>
                          <div className="text-gray-500 text-xs">Target: {data.target}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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