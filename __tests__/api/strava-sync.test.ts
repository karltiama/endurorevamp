import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/strava/sync/route'
import { createClient } from '@/lib/supabase/server'
import { syncStravaActivities, updateActivitiesWithTSS } from '@/lib/strava/sync-activities'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

// Mock sync functions
jest.mock('@/lib/strava/sync-activities', () => ({
  syncStravaActivities: jest.fn(),
  updateActivitiesWithTSS: jest.fn()
}))

const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn()
}

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
}

const mockSyncState = {
  user_id: 'test-user-id',
  sync_enabled: true,
  sync_requests_today: 2,
  last_sync_date: new Date().toDateString(),
  last_activity_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
}

describe('Strava Sync API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('POST /api/strava/sync', () => {
    it('should sync activities successfully', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock sync state (can sync)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                user_id: mockUser.id,
                sync_enabled: true,
                sync_requests_today: 2,
                last_sync_date: new Date().toDateString(),
                last_activity_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
              },
              error: null
            })
          })
        })
      })

      // Mock successful sync result
      ;(syncStravaActivities as jest.Mock).mockResolvedValue({
        success: true,
        activitiesSynced: 10,
        newActivities: 5,
        updatedActivities: 3,
        errors: []
      })

      const request = new NextRequest('http://localhost:3000/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxActivities: 50,
          sinceDays: 7,
          forceRefresh: false
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.activitiesSynced).toBe(10)
      expect(data.newActivities).toBe(5)
      expect(data.updatedActivities).toBe(3)
    })

    it('should handle unauthenticated user', async () => {
      // Mock failed authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      })

      const request = new NextRequest('http://localhost:3000/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })





    it('should handle sync with errors', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock sync state (can sync)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                user_id: mockUser.id,
                sync_enabled: true,
                sync_requests_today: 1,
                last_sync_date: new Date().toDateString(),
                last_activity_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
              },
              error: null
            })
          })
        })
      })

      // Mock sync result with errors
      ;(syncStravaActivities as jest.Mock).mockResolvedValue({
        success: false,
        activitiesSynced: 8,
        newActivities: 3,
        updatedActivities: 2,
        errors: ['Network timeout', 'Invalid activity data']
      })

      const request = new NextRequest('http://localhost:3000/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Network timeout')
      expect(data.errors).toContain('Invalid activity data')
    })

    it('should handle missing request body', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock sync state (can sync)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                user_id: mockUser.id,
                sync_enabled: true,
                sync_requests_today: 1,
                last_sync_date: new Date().toDateString(),
                last_activity_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
              },
              error: null
            })
          })
        })
      })

      // Mock successful sync result
      ;(syncStravaActivities as jest.Mock).mockResolvedValue({
        success: true,
        activitiesSynced: 5,
        newActivities: 2,
        updatedActivities: 1,
        errors: []
      })

      const request = new NextRequest('http://localhost:3000/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
        // No body
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle update-tss action', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock update TSS result
      ;(updateActivitiesWithTSS as jest.Mock).mockResolvedValue({
        updated: 10,
        errors: 2
      })

      const request = new NextRequest('http://localhost:3000/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update-tss'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.action).toBe('update-tss')
      expect(data.updated).toBe(10)
      expect(data.errors).toBe(2)
    })

    it('should handle sync service errors', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock sync state (can sync)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                user_id: mockUser.id,
                sync_enabled: true,
                sync_requests_today: 1,
                last_sync_date: new Date().toDateString(),
                last_activity_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
              },
              error: null
            })
          })
        })
      })

      // Mock sync service throwing error
      ;(syncStravaActivities as jest.Mock).mockRejectedValue(new Error('Strava API error'))

      const request = new NextRequest('http://localhost:3000/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('GET /api/strava/sync', () => {
    it('should return sync status successfully', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock sync state (first call to supabase.from)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                user_id: mockUser.id,
                sync_enabled: true,
                sync_requests_today: 2,
                last_sync_date: new Date().toDateString(),
                last_activity_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
              },
              error: null
            })
          })
        })
      })

      // Mock activities count (second call to supabase.from)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: 25,
            error: null
          })
        })
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.syncState).toBeDefined()
      expect(data.syncState.user_id).toBe(mockUser.id)
      expect(data.activityCount).toBe(25)
      expect(data.canSync).toBe(true)
    })

    it('should handle unauthenticated user for GET', async () => {
      // Mock failed authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle no sync state (first time user)', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock no sync state (PGRST116 error)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          }),
          count: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 0,
              error: null
            })
          })
        })
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.syncState).toBe(null)
      expect(data.activityCount).toBe(0)
      expect(data.canSync).toBe(true) // First time sync allowed
    })

    it('should handle database errors', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        })
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
}) 