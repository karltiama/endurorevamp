import { NextRequest } from 'next/server'
import { GET, PUT, POST } from '@/app/api/debug/sync-state/route'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

const mockCreateClient = require('@/lib/supabase/server').createClient

describe('Debug Sync State API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock environment
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true
    })
  })

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: undefined,
      writable: true
    })
  })

  describe('GET /api/debug/sync-state', () => {
    it('should return sync state for authenticated user', async () => {
      const mockUser = { id: 'user-123' }
      const mockSyncState = {
        user_id: 'user-123',
        sync_requests_today: 5,
        consecutive_errors: 0,
        sync_enabled: true,
        last_activity_sync: '2024-01-01T10:00:00Z'
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSyncState,
                error: null
              })
            })
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.syncState).toEqual(mockSyncState)
    })

    it('should return 401 for unauthenticated user', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null
          })
        }
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 403 in production', async () => {
      process.env.NODE_ENV = 'production'

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Debug endpoints not available in production')
    })

    it('should handle database errors gracefully', async () => {
      const mockUser = { id: 'user-123' }
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' }
              })
            })
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.error).toBeDefined()
    })
  })

  describe('PUT /api/debug/sync-state', () => {
    it('should return success message in development', async () => {
      const request = new NextRequest('http://localhost:3000/api/debug/sync-state', {
        method: 'PUT'
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('API endpoint is working')
      expect(data.timestamp).toBeDefined()
    })

    it('should return 403 in production', async () => {
      process.env.NODE_ENV = 'production'

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state', {
        method: 'PUT'
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Debug endpoints not available in production')
    })
  })

  describe('POST /api/debug/sync-state', () => {
    it('should add sync request', async () => {
      const mockUser = { id: 'user-123' }
      const mockSyncState = {
        user_id: 'user-123',
        sync_requests_today: 3,
        consecutive_errors: 0,
        sync_enabled: true
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSyncState,
                error: null
              })
            })
          }),
          upsert: jest.fn().mockResolvedValue({
            data: { ...mockSyncState, sync_requests_today: 4 },
            error: null
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_sync' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should remove sync request', async () => {
      const mockUser = { id: 'user-123' }
      const mockSyncState = {
        user_id: 'user-123',
        sync_requests_today: 5,
        consecutive_errors: 0,
        sync_enabled: true
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSyncState,
                error: null
              })
            })
          }),
          upsert: jest.fn().mockResolvedValue({
            data: { ...mockSyncState, sync_requests_today: 4 },
            error: null
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_sync' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should set sync count', async () => {
      const mockUser = { id: 'user-123' }
      const mockSyncState = {
        user_id: 'user-123',
        sync_requests_today: 0,
        consecutive_errors: 0,
        sync_enabled: true
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSyncState,
                error: null
              })
            })
          }),
          upsert: jest.fn().mockResolvedValue({
            data: { ...mockSyncState, sync_requests_today: 10 },
            error: null
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_syncs', count: 10 })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should reset timer', async () => {
      const mockUser = { id: 'user-123' }
      const mockSyncState = {
        user_id: 'user-123',
        sync_requests_today: 0,
        consecutive_errors: 0,
        sync_enabled: true
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSyncState,
                error: null
              })
            })
          }),
          upsert: jest.fn().mockResolvedValue({
            data: { ...mockSyncState, last_activity_sync: expect.any(String) },
            error: null
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_timer' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should add error', async () => {
      const mockUser = { id: 'user-123' }
      const mockSyncState = {
        user_id: 'user-123',
        sync_requests_today: 0,
        consecutive_errors: 2,
        sync_enabled: true
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSyncState,
                error: null
              })
            })
          }),
          upsert: jest.fn().mockResolvedValue({
            data: { 
              ...mockSyncState, 
              consecutive_errors: 3,
              last_error_message: 'Debug: Added consecutive error',
              last_error_at: expect.any(String)
            },
            error: null
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_error' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should clear errors', async () => {
      const mockUser = { id: 'user-123' }
      const mockSyncState = {
        user_id: 'user-123',
        sync_requests_today: 0,
        consecutive_errors: 5,
        last_error_message: 'Some error',
        last_error_at: '2024-01-01T10:00:00Z',
        sync_enabled: true
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSyncState,
                error: null
              })
            })
          }),
          upsert: jest.fn().mockResolvedValue({
            data: { 
              ...mockSyncState, 
              consecutive_errors: 0,
              last_error_message: null,
              last_error_at: null
            },
            error: null
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_errors' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should disable sync', async () => {
      const mockUser = { id: 'user-123' }
      const mockSyncState = {
        user_id: 'user-123',
        sync_requests_today: 0,
        consecutive_errors: 0,
        sync_enabled: true
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSyncState,
                error: null
              })
            })
          }),
          upsert: jest.fn().mockResolvedValue({
            data: { ...mockSyncState, sync_enabled: false },
            error: null
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable_sync' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should enable sync', async () => {
      const mockUser = { id: 'user-123' }
      const mockSyncState = {
        user_id: 'user-123',
        sync_requests_today: 0,
        consecutive_errors: 0,
        sync_enabled: false
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSyncState,
                error: null
              })
            })
          }),
          upsert: jest.fn().mockResolvedValue({
            data: { ...mockSyncState, sync_enabled: true },
            error: null
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable_sync' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should reset all state', async () => {
      const mockUser = { id: 'user-123' }
      const mockSyncState = {
        user_id: 'user-123',
        sync_requests_today: 10,
        consecutive_errors: 5,
        sync_enabled: false
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSyncState,
                error: null
              })
            })
          }),
          upsert: jest.fn().mockResolvedValue({
            data: { 
              user_id: 'user-123',
              sync_requests_today: 0,
              consecutive_errors: 0,
              sync_enabled: true,
              last_activity_sync: expect.any(String),
              last_sync_date: expect.any(String)
            },
            error: null
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_all' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 401 for unauthenticated user', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null
          })
        }
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_sync' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 403 in production', async () => {
      process.env.NODE_ENV = 'production'

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_sync' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Debug endpoints not available in production')
    })

    it('should handle invalid action gracefully', async () => {
      const mockUser = { id: 'user-123' }
      const mockSyncState = {
        user_id: 'user-123',
        sync_requests_today: 0,
        consecutive_errors: 0,
        sync_enabled: true
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSyncState,
                error: null
              })
            })
          }),
          upsert: jest.fn().mockResolvedValue({
            data: mockSyncState,
            error: null
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/debug/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invalid_action' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
}) 