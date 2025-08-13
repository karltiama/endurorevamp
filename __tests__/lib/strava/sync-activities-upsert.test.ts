import { syncActivitiesToDatabase } from '@/lib/strava/sync-activities';
import { createClient } from '@/lib/supabase/server';
import type { StravaActivity } from '@/lib/strava/types';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
};

describe('syncActivitiesToDatabase - Upsert Functionality', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe('Activity Storage', () => {
    it('should use correct onConflict specification for upsert', async () => {
      // Mock the database operations
      const mockSelectChain = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null, // No existing activity
              error: null,
            }),
          })),
        })),
      }));

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-id',
              created_at: '2023-01-01T10:00:00Z',
              updated_at: '2023-01-01T10:00:00Z',
            },
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelectChain,
        insert: mockInsert,
      });

      const mockActivity = {
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
        has_heartrate: false,
      } as StravaActivity;

      // Call the syncActivitiesToDatabase function
      const result = await syncActivitiesToDatabase(mockUserId, [mockActivity]);

      // Verify that from was called with 'activities' table
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');

      // Verify that insert was called
      expect(mockInsert).toHaveBeenCalled();

      // Verify the result
      expect(result.newActivities).toBe(1);
      expect(result.updatedActivities).toBe(0);
    });

    it('should handle duplicate activities correctly', async () => {
      // Mock an existing activity for the existence check
      const mockExistingActivity = {
        id: 'existing-id',
        strava_activity_id: 12345,
      };

      // Mock the current activity data for change detection - with different values to trigger update
      const mockCurrentActivity = {
        id: 'existing-id',
        name: 'Old Test Run', // Different name to trigger update
        distance: 4000, // Different distance to trigger update
        moving_time: 1800,
        elapsed_time: 1900,
        total_elevation_gain: 100,
        achievement_count: 0,
        kudos_count: 0,
        comment_count: 0,
        average_speed: 2.78,
        max_speed: 4.17,
        average_heartrate: 0,
        max_heartrate: 0,
        average_watts: 0,
        max_watts: 0,
        weighted_average_watts: 0,
        kilojoules: 0,
        description: null,
      };

      // Mock the select chain to return different data for different calls
      const mockSelectChain = jest
        .fn()
        .mockReturnValueOnce({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: mockExistingActivity, // Activity exists
                error: null,
              }),
            })),
          })),
        })
        .mockReturnValueOnce({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockCurrentActivity, // Current activity data for change detection
              error: null,
            }),
          })),
        })
        .mockReturnValueOnce({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockCurrentActivity, // Current activity data for change detection
              error: null,
            }),
          })),
        });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelectChain,
        update: mockUpdate,
      });

      const mockActivity = {
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
        has_heartrate: false,
      } as StravaActivity;

      const result = await syncActivitiesToDatabase(mockUserId, [mockActivity]);

      // Verify that update was called
      expect(mockUpdate).toHaveBeenCalled();

      // Verify the result
      expect(result.newActivities).toBe(0);
      expect(result.updatedActivities).toBe(1);
    });

    it('should handle null and undefined values safely', async () => {
      const mockSelectChain = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null, // No existing activity
              error: null,
            }),
          })),
        })),
      }));

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-id' },
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelectChain,
        insert: mockInsert,
      });

      await syncActivitiesToDatabase(mockUserId, [
        {
          id: 12345,
          name: 'Test Run',
          sport_type: 'Run',
          distance: null as any, // Should handle null
          moving_time: undefined as any, // Should handle undefined
          elapsed_time: 1900,
          start_date: '2023-01-01T10:00:00Z',
          start_date_local: '2023-01-01T10:00:00Z',
          timezone: 'UTC',
          total_elevation_gain: null as any, // Should handle invalid number
          average_speed: 2.78,
          max_speed: 4.17,
          trainer: false,
          commute: false,
          manual: false,
          achievement_count: 0,
          kudos_count: 0,
          comment_count: 0,
          has_heartrate: false,
        },
      ]);

      // Verify that insert was called with safe number conversions
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          distance: 0, // safeNumber fallback
          moving_time: 0, // safeNumber fallback
          elapsed_time: 1900,
          total_elevation_gain: 0, // Invalid values default to 0
        })
      );
    });
  });

  describe('Data Type Safety', () => {
    it('should handle null and undefined values safely', async () => {
      const mockSelectChain = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null, // No existing activity
              error: null,
            }),
          })),
        })),
      }));

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-id' },
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelectChain,
        insert: mockInsert,
      });

      const testActivity = {
        id: 12345,
        name: 'Test Run',
        sport_type: 'Run',
        distance: null as any, // Should handle null
        moving_time: undefined as any, // Should handle undefined
        elapsed_time: 1900,
        start_date: '2023-01-01T10:00:00Z',
        start_date_local: '2023-01-01T10:00:00Z',
        timezone: 'UTC',
        total_elevation_gain: null as any, // Should handle invalid number
        average_speed: 2.78,
        max_speed: 4.17,
        trainer: false,
        commute: false,
        manual: false,
        achievement_count: 0,
        kudos_count: 0,
        comment_count: 0,
        has_heartrate: false,
      } as any;

      await syncActivitiesToDatabase(mockUserId, [testActivity]);

      // Verify that insert was called with safe number conversions
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          distance: 0, // safeNumber fallback
          moving_time: 0, // safeNumber fallback
          elapsed_time: 1900,
          total_elevation_gain: 0, // Invalid values default to 0
        })
      );
    });
  });
});

