import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/strava/sync/route'
import { createClient } from '@/lib/supabase/server'
import { StravaActivitySync } from '@/lib/strava/sync-activities'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

// Mock StravaActivitySync
jest.mock('@/lib/strava/sync-activities', () => ({
  StravaActivitySync: jest.fn()
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
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock sync state
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSyncState,
              error: null
            })
          })
        })
      })

      // Mock successful sync
      const mockSyncService = {
        syncUserActivities: jest.fn().mockResolvedValue({
          success: true,
          activitiesProcessed: 15,
          newActivities: 10,
          updatedActivities: 5,
          syncDuration: 2500
        })
      }
      ;(StravaActivitySync as jest.Mock).mockImplementation(() => mockSyncService)

      const request = new NextRequest('http://localhost:3000/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxActivities: 200,
          sinceDays: 90,
          forceRefresh: false
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Sync completed successfully')
      expect(data.data).toEqual({
        activitiesProcessed: 15,
        newActivities: 10,
        updatedActivities: 5,
        syncDuration: 2500
      })
    })

    it('should handle unauthenticated user', async () => {
      // Mock authentication failure
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
      expect(data.error).toBe('Authentication required')
    })

    it('should handle rate limit exceeded', async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock rate limit exceeded
      const rateLimitedSyncState = {
        ...mockSyncState,
        sync_requests_today: 5 // At limit
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: rateLimitedSyncState,
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          forceRefresh: false
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toBe('RATE_LIMIT_EXCEEDED')
      expect(data.message).toContain('rate limit exceeded')
    })

    it('should allow force refresh even when rate limited', async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock rate limit exceeded
      const rateLimitedSyncState = {
        ...mockSyncState,
        sync_requests_today: 5
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: rateLimitedSyncState,
              error: null
            })
          })
        })
      })

      // Mock successful sync
      const mockSyncService = {
        syncUserActivities: jest.fn().mockResolvedValue({
          success: true,
          activitiesProcessed: 5,
          newActivities: 3,
          updatedActivities: 2,
          syncDuration: 1500
        })
      }
      ;(StravaActivitySync as jest.Mock).mockImplementation(() => mockSyncService)

      const request = new NextRequest('http://localhost:3000/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          forceRefresh: true
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle sync with errors', async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock sync state
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSyncState,
              error: null
            })
          })
        })
      })

      // Mock sync with errors
      const mockSyncService = {
        syncUserActivities: jest.fn().mockResolvedValue({
          success: false,
          activitiesProcessed: 10,
          newActivities: 5,
          updatedActivities: 3,
          syncDuration: 2000,
          errors: ['Some activities failed to sync']
        })
      }
      ;(StravaActivitySync as jest.Mock).mockImplementation(() => mockSyncService)

      const request = new NextRequest('http://localhost:3000/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Sync completed with errors')
      expect(data.errors).toEqual(['Some activities failed to sync'])
    })

    it('should handle invalid request body gracefully', async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock sync state
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSyncState,
              error: null
            })
          })
        })
      })

      // Mock successful sync with defaults
      const mockSyncService = {
        syncUserActivities: jest.fn().mockResolvedValue({
          success: true,
          activitiesProcessed: 5,
          newActivities: 3,
          updatedActivities: 2,
          syncDuration: 1000
        })
      }
      ;(StravaActivitySync as jest.Mock).mockImplementation(() => mockSyncService)

      const request = new NextRequest('http://localhost:3000/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle sync service errors', async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock sync state
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSyncState,
              error: null
            })
          })
        })
      })

      // Mock sync service error
      const mockSyncService = {
        syncUserActivities: jest.fn().mockRejectedValue(new Error('Strava API error'))
      }
      ;(StravaActivitySync as jest.Mock).mockImplementation(() => mockSyncService)

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
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error during sync')
    })
  })

  describe('GET /api/strava/sync', () => {
    it('should return sync status successfully', async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock sync state
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSyncState,
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.syncState).toEqual(mockSyncState)
      expect(data.activityCount).toBeDefined()
      expect(data.canSync).toBeDefined()
    })

    it('should handle unauthenticated user', async () => {
      // Mock authentication failure
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle new user with no sync state', async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock no sync state (new user)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // Not found
            })
          })
        })
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.syncState).toBeNull()
      expect(data.canSync).toBe(true) // New users can sync
    })

    it('should reset daily counter for new day', async () => {
      // Mock successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock sync state with old date
      const oldSyncState = {
        ...mockSyncState,
        last_sync_date: '2023-01-01',
        sync_requests_today: 5
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: oldSyncState,
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.syncState.sync_requests_today).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      // Mock successful authentication
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