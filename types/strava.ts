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