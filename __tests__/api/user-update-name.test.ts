import { NextRequest } from 'next/server';
import { PATCH } from '../../app/api/user/update-name/route';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock the server-side Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
};

mockCreateClient.mockReturnValue(mockSupabase as any);

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

    const request = new NextRequest('http://localhost:3000/api/user/update-name', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    });

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

    const request = new NextRequest('http://localhost:3000/api/user/update-name', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    });

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

    const request = new NextRequest('http://localhost:3000/api/user/update-name', {
      method: 'PUT',
      body: JSON.stringify({}),
    });

    const response = await PUT(request);
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

    const request = new NextRequest('http://localhost:3000/api/user/update-name', {
      method: 'PUT',
      body: JSON.stringify({ name: '' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Name cannot be empty',
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
    const request = new NextRequest('http://localhost:3000/api/user/update-name', {
      method: 'PUT',
      body: JSON.stringify({ name: longName }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Name must be 100 characters or less',
    });
  });

  it('returns 400 when request body is invalid JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/user/update-name', {
      method: 'PUT',
      body: 'invalid json',
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Invalid request body',
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

    mockSupabase.from('users').update().eq().select().single.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const request = new NextRequest('http://localhost:3000/api/user/update-name', {
      method: 'PUT',
      body: JSON.stringify({ name: 'New Name' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to update user name',
    });
  });

  it('returns 500 when auth getUser fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    });

    const request = new NextRequest('http://localhost:3000/api/user/update-name', {
      method: 'PUT',
      body: JSON.stringify({ name: 'New Name' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to get user',
    });
  });

  it('trims whitespace from name', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    const mockUpdatedUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Trimmed Name',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from('users').update().eq().select().single.mockResolvedValue({
      data: mockUpdatedUser,
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/user/update-name', {
      method: 'PUT',
      body: JSON.stringify({ name: '  Trimmed Name  ' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockSupabase.from('users').update).toHaveBeenCalledWith({
      name: 'Trimmed Name',
      updated_at: expect.any(String),
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

    const request = new NextRequest('http://localhost:3000/api/user/update-name', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Name with <script>alert("xss")</script>' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Name contains invalid characters',
    });
  });

  it('handles concurrent updates gracefully', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    };

    const mockUpdatedUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Concurrent Name',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.from('users').update().eq().select().single.mockResolvedValue({
      data: mockUpdatedUser,
      error: null,
    });

    // Simulate concurrent requests
    const request1 = new NextRequest('http://localhost:3000/api/user/update-name', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Concurrent Name' }),
    });

    const request2 = new NextRequest('http://localhost:3000/api/user/update-name', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Another Name' }),
    });

    const [response1, response2] = await Promise.all([
      PUT(request1),
      PUT(request2),
    ]);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });
}); 