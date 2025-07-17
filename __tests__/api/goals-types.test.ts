import { NextRequest } from 'next/server'
import { GET } from '@/app/api/goals/types/route'

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

// Mock the auth server
jest.mock('@/lib/auth/server', () => ({
  getUser: jest.fn()
}))

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockGetUser = getUser as jest.MockedFunction<typeof getUser>

describe('Goals Types API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/goals/types', () => {
    it('should return goal types successfully', async () => {
      // Mock authenticated user
      const mockUser = { 
        id: 'test-user-id', 
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z'
      }
      mockGetUser.mockResolvedValue(mockUser)

      // Mock goal types data
      const mockGoalTypes = [
        {
          id: 'goal-type-1',
          display_name: 'Distance Goal',
          description: 'Set a distance target',
          unit: 'km',
          is_active: true,
          category: 'distance'
        },
        {
          id: 'goal-type-2',
          display_name: 'Time Goal',
          description: 'Set a time target',
          unit: 'hours',
          is_active: true,
          category: 'time'
        }
      ]

      // Mock Supabase client
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockGoalTypes,
                error: null
              })
            })
          })
        })
      }
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        goalTypes: mockGoalTypes
      })

      // Verify Supabase query
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('goal_types')
      expect(mockSupabaseClient.from().select).toHaveBeenCalledWith('*')
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('is_active', true)
      expect(mockSupabaseClient.from().select().eq().order).toHaveBeenCalledWith('display_name')
    })

    it('should handle unauthenticated user', async () => {
      // Mock unauthenticated user
      mockGetUser.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Authentication required'
      })
    })

    it('should handle database errors', async () => {
      // Mock authenticated user
      const mockUser = { 
        id: 'test-user-id', 
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z'
      }
      mockGetUser.mockResolvedValue(mockUser)

      // Mock database error
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' }
              })
            })
          })
        })
      }
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to fetch goal types'
      })
    })

    it('should handle unexpected errors', async () => {
      // Mock authenticated user
      const mockUser = { 
        id: 'test-user-id', 
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z'
      }
      mockGetUser.mockResolvedValue(mockUser)

      // Mock unexpected error
      mockCreateClient.mockRejectedValue(new Error('Unexpected error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Internal server error'
      })
    })

    it('should return empty array when no goal types found', async () => {
      // Mock authenticated user
      const mockUser = { 
        id: 'test-user-id', 
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z'
      }
      mockGetUser.mockResolvedValue(mockUser)

      // Mock empty result
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      }
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        goalTypes: []
      })
    })
  })
}) 