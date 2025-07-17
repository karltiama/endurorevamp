import { NextRequest } from 'next/server'
import { GET } from '@/app/api/strava/athlete/route'

// Mock fetch globally
global.fetch = jest.fn()

describe('Strava Athlete API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/strava/athlete', () => {
    it('should return athlete data successfully', async () => {
      // Mock successful Strava API response
      const mockAthleteData = {
        id: 12345,
        username: 'test_athlete',
        firstname: 'Test',
        lastname: 'Athlete',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        sex: 'M',
        premium: true,
        summit: false,
        created_at: 202310,
        updated_at: 2023100,
        badge_type_id: 1,
        weight: 70.5,
        profile_medium: 'https://example.com/medium.jpg',
        profile: 'https://example.com/profile.jpg',
        friend: null,
        follower: null
      }

      // Create a proper Response mock
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockAthleteData)
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      // Create a mock request with authorization header
      const mockRequest = new Request(
        'http://localhost:3000/api/strava/athlete',
        {
          headers: { Authorization: 'Bearer test-token' }
        }
      )

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockAthleteData)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.strava.com/api/v3/athlete',
        { headers: { Authorization: 'Bearer test-token' } }
      )
    })

    it('should handle missing authorization header', async () => {
      const mockRequest = new Request('http://localhost:3000/api/strava/athlete')

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('No authorization token')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should handle Strava API errors', async () => {
      // Mock Strava API error response
      const mockErrorResponse = {
        ok: false,
        status: 41,
        statusText: 'Unauthorized'
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockErrorResponse)

      const mockRequest = new Request(
        'http://localhost:3000/api/strava/athlete',
        {
          headers: { Authorization: 'Bearer invalid-token' }
        }
      )

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch athlete data')
    })

    it('should handle network errors', async () => {
      // Mock network error
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const mockRequest = new Request(
        'http://localhost:3000/api/strava/athlete',
        {
          headers: { Authorization: 'Bearer test-token' }
        }
      )

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch athlete data')
    })

    it('should handle malformed JSON response', async () => {
      // Mock response with malformed JSON
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const mockRequest = new Request(
        'http://localhost:3000/api/strava/athlete',
        {
          headers: { Authorization: 'Bearer test-token' }
        }
      )

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch athlete data')
    })
  })
}) 