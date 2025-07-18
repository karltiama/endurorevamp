import { Activity as StravaActivity } from '@/lib/strava/types';

interface SmartGoalGeneratorOptions {
  userId: string;
  activities: StravaActivity[];
  preferences: {
    distance: 'km' | 'miles';
    pace: 'min/km' | 'min/mile';
  };
}

interface GoalSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'distance' | 'frequency' | 'duration' | 'intensity';
  target: number;
  unit: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  difficulty: 'conservative' | 'moderate' | 'ambitious';
  successProbability: number;
  benefits: string[];
  strategies: string[];
  warnings?: string[];
}

export class SmartGoalGenerator {
  private userId: string;
  private activities: StravaActivity[];
  private preferences: { distance: 'km' | 'miles'; pace: 'min/km' | 'min/mile' };

  constructor(options: SmartGoalGeneratorOptions) {
    this.userId = options.userId;
    this.activities = options.activities;
    this.preferences = options.preferences;
  }

  generateSuggestions(): GoalSuggestion[] {
    const suggestions: GoalSuggestion[] = [];

    // Analyze user's current training patterns
    const analysis = this.analyzeTrainingPatterns();

    // Generate distance-based suggestions
    if (analysis.weeklyDistance > 0) {
      suggestions.push(this.generateDistanceGoal(analysis));
    }

    // Generate frequency-based suggestions
    if (analysis.weeklyFrequency < 5) {
      suggestions.push(this.generateFrequencyGoal(analysis));
    }

    // Generate pace-based suggestions
    if (analysis.averagePace > 0) {
      suggestions.push(this.generatePaceGoal(analysis));
    }

    // Generate duration-based suggestions
    if (analysis.averageDuration > 0) {
      suggestions.push(this.generateDurationGoal(analysis));
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  private analyzeTrainingPatterns() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Filter activities for current week
    const thisWeekActivities = this.activities.filter(activity => {
      const activityDate = new Date(activity.start_date);
      return activityDate >= weekStart && activityDate <= weekEnd;
    });

    // Calculate weekly distance
    const weeklyDistance = thisWeekActivities.reduce((sum, activity) => 
      sum + activity.distance, 0) / 1000; // Convert to km

    // Calculate weekly frequency
    const weeklyFrequency = thisWeekActivities.length;

    // Calculate average pace
    const runningActivities = this.activities.filter(a => a.sport_type === 'Run');
    const averagePace = runningActivities.length > 0 
      ? runningActivities.reduce((sum, activity) => {
          const pace = activity.moving_time / (activity.distance / 1000); // seconds per km
          return sum + pace;
        }, 0) / runningActivities.length
      : 0;

    // Calculate average duration
    const averageDuration = this.activities.length > 0
      ? this.activities.reduce((sum, activity) => sum + activity.moving_time, 0) / this.activities.length / 60 // minutes
      : 0;
    
    return {
      weeklyDistance,
      weeklyFrequency,
      averagePace,
      averageDuration,
      totalActivities: this.activities.length
    };
  }

  private generateDistanceGoal(analysis: ReturnType<typeof this.analyzeTrainingPatterns>): GoalSuggestion {
    const currentWeekly = analysis.weeklyDistance;
    const targetWeekly = Math.round(currentWeekly * 1.2 * 10) / 10; // 20% increase
    
    return {
      id: 'weekly-distance',
      title: 'Increase Weekly Distance',
      description: 'Build endurance gradually by increasing your weekly running distance',
      type: 'distance',
      target: targetWeekly,
      unit: this.preferences.distance,
      priority: 'high',
      reasoning: `Current weekly average: ${currentWeekly.toFixed(1)}${this.preferences.distance === 'km' ? 'km' : 'mi'}`,
      difficulty: 'moderate',
      successProbability: 80,
      benefits: [
        'Builds aerobic endurance',
        'Improves running economy',
        'Prepares for longer races'
      ],
      strategies: [
        'Increase distance by 10% each week',
        'Include rest days between runs',
        'Listen to your body and adjust as needed'
      ]
    };
  }

  private generateFrequencyGoal(analysis: ReturnType<typeof this.analyzeTrainingPatterns>): GoalSuggestion {
    const targetFrequency = Math.min(analysis.weeklyFrequency + 1, 5);
    
    return {
      id: 'weekly-frequency',
      title: 'Build Training Consistency',
      description: 'Establish regular training habits for long-term progress',
      type: 'frequency',
      target: targetFrequency,
      unit: 'runs/week',
      priority: 'high',
      reasoning: `Currently averaging ${analysis.weeklyFrequency} activities per week`,
      difficulty: 'conservative',
      successProbability: 85,
      benefits: [
        'Builds training consistency',
        'Improves fitness gradually',
        'Creates sustainable habits'
      ],
      strategies: [
        'Schedule runs on specific days',
        'Start with shorter, easier runs',
        'Gradually increase frequency'
      ]
    };
  }

  private generatePaceGoal(analysis: ReturnType<typeof this.analyzeTrainingPatterns>): GoalSuggestion {
    const currentPace = analysis.averagePace;
    const targetPace = Math.round(currentPace * 0.95); // 5% improvement
    
    return {
      id: 'pace-improvement',
      title: 'Improve Running Pace',
      description: 'Focus on speed development and running efficiency',
      type: 'intensity',
      target: targetPace,
      unit: 'seconds/km',
      priority: 'medium',
      reasoning: `Current average pace: ${Math.round(currentPace)}s/km`,
      difficulty: 'ambitious',
      successProbability: 70,
      benefits: [
        'Improves running economy',
        'Builds speed endurance',
        'Enhances overall fitness'
      ],
      strategies: [
        'Include interval training once per week',
        'Focus on good running form',
        'Gradually increase intensity'
      ],
      warnings: [
        'Don\'t increase intensity too quickly',
        'Listen to your body and rest when needed'
      ]
    };
  }

  private generateDurationGoal(analysis: ReturnType<typeof this.analyzeTrainingPatterns>): GoalSuggestion {
    const targetDuration = Math.round(analysis.averageDuration * 1.15); // 15% increase
    
    return {
      id: 'duration-increase',
      title: 'Extend Workout Duration',
      description: 'Build endurance and stamina with longer training sessions',
      type: 'duration',
      target: targetDuration,
      unit: 'minutes',
      priority: 'medium',
      reasoning: `Current average: ${Math.round(analysis.averageDuration)} minutes per workout`,
      difficulty: 'moderate',
      successProbability: 75,
      benefits: [
        'Builds aerobic endurance',
        'Improves fat burning',
        'Prepares for longer races'
      ],
      strategies: [
        'Start with 30-minute runs',
        'Increase duration by 10% weekly',
        'Keep long runs at easy pace'
      ]
    };
  }
} 