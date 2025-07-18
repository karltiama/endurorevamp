import { createClient } from '@/lib/supabase/server'

// Types for test helpers
export interface MockUser {
  id: string
  email?: string
  created_at?: string
}

export interface MockStravaTokens {
  strava_athlete_id: number
  athlete_firstname: string
  athlete_lastname: string
  access_token?: string
  refresh_token?: string
  expires_at?: string
}

export interface MockStravaAuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_at: number
  expires_in: number
  athlete: {
    id: number
    firstname: string
    lastname: string
    profile?: string
  }
}

// Mock Supabase client builder
export class MockSupabaseClient {
  private auth: any
  private from: any

  constructor() {
    this.auth = {
      getUser: jest.fn()
    }
    this.from = jest.fn()
  }

  withAuthenticatedUser(user: MockUser = { id: 'test-user-id' }) {
    this.auth.getUser.mockResolvedValue({
      data: { user },
      error: null
    })
    return this
  }

  withUnauthenticatedUser() {
    this.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })
    return this
  }

  withAuthError(error: any) {
    this.auth.getUser.mockResolvedValue({
      data: { user: null },
      error
    })
    return this
  }

  withStravaTokens(tokens: MockStravaTokens | null) {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: tokens,
            error: tokens ? null : { message: 'No rows returned' }
          })
        })
      }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })
    this.from = mockFrom
    return this
  }

  withDatabaseError(error: any) {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error
          })
        })
      }),
      upsert: jest.fn().mockResolvedValue({ error }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error })
      })
    })
    this.from = mockFrom
    return this
  }

  withUpsertError(error: any) {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { refresh_token: 'test-token' },
            error: null
          })
        })
      }),
      upsert: jest.fn().mockResolvedValue({ error }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })
    this.from = mockFrom
    return this
  }

  build() {
    return {
      auth: this.auth,
      from: this.from
    }
  }
}

// Strava API mock helpers
export class MockStravaAPI {
  static successAuthResponse(data: Partial<MockStravaAuthResponse> = {}): MockStravaAuthResponse {
    return {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      token_type: 'Bearer',
      expires_at: 1234567890,
      expires_in: 21600,
      athlete: {
        id: 12345,
        firstname: 'John',
        lastname: 'Doe',
        profile: 'https://example.com/profile.jpg'
      },
      ...data
    }
  }

  static errorResponse(status: number = 400, message: string = 'API Error') {
    return {
      ok: false,
      status,
      text: jest.fn().mockResolvedValue(message)
    }
  }

  static successResponse(data: MockStravaAuthResponse) {
    return {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(data)
    }
  }
}

// Request builder helpers
export class RequestBuilder {
  static authTokenGet() {
    return new Request('http://localhost:3000/api/auth/strava/token', {
      method: 'GET'
    })
  }

  static authTokenPut() {
    return new Request('http://localhost:3000/api/auth/strava/token', {
      method: 'PUT'
    })
  }

  static authTokenPost(code: string) {
    return new Request('http://localhost:3000/api/auth/strava/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code })
    })
  }

  static authTokenPostEmpty() {
    return new Request('http://localhost:3000/api/auth/strava/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: ''
    })
  }

  static authTokenPostInvalidJson() {
    return new Request('http://localhost:3000/api/auth/strava/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json'
    })
  }

  static authTokenPostNoCode() {
    return new Request('http://localhost:3000/api/auth/strava/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    })
  }
}

// Test data factories
export const TestData = {
  users: {
    authenticated: { id: 'test-user-id', email: 'test@example.com' },
    unauthenticated: null
  },
  
  stravaTokens: {
    valid: {
      strava_athlete_id: 12345,
      athlete_firstname: 'John',
      athlete_lastname: 'Doe',
      access_token: 'valid-access-token',
      refresh_token: 'valid-refresh-token',
      expires_at: '2024-01-01T00:00:00.000Z'
    },
    invalid: {
      strava_athlete_id: 12345,
      athlete_firstname: 'John',
      athlete_lastname: 'Doe',
      access_token: 'expired-access-token',
      refresh_token: 'invalid-refresh-token',
      expires_at: '2023-01-01T00:00:00.000Z'
    }
  },

  stravaAuth: {
    success: MockStravaAPI.successAuthResponse(),
    expired: MockStravaAPI.successAuthResponse({
      access_token: 'expired-token',
      refresh_token: 'expired-refresh-token'
    })
  },

  errors: {
    database: { message: 'Database connection failed' },
    auth: { message: 'Authentication failed' },
    strava: { message: 'Strava API error' },
    network: new Error('Network error')
  }
}

// Common test scenarios
export const TestScenarios = {
  authenticatedUserWithTokens: () => {
    return new MockSupabaseClient()
      .withAuthenticatedUser()
      .withStravaTokens(TestData.stravaTokens.valid)
      .build()
  },

  authenticatedUserWithoutTokens: () => {
    return new MockSupabaseClient()
      .withAuthenticatedUser()
      .withStravaTokens(null)
      .build()
  },

  unauthenticatedUser: () => {
    return new MockSupabaseClient()
      .withUnauthenticatedUser()
      .build()
  },

  databaseError: () => {
    return new MockSupabaseClient()
      .withAuthenticatedUser()
      .withDatabaseError(TestData.errors.database)
      .build()
  },

  stravaTokenRefreshSuccess: () => {
    return new MockSupabaseClient()
      .withAuthenticatedUser()
      .withStravaTokens(TestData.stravaTokens.valid)
      .build()
  },

  stravaTokenRefreshFailure: () => {
    return new MockSupabaseClient()
      .withAuthenticatedUser()
      .withStravaTokens(TestData.stravaTokens.invalid)
      .build()
  }
}

// Utility functions for common assertions
export const Assertions = {
  expectSuccessResponse: (response: Response, expectedData: any) => {
    expect(response.status).toBe(200)
    expect(response.json()).resolves.toEqual(expectedData)
  },

  expectErrorResponse: (response: Response, status: number, expectedError: any) => {
    expect(response.status).toBe(status)
    expect(response.json()).resolves.toEqual(expectedError)
  },

  expectUnauthenticatedError: (response: Response) => {
    Assertions.expectErrorResponse(response, 401, {
      success: false,
      error: 'No authenticated user found'
    })
  },

  expectDatabaseError: (response: Response) => {
    Assertions.expectErrorResponse(response, 500, {
      success: false,
      error: 'Database connection failed'
    })
  }
}

// Setup and teardown helpers
export const TestHelpers = {
  setupMocks: () => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  },

  mockStravaAPI: (response: any) => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(response)
  },

  mockSupabaseClient: (client: any) => {
    const mockCreateClient = require('@/lib/supabase/server').createClient
    ;(mockCreateClient as jest.Mock).mockResolvedValue(client)
  }
} 