import { NextRequest } from 'next/server';
import { POST } from '@/app/api/goals/update-progress/route';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    rpc: jest.fn(),
  })),
}));

// Mock auth
jest.mock('@/lib/auth/server', () => ({
  getUser: jest.fn(),
}));

describe('/api/goals/update-progress', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockGoalProgressResults = [
    {
      goal_id: 'goal-1',
      goal_type: 'weekly_distance',
      target_value: 30,
      current_progress: 15,
      progress_percentage: 50,
      is_completed: false,
      last_updated: '2025-07-17T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update goal progress successfully', async () => {
    // Mock successful authentication
    const { getUser } = require('@/lib/auth/server');
    getUser.mockResolvedValue(mockUser);

    // Mock successful Supabase RPC call
    const { createClient } = require('@/lib/supabase/server');
    const mockSupabase = {
      rpc: jest.fn().mockResolvedValue({
        data: mockGoalProgressResults,
        error: null,
      }),
    };
    createClient.mockResolvedValue(mockSupabase);

    // Create request
    const request = new Request(
      'http://localhost:3000/api/goals/update-progress',
      {
        method: 'POST',
      }
    );

    // Call the API
    const response = await POST();
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.goalsUpdated).toBe(1);
    expect(data.goals).toEqual(mockGoalProgressResults);

    // Verify Supabase was called correctly
    expect(mockSupabase.rpc).toHaveBeenCalledWith('calculate_goal_progress', {
      p_user_id: mockUser.id,
    });
  });

  it('should handle authentication failure', async () => {
    // Mock failed authentication
    const { getUser } = require('@/lib/auth/server');
    getUser.mockResolvedValue(null);

    // Create request
    const request = new Request(
      'http://localhost:3000/api/goals/update-progress',
      {
        method: 'POST',
      }
    );

    // Call the API
    const response = await POST();
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should handle database errors gracefully', async () => {
    // Mock successful authentication
    const { getUser } = require('@/lib/auth/server');
    getUser.mockResolvedValue(mockUser);

    // Mock failed Supabase RPC call
    const { createClient } = require('@/lib/supabase/server');
    const mockSupabase = {
      rpc: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    };
    createClient.mockResolvedValue(mockSupabase);

    // Create request
    const request = new Request(
      'http://localhost:3000/api/goals/update-progress',
      {
        method: 'POST',
      }
    );

    // Call the API
    const response = await POST();
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update goal progress');
    expect(data.details).toBe('Database error');
  });

  it('should handle empty goal results', async () => {
    // Mock successful authentication
    const { getUser } = require('@/lib/auth/server');
    getUser.mockResolvedValue(mockUser);

    // Mock successful Supabase RPC call with no goals
    const { createClient } = require('@/lib/supabase/server');
    const mockSupabase = {
      rpc: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };
    createClient.mockResolvedValue(mockSupabase);

    // Create request
    const request = new Request(
      'http://localhost:3000/api/goals/update-progress',
      {
        method: 'POST',
      }
    );

    // Call the API
    const response = await POST();
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.goalsUpdated).toBe(0);
    expect(data.goals).toEqual([]);
  });
});
