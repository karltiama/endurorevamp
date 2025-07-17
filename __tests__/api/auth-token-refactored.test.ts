import { NextRequest } from 'next/server'
import { GET, PUT, POST } from '@/app/api/auth/strava/token/route'
import {
  MockSupabaseClient,
  MockStravaAPI,
  RequestBuilder,
  TestData,
  TestScenarios,
  Assertions,
  TestHelpers
} from '../utils/auth-test-helpers'

// Mock fetch globally
global.fetch = jest.fn()

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    set: jest.fn(),
    getAll: jest.fn().mockReturnValue([])
  })
}))

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

import { createClient } from '@/lib/supabase/server'

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Auth Token API (Refactored with Helpers)', () => {
  beforeEach(() => {
    TestHelpers.setupMocks()
  })

  describe('GET /api/auth/strava/token', () => {
    it('should return authentication status for authenticated user with tokens', async () => {
      // Arrange
      const mockClient = TestScenarios.authenticatedUserWithTokens()
      TestHelpers.mockSupabaseClient(mockClient)

      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        authenticated: true,
        user_id: 'test-user-id',
        has_strava_tokens: true,
        athlete: {
          id: 12345,
          name: 'John Doe'
        }
      })
    })

    it('should return authentication status for authenticated user without tokens', async () => {
      // Arrange
      const mockClient = TestScenarios.authenticatedUserWithoutTokens()
      TestHelpers.mockSupabaseClient(mockClient)

      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        authenticated: true,
        user_id: 'test-user-id',
        has_strava_tokens: false,
        athlete: null
      })
    })

    it('should handle unauthenticated user', async () => {
      // Arrange
      const mockClient = TestScenarios.unauthenticatedUser()
      TestHelpers.mockSupabaseClient(mockClient)

      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: false,
        authenticated: false,
        message: 'No authenticated user found'
      })
    })

    it('should handle unexpected errors', async () => {
      // Arrange
      mockCreateClient.mockRejectedValue(TestData.errors.network)

      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: false,
        authenticated: false,
        error: 'Network error'
      })
    })
  })

  describe('PUT /api/auth/strava/token', () => {
    it('should successfully refresh tokens', async () => {
      // Arrange
      const mockClient = TestScenarios.stravaTokenRefreshSuccess()
      TestHelpers.mockSupabaseClient(mockClient)
      
      const mockAuthData = MockStravaAPI.successAuthResponse()
      TestHelpers.mockStravaAPI(MockStravaAPI.successResponse(mockAuthData))

      // Act
      const request = RequestBuilder.authTokenPut()
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        athlete: mockAuthData.athlete
      })
    })

    it('should handle unauthenticated user', async () => {
      // Arrange
      const mockClient = TestScenarios.unauthenticatedUser()
      TestHelpers.mockSupabaseClient(mockClient)

      // Act
      const request = RequestBuilder.authTokenPut()
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      Assertions.expectUnauthenticatedError(response)
    })

    it('should handle missing tokens', async () => {
      // Arrange
      const mockClient = new MockSupabaseClient()
        .withAuthenticatedUser()
        .withStravaTokens(null)
        .build()
      TestHelpers.mockSupabaseClient(mockClient)

      // Act
      const request = RequestBuilder.authTokenPut()
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data).toEqual({
        success: false,
        error: 'No Strava tokens found. Please reconnect your account.'
      })
    })

    it('should handle Strava API refresh failure', async () => {
      // Arrange
      const mockClient = TestScenarios.stravaTokenRefreshFailure()
      TestHelpers.mockSupabaseClient(mockClient)
      
      TestHelpers.mockStravaAPI(MockStravaAPI.errorResponse(400, 'Invalid refresh token'))

      // Act
      const request = RequestBuilder.authTokenPut()
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Token refresh failed. Please reconnect your Strava account.'
      })
    })

    it('should handle database storage error', async () => {
      // Arrange
      const mockClient = new MockSupabaseClient()
        .withAuthenticatedUser()
        .withStravaTokens(TestData.stravaTokens.valid)
        .withUpsertError(TestData.errors.database)
        .build()
      TestHelpers.mockSupabaseClient(mockClient)
      
      const mockAuthData = MockStravaAPI.successAuthResponse()
      TestHelpers.mockStravaAPI(MockStravaAPI.successResponse(mockAuthData))

      // Act
      const request = RequestBuilder.authTokenPut()
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to store refreshed tokens'
      })
    })
  })

  describe('POST /api/auth/strava/token', () => {
    it('should successfully exchange authorization code for tokens', async () => {
      // Arrange
      const mockClient = new MockSupabaseClient()
        .withAuthenticatedUser()
        .build()
      TestHelpers.mockSupabaseClient(mockClient)
      
      const mockAuthData = MockStravaAPI.successAuthResponse()
      TestHelpers.mockStravaAPI(MockStravaAPI.successResponse(mockAuthData))

      // Act
      const request = RequestBuilder.authTokenPost('test-authorization-code')
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        athlete: mockAuthData.athlete
      })
    })

    it('should handle missing authorization code', async () => {
      // Act
      const request = RequestBuilder.authTokenPostNoCode()
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Authorization code is required'
      })
    })

    it('should handle empty request body', async () => {
      // Act
      const request = RequestBuilder.authTokenPostEmpty()
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Invalid request body format'
      })
    })

    it('should handle invalid JSON in request body', async () => {
      // Act
      const request = RequestBuilder.authTokenPostInvalidJson()
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Invalid request body format'
      })
    })

    it('should handle unauthenticated user', async () => {
      // Arrange
      const mockClient = TestScenarios.unauthenticatedUser()
      TestHelpers.mockSupabaseClient(mockClient)

      // Act
      const request = RequestBuilder.authTokenPost('test-code')
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'No authenticated user found'
      })
    })

    it('should handle Strava API errors', async () => {
      // Arrange
      const mockClient = new MockSupabaseClient()
        .withAuthenticatedUser()
        .build()
      TestHelpers.mockSupabaseClient(mockClient)
      
      TestHelpers.mockStravaAPI(MockStravaAPI.errorResponse(400, 'Invalid authorization code'))

      // Act
      const request = RequestBuilder.authTokenPost('invalid-code')
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Strava API error: 400 - Invalid authorization code'
      })
    })

    it('should handle database storage error', async () => {
      // Arrange
      const mockClient = new MockSupabaseClient()
        .withAuthenticatedUser()
        .withUpsertError(TestData.errors.database)
        .build()
      TestHelpers.mockSupabaseClient(mockClient)
      
      const mockAuthData = MockStravaAPI.successAuthResponse()
      TestHelpers.mockStravaAPI(MockStravaAPI.successResponse(mockAuthData))

      // Act
      const request = RequestBuilder.authTokenPost('test-code')
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to store Strava tokens in database'
      })
    })

    it('should handle unexpected errors', async () => {
      // Arrange
      mockCreateClient.mockRejectedValue(TestData.errors.network)

      // Act
      const request = RequestBuilder.authTokenPost('test-code')
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Network error'
      })
    })
  })
}) 