import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/activities/[id]/rpe/route'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/auth/server')

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockGetUser = getUser as jest.MockedFunction<typeof getUser>

describe('/api/activities/[id]/rpe', () => {
  // Helper function to create a mock user
  const createMockUser = (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    ...overrides
  })

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default Supabase mock with proper method chaining
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          })
        })
      })
    }
    
    mockCreateClient.mockResolvedValue(mockSupabase as any)
  })

  describe('PATCH', () => {
    const createRequest = (body: any, activityId: string = '123456') => {
      return new NextRequest('http://localhost:3000/api/activities/123456/rpe', {
        method: 'PATCH',
        body: JSON.stringify(body)
      })
    }

    it('successfully updates RPE for Strava activity ID', async () => {
      const mockUpdatedActivity = {
        id: 'activity-123',
        strava_activity_id: 123456,
        perceived_exertion: 8,
        user_id: 'test-user-id'
      }

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockUpdatedActivity, error: null })
                })
              })
            })
          })
        })
      }
      
      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockGetUser.mockResolvedValue(createMockUser())

      const request = createRequest({ perceived_exertion: 8 }, '123456')
      const response = await PATCH(request, { params: Promise.resolve({ id: '123456' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        activity: mockUpdatedActivity
      })

      // Verify the correct query was built
      expect(mockSupabase.from).toHaveBeenCalledWith('activities')
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        perceived_exertion: 8,
        updated_at: expect.any(String)
      })
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(mockSupabase.from().update().eq().eq).toHaveBeenCalledWith('strava_activity_id', 123456)
    })

    it('successfully updates RPE for database UUID', async () => {
      const activityId = '550e8400-e29b-41d4-a716-446655440000'
      const mockUpdatedActivity = {
        id: activityId,
        perceived_exertion: 6,
        user_id: 'test-user-id'
      }

      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockUpdatedActivity, error: null })
                })
              })
            })
          })
        })
      }
      
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any)
      mockGetUser.mockResolvedValue(createMockUser())

      const request = createRequest({ perceived_exertion: 6 }, activityId)
      const response = await PATCH(request, { params: Promise.resolve({ id: activityId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        activity: mockUpdatedActivity
      })

      // Verify UUID was used as database id
      expect(mockSupabaseClient.from().update().eq().eq).toHaveBeenCalledWith('id', activityId)
    })

    it('returns 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null)

      const request = createRequest({ perceived_exertion: 5 })
      const response = await PATCH(request, { params: Promise.resolve({ id: '123456' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Authentication required'
      })
    })

    it('returns 400 for invalid RPE values', async () => {
      mockGetUser.mockResolvedValue(createMockUser())
      
      const testCases = [
        { value: 0, description: 'below minimum' },
        { value: 11, description: 'above maximum' },
        { value: '5', description: 'string instead of number' },
        { value: null, description: 'null value' },
        { value: undefined, description: 'undefined value' }
      ]

      for (const testCase of testCases) {
        const request = createRequest({ perceived_exertion: testCase.value })
        const response = await PATCH(request, { params: Promise.resolve({ id: '123456' }) })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data).toEqual({
          error: 'Invalid RPE value. Must be a number between 1 and 10.'
        })
      }
    })

    it('returns 400 for missing perceived_exertion field', async () => {
      mockGetUser.mockResolvedValue(createMockUser())
      
      const request = createRequest({})
      const response = await PATCH(request, { params: Promise.resolve({ id: '123456' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Invalid RPE value. Must be a number between 1 and 10.'
      })
    })

    it('returns 404 when activity is not found', async () => {
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: null })
                })
              })
            })
          })
        })
      }
      
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any)
      mockGetUser.mockResolvedValue(createMockUser())

      const request = createRequest({ perceived_exertion: 7 })
      const response = await PATCH(request, { params: Promise.resolve({ id: '123456' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({
        error: 'Activity not found'
      })
    })

    it('returns 500 when database update fails', async () => {
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
                })
              })
            })
          })
        })
      }
      
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any)
      mockGetUser.mockResolvedValue(createMockUser())

      const request = createRequest({ perceived_exertion: 8 })
      const response = await PATCH(request, { params: Promise.resolve({ id: '123456' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to update activity RPE'
      })
    })

    it('returns 500 when database throws an error', async () => {
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockRejectedValue(new Error('Database connection failed'))
                })
              })
            })
          })
        })
      }
      
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any)
      mockGetUser.mockResolvedValue(createMockUser())

      const request = createRequest({ perceived_exertion: 9 })
      const response = await PATCH(request, { params: Promise.resolve({ id: '123456' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Internal server error'
      })
    })

    it('handles valid RPE values correctly', async () => {
      mockGetUser.mockResolvedValue(createMockUser())
      
      const validRPEValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

      for (const rpeValue of validRPEValues) {
        const mockUpdatedActivity = {
          id: 'activity-123',
          perceived_exertion: rpeValue,
          user_id: 'test-user-id'
        }

        const mockSupabaseClient = {
          from: jest.fn().mockReturnValue({
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: mockUpdatedActivity, error: null })
                  })
                })
              })
            })
          })
        }
        
        mockCreateClient.mockResolvedValue(mockSupabaseClient as any)

        const request = createRequest({ perceived_exertion: rpeValue })
        const response = await PATCH(request, { params: Promise.resolve({ id: '123456' }) })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.activity.perceived_exertion).toBe(rpeValue)
      }
    })

    it('updates updated_at timestamp', async () => {
      const mockUpdatedActivity = {
        id: 'activity-123',
        perceived_exertion: 7,
        user_id: 'test-user-id'
      }

      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockUpdatedActivity, error: null })
                })
              })
            })
          })
        })
      }
      
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any)
      mockGetUser.mockResolvedValue(createMockUser())

      const beforeUpdate = new Date()
      const request = createRequest({ perceived_exertion: 7 })
      await PATCH(request, { params: Promise.resolve({ id: '123456' }) })
      const afterUpdate = new Date()

      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        perceived_exertion: 7,
        updated_at: expect.any(String)
      })

      // Verify the timestamp is recent
      const updateCall = mockSupabaseClient.from().update.mock.calls[0][0]
      const updatedAt = new Date(updateCall.updated_at)
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterUpdate.getTime())
    })
  })
}) 