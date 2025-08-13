import type { Activity } from '@/lib/strava/types';
import type { TrainingLoadMetrics } from './training-load';

export interface WorkoutRecommendation {
  id: string;
  type:
    | 'easy'
    | 'tempo'
    | 'threshold'
    | 'long'
    | 'recovery'
    | 'strength'
    | 'cross-training';
  sport: 'Run' | 'Ride' | 'Swim' | 'Workout' | 'WeightTraining' | 'Yoga';
  duration: number; // minutes
  intensity: number; // 1-10 scale
  distance?: number; // km, for distance-based workouts
  reasoning: string; // Why this workout is recommended
  alternatives: WorkoutRecommendation[];
  goalAlignment?: string; // How it aligns with user goals
  weatherConsideration?: string; // Weather-based adjustments
}

export interface UserGoal {
  id: string;
  type: string;
  target: number;
  unit: string;
  deadline?: Date;
}

export interface WorkoutPlanningContext {
  userId: string;
  currentTrainingLoad: TrainingLoadMetrics;
  recentActivities: Activity[];
  userGoals: UserGoal[]; // Proper goal types
  userPreferences: {
    preferredSports: string[];
    availableTime: number; // minutes per day
    unitPreferences?: {
      distance: string;
      pace: string;
    };
    weatherConditions?: {
      temperature: number;
      precipitation: number;
      windSpeed: number;
    };
  };
}

export class WorkoutPlanner {
  private context: WorkoutPlanningContext;

  constructor(context: WorkoutPlanningContext) {
    this.context = context;
  }

  /**
   * Generate today's workout recommendation
   */
  generateTodaysWorkout(): WorkoutRecommendation | null {
    // Check if user needs recovery
    if (this.shouldRecommendRecovery()) {
      return this.createRecoveryWorkout();
    }

    // Check if user should do a long workout
    if (this.shouldRecommendLongWorkout()) {
      return this.createLongWorkout();
    }

    // Check if user should do intensity work
    if (this.shouldRecommendIntensityWork()) {
      return this.createIntensityWorkout();
    }

    // Default to moderate workout
    return this.createModerateWorkout();
  }

  /**
   * Generate weekly workout plan
   */
  generateWeeklyPlan(): WorkoutRecommendation[] {
    const plan: WorkoutRecommendation[] = [];

    // Generate 7 days of recommendations with periodization
    for (let day = 0; day < 7; day++) {
      const recommendation = this.generateWorkoutForDay(day);
      if (recommendation) {
        plan.push(recommendation);
      }
    }

    return plan;
  }

  /**
   * Generate weekly workout plan starting from today's workout
   */
  generateWeeklyPlanStartingFromToday(
    todaysWorkout: WorkoutRecommendation | null
  ): WorkoutRecommendation[] {
    const plan: WorkoutRecommendation[] = [];

    // Start with today's workout if available
    if (todaysWorkout) {
      plan.push(todaysWorkout);
    } else {
      // Fallback to generating today's workout
      const todaysRecommendation = this.generateTodaysWorkout();
      if (todaysRecommendation) {
        plan.push(todaysRecommendation);
      }
    }

    // Generate the remaining 6 days
    for (let day = 1; day < 7; day++) {
      const recommendation = this.generateWorkoutForDay(day);
      if (recommendation) {
        plan.push(recommendation);
      }
    }

    return plan;
  }

  /**
   * Check if user needs recovery based on training load
   */
  private shouldRecommendRecovery(): boolean {
    const { currentTrainingLoad, recentActivities } = this.context;

    // Recovery if TSB is very low (high fatigue)
    if (currentTrainingLoad.balance < -20) {
      return true;
    }

    // Recovery if ATL is very high
    if (currentTrainingLoad.acute > 80) {
      return true;
    }

    // Recovery if recent high-intensity workouts
    const recentIntenseWorkouts = recentActivities
      .slice(0, 3)
      .filter(activity => {
        const load =
          (activity as Activity & { training_load_score?: number })
            .training_load_score || 0;
        return load > 70;
      });

    if (recentIntenseWorkouts.length >= 2) {
      return true;
    }

    return false;
  }

  /**
   * Check if user should do a long workout
   */
  private shouldRecommendLongWorkout(): boolean {
    const { currentTrainingLoad, recentActivities } = this.context;

    // Long workout if CTL is stable and TSB is positive
    if (currentTrainingLoad.balance > 5 && currentTrainingLoad.chronic > 30) {
      return true;
    }

    // Long workout if no long workouts in recent history
    const recentLongWorkouts = recentActivities.slice(0, 7).filter(activity => {
      const duration = activity.moving_time / 60; // minutes
      return duration > 90;
    });

    if (recentLongWorkouts.length === 0) {
      return true;
    }

    return false;
  }

