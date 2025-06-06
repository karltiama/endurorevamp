import { renderHook } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/hooks/auth/useRequireAuth'
import { useAuth } from '@/providers/AuthProvider'

// Mock dependencies
jest.mock('next/navigation')
jest.mock('@/providers/AuthProvider')

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('useRequireAuth', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: jest.fn(),
    } as any)
  })

  it('should return user data when authenticated', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
    }

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      isLoading: false,
      isAuthenticated: true,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    })

    const { result } = renderHook(() => useRequireAuth())

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isAuthenticated).toBe(true)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should redirect to login when not authenticated and not loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    })

    const { result } = renderHook(() => useRequireAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  it('should not redirect when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    })

    const { result } = renderHook(() => useRequireAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should not redirect when user exists', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
    }

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      isLoading: false,
      isAuthenticated: true,
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    })

    renderHook(() => useRequireAuth())

    expect(mockPush).not.toHaveBeenCalled()
  })
}) 