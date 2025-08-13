import { renderHook } from '@testing-library/react';
import { useRequireAuth } from '@/hooks/auth/useRequireAuth';

// Get the mocked functions from global setup
const { useAuth } = require('@/providers/AuthProvider');
const { __mockRouterFunctions } = require('next/navigation');

describe('useRequireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Router functions are already mocked globally, no need to override
  });

  it('should return user data when authenticated', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
    };

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser as any,
      isLoading: false,
      isAuthenticated: true,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useRequireAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(__mockRouterFunctions.push).not.toHaveBeenCalled();
  });

  it('should redirect to login when not authenticated and not loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useRequireAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(__mockRouterFunctions.push).toHaveBeenCalledWith('/auth/login');
  });

  it('should not redirect when loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useRequireAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(__mockRouterFunctions.push).not.toHaveBeenCalled();
  });

  it('should not redirect when user exists', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
    };

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser as any,
      isLoading: false,
      isAuthenticated: true,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    });

    renderHook(() => useRequireAuth());

    expect(__mockRouterFunctions.push).not.toHaveBeenCalled();
  });
});
