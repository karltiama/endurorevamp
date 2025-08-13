import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFavoriteActivity } from '@/hooks/useFavoriteActivity';

// Mock fetch
global.fetch = jest.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useFavoriteActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should toggle favorite status successfully', async () => {
    const mockResponse = {
      is_favorite: true,
      message: 'Activity added to favorites',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useFavoriteActivity(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isToggling).toBe(false);

    await act(async () => {
      await result.current.toggleFavorite(12345);
    });

    expect(fetch).toHaveBeenCalledWith('/api/activities/12345/favorite', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(result.current.isToggling).toBe(false);
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useFavoriteActivity(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.toggleFavorite(12345);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error toggling favorite:',
      expect.any(Error)
    );
    expect(result.current.isToggling).toBe(false);

    consoleSpy.mockRestore();
  });

  it('should handle network errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useFavoriteActivity(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.toggleFavorite(12345);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error toggling favorite:',
      expect.any(Error)
    );
    expect(result.current.isToggling).toBe(false);

    consoleSpy.mockRestore();
  });

  it('should set isToggling state correctly during API call', async () => {
    // Mock a delayed response
    (fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({ ok: true, json: async () => ({ is_favorite: true }) }),
            100
          )
        )
    );

    const { result } = renderHook(() => useFavoriteActivity(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isToggling).toBe(false);

    // Start the toggle
    act(() => {
      result.current.toggleFavorite(12345);
    });

    // Should be toggling immediately
    expect(result.current.isToggling).toBe(true);

    // Wait for completion
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Should be done
    expect(result.current.isToggling).toBe(false);
  });
});
