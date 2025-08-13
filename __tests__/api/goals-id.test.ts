import { PATCH, DELETE } from '@/app/api/goals/[id]/route';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock the auth server
jest.mock('@/lib/auth/server', () => ({
  getUser: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockGetUser = getUser as jest.MockedFunction<typeof getUser>;

describe('Goals [id] API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /api/goals/[id]', () => {
    const params = Promise.resolve({ id: 'goal-1' });

    it('should update a goal successfully', async () => {
      // Mock authenticated user
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z',
      };
      mockGetUser.mockResolvedValue(mockUser);

      // Mock request body
      const body = {
        target_value: 100,
        target_date: '2024-12-31',
        goal_data: { notes: 'Updated' },
        current_progress: 50,
        is_completed: false,
      };
      const request = new Request('http://localhost/api/goals/goal-1', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      // Mock Supabase client
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'goal-1', user_id: 'test-user-id' },
                  error: null,
                }),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'goal-1', ...body },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        goal: { id: 'goal-1', ...body },
      });
    });

    it('should return 404 if goal not found', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z',
      };
      mockGetUser.mockResolvedValue(mockUser);
      const request = new Request('http://localhost/api/goals/goal-1', {
        method: 'PATCH',
        body: '{}',
      });
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
              }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);
      const response = await PATCH(request, { params });
      const data = await response.json();
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Goal not found' });
    });

    it('should return 401 if unauthenticated', async () => {
      mockGetUser.mockResolvedValue(null);
      const request = new Request('http://localhost/api/goals/goal-1', {
        method: 'PATCH',
        body: '{}',
      });
      const response = await PATCH(request, { params });
      const data = await response.json();
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Authentication required' });
    });

    it('should handle update errors', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z',
      };
      mockGetUser.mockResolvedValue(mockUser);
      const request = new Request('http://localhost/api/goals/goal-1', {
        method: 'PATCH',
        body: '{}',
      });
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: { id: 'goal-1' }, error: null }),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Update error' },
                  }),
                }),
              }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);
      const response = await PATCH(request, { params });
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update goal' });
    });
  });

  describe('DELETE /api/goals/[id]', () => {
    const params = Promise.resolve({ id: 'goal-1' });

    it('should delete a goal successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z',
      };
      mockGetUser.mockResolvedValue(mockUser);
      const request = new Request('http://localhost/api/goals/goal-1', {
        method: 'DELETE',
      });
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: { id: 'goal-1' }, error: null }),
              }),
            }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);
      const response = await DELETE(request, { params });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Goal deleted successfully',
      });
    });

    it('should return 404 if goal not found', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z',
      };
      mockGetUser.mockResolvedValue(mockUser);
      const request = new Request('http://localhost/api/goals/goal-1', {
        method: 'DELETE',
      });
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
              }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);
      const response = await DELETE(request, { params });
      const data = await response.json();
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Goal not found' });
    });

    it('should return 401 if unauthenticated', async () => {
      mockGetUser.mockResolvedValue(null);
      const request = new Request('http://localhost/api/goals/goal-1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params });
      const data = await response.json();
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Authentication required' });
    });

    it('should handle delete errors', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z',
      };
      mockGetUser.mockResolvedValue(mockUser);
      const request = new Request('http://localhost/api/goals/goal-1', {
        method: 'DELETE',
      });
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: { id: 'goal-1' }, error: null }),
              }),
            }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest
                .fn()
                .mockResolvedValue({ error: { message: 'Delete error' } }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);
      const response = await DELETE(request, { params });
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to delete goal' });
    });
  });
});
