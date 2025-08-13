import { NextRequest } from 'next/server';
import { GET, PUT, POST } from '@/app/api/auth/strava/token/route';

// Mock fetch globally
global.fetch = jest.fn();

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    set: jest.fn(),
    getAll: jest.fn().mockReturnValue([]),
  }),
}));

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('Auth Token API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();

    // Setup default Supabase mock with proper method chaining
    const mockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        upsert: jest.fn().mockResolvedValue({ error: null }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient as any);
  });

  describe('GET /api/auth/strava/token', () => {
    it('should return authentication status for authenticated user with tokens', async () => {
      // Mock user with tokens
      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  strava_athlete_id: 12345,
                  athlete_firstname: 'John',
                  athlete_lastname: 'Doe',
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        authenticated: true,
        user_id: 'test-user-id',
        has_strava_tokens: true,
        athlete: {
          id: 12345,
          name: 'John Doe',
        },
      });
    });

    it('should return authentication status for authenticated user without tokens', async () => {
      // Mock user without tokens
      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'No rows returned' },
              }),
            }),
          }),
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        authenticated: true,
        user_id: 'test-user-id',
        has_strava_tokens: false,
        athlete: null,
      });
    });

    it('should handle unauthenticated user', async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };

      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: false,
        authenticated: false,
        message: 'No authenticated user found',
      });
    });

    it('should handle authentication error', async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Auth error' },
          }),
        },
      };

      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: false,
        authenticated: false,
        message: 'No authenticated user found',
      });
    });

    it('should handle unexpected errors', async () => {
      mockCreateClient.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: false,
        authenticated: false,
        error: 'Database connection failed',
      });
    });
  });

  describe('PUT /api/auth/strava/token', () => {
    it('should successfully refresh tokens', async () => {
      // Mock successful token refresh
      const mockAuthData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_at: 1234567890,
        expires_in: 21600,
        athlete: {
          id: 12345,
          firstname: 'John',
          lastname: 'Doe',
          profile: 'https://example.com/profile.jpg',
        },
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockAuthData),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Mock user with existing tokens
      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  refresh_token: 'old-refresh-token',
                },
                error: null,
              }),
            }),
          }),
          upsert: jest.fn().mockResolvedValue({ error: null }),
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        athlete: mockAuthData.athlete,
      });

      // Verify Strava API call
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.strava.com/oauth/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: 'old-refresh-token',
          }),
        }
      );
    });

    it('should handle unauthenticated user', async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };

      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'No authenticated user found',
      });
    });

    it('should handle missing tokens', async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'No tokens found' },
              }),
            }),
          }),
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'No Strava tokens found. Please reconnect your account.',
      });
    });

    it('should handle Strava API refresh failure', async () => {
      // Mock failed token refresh
      const mockResponse = {
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Invalid refresh token'),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  refresh_token: 'invalid-refresh-token',
                },
                error: null,
              }),
            }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Token refresh failed: 400 - Invalid refresh token',
        retryable: true,
      });
    });

    it('should handle database storage error', async () => {
      // Mock successful token refresh
      const mockAuthData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_at: 1234567890,
        expires_in: 21600,
        athlete: {
          id: 12345,
          firstname: 'John',
          lastname: 'Doe',
          profile: 'https://example.com/profile.jpg',
        },
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockAuthData),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  refresh_token: 'old-refresh-token',
                },
                error: null,
              }),
            }),
          }),
          upsert: jest.fn().mockResolvedValue({
            error: { message: 'Database error' },
          }),
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to store refreshed tokens',
      });
    });
  });

  describe('POST /api/auth/strava/token', () => {
    it('should successfully exchange authorization code for tokens', async () => {
      // Mock successful token exchange
      const mockAuthData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_at: 1234567890,
        expires_in: 21600,
        athlete: {
          id: 12345,
          firstname: 'John',
          lastname: 'Doe',
          profile: 'https://example.com/profile.jpg',
        },
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockAuthData),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          upsert: jest.fn().mockResolvedValue({ error: null }),
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      const request = new Request(
        'http://localhost:3000/api/auth/strava/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: 'test-authorization-code' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        athlete: mockAuthData.athlete,
      });

      // Verify Strava API call
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.strava.com/oauth/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            code: 'test-authorization-code',
            grant_type: 'authorization_code',
          }),
        }
      );
    });

    it('should handle missing authorization code', async () => {
      const request = new Request(
        'http://localhost:3000/api/auth/strava/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Authorization code is required',
      });
    });

    it('should handle empty request body', async () => {
      const request = new Request(
        'http://localhost:3000/api/auth/strava/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: '',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid request body format',
      });
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new Request(
        'http://localhost:3000/api/auth/strava/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: 'invalid json',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid request body format',
      });
    });

    it('should handle unauthenticated user', async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };

      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      const request = new Request(
        'http://localhost:3000/api/auth/strava/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: 'test-code' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: 'No authenticated user found',
      });
    });

    it('should handle Strava API errors', async () => {
      // Mock failed token exchange
      const mockResponse = {
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Invalid authorization code'),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
        },
      };

      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      const request = new Request(
        'http://localhost:3000/api/auth/strava/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: 'invalid-code' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Strava API error: 400 - Invalid authorization code',
      });
    });

    it('should handle database storage error', async () => {
      // Mock successful token exchange
      const mockAuthData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_at: 1234567890,
        expires_in: 21600,
        athlete: {
          id: 12345,
          firstname: 'John',
          lastname: 'Doe',
          profile: 'https://example.com/profile.jpg',
        },
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockAuthData),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const mockSupabaseClient = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          upsert: jest.fn().mockResolvedValue({
            error: { message: 'Database error' },
          }),
        }),
      };

      mockCreateClient.mockResolvedValue(mockSupabaseClient as any);

      const request = new Request(
        'http://localhost:3000/api/auth/strava/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: 'test-code' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to store Strava tokens in database',
      });
    });

    it('should handle unexpected errors', async () => {
      mockCreateClient.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new Request(
        'http://localhost:3000/api/auth/strava/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: 'test-code' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Database connection failed',
      });
    });
  });
});
