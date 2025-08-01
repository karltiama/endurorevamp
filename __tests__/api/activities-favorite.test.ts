import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/activities/[id]/favorite/route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('/api/activities/[id]/favorite', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should toggle favorite status successfully', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({
          data: { is_favorite: false, user_id: 'test-user-id' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { is_favorite: true },
          error: null,
        }),
      update: jest.fn().mockReturnThis(),
    }

    mockCreateClient.mockResolvedValue(mockSupabase as any)

    const request = new NextRequest('http://localhost:3000/api/activities/12345/favorite', {
      method: 'PATCH',
    })

    const params = Promise.resolve({ id: '12345' })

    const response = await PATCH(request, { params })

    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData.is_favorite).toBe(true)
    expect(responseData.message).toBe('Activity added to favorites')

    // Verify the database calls
    expect(mockSupabase.from).toHaveBeenCalledWith('activities')
    expect(mockSupabase.eq).toHaveBeenCalledWith('strava_activity_id', '12345')
    expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
  })

  it('should handle unauthorized requests', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    }

    mockCreateClient.mockResolvedValue(mockSupabase as any)

    const request = new NextRequest('http://localhost:3000/api/activities/12345/favorite', {
      method: 'PATCH',
    })

    const params = Promise.resolve({ id: '12345' })

    const response = await PATCH(request, { params })

    expect(response.status).toBe(401)
    
    const responseData = await response.json()
    expect(responseData.error).toBe('Unauthorized')
  })

  it('should handle activity not found', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Activity not found' },
      }),
    }

    mockCreateClient.mockResolvedValue(mockSupabase as any)

    const request = new NextRequest('http://localhost:3000/api/activities/99999/favorite', {
      method: 'PATCH',
    })

    const params = Promise.resolve({ id: '99999' })

    const response = await PATCH(request, { params })

    expect(response.status).toBe(404)
    
    const responseData = await response.json()
    expect(responseData.error).toBe('Activity not found')
  })

  it('should handle database update errors', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({
          data: { is_favorite: false, user_id: 'test-user-id' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Update failed' },
        }),
      update: jest.fn().mockReturnThis(),
    }

    mockCreateClient.mockResolvedValue(mockSupabase as any)

    const request = new NextRequest('http://localhost:3000/api/activities/12345/favorite', {
      method: 'PATCH',
    })

    const params = Promise.resolve({ id: '12345' })

    const response = await PATCH(request, { params })

    expect(response.status).toBe(500)
    
    const responseData = await response.json()
    expect(responseData.error).toBe('Failed to update favorite status')
  })

  it('should properly await params in Next.js 15', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({
          data: { is_favorite: true, user_id: 'test-user-id' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { is_favorite: false },
          error: null,
        }),
      update: jest.fn().mockReturnThis(),
    }

    mockCreateClient.mockResolvedValue(mockSupabase as any)

    const request = new NextRequest('http://localhost:3000/api/activities/12345/favorite', {
      method: 'PATCH',
    })

    // Test that params is properly awaited
    const params = Promise.resolve({ id: '12345' })

    const response = await PATCH(request, { params })

    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData.is_favorite).toBe(false) // Should toggle from true to false
    expect(responseData.message).toBe('Activity removed from favorites')
  })
}) 