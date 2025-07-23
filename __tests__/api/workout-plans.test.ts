import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from '@/app/api/workout-plans/route'

// Mock the auth and database modules
jest.mock('@/lib/auth/server', () => ({
  requireAuth: jest.fn()
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

const mockRequireAuth = jest.requireMock('@/lib/auth/server').requireAuth
const mockCreateClient = jest.requireMock('@/lib/supabase/server').createClient

describe('/api/workout-plans', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      rpc: jest.fn(),
      from: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      body: jest.fn().mockReturnThis(),
      headers: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    mockCreateClient.mockResolvedValue(mockSupabase)
    mockRequireAuth.mockResolvedValue({ id: 'test-user-id' })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('DELETE', () => {
    it('should delete the current week workout plan', async () => {
      // Mock successful deletion
      mockSupabase.delete.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/workout-plans', {
        method: 'DELETE'
      })

      const response = await DELETE()
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toBe('Workout plan reset to recommended plan')

      // Verify the correct database calls were made
      expect(mockSupabase.from).toHaveBeenCalledWith('workout_plans')
      expect(mockSupabase.delete).toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      // Mock database error for the select query
      mockSupabase.select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ 
            data: [],
            error: { message: 'Database error' } 
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/workout-plans', {
        method: 'DELETE'
      })

      const response = await DELETE()
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to check existing plans')
    })

    it('should handle authentication errors', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))

      const request = new NextRequest('http://localhost:3000/api/workout-plans', {
        method: 'DELETE'
      })

      const response = await DELETE()
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })
  })

  describe('GET', () => {
    it('should return current week plan', async () => {
      const mockPlanData = [
        {
          plan_id: 'test-plan-id',
          plan_name: 'Weekly Plan',
          week_start: '2024-01-01',
          periodization_phase: 'base',
          total_tss: 150,
          total_distance: 25.5,
          total_time: 75,
          day_of_week: 0,
          workout_type: 'easy',
          sport: 'Run',
          duration: 30,
          intensity: 3,
          distance: 5.0,
          difficulty: 'beginner',
          energy_cost: 3,
          recovery_time: 12,
          reasoning: 'Easy recovery run',
          goal_alignment: null,
          weather_consideration: null,
          instructions: ['Warm up', 'Easy pace'],
          tips: ['Stay hydrated'],
          modifications: {},
          alternatives: []
        }
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockPlanData,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/workout-plans')
      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.weeklyPlan).toBeDefined()
      expect(result.weeklyPlan.workouts[0]).toBeDefined()
      expect(result.weeklyPlan.workouts[0].type).toBe('easy')
    })
  })

  describe('POST', () => {
    it('should save workout plan', async () => {
      const mockPlanId = 'test-plan-id'
      mockSupabase.rpc.mockResolvedValue({
        data: mockPlanId,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/workout-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          weeklyPlan: {
            weekStart: '2024-01-01',
            workouts: {
              0: {
                type: 'easy',
                sport: 'Run',
                duration: 30,
                intensity: 3
              }
            },
            totalTSS: 150,
            totalDistance: 25,
            totalTime: 75,
            periodizationPhase: 'base'
          }
        })
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.planId).toBe(mockPlanId)
    })
  })
}) 