export const createClient = jest.fn()

export interface User {
  id: string
  email?: string
  created_at?: string
  app_metadata?: any
}

export interface AuthResponse {
  data: {
    user: User | null
  }
  error: any
}

export interface Session {
  user: User
  access_token: string
}

export { createClient as default } 