  /**
   * Check if user should do intensity work
   */
  private shouldRecommendIntensityWork(): boolean {
    const { currentTrainingLoad, recentActivities } = this.context;

    // Intensity if CTL is high and TSB is positive
    if (currentTrainingLoad.chronic > 50 && currentTrainingLoad.balance > 10) {
      return true;
    }

    // Intensity if no recent intensity work
    const recentIntensityWork = recentActivities
      .slice(0, 5)
      .filter(activity => {
        const load =
          (activity as Activity & { training_load_score?: number })
            .training_load_score || 0;
        return load > 60;
      });

    if (recentIntensityWork.length === 0) {
      return true;
    }

    return false;
  }

  /**
   * Create a recovery workout recommendation
   */
  private createRecoveryWorkout(): WorkoutRecommendation {
    const baseRecommendation: WorkoutRecommendation = {
      id: `recovery-${Date.now()}`,
      type: 'recovery',
      sport: 'Run',
      duration: 30,
      intensity: 3,
      reasoning:
        'Your training stress balance is low, indicating high fatigue. A light recovery session will help you bounce back.',
      alternatives: [
        {
          id: `recovery-yoga-${Date.now()}`,
          type: 'recovery',
          sport: 'Yoga',
          duration: 45,
          intensity: 2,
          reasoning: 'Gentle yoga can help with recovery and flexibility.',
          alternatives: [],
        },
        {
          id: `recovery-swim-${Date.now()}`,
          type: 'recovery',
          sport: 'Swim',
          duration: 20,
          intensity: 2,
          reasoning: 'Low-impact swimming is excellent for active recovery.',
          alternatives: [],
        },
      ],
    };

    return this.adjustForWeather(baseRecommendation);
  }

  /**
   * Create a long workout recommendation
   */
  private createLongWorkout(): WorkoutRecommendation {
    const baseRecommendation: WorkoutRecommendation = {
      id: `long-${Date.now()}`,
      type: 'long',
      sport: 'Run',
      duration: 90,
      intensity: 5,
      distance: 12,
      reasoning:
        'Your fitness level supports a longer session. This will help build endurance.',
      alternatives: [
        {
          id: `long-ride-${Date.now()}`,
          type: 'long',
          sport: 'Ride',
          duration: 120,
          intensity: 4,
          distance: 40,
          reasoning: 'A longer bike ride can build endurance with less impact.',
          alternatives: [],
        },
      ],
    };

    return this.adjustForWeather(baseRecommendation);
  }

  /**
   * Create an intensity workout recommendation
   */
  private createIntensityWorkout(): WorkoutRecommendation {
    const baseRecommendation: WorkoutRecommendation = {
      id: `tempo-${Date.now()}`,
      type: 'tempo',
      sport: 'Run',
      duration: 45,
      intensity: 7,
      distance: 8,
      reasoning:
        'Your fitness level supports intensity work. This tempo run will improve your lactate threshold.',
      alternatives: [
        {
          id: `threshold-${Date.now()}`,
          type: 'threshold',
          sport: 'Run',
          duration: 30,
          intensity: 8,
          distance: 5,
          reasoning: 'Threshold intervals will improve your aerobic capacity.',
          alternatives: [],
        },
        {
          id: `strength-${Date.now()}`,
          type: 'strength',
          sport: 'WeightTraining',
          duration: 60,
          intensity: 6,
          reasoning:
            'Strength training complements your running and prevents injury.',
          alternatives: [],
        },
      ],
    };

    return this.adjustForWeather(baseRecommendation);
  }

  /**
   * Create an easy workout recommendation
   */
  private createEasyWorkout(): WorkoutRecommendation {
    const baseRecommendation: WorkoutRecommendation = {
      id: `easy-${Date.now()}`,
      type: 'easy',
      sport: 'Run',
      duration: 30,
      intensity: 3,
      distance: 4,
      reasoning:
        'An easy session to promote recovery and maintain aerobic fitness.',
      alternatives: [
        {
          id: `easy-ride-${Date.now()}`,
          type: 'easy',
          sport: 'Ride',
          duration: 45,
          intensity: 3,
          distance: 15,
          reasoning: 'Easy cycling is great for active recovery.',
          alternatives: [],
        },
        {
          id: `easy-swim-${Date.now()}`,
          type: 'easy',
          sport: 'Swim',
          duration: 20,
          intensity: 2,
          reasoning: 'Swimming provides excellent low-impact recovery.',
          alternatives: [],
        },
      ],
    };

    return this.adjustForWeather(baseRecommendation);
  }

