import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StravaConnectionStatus } from '@/components/strava/StravaConnectionStatus';

// Mock the hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
  })),
}));

jest.mock('@/providers/AuthProvider', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user' }
  })),
}));

jest.mock('@/hooks/strava/useStravaConnection', () => ({
  useStravaConnection: jest.fn(() => ({
    connectionStatus: { connected: false },
    isLoading: false,
    error: null,
    refreshStatus: jest.fn(),
    disconnect: jest.fn(),
  })),
  STRAVA_CONNECTION_QUERY_KEY: 'strava-connection',
}));

jest.mock('@/hooks/use-strava-sync', () => ({
  useStravaSync: jest.fn(() => ({
    syncData: jest.fn(),
    isLoading: false,
    lastSyncResult: null,
    error: null,
  })),
}));

jest.mock('@/hooks/use-strava-auth', () => ({
  useStravaAuth: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));

jest.mock('@/hooks/strava/useStravaToken', () => ({
  useStravaToken: jest.fn(() => ({
    accessToken: null,
  })),
  STRAVA_TOKEN_QUERY_KEY: 'strava-token',
}));

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

describe('StravaConnectionStatus OAuth Callback', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should handle OAuth callback with authorization code', async () => {
    const mockExchangeToken = jest.fn();
    const mockRouter = { replace: jest.fn() };
    
    // Mock search params with OAuth code
    mockUseSearchParams.mockReturnValue({
      get: jest.fn((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      }),
    } as any);

    // Mock the hooks
    require('@/hooks/use-strava-auth').useStravaAuth.mockReturnValue({
      mutate: mockExchangeToken,
      isPending: false,
    });

    require('next/navigation').useRouter.mockReturnValue(mockRouter);

    renderWithQueryClient(<StravaConnectionStatus />);

    await waitFor(() => {
      expect(mockExchangeToken).toHaveBeenCalledWith(
        'test-oauth-code',
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    // Verify URL cleanup happens immediately
    expect(mockRouter.replace).toHaveBeenCalled();
  });

  it('should handle OAuth error from Strava', async () => {
    const mockRouter = { replace: jest.fn() };
    
    // Mock search params with OAuth error
    mockUseSearchParams.mockReturnValue({
      get: jest.fn((key: string) => {
        if (key === 'error') return 'access_denied';
        if (key === 'error_description') return 'User denied access';
        return null;
      }),
    } as any);

    require('next/navigation').useRouter.mockReturnValue(mockRouter);

    renderWithQueryClient(<StravaConnectionStatus />);

    await waitFor(() => {
      expect(screen.getByText(/User denied access/)).toBeInTheDocument();
    });

    // Verify URL cleanup
    expect(mockRouter.replace).toHaveBeenCalled();
  });

  it('should not process OAuth code when already connected', () => {
    const mockExchangeToken = jest.fn();
    
    // Mock search params with OAuth code
    mockUseSearchParams.mockReturnValue({
      get: jest.fn((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      }),
    } as any);

    // Mock connection status as already connected
    require('@/hooks/strava/useStravaConnection').useStravaConnection.mockReturnValue({
      connectionStatus: { connected: true },
      isLoading: false,
      error: null,
      refreshStatus: jest.fn(),
      disconnect: jest.fn(),
    });

    require('@/hooks/use-strava-auth').useStravaAuth.mockReturnValue({
      mutate: mockExchangeToken,
      isPending: false,
    });

    renderWithQueryClient(<StravaConnectionStatus />);

    // Should not call exchangeToken when already connected
    expect(mockExchangeToken).not.toHaveBeenCalled();
  });

  it('should not process OAuth code when already in progress', () => {
    const mockExchangeToken = jest.fn();
    
    // Mock search params with OAuth code
    mockUseSearchParams.mockReturnValue({
      get: jest.fn((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      }),
    } as any);

    // Mock auth as in progress
    require('@/hooks/use-strava-auth').useStravaAuth.mockReturnValue({
      mutate: mockExchangeToken,
      isPending: true,
    });

    renderWithQueryClient(<StravaConnectionStatus />);

    // Should not call exchangeToken when already in progress
    expect(mockExchangeToken).not.toHaveBeenCalled();
  });

  it('should invalidate query cache on successful OAuth', async () => {
    const mockExchangeToken = jest.fn();
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
    
    // Mock search params with OAuth code
    mockUseSearchParams.mockReturnValue({
      get: jest.fn((key: string) => {
        if (key === 'code') return 'test-oauth-code';
        return null;
      }),
    } as any);

    // Make sure connection status is not connected to allow OAuth processing
    require('@/hooks/strava/useStravaConnection').useStravaConnection.mockReturnValue({
      connectionStatus: { connected: false },
      isLoading: false,
      error: null,
      refreshStatus: jest.fn(),
      disconnect: jest.fn(),
    });

    require('@/hooks/use-strava-auth').useStravaAuth.mockReturnValue({
      mutate: mockExchangeToken,
      isPending: false,
    });

    renderWithQueryClient(<StravaConnectionStatus />);

    // Get the onSuccess callback that was passed to exchangeToken
    await waitFor(() => {
      expect(mockExchangeToken).toHaveBeenCalled();
    });

    const onSuccessCallback = mockExchangeToken.mock.calls[0][1].onSuccess;
    
    // Simulate successful OAuth with act() wrapper
    await act(async () => {
      await onSuccessCallback({ success: true, athlete: { id: 123 } });
    });

    // Verify cache invalidation
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['strava', 'connection'],
    });
  });
}); 