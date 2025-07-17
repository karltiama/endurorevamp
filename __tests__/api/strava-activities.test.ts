import { NextRequest } from 'next/server'
import { GET } from '@/app/api/strava/activities/route'

// Mock fetch globally
global.fetch = jest.fn()

describe('Strava Activities API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/strava/activities', () => {
    it('should return activities data successfully', async () => {
      // Mock successful Strava API response
      const mockActivitiesData = [
        {
          id: 123456789,
          name: 'Morning Run',
          distance: 5000,
          moving_time: 1800,
          elapsed_time: 1900,
          total_elevation_gain: 50,
          type: 'Run',
          start_date: '2024-01-06T06:00:00Z',
          start_date_local: '2024-01-06T06:00Z',
          timezone: 'America/New_York',
          average_speed: 20.78,
          max_speed: 3.5,
          average_cadence: 170,
          average_heartrate: 150,
          max_heartrate: 180,
          elev_high: 10,
          elev_low: 50,
          upload_id: null,
          external_id: null,
          trainer: false,
          commute: false,
          manual: false,
          private: false,
          flagged: false,
          workout_type: null,
          average_watts: null,
          kilojoules: null,
          device_watts: false,
          has_kudoed: false,
          suffer_score: null,
          calories: 40,
          has_heartrate: true,
          elev_unit: 'm',
          total_photo_count: 0,
          map: {
            id: 'a123456789',
            summary_polyline: 'encoded_polyline_string',
            polyline: 'encoded_polyline_string',
            resource_state: 3
          },
          photos: {
            primary: null,
            count: 0
          },
          gear_id: null,
          from_accepted_tag: false,
          segment_efforts: [],
          splits_metric: [],
          splits_standard: [],
          best_efforts: []
        },
        {
          id: 123456790,
          name: 'Evening Ride',
          distance: 25000,
          moving_time: 3600,
          elapsed_time: 3800,
          total_elevation_gain: 20,
          type: 'Ride',
          sport_type: 'Ride',
          start_date: '2024-01-17T17:00:00Z',
          start_date_local: '2024-01-17T17:00Z',
          timezone: 'America/New_York',
          average_speed: 6.94,
          max_speed: 1200.5,
          average_heartrate: 140,
          max_heartrate: 165,
          average_cadence: 85,
          kilojoules: 80,
          device_watts: true,
          has_heartrate: true,
          workout_type: 1,
          average_watts: 20,
          weighted_average_watts: 210,
          max_watts: 350,
          suffer_score: 78
        }
      ]

      // Create a proper Response mock
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockActivitiesData)
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      // Create a mock request with authorization header
      const mockRequest = new Request(
        'http://localhost:3000/api/strava/activities',
        {
          headers: { Authorization: 'Bearer test-token' }
        }
      )

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockActivitiesData)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.strava.com/api/v3/athlete/activities?page=1&per_page=10',
        { headers: { Authorization: 'Bearer test-token' } }
      )
    })

    it('should handle missing authorization header', async () => {
      const mockRequest = new Request(
        'http://localhost:3000/api/strava/activities'
      )

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('No authorization token')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should handle pagination parameters', async () => {
      const mockActivitiesData = [{ id: 1, name: 'Test Activity' }]
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockActivitiesData)
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const mockRequest = new Request(
        'http://localhost:3000/api/strava/activities?page=2&per_page=20',
        {
          headers: { Authorization: 'Bearer test-token' }
        }
      )

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockActivitiesData)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.strava.com/api/v3/athlete/activities?page=2&per_page=20',
        { headers: { Authorization: 'Bearer test-token' } }
      )
    })

    it('should handle date filtering parameters', async () => {
      const mockActivitiesData = [{ id: 1, name: 'Filtered Activity' }]
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockActivitiesData)
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const mockRequest = new Request(
        'http://localhost:3000/api/strava/activities?after=1642204800&before=1642291200',
        {
          headers: { Authorization: 'Bearer test-token' }
        }
      )

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockActivitiesData)
      // Check that the URL contains all expected parameters, regardless of order
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const calledUrl = fetchCall[0];
      expect(calledUrl).toContain('https://www.strava.com/api/v3/athlete/activities');
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('per_page=10');
      expect(calledUrl).toContain('after=1642204800');
      expect(calledUrl).toContain('before=1642291200');
      expect(fetchCall[1]).toEqual({ headers: { Authorization: 'Bearer test-token' } });
    })

    it('should handle Strava API errors', async () => {
      // Mock Strava API error response
      const mockErrorResponse = {
        ok: false,
        status: 41,
        statusText: 'Unauthorized',
        text: jest.fn().mockResolvedValue('Invalid token')
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockErrorResponse)

      const mockRequest = new Request(
        'http://localhost:3000/api/strava/activities',
        {
          headers: { Authorization: 'Bearer invalid-token' }
        }
      )

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch activities data')
      expect(data.details).toContain('Strava API error: 41')
    })

    it('should handle network errors', async () => {
      // Mock network error
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const mockRequest = new Request(
        'http://localhost:3000/api/strava/activities',
        {
          headers: { Authorization: 'Bearer test-token' }
        }
      )

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch activities data')
      expect(data.details).toBe('Network error')
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
        'http://localhost:3000/api/strava/activities',
        {
          headers: { Authorization: 'Bearer test-token' }
        }
      )

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch activities data')
      expect(data.details).toBe('Invalid JSON')
    })

    it('should handle empty activities list', async () => {
      const mockActivitiesData: any[] = []
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockActivitiesData)
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const mockRequest = new Request(
        'http://localhost:3000/api/strava/activities',
        {
          headers: { Authorization: 'Bearer test-token' }
        }
      )

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.strava.com/api/v3/athlete/activities?page=1&per_page=10',
        { headers: { Authorization: 'Bearer test-token' } }
      )
    })

    it('should handle complex query parameters', async () => {
      const mockActivitiesData = [{ id: 1, name: 'Complex Query Activity' }]
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockActivitiesData)
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const mockRequest = new Request(
        'http://localhost:3000/api/strava/activities?page=3&per_page=50&after=1642204800&before=1642291200',
        {
          headers: { Authorization: 'Bearer test-token' }
        }
      )

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockActivitiesData)
      // Check that the URL contains all expected parameters, regardless of order
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const calledUrl = fetchCall[0];
      expect(calledUrl).toContain('https://www.strava.com/api/v3/athlete/activities');
      expect(calledUrl).toContain('page=3');
      expect(calledUrl).toContain('per_page=50');
      expect(calledUrl).toContain('after=1642204800');
      expect(calledUrl).toContain('before=1642291200');
      expect(fetchCall[1]).toEqual({ headers: { Authorization: 'Bearer test-token' } });
    })

    it('should handle Strava API rate limiting', async () => {
      // Mock rate limit error
      const mockErrorResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: jest.fn().mockResolvedValue('Rate limit exceeded')
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockErrorResponse)

      const mockRequest = new Request(
        'http://localhost:3000/api/strava/activities',
        {
          headers: { Authorization: 'Bearer test-token' }
        }
      )

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch activities data')
      expect(data.details).toContain('Strava API error: 429')
    })
  })
}) 