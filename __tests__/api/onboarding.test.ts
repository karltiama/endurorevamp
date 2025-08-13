import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/onboarding/route';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { UpdateOnboardingRequest } from '@/types/goals';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/server');

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockGetUser = getUser as jest.MockedFunction<typeof getUser>;

// Helper function to create a mock user
const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  ...overrides,
});

describe('/api/onboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/onboarding', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Authentication required' });
    });

    it('should create new onboarding record when none exists', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
      };
      const mockOnboarding = {
        id: 'onboarding-id',
        user_id: 'test-user-id',
        goals_completed: false,
        strava_connected: false,
        profile_completed: false,
        first_sync_completed: false,
        current_step: 'goals',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockGetUser.mockResolvedValue(mockUser);

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows returned' },
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockOnboarding,
                error: null,
              }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        onboarding: mockOnboarding,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('user_onboarding');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        current_step: 'goals',
      });
    });

    it('should return existing onboarding record', async () => {
      const mockUser = createMockUser();
      const mockOnboarding = {
        id: 'onboarding-id',
        user_id: 'test-user-id',
        goals_completed: true,
        strava_connected: false,
        profile_completed: false,
        first_sync_completed: false,
        current_step: 'strava',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockGetUser.mockResolvedValue(mockUser);

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockOnboarding,
                error: null,
              }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        onboarding: mockOnboarding,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('user_onboarding');
      expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith(
        'user_id',
        'test-user-id'
      );
    });

    it('should return 500 when database error occurs during fetch', async () => {
      const mockUser = createMockUser();
      const dbError = { message: 'Database connection failed' };

      mockGetUser.mockResolvedValue(mockUser);

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: dbError,
              }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch onboarding status' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching onboarding status:',
        dbError
      );

      consoleSpy.mockRestore();
    });

    it('should return 500 when error occurs during record creation', async () => {
      const mockUser = createMockUser();
      const createError = { message: 'Insert failed' };

      mockGetUser.mockResolvedValue(mockUser);

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows returned' },
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: createError,
              }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to initialize onboarding' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating onboarding record:',
        createError
      );

      consoleSpy.mockRestore();
    });

    it('should handle unexpected errors', async () => {
      mockGetUser.mockRejectedValue(new Error('Unexpected error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Onboarding GET API error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('PATCH /api/onboarding', () => {
    const createPatchRequest = (body: UpdateOnboardingRequest) => {
      return new NextRequest('http://localhost:3000/api/onboarding', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    };

    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);

      const request = createPatchRequest({ goals_completed: true });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Authentication required' });
    });

    it('should update onboarding status successfully', async () => {
      const mockUser = createMockUser();
      const updateData: UpdateOnboardingRequest = {
        goals_completed: true,
        strava_connected: false,
        profile_completed: false,
        first_sync_completed: false,
      };
      const updatedOnboarding = {
        id: 'onboarding-id',
        user_id: 'test-user-id',
        ...updateData,
        current_step: 'strava',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockGetUser.mockResolvedValue(mockUser);

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedOnboarding,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const request = createPatchRequest(updateData);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        onboarding: updatedOnboarding,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('user_onboarding');
      expect(mockSupabase.from().update).toHaveBeenCalledWith(updateData);
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith(
        'user_id',
        'test-user-id'
      );
    });

    it('should mark onboarding as complete when all steps are finished', async () => {
      const mockUser = createMockUser();
      const updateData: UpdateOnboardingRequest = {
        goals_completed: true,
        strava_connected: true,
        profile_completed: true,
        first_sync_completed: true,
      };
      const completedOnboarding = {
        id: 'onboarding-id',
        user_id: 'test-user-id',
        ...updateData,
        current_step: 'complete',
        completed_at: '2024-01-01T12:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
      };

      mockGetUser.mockResolvedValue(mockUser);

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: completedOnboarding,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const request = createPatchRequest(updateData);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        onboarding: completedOnboarding,
      });

      // Verify that completed_at and current_step were set
      const expectedUpdateData = {
        ...updateData,
        completed_at: expect.any(String),
        current_step: 'complete',
      };
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expectedUpdateData
      );
    });

    it('should return 500 when database update fails', async () => {
      const mockUser = createMockUser();
      const updateError = { message: 'Update failed' };

      mockGetUser.mockResolvedValue(mockUser);

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: updateError,
                }),
              }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const request = createPatchRequest({ goals_completed: true });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update onboarding status' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error updating onboarding status:',
        updateError
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in request body', async () => {
      const mockUser = createMockUser();
      mockGetUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/onboarding', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Onboarding PATCH API error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty request body', async () => {
      const mockUser = createMockUser();
      mockGetUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/onboarding', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '',
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update onboarding status' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error updating onboarding status:',
        { message: 'Update failed' }
      );

      consoleSpy.mockRestore();
    });

    it('should handle partial updates correctly', async () => {
      const mockUser = createMockUser();
      const updateData: UpdateOnboardingRequest = {
        goals_completed: true,
      };
      const updatedOnboarding = {
        id: 'onboarding-id',
        user_id: 'test-user-id',
        goals_completed: true,
        strava_connected: false,
        profile_completed: false,
        first_sync_completed: false,
        current_step: 'goals',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockGetUser.mockResolvedValue(mockUser);

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedOnboarding,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const request = createPatchRequest(updateData);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        onboarding: updatedOnboarding,
      });

      expect(mockSupabase.from().update).toHaveBeenCalledWith(updateData);
    });

    it('should handle unexpected errors', async () => {
      mockGetUser.mockRejectedValue(new Error('Unexpected error'));

      const request = createPatchRequest({ goals_completed: true });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Onboarding PATCH API error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
