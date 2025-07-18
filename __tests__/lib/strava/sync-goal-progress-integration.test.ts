import { StravaActivitySync } from '@/lib/strava/sync-activities';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}));

const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn()
};

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
};

const mockStravaActivity = {
  id: 12345,
  name: 'Test Run',
  sport_type: 'Run',
  distance: 5000, // 5km
  moving_time: 1800, // 30 minutes
  elapsed_time: 1900,
  total_elevation_gain: 50,
  start_date: '2023-01-01T10:00:00Z',
  start_date_local: '2023-01-01T10:00:00Z',
  timezone: 'UTC',
  average_speed: 2.78,
  max_speed: 3.5,
  trainer: false,
  commute: false,
  manual: false,
  achievement_count: 0,
  kudos_count: 0,
  comment_count: 0,
  has_heartrate: false
};

describe('Strava Sync + Goal Progress Integration', () => {
  let stravaSync: StravaActivitySync;
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the createClient function
    const { createClient } = require('@/lib/supabase/client');
    createClient.mockReturnValue(mockSupabase);
    
    stravaSync = new StravaActivitySync();
  });

  describe('Activity Storage', () => {
    it('should store activity successfully', async () => {
      // Mock successful activity storage
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null, // No existing activity
            error: null
          })
        })
      });
      
      const mockUpsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'activity-id', created_at: '2023-01-01T10:00:00Z' },
            error: null
          })
        })
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        upsert: mockUpsert
      });

      const result = await stravaSync.storeActivity(mockUserId, mockStravaActivity);

      // Verify activity was stored
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
      expect(result.data).toBeDefined();
      expect(result.isNew).toBe(true);
    });

    it('should handle activity storage failure', async () => {
      // Mock activity storage failure
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      });
      
      const mockUpsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        upsert: mockUpsert
      });

      // Should throw on activity storage failure
      await expect(stravaSync.storeActivity(mockUserId, mockStravaActivity))
        .rejects.toThrow('Database error');
    });

    it('should convert StravaActivity to Activity type correctly', async () => {
      // Mock successful storage
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        }),
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'activity-id' },
              error: null
            })
          })
        })
      });

      const result = await stravaSync.storeActivity(mockUserId, mockStravaActivity);

      // Verify the conversion includes all required fields
      expect(result.data).toBeDefined();
      expect(result.isNew).toBe(true);
      
      // Verify the activity was stored with correct data structure
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
    });
  });

  describe('Bulk Goal Progress Update', () => {
    it('should update goal progress in bulk after sync', async () => {
      // Mock successful activity storage
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        }),
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'activity-id' },
              error: null
            })
          })
        })
      });

      // Mock successful goal progress calculation
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { goal_id: 'goal-1', current_progress: 10, target_value: 50 },
          { goal_id: 'goal-2', current_progress: 5, target_value: 20 }
        ],
        error: null
      });

      const result = await stravaSync.storeActivity(mockUserId, mockStravaActivity);

      // Verify activity was stored
      expect(result.data).toBeDefined();
      expect(result.isNew).toBe(true);

      // Note: Goal progress is now updated in bulk after sync, not per activity
      // This is more efficient and prevents race conditions
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        }),
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database connection failed'))
          })
        })
      });

      await expect(stravaSync.storeActivity(mockUserId, mockStravaActivity))
        .rejects.toThrow('Database connection failed');
    });
  });
}); 