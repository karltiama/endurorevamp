import { StravaActivitySync } from '@/lib/strava/sync-activities';
import { AutomaticGoalProgress } from '@/lib/goals/automatic-progress';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}));

// Mock AutomaticGoalProgress
jest.mock('@/lib/goals/automatic-progress', () => ({
  AutomaticGoalProgress: {
    updateProgressFromActivity: jest.fn()
  }
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
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    stravaSync = new StravaActivitySync();
  });

  describe('Activity Storage with Goal Progress Update', () => {
    it('should store activity and update goal progress successfully', async () => {
      // Mock successful activity storage
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null, // No existing activity
          error: null
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

      // Mock successful goal progress update
      (AutomaticGoalProgress.updateProgressFromActivity as jest.Mock).mockResolvedValue(undefined);

      const result = await stravaSync.storeActivity(mockUserId, mockStravaActivity);

      // Verify activity was stored
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
      expect(result.data).toBeDefined();
      expect(result.isNew).toBe(true);

      // Verify goal progress was updated
      expect(AutomaticGoalProgress.updateProgressFromActivity).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          user_id: mockUserId,
          strava_activity_id: mockStravaActivity.id,
          name: mockStravaActivity.name,
          sport_type: mockStravaActivity.sport_type,
          distance: mockStravaActivity.distance
        })
      );
    });

    it('should handle goal progress update failure gracefully', async () => {
      // Mock successful activity storage
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        }),
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'activity-id', created_at: '2023-01-01T10:00:00Z' },
              error: null
            })
          })
        })
      });

      // Mock goal progress update failure
      const progressError = new Error('Goal progress update failed');
      (AutomaticGoalProgress.updateProgressFromActivity as jest.Mock).mockRejectedValue(progressError);

      // Should not throw - activity storage should succeed even if goal progress fails
      const result = await stravaSync.storeActivity(mockUserId, mockStravaActivity);

      // Verify activity was still stored successfully
      expect(result.data).toBeDefined();
      expect(result.isNew).toBe(true);

      // Verify goal progress was attempted but failed
      expect(AutomaticGoalProgress.updateProgressFromActivity).toHaveBeenCalled();
    });

    it('should handle activity storage failure and not attempt goal progress update', async () => {
      // Mock activity storage failure
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
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

      // Goal progress should not be attempted if activity storage fails
      expect(AutomaticGoalProgress.updateProgressFromActivity).not.toHaveBeenCalled();
    });

    it('should convert StravaActivity to Activity type correctly', async () => {
      // Mock successful storage
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
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

      (AutomaticGoalProgress.updateProgressFromActivity as jest.Mock).mockResolvedValue(undefined);

      await stravaSync.storeActivity(mockUserId, mockStravaActivity);

      // Verify the conversion includes all required fields
      expect(AutomaticGoalProgress.updateProgressFromActivity).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          user_id: mockUserId,
          strava_activity_id: mockStravaActivity.id,
          name: mockStravaActivity.name,
          sport_type: mockStravaActivity.sport_type,
          distance: mockStravaActivity.distance,
          moving_time: mockStravaActivity.moving_time,
          elapsed_time: mockStravaActivity.elapsed_time,
          total_elevation_gain: mockStravaActivity.total_elevation_gain,
          start_date: mockStravaActivity.start_date,
          start_date_local: mockStravaActivity.start_date_local,
          timezone: mockStravaActivity.timezone,
          average_speed: mockStravaActivity.average_speed,
          max_speed: mockStravaActivity.max_speed,
          trainer: mockStravaActivity.trainer,
          commute: mockStravaActivity.commute,
          manual: mockStravaActivity.manual,
          achievement_count: mockStravaActivity.achievement_count,
          kudos_count: mockStravaActivity.kudos_count,
          comment_count: mockStravaActivity.comment_count,
          has_heartrate: mockStravaActivity.has_heartrate
        })
      );
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should log goal progress errors without failing sync', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock successful activity storage
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
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

      // Mock goal progress error
      const progressError = new Error('Constraint violation in goal progress');
      (AutomaticGoalProgress.updateProgressFromActivity as jest.Mock).mockRejectedValue(progressError);

      const result = await stravaSync.storeActivity(mockUserId, mockStravaActivity);

      // Activity should still be stored successfully
      expect(result.data).toBeDefined();

      // Error should be logged but not thrown
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Goal progress update failed'),
        progressError
      );

      consoleSpy.mockRestore();
    });
  });
}); 