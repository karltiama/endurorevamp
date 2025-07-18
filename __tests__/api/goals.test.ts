import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/goals/route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

// Mock auth helpers
jest.mock('@/lib/auth/server', () => ({
  getUser: jest.fn()
}))

const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
}

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
}

describe('Goals API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('GET /api/goals', () => {
    it('should return user goals successfully', async () => {
      // Mock successful user authentication
      const { getUser } = require('@/lib/auth/server')
      getUser.mockResolvedValue(mockUser)

      // Mock goals data
      const mockGoals = [
        {
          id: 'goal-1',
          user_id: mockUser.id,
          goal_type_id: 'distance',
          target_value: 50,
          target_unit: 'km',
          time_period: 'monthly',
          current_progress: 25,
          is_active: true,
          is_completed: false
        }
      ]

      // Mock onboarding data
      const mockOnboarding = {
        id: 'onboarding-1',
        user_id: mockUser.id,
        goals_completed: true,
        strava_connected: true,
        current_step: 'complete'
      }

      // Mock Supabase chain for goals query
      const mockGoalsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockGoals,
                error: null
              })
            })
          })
        })
      };

      // Mock Supabase chain for onboarding query
      const mockOnboardingQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockOnboarding,
              error: null
            })
          })
        })
      };

      // Mock Supabase chain for activity count
      const mockActivityCountQuery = {
        count: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: 5,
            error: null
          })
        })
      };

      // Mock Supabase chain for Strava token
      const mockStravaTokenQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: { id: 'token-1' },
            error: null
          })
        })
      };

      // Set up the mock to return different values based on the table name
      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'user_goals':
            return mockGoalsQuery;
          case 'user_onboarding':
            return mockOnboardingQuery;
          case 'activities':
            return mockActivityCountQuery;
          case 'strava_tokens':
            return mockStravaTokenQuery;
          case 'goal_types':
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: { id: 'distance', name: 'Weekly Distance' },
                    error: null
                  })
                })
              })
            };
          default:
            // For any other table, return a basic mock
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: null
                  })
                })
              })
            };
        }
      });

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.goals).toEqual(mockGoals)
      expect(data.onboarding).toBeDefined()
      expect(data.userStats).toEqual({
        activityCount: 5,
        hasStravaConnection: true
      })
    })

    it('should handle unauthenticated user', async () => {
      const { getUser } = require('@/lib/auth/server')
      getUser.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle database errors gracefully', async () => {
      const { getUser } = require('@/lib/auth/server')
      getUser.mockResolvedValue(mockUser)

      // Mock database error
      mockSupabase.from.mockImplementation((table: string) => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      }));

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should create onboarding record for new users', async () => {
      const { getUser } = require('@/lib/auth/server')
      getUser.mockResolvedValue(mockUser)

      // Mock no existing onboarding (PGRST116 error)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'user_onboarding') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'new-onboarding',
                    user_id: mockUser.id,
                    current_step: 'goals'
                  },
                  error: null
                })
              })
            })
          };
        } else if (table === 'activities') {
          return {
            count: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                count: 0,
                error: null
              })
            })
          };
        } else {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          };
        }
      });

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.onboarding).toBeDefined()
      expect(data.onboarding.current_step).toBe('goals')
    })
  })

  describe('POST /api/goals', () => {
    it('should create a new goal successfully', async () => {
      const { getUser } = require('@/lib/auth/server')
      getUser.mockResolvedValue(mockUser)

      const newGoal = {
        goal_type_id: 'distance',
        target_value: 100,
        target_unit: 'km',
        time_period: 'monthly'
      }

      // Mock successful goal creation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'goal_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'distance', name: 'Weekly Distance', unit: 'km' },
                    error: null
                  })
                })
              })
            })
          };
        } else if (table === 'user_goals') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'new-goal-id',
                    user_id: mockUser.id,
                    ...newGoal,
                    current_progress: 0,
                    is_active: true,
                    is_completed: false
                  },
                  error: null
                })
              })
            })
          };
        }
        return {};
      });

      const request = new NextRequest('http://localhost:3000/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newGoal)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.goal).toBeDefined()
      expect(data.goal.user_id).toBe(mockUser.id)
    })

    it('should validate required fields', async () => {
      const { getUser } = require('@/lib/auth/server')
      getUser.mockResolvedValue(mockUser)

      const invalidGoal = {
        // Missing required fields
        target_value: 100
      }

      const request = new NextRequest('http://localhost:3000/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidGoal)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Goal type is required')
    })

    it('should handle database errors during creation', async () => {
      const { getUser } = require('@/lib/auth/server')
      getUser.mockResolvedValue(mockUser)

      const newGoal = {
        goal_type_id: 'distance',
        target_value: 100,
        target_unit: 'km',
        time_period: 'monthly'
      }

      // Mock database error
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'goal_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'distance', name: 'Weekly Distance', unit: 'km' },
                    error: null
                  })
                })
              })
            })
          };
        } else if (table === 'user_goals') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Constraint violation' }
                })
              })
            })
          };
        }
        return {};
      });

      const request = new NextRequest('http://localhost:3000/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newGoal)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })
}) 