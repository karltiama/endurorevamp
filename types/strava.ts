export interface StravaAuthResponse {
  token_type: string
  expires_at: number
  expires_in: number
  refresh_token: string
  access_token: string
  athlete: {
    id: number
    firstname: string
    lastname: string
    profile: string
    // Add other athlete fields as needed
  }
}

export interface StravaActivity {
  id: number
  name: string
  distance: number // meters
  moving_time: number // seconds
  elapsed_time: number // seconds
  total_elevation_gain: number // meters
  type: string // 'Ride', 'Run', 'Swim', etc.
  sport_type: string
  start_date: string // ISO date
  start_date_local: string // ISO date
  timezone: string
  average_speed: number // m/s
  max_speed: number // m/s
  average_heartrate?: number
  max_heartrate?: number
  average_watts?: number
  max_watts?: number
  kilojoules?: number
  achievement_count: number
  kudos_count: number
  comment_count: number
  athlete_count: number
  photo_count: number
  trainer: boolean
  commute: boolean
  manual: boolean
  private: boolean
  gear_id?: string
  workout_type?: number
  athlete: {
    id: number
    resource_state: number
  }
  map?: {
    id: string
    summary_polyline?: string
    resource_state: number
  }
}

export interface ActivityFilters {
  page?: number
  per_page?: number
  before?: number // timestamp
  after?: number // timestamp
} 