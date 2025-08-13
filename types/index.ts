// Central type exports for the application

// Auth
export * from './auth';

// Goals
export * from './goals';

// Strava (re-export from lib)
export * from '../lib/strava/types';
import { Activity } from '../lib/strava/types';

// Strava Activity Types
export interface StravaActivity {
  id: string;
  name: string;
  sport_type: string;
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed?: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  kilojoules?: number;
  device_watts?: boolean;
  has_kudoed?: boolean;
  kudos_count?: number;
  comment_count?: number;
  athlete_count?: number;
  photo_count?: number;
  suffer_score?: number;
  // Custom calculated fields
  training_stress_score?: number;
  perceived_exertion?: number;
  recovery_time?: number;
  training_load_score?: number;
}

export interface TrainingState {
  weeklyTSS: number;
  averageRPE: number;
  daysSinceLastWorkout: number;
  workoutCount: number;
  isRestNeeded: boolean;
  isActiveRecovery: boolean;
  isReadyForIntensity: boolean;
}

export interface RecoveryFactors {
  daysSinceLastWorkout: number;
  lastRPE?: number;
  tssBalance: number;
  lastActivity: StravaActivity;
}

export interface ReadinessFactors {
  recoveryScore: number;
  daysSinceLastWorkout: number;
  tssBalance: number;
  lastRPE?: number;
}

// Extended Activity interface with computed training fields
export interface ActivityWithTrainingData extends Activity {
  training_stress_score?: number;
  perceived_exertion?: number;
  recovery_time?: number;
  training_load_score?: number;
}
