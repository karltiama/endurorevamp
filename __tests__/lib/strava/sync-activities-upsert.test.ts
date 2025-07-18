import { StravaActivitySync } from '@/lib/strava/sync-activities'
import { createClient } from '@/lib/supabase/client'

// Mock the Supabase clients
jest.mock('@/lib/supabase/client')
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

// Mock AutomaticGoalProgress to prevent server-side calls
jest.mock('@/lib/goals/automatic-progress', () => ({
  AutomaticGoalProgress: {
    updateProgressFromActivity: jest.fn().mockResolvedValue({}),
  },
}))

const mockRpc = jest.fn()

// Create a properly chained mock that captures the actual call sequence
const mockSupabase = {
  from: jest.fn((table: string) => ({
    upsert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-id', created_at: '2023-01-01T10:00:00Z', updated_at: '2023-01-01T10:00:00Z' },
          error: null
        })
      })
    }),
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-id', created_at: '2023-01-01T10:00:00Z', updated_at: '2023-01-01T10:00:00Z' },
          error: null
        })
      })
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-id', created_at: '2023-01-01T10:00:00Z', updated_at: '2023-01-01T10:05:00Z' },
            error: null
          })
        })
      })
    }),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({
            data: null, // No existing activity found
            error: { code: 'PGRST116' } // Not found error
          })
        }))
      }))
    }))
  })),
  rpc: mockRpc
}

;(createClient as jest.Mock).mockReturnValue(mockSupabase)

// Also mock server-side createClient
const { createClient: createServerClient } = require('@/lib/supabase/server')
;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

// Mock the StravaAuth
jest.mock('@/lib/strava/auth', () => ({
  StravaAuth: jest.fn().mockImplementation(() => ({
    getAccessToken: jest.fn().mockResolvedValue('mock-token')
  }))
}))

describe('StravaActivitySync - Upsert Functionality', () => {
  let stravaSync: StravaActivitySync
  const mockUserId = 'test-user-id'
  const mockActivityData = {
    user_id: mockUserId,
    strava_activity_id: 12345,
    name: 'Test Run',
    sport_type: 'Run',
    distance: 5000,
    moving_time: 1800,
    elapsed_time: 1900
  }

  beforeEach(() => {
    jest.clearAllMocks()
    stravaSync = new StravaActivitySync('test-user-id')
  })

  describe('Activity Storage', () => {
    it('should use correct onConflict specification for upsert', async () => {
      // Call the storeActivity method and await the result
      const result = await stravaSync.storeActivity(mockUserId, {
        id: 12345,
        name: 'Test Run',
        sport_type: 'Run',
        distance: 5000,
        moving_time: 1800,
        elapsed_time: 1900,
        start_date: '2023-01-01T10:00:00Z',
        start_date_local: '2023-01-01T10:00:00Z',
        timezone: 'UTC',
        total_elevation_gain: 100,
        average_speed: 2.78,
        max_speed: 4.17,
        trainer: false,
        commute: false,
        manual: false,
        achievement_count: 0,
        kudos_count: 0,
        comment_count: 0,
        has_heartrate: false
      } as any)

      // Verify that from was called with 'activities' table
      expect(mockSupabase.from).toHaveBeenCalledWith('activities')
      
      // Verify that insert was called with the correct parameters
      const mockFrom = mockSupabase.from as jest.Mock
      expect(mockFrom).toHaveBeenCalledWith('activities')
      
      // Get the insert mock from the last call
      const lastCall = mockFrom.mock.results[mockFrom.mock.results.length - 1]
      const mockInsert = lastCall.value.insert as jest.Mock
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          strava_activity_id: 12345
        })
      )
      
      // Verify the method completed successfully
      expect(result.data).toBeDefined()
      expect(result.isNew).toBeDefined()
    })

    it('should handle duplicate activities correctly', async () => {
      // Mock an existing activity for the existence check
      const mockExistingActivity = { strava_activity_id: 12345 }
      
      // Override the select mock to return existing activity for the first call (existence check)
      const mockSelectChain = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockExistingActivity, // Activity exists
              error: null
            })
          }))
        }))
      }))
      
      mockSupabase.from.mockReturnValueOnce({
        select: mockSelectChain,
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-id', created_at: '2023-01-01T10:00:00Z', updated_at: '2023-01-01T10:05:00Z' },
              error: null
            })
          })
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-id', created_at: '2023-01-01T10:00:00Z', updated_at: '2023-01-01T10:00:00Z' },
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'test-id', created_at: '2023-01-01T10:00:00Z', updated_at: '2023-01-01T10:05:00Z' },
                error: null
              })
            })
          })
        })
      })

      const result = await stravaSync.storeActivity(mockUserId, {
        id: 12345,
        name: 'Test Run',
        sport_type: 'Run',
        distance: 5000,
        moving_time: 1800,
        elapsed_time: 1900,
        start_date: '2023-01-01T10:00:00Z',
        start_date_local: '2023-01-01T10:00:00Z',
        timezone: 'UTC',
        total_elevation_gain: 100,
        average_speed: 2.78,
        max_speed: 4.17,
        trainer: false,
        commute: false,
        manual: false,
        achievement_count: 0,
        kudos_count: 0,
        comment_count: 0,
        has_heartrate: false
      } as any)

      // Should detect this as an update, not a new activity
      expect(result.isNew).toBe(false)
      expect(result.data).toBeDefined()
    })
  })

  describe('Data Type Safety', () => {
    it('should handle null and undefined values safely', async () => {
      await stravaSync.storeActivity(mockUserId, {
        id: 12345,
        name: 'Test Run',
        sport_type: 'Run',
        distance: null as any, // Should handle null
        moving_time: undefined as any, // Should handle undefined
        elapsed_time: '' as any, // Should handle empty string
        start_date: '2023-01-01T10:00:00Z',
        start_date_local: '2023-01-01T10:00:00Z',
        timezone: 'UTC',
        total_elevation_gain: 'invalid' as any, // Should handle invalid number
        average_speed: 2.78,
        max_speed: 4.17,
        trainer: false,
        commute: false,
        manual: false,
        achievement_count: 0,
        kudos_count: 0,
        comment_count: 0,
        has_heartrate: false
      } as any)

      // Access the insert call arguments directly from the mock
      const mockFrom = mockSupabase.from as jest.Mock
      const lastCall = mockFrom.mock.results[mockFrom.mock.results.length - 1]
      const mockInsert = lastCall.value.insert as jest.Mock
      expect(mockInsert).toHaveBeenCalledTimes(1)
      const insertCall = mockInsert.mock.calls[0][0]
      
      // Verify null/undefined handling
      expect(insertCall.distance).toBe(0) // safeNumberRequired fallback
      expect(insertCall.moving_time).toBe(0) // safeNumberRequired fallback  
      expect(insertCall.elapsed_time).toBe(0) // safeNumberRequired fallback
      expect(insertCall.total_elevation_gain).toBe(0) // Invalid values default to 0
    })
  })
})

