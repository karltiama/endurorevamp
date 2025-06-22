// Strava API response types
export interface StravaAuthResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
    profile: string;
    // Add other athlete fields as needed
  };
}

export interface StravaAthlete {
  id: number;
  username?: string;
  firstname?: string;
  lastname?: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: 'M' | 'F';
  premium?: boolean;
  ftp?: number;
  weight?: number;
  profile_medium?: string;
  profile?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  sport_type: string;
  type?: string; // deprecated but still returned
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  start_date: string; // ISO date
  start_date_local: string; // ISO date
  timezone: string;
  
  // Performance metrics
  average_speed?: number; // m/s
  max_speed?: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  max_watts?: number;
  average_cadence?: number;
  kilojoules?: number;
  
  // Location
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  
  // Characteristics
  trainer?: boolean;
  commute?: boolean;
  manual?: boolean;
  private?: boolean;
  device_name?: string;
  device_watts?: boolean;
  has_heartrate?: boolean;
  
  // Social
  kudos_count?: number;
  comment_count?: number;
  athlete_count?: number;
  photo_count?: number;
  achievement_count?: number;
  pr_count?: number;
  
  // Additional fields from API
  calories?: number;
  description?: string;
  gear_id?: string;
  workout_type?: number;
  athlete?: {
    id: number;
    resource_state: number;
  };
  map?: {
    id: string;
    summary_polyline?: string;
    resource_state: number;
  };
}

// API request types
export interface ActivityFilters {
  page?: number;
  per_page?: number;
  before?: number; // timestamp
  after?: number; // timestamp
}

// Database types
export interface AthleteProfile {
  id?: string;
  user_id: string;
  strava_athlete_id: number;
  firstname?: string;
  lastname?: string;
  username?: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: 'M' | 'F';
  premium?: boolean;
  ftp?: number;
  weight?: number;
  profile_medium?: string;
  profile_large?: string;
  strava_created_at?: string;
  strava_updated_at?: string;
  last_synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Activity {
  id?: string;
  user_id: string;
  strava_activity_id: number;
  name: string;
  sport_type: string;
  activity_type?: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  timezone: string;
  
  // Performance metrics
  average_speed?: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  max_watts?: number;
  average_cadence?: number;
  kilojoules?: number;
  
  // Location as string for PostGIS POINT
  start_latlng?: string;
  end_latlng?: string;
  
  // Characteristics
  trainer?: boolean;
  commute?: boolean;
  manual?: boolean;
  private?: boolean;
  device_name?: string;
  device_watts?: boolean;
  has_heartrate?: boolean;
  
  // Social
  kudos_count?: number;
  comment_count?: number;
  athlete_count?: number;
  photo_count?: number;
  achievement_count?: number;
  pr_count?: number;
  
  // Additional
  calories?: number;
  description?: string;
  gear_id?: string;
  
  last_synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SyncState {
  user_id: string;
  last_activity_sync?: string;
  last_activity_id?: number;
  activities_synced_count?: number;
  last_profile_sync?: string;
  last_sync_error?: any;
  consecutive_errors?: number;
  requests_used_today?: number;
  rate_limit_reset_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SyncOptions {
  forceRefresh?: boolean;
  maxActivities?: number;
  sinceDays?: number;
}

export interface SyncResult {
  success: boolean;
  activitiesProcessed: number;
  profileUpdated: boolean;
  errors: string[];
  rateLimitInfo?: {
    remaining: number;
    resetTime: string;
  };
} 