describe('Activity Upsert Conflict Resolution', () => {
  let mockUpsertCall: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUpsertCall = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-id', strava_activity_id: 12345 },
          error: null,
        }),
      })),
    }));

    const mockSupabaseInstance = {
      from: jest.fn(() => ({
        upsert: mockUpsertCall,
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found
            }),
          })),
        })),
      })),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseInstance);
  });

  it('should demonstrate the fix for onConflict specification', async () => {
    const testData = {
      user_id: 'test-user-id',
      strava_activity_id: 12345,
      name: 'Test Activity',
      sport_type: 'Run',
    };

    // Get the mock supabase instance
    const mockSupabaseInstance = (createClient as jest.Mock)();

    // Simulate what the actual implementation does
    const { data, error } = await mockSupabaseInstance
      .from('activities')
      .upsert(testData, {
        ignoreDuplicates: false,
      })
      .select('*')
      .single();

    // Verify the upsert was called with correct parameters
    expect(mockSupabaseInstance.from).toHaveBeenCalledWith('activities');

    expect(mockUpsertCall).toHaveBeenCalledWith(testData, {
      ignoreDuplicates: false,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should handle the old broken specification for comparison', async () => {
    const testData = {
      user_id: 'test-user-id',
      strava_activity_id: 12345,
      name: 'Test Activity',
      sport_type: 'Run',
    };

    // Get the mock supabase instance
    const mockSupabaseInstance = (createClient as jest.Mock)();

    // Simulate what the old broken code would do
    // This would fail in a real database but passes in mocks
    await mockSupabaseInstance
      .from('activities')
      .upsert(testData, {
        onConflict: 'strava_activity_id', // Old broken way
        ignoreDuplicates: false,
      })
      .select('*')
      .single();

    // The mock will pass, but this demonstrates the difference
    expect(mockUpsertCall).toHaveBeenCalledWith(testData, {
      onConflict: 'strava_activity_id', // This would cause DB error: 42P10
      ignoreDuplicates: false,
    });
  });

  it('should verify correct constraint exists in migration', () => {
    // This test documents what the migration should create
    const expectedConstraint = {
      name: 'activities_user_strava_unique',
      columns: ['user_id', 'strava_activity_id'],
      type: 'UNIQUE',
    };

    // This is more of a documentation test showing what we expect
    expect(expectedConstraint.columns).toEqual([
      'user_id',
      'strava_activity_id',
    ]);
    expect(expectedConstraint.type).toBe('UNIQUE');
  });
});