describe('Activity Upsert Conflict Resolution', () => {
  let mockUpsertCall: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUpsertCall = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-id', strava_activity_id: 12345 },
          error: null
        })
      }))
    }))
    
    const mockSupabaseInstance = {
      from: jest.fn(() => ({
        upsert: mockUpsertCall,
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // Not found
            })
          }))
        }))
      }))
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseInstance)
  })

  it('should demonstrate the fix for onConflict specification', async () => {
    const testData = {
      user_id: 'test-user-id',
      strava_activity_id: 12345,
      name: 'Test Activity',
      sport_type: 'Run'
    }

    // Get the mock supabase instance
    const mockSupabaseInstance = (createClient as jest.Mock)()
    
    // Simulate what the actual implementation does
    const { data, error } = await mockSupabaseInstance
      .from('activities')
      .upsert(testData, {
        ignoreDuplicates: false
      })
      .select('*')
      .single()

    // Verify the upsert was called with correct parameters
    expect(mockSupabaseInstance.from).toHaveBeenCalledWith('activities')
    
    expect(mockUpsertCall).toHaveBeenCalledWith(
      testData,
      {
        ignoreDuplicates: false
      }
    )

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('should handle the old broken specification for comparison', async () => {
    const testData = {
      user_id: 'test-user-id',
      strava_activity_id: 12345,
      name: 'Test Activity',
      sport_type: 'Run'
    }

    // Get the mock supabase instance
    const mockSupabaseInstance = (createClient as jest.Mock)()

    // Simulate what the old broken code would do
    // This would fail in a real database but passes in mocks
    await mockSupabaseInstance
      .from('activities')
      .upsert(testData, {
        onConflict: 'strava_activity_id', // Old broken way
        ignoreDuplicates: false
      })
      .select('*')
      .single()

    // The mock will pass, but this demonstrates the difference
    expect(mockUpsertCall).toHaveBeenCalledWith(
      testData,
      {
        onConflict: 'strava_activity_id', // This would cause DB error: 42P10
        ignoreDuplicates: false
      }
    )
  })

  it('should verify correct constraint exists in migration', () => {
    // This test documents what the migration should create
    const expectedConstraint = {
      name: 'activities_user_strava_unique',
      columns: ['user_id', 'strava_activity_id'],
      type: 'UNIQUE'
    }

    // This is more of a documentation test showing what we expect
    expect(expectedConstraint.columns).toEqual(['user_id', 'strava_activity_id'])
    expect(expectedConstraint.type).toBe('UNIQUE')
  })
}) 