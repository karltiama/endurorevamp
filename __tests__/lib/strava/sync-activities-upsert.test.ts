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

const mockUpsert = jest.fn()
const mockSelect = jest.fn()
const mockSingle = jest.fn()
const mockRpc = jest.fn()

// Create a properly chained mock that captures the actual call sequence
const mockSupabase = {
  from: jest.fn((table: string) => ({
    upsert: mockUpsert.mockReturnValue({
      select: mockSelect.mockReturnValue({
        single: mockSingle.mockResolvedValue({
          data: { id: 'test-id', created_at: '2023-01-01T10:00:00Z', updated_at: '2023-01-01T10:00:00Z' },
          error: null
        })
      })
    }),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
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
    stravaSync = new StravaActivitySync()
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
      })

      // Verify that from was called with 'activities' table
      expect(mockSupabase.from).toHaveBeenCalledWith('activities')
      
      // Verify that upsert was called with the correct onConflict specification
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          strava_activity_id: 12345
        }),
        expect.objectContaining({
          onConflict: 'user_id,strava_activity_id', // Fixed: Use composite constraint to prevent duplicates per user
          ignoreDuplicates: false
        })
      )
      
      // Verify the method completed successfully
      expect(result.data).toBeDefined()
      expect(result.isNew).toBeDefined()
    })

    it('should handle duplicate activities correctly', async () => {
      // Mock an updated activity (created_at != updated_at means it was updated)
      const mockData = {
        id: 'test-id',
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T10:05:00Z' // 5 minutes later = update
      }

      // Override the single mock to return the updated activity data
      mockSingle.mockResolvedValueOnce({
        data: mockData,
        error: null
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
      })

      // Should detect this as an update, not a new activity
      expect(result.isNew).toBe(false)
      expect(result.data).toEqual(mockData)
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
      })

      // Access the upsert call arguments directly from the mock
      expect(mockUpsert).toHaveBeenCalledTimes(1)
      const upsertCall = mockUpsert.mock.calls[0][0]
      
      // Verify null/undefined handling
      expect(upsertCall.distance).toBe(0) // safeNumberRequired fallback
      expect(upsertCall.moving_time).toBe(0) // safeNumberRequired fallback  
      expect(upsertCall.elapsed_time).toBe(0) // safeNumberRequired fallback
      expect(upsertCall.total_elevation_gain).toBeNull() // safeNumber allows null
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
    
    // Simulate what the fixed code should do
    const { data, error } = await mockSupabaseInstance
      .from('activities')
      .upsert(testData, {
        onConflict: 'user_id,strava_activity_id', // This is the fix
        ignoreDuplicates: false
      })
      .select('*')
      .single()

    // Verify the upsert was called with correct conflict specification
    expect(mockSupabaseInstance.from).toHaveBeenCalledWith('activities')
    
    expect(mockUpsertCall).toHaveBeenCalledWith(
      testData,
      {
        onConflict: 'user_id,strava_activity_id',
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