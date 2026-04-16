import { GET as startOAuth } from '@/app/api/auth/strava/start/route';
import { GET as callbackOAuth } from '@/app/api/auth/strava/callback/route';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');

type MockRequest = {
  url: string;
  nextUrl: URL;
  cookies: {
    get: (name: string) => { value: string } | undefined;
  };
};

function makeRequest(url: string, stateCookie?: string): MockRequest {
  return {
    url,
    nextUrl: new URL(url),
    cookies: {
      get: (name: string) =>
        name === 'strava_oauth_state' && stateCookie
          ? { value: stateCookie }
          : undefined,
    },
  };
}

describe('Strava OAuth server routes', () => {
  const originalEnv = process.env;
  const mockCreateClient = createClient as jest.MockedFunction<
    typeof createClient
  >;
  let setCookieMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_STRAVA_CLIENT_ID: '12345',
      STRAVA_CLIENT_SECRET: 'secret',
      NODE_ENV: 'test',
    };
    (global.fetch as jest.Mock) = jest.fn();

    setCookieMock = jest.fn();
    (NextResponse as unknown as { redirect?: unknown }).redirect = (
      url: string | URL
    ) => {
      const location = typeof url === 'string' ? url : url.toString();
      const response = NextResponse.json({}, { status: 307 });
      response.headers.set('location', location);
      (response as unknown as { cookies: { set: jest.Mock } }).cookies = {
        set: setCookieMock,
      };
      return response;
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('GET /api/auth/strava/start', () => {
    it('redirects to Strava authorize URL with callback and state', async () => {
      const request = makeRequest('http://localhost:3000/api/auth/strava/start');
      const response = await startOAuth(request as never);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toBeTruthy();

      const redirect = new URL(location!);
      expect(redirect.origin).toBe('https://www.strava.com');
      expect(redirect.pathname).toBe('/oauth/authorize');
      expect(redirect.searchParams.get('client_id')).toBe('12345');
      expect(redirect.searchParams.get('redirect_uri')).toBe(
        'http://localhost:3000/api/auth/strava/callback'
      );
      expect(redirect.searchParams.get('response_type')).toBe('code');
      expect(redirect.searchParams.get('scope')).toBe('read,activity:read_all');
      expect(redirect.searchParams.get('state')).toBeTruthy();

      expect(setCookieMock).toHaveBeenCalledTimes(1);
      expect(setCookieMock).toHaveBeenCalledWith(
        'strava_oauth_state',
        expect.any(String),
        expect.objectContaining({ httpOnly: true, sameSite: 'lax' })
      );
    });
  });

  describe('GET /api/auth/strava/callback', () => {
    it('redirects with connected on successful callback exchange', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          upsert: jest.fn().mockResolvedValue({ error: null }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as never);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'access',
          refresh_token: 'refresh',
          token_type: 'Bearer',
          expires_at: 2000000000,
          expires_in: 21600,
          athlete: {
            id: 99,
            firstname: 'Test',
            lastname: 'Athlete',
            profile: 'https://example.com/a.jpg',
          },
        }),
      });

      const request = makeRequest(
        'http://localhost:3000/api/auth/strava/callback?code=abc123&state=valid-state',
        'valid-state'
      );
      const response = await callbackOAuth(request as never);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toBeTruthy();

      const redirect = new URL(location!);
      expect(redirect.pathname).toBe('/dashboard');
      expect(redirect.searchParams.get('strava')).toBe('connected');
      expect(mockSupabase.from).toHaveBeenCalledWith('strava_tokens');
    });

    it('redirects with invalid_state when state is missing', async () => {
      const request = makeRequest(
        'http://localhost:3000/api/auth/strava/callback?code=abc123&state=xyz'
      );
      const response = await callbackOAuth(request as never);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toBeTruthy();

      const redirect = new URL(location!);
      expect(redirect.pathname).toBe('/dashboard');
      expect(redirect.searchParams.get('strava')).toBe('error');
      expect(redirect.searchParams.get('reason')).toBe('invalid_state');
    });

    it('redirects with invalid_state when state cookie is expired/missing', async () => {
      const request = makeRequest(
        'http://localhost:3000/api/auth/strava/callback?code=abc123&state=valid-state'
      );
      const response = await callbackOAuth(request as never);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toBeTruthy();

      const redirect = new URL(location!);
      expect(redirect.pathname).toBe('/dashboard');
      expect(redirect.searchParams.get('strava')).toBe('error');
      expect(redirect.searchParams.get('reason')).toBe('invalid_state');
    });

    it('redirects with invalid_state when state cookie mismatches query state', async () => {
      const request = makeRequest(
        'http://localhost:3000/api/auth/strava/callback?code=abc123&state=query-state',
        'cookie-state'
      );
      const response = await callbackOAuth(request as never);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toBeTruthy();

      const redirect = new URL(location!);
      expect(redirect.pathname).toBe('/dashboard');
      expect(redirect.searchParams.get('strava')).toBe('error');
      expect(redirect.searchParams.get('reason')).toBe('invalid_state');
    });

    it('redirects with oauth error details from provider', async () => {
      const request = makeRequest(
        'http://localhost:3000/api/auth/strava/callback?error=access_denied&error_description=Denied'
      );
      const response = await callbackOAuth(request as never);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toBeTruthy();

      const redirect = new URL(location!);
      expect(redirect.pathname).toBe('/dashboard');
      expect(redirect.searchParams.get('strava')).toBe('error');
      expect(redirect.searchParams.get('reason')).toBe('Denied');
    });

    it('redirects with unauthenticated reason when user session is missing', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase as never);

      const request = makeRequest(
        'http://localhost:3000/api/auth/strava/callback?code=abc123&state=valid-state',
        'valid-state'
      );
      const response = await callbackOAuth(request as never);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toBeTruthy();

      const redirect = new URL(location!);
      expect(redirect.pathname).toBe('/dashboard');
      expect(redirect.searchParams.get('strava')).toBe('error');
      expect(redirect.searchParams.get('reason')).toBe('unauthenticated');
    });

    it('redirects with token_exchange_failed when Strava token endpoint fails', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase as never);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('invalid_grant'),
      });

      const request = makeRequest(
        'http://localhost:3000/api/auth/strava/callback?code=abc123&state=valid-state',
        'valid-state'
      );
      const response = await callbackOAuth(request as never);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toBeTruthy();

      const redirect = new URL(location!);
      expect(redirect.pathname).toBe('/dashboard');
      expect(redirect.searchParams.get('strava')).toBe('error');
      expect(redirect.searchParams.get('reason')).toBe('token_exchange_failed');
    });

    it('redirects with token_store_failed when token persistence fails', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          upsert: jest.fn().mockResolvedValue({
            error: { message: 'db write failed' },
          }),
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase as never);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'access',
          refresh_token: 'refresh',
          token_type: 'Bearer',
          expires_at: 2000000000,
          expires_in: 21600,
          athlete: {
            id: 99,
            firstname: 'Test',
            lastname: 'Athlete',
            profile: 'https://example.com/a.jpg',
          },
        }),
      });

      const request = makeRequest(
        'http://localhost:3000/api/auth/strava/callback?code=abc123&state=valid-state',
        'valid-state'
      );
      const response = await callbackOAuth(request as never);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toBeTruthy();

      const redirect = new URL(location!);
      expect(redirect.pathname).toBe('/dashboard');
      expect(redirect.searchParams.get('strava')).toBe('error');
      expect(redirect.searchParams.get('reason')).toBe('token_store_failed');
    });

    it('redirects with callback_exception when callback throws unexpectedly', async () => {
      const request = makeRequest(
        'http://localhost:3000/api/auth/strava/callback?code=abc123&state=valid-state',
        'valid-state'
      );

      // Route uses fetch().json() for token payload; force that call to throw.
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase as never);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockImplementation(() => {
          throw new Error('Unexpected token payload failure');
        }),
      });

      const response = await callbackOAuth(request as never);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toBeTruthy();

      const redirect = new URL(location!);
      expect(redirect.pathname).toBe('/dashboard');
      expect(redirect.searchParams.get('strava')).toBe('error');
      expect(redirect.searchParams.get('reason')).toBe('callback_exception');
    });
  });
});
