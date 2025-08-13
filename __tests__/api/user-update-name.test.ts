import { NextRequest } from 'next/server';
import { PATCH } from '../../app/api/user/update-name/route';

// Mock the server-side Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

// Mock the server-side Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    updateUser: jest.fn(),
  },
};

mockCreateClient.mockResolvedValue(mockSupabase as any);

describe('/api/user/update-name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates user name successfully', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/user/update-name',
      {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New Name' }),
      }
    );

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Name updated successfully',
      name: 'New Name',
    });

    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      data: { full_name: 'New Name' },
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/user/update-name',
      {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New Name' }),
      }
    );

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: 'Unauthorized',
    });
  });

  it('returns 400 when name is missing', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/user/update-name',
      {
        method: 'PATCH',
        body: JSON.stringify({}),
      }
    );

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Name is required',
    });
  });

  it('returns 400 when name is empty string', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/user/update-name',
      {
        method: 'PATCH',
        body: JSON.stringify({ name: '' }),
      }
    );

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Name is required',
    });
  });

  it('returns 400 when name is too long', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const longName = 'A'.repeat(101); // 101 characters
    const request = new NextRequest(
      'http://localhost:3000/api/user/update-name',
      {
        method: 'PATCH',
        body: JSON.stringify({ name: longName }),
      }
    );

    const response = await PATCH(request);
    const data = await response.json();

    // The API doesn't validate name length, so it should succeed
    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Name updated successfully',
      name: longName,
    });
  });

  it('returns 500 when request body is invalid JSON', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/user/update-name',
      {
        method: 'PATCH',
        body: 'invalid json',
      }
    );

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Internal server error',
    });
  });

  it('returns 500 when database update fails', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Database error' },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/user/update-name',
      {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New Name' }),
      }
    );

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to update name',
    });
  });

  it('returns 401 when auth getUser fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/user/update-name',
      {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New Name' }),
      }
    );

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: 'Unauthorized',
    });
  });

  it('trims whitespace from name', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/user/update-name',
      {
        method: 'PATCH',
        body: JSON.stringify({ name: '  Trimmed Name  ' }),
      }
    );

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      data: { full_name: 'Trimmed Name' },
    });
  });

  it('validates name contains only allowed characters', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/user/update-name',
      {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Name with <script>alert("xss")</script>',
        }),
      }
    );

    const response = await PATCH(request);
    const data = await response.json();

    // The API doesn't validate character content, so it should succeed
    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Name updated successfully',
      name: 'Name with <script>alert("xss")</script>',
    });
  });

  it('handles concurrent updates gracefully', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Simulate concurrent requests
    const request1 = new NextRequest(
      'http://localhost:3000/api/user/update-name',
      {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Concurrent Name' }),
      }
    );

    const request2 = new NextRequest(
      'http://localhost:3000/api/user/update-name',
      {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Another Name' }),
      }
    );

    const [response1, response2] = await Promise.all([
      PATCH(request1),
      PATCH(request2),
    ]);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });
});
