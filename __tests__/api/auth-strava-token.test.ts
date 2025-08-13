jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET, POST, PUT } from '@/app/api/auth/strava/token/route';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Mock dependencies
jest.mock('@/lib/supabase/server');

// Ensure cookies is a Jest mock function
import * as headers from 'next/headers';

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockCookies = cookies as jest.MockedFunction<typeof cookies>;

// Mock console methods to reduce test noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

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

// Mock Strava API responses
const mockStravaAuthResponse = {
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

const mockStravaErrorResponse = {
  message: 'invalid_grant',
  errors: [{ resource: 'AuthorizationCode', field: 'code', code: 'invalid' }],
};

describe('/api/auth/strava/token', () => {
  beforeAll(() => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'test' });
  });
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock global fetch
    global.fetch = jest.fn();

    // Suppress console output during tests
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('GET /api/auth/strava/token', () => {
    it('should return authentication status when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: false,
        authenticated: false,
        message: 'No authenticated user found',
      });
    });

    it('should return user status when authenticated but no Strava tokens', async () => {
      const mockUser = createMockUser();
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows returned' },
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
        authenticated: true,
        user_id: 'test-user-id',
        has_strava_tokens: false,
        athlete: null,
      });
    });

    it('should return user status with Strava athlete info when connected', async () => {
      const mockUser = createMockUser();
      const mockTokens = {
        strava_athlete_id: 12345,
        athlete_firstname: 'John',
        athlete_lastname: 'Doe',
      };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTokens,
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
        authenticated: true,
        user_id: 'test-user-id',
        has_strava_tokens: true,
        athlete: {
          id: 12345,
          name: 'John Doe',
        },
      });
    });

    it('should handle authentication errors', async () => {
      const authError = { message: 'Authentication failed' };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: authError,
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

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

  describe('POST /api/auth/strava/token', () => {
    const createPostRequest = (body: any) => {
      return new NextRequest('http://localhost:3000/api/auth/strava/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    };

    it('should return 400 when request body is empty', async () => {
      const request = new NextRequest(
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
      expect(data).toEqual({ error: 'Invalid request body format' });
    });

    it('should return 400 when request body is invalid JSON', async () => {
      const request = new NextRequest(
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
      expect(data).toEqual({ error: 'Invalid request body format' });
    });

    it('should return 400 when no authorization code is provided', async () => {
      const request = createPostRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Authorization code is required' });
    });

    it('should return 401 when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const request = createPostRequest({ code: 'test-auth-code' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'No authenticated user found' });
    });

    it('should successfully exchange code for tokens', async () => {
      const mockUser = createMockUser();
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          upsert: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      // Mock cookies
      const mockCookieStore = {
        set: jest.fn(),
      };
      (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

      // Mock Strava API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockStravaAuthResponse),
      });

      const request = createPostRequest({ code: 'test-auth-code' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        athlete: mockStravaAuthResponse.athlete,
      });

      // Verify Strava API was called correctly
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
            code: 'test-auth-code',
            grant_type: 'authorization_code',
          }),
        }
      );

      // Verify tokens were stored
      expect(mockSupabase.from).toHaveBeenCalledWith('strava_tokens');
      expect(mockSupabase.from().upsert).toHaveBeenCalledWith(
        {
          user_id: 'test-user-id',
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          token_type: 'Bearer',
          expires_at: expect.any(String),
          expires_in: 21600,
          strava_athlete_id: 12345,
          athlete_firstname: 'John',
          athlete_lastname: 'Doe',
          athlete_profile: 'https://example.com/profile.jpg',
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        }
      );

      // Verify cookie was set
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'strava_connected',
        'true',
        {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
        }
      );
    });

    it('should return error when Strava API returns error', async () => {
      const mockUser = createMockUser();
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      // Mock Strava API error response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify(mockStravaErrorResponse)),
      });

      const request = createPostRequest({ code: 'invalid-code' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error:
          'Strava API error: 400 - {"message":"invalid_grant","errors":[{"resource":"AuthorizationCode","field":"code","code":"invalid"}]}',
      });
    });

    it('should return 500 when token storage fails', async () => {
      const mockUser = createMockUser();
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          upsert: jest.fn().mockResolvedValue({
            error: { message: 'Database error' },
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      // Mock Strava API success response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockStravaAuthResponse),
      });

      const request = createPostRequest({ code: 'test-auth-code' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to store Strava tokens in database',
      });
    });

    it('should handle unexpected errors', async () => {
      mockCreateClient.mockRejectedValue(new Error('Unexpected error'));

      const request = createPostRequest({ code: 'test-auth-code' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Unexpected error' });
    });
  });

  describe('PUT /api/auth/strava/token', () => {
    it('should return 401 when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'No authenticated user found',
      });
    });

    it('should return 404 when no Strava tokens found', async () => {
      const mockUser = createMockUser();
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows returned' },
              }),
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'No Strava tokens found. Please reconnect your account.',
      });
    });

    it('should successfully refresh tokens', async () => {
      const mockUser = createMockUser();
      const mockTokens = {
        user_id: 'test-user-id',
        access_token: 'old-access-token',
        refresh_token: 'old-refresh-token',
        token_type: 'Bearer',
        expires_at: '2024-01-01T00:00:00Z',
        expires_in: 21600,
        strava_athlete_id: 12345,
        athlete_firstname: 'John',
        athlete_lastname: 'Doe',
        athlete_profile: 'https://example.com/profile.jpg',
      };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTokens,
                error: null,
              }),
            }),
          }),
          upsert: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      // Mock Strava API success response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockStravaAuthResponse),
      });

      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        athlete: mockStravaAuthResponse.athlete,
      });

      // Verify Strava API was called correctly
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

      // Verify tokens were updated
      expect(mockSupabase.from).toHaveBeenCalledWith('strava_tokens');
      expect(mockSupabase.from().upsert).toHaveBeenCalledWith(
        {
          user_id: 'test-user-id',
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          token_type: 'Bearer',
          expires_at: expect.any(String),
          expires_in: 21600,
          strava_athlete_id: 12345,
          athlete_firstname: 'John',
          athlete_lastname: 'Doe',
          athlete_profile: 'https://example.com/profile.jpg',
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        }
      );
    });

    it('should delete tokens when refresh fails', async () => {
      const mockUser = createMockUser();
      const mockTokens = {
        user_id: 'test-user-id',
        refresh_token: 'invalid-refresh-token',
      };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTokens,
                error: null,
              }),
            }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      // Mock Strava API error response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('invalid_grant'),
      });

      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Token refresh failed. Please reconnect your Strava account.',
      });

      // Verify tokens were deleted
      expect(mockSupabase.from).toHaveBeenCalledWith('strava_tokens');
      expect(mockSupabase.from().delete).toHaveBeenCalled();
      expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith(
        'user_id',
        'test-user-id'
      );
    });

    it('should return 500 when token storage fails after refresh', async () => {
      const mockUser = createMockUser();
      const mockTokens = {
        user_id: 'test-user-id',
        refresh_token: 'valid-refresh-token',
      };
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTokens,
                error: null,
              }),
            }),
          }),
          upsert: jest.fn().mockResolvedValue({
            error: { message: 'Database error' },
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      // Mock Strava API success response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockStravaAuthResponse),
      });

      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to store refreshed tokens',
      });
    });

    it('should handle unexpected errors', async () => {
      mockCreateClient.mockRejectedValue(new Error('Unexpected error'));

      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Unexpected error',
        retryable: true,
      });
    });
  });
});