  /**
   * Create a moderate workout recommendation
   */
  private createModerateWorkout(): WorkoutRecommendation {
    const baseRecommendation: WorkoutRecommendation = {
      id: `moderate-${Date.now()}`,
      type: 'easy',
      sport: 'Run',
      duration: 45,
      intensity: 5,
      distance: 6,
      reasoning:
        'A moderate session to maintain fitness and build consistency.',
      alternatives: [
        {
          id: `moderate-ride-${Date.now()}`,
          type: 'easy',
          sport: 'Ride',
          duration: 60,
          intensity: 4,
          distance: 20,
          reasoning: 'Cycling provides good aerobic training with less impact.',
          alternatives: [],
        },
      ],
    };

    return this.adjustForWeather(baseRecommendation);
  }

  /**
   * Generate workout for a specific day with periodization
   */
  private generateWorkoutForDay(
    dayOffset: number
  ): WorkoutRecommendation | null {
    // Get the actual day of week for this offset (0 = today, 1 = tomorrow, etc.)
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const targetDay = (today + dayOffset) % 7;

    // Convert to Monday-based week for periodization logic
    const mondayBasedDay = targetDay === 0 ? 6 : targetDay - 1;

    // Weekly periodization pattern based on Monday-based week
    switch (mondayBasedDay) {
      case 0: // Monday - Start of week
        return this.createModerateWorkout();

      case 1: // Tuesday - Quality session
        if (this.shouldRecommendIntensityWork()) {
          return this.createIntensityWorkout();
        }
        return this.createModerateWorkout();

      case 2: // Wednesday - Recovery or easy
        if (this.shouldRecommendRecovery()) {
          return this.createRecoveryWorkout();
        }
        return this.createEasyWorkout();

      case 3: // Thursday - Quality session
        if (this.shouldRecommendIntensityWork()) {
          return this.createIntensityWorkout();
        }
        return this.createModerateWorkout();

      case 4: // Friday - Easy or recovery
        if (this.shouldRecommendRecovery()) {
          return this.createRecoveryWorkout();
        }
        return this.createEasyWorkout();

      case 5: // Saturday - Long workout
        if (this.shouldRecommendLongWorkout()) {
          return this.createLongWorkout();
        }
        return this.createModerateWorkout();

      case 6: // Sunday - Recovery or rest
        if (this.shouldRecommendRecovery()) {
          return this.createRecoveryWorkout();
        }
        return null; // Rest day

      default:
        return this.createModerateWorkout();
    }
  }

  /**
   * Adjust workout based on weather conditions
   */
  private adjustForWeather(
    recommendation: WorkoutRecommendation
  ): WorkoutRecommendation {
    const { weatherConditions } = this.context.userPreferences;

    if (!weatherConditions) {
      return recommendation;
    }

    const { temperature, precipitation, windSpeed } = weatherConditions;

    // Adjust for extreme weather
    if (temperature < 0 || temperature > 35) {
      return {
        ...recommendation,
        sport: 'Workout',
        reasoning: `${recommendation.reasoning} Adjusted for extreme weather conditions.`,
        weatherConsideration: `Temperature: ${temperature}°C - indoor workout recommended`,
      };
    }

    if (precipitation > 0.5) {
      return {
        ...recommendation,
        reasoning: `${recommendation.reasoning} Consider indoor alternatives due to rain.`,
        weatherConsideration: `Precipitation: ${precipitation}mm - wet conditions`,
      };
    }

    if (windSpeed > 20) {
      return {
        ...recommendation,
        reasoning: `${recommendation.reasoning} High winds may affect outdoor activities.`,
        weatherConsideration: `Wind: ${windSpeed} km/h - consider sheltered routes`,
      };
    }

    return recommendation;
  }

  /**
   * Get workout alternatives based on user preferences
   */
  getAlternatives(
    recommendation: WorkoutRecommendation
  ): WorkoutRecommendation[] {
    const { preferredSports } = this.context.userPreferences;

    // Filter alternatives based on user preferences
    return recommendation.alternatives.filter(alt =>
      preferredSports.includes(alt.sport)
    );
  }
}
