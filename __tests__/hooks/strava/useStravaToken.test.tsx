import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useStravaToken } from '@/hooks/strava/useStravaToken'
import { useAuth } from '@/providers/AuthProvider'
import { StravaAuth } from '@/lib/strava/auth'
import { User } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('@/providers/AuthProvider')
jest.mock('@/lib/strava/auth')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const MockStravaAuth = StravaAuth as jest.MockedClass<typeof StravaAuth>

// Mock user data
const createMockUser = (id: string): User => ({
  id,
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
})

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useStravaToken', () => {
  const mockGetValidAccessToken = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup StravaAuth mock
    MockStravaAuth.mockImplementation(() => ({
      getValidAccessToken: mockGetValidAccessToken,
    } as any))
  })

  it('returns null when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      signOut: jest.fn(),
      refreshUser: jest.fn()
    })

    const { result } = renderHook(() => useStravaToken(), {
      wrapper: TestWrapper,
    })

    expect(result.current.accessToken).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetches access token when user is authenticated', async () => {
    const mockUser = createMockUser('user-123')
    const mockToken = 'access-token-123'

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      signOut: jest.fn(),
      refreshUser: jest.fn()
    })
    
    mockGetValidAccessToken.mockResolvedValue(mockToken)

    const { result } = renderHook(() => useStravaToken(), {
      wrapper: TestWrapper,
    })

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.accessToken).toBe(mockToken)
    expect(result.current.error).toBeNull()
    expect(mockGetValidAccessToken).toHaveBeenCalledWith('user-123')
  })

  it('handles errors when fetching access token', async () => {
    const mockUser = createMockUser('user-123')
    const error = new Error('Failed to get token')

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      signOut: jest.fn(),
      refreshUser: jest.fn()
    })
    
    // Mock the function to always reject (after retries)
    mockGetValidAccessToken.mockRejectedValue(error)

    const { result } = renderHook(() => useStravaToken(), {
      wrapper: TestWrapper,
    })

    // Wait for the query to finish (including retries)
    await act(async () => {
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      }, { timeout: 10000 })

      // Wait a bit more to ensure React Query has finished processing
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(result.current.accessToken).toBeNull()
    expect(result.current.error).toBe('Failed to get token')
  })

  it('can refresh token manually', async () => {
    const mockUser = createMockUser('user-123')
    const mockToken = 'new-access-token-123'

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      signOut: jest.fn(),
      refreshUser: jest.fn()
    })
    
    // First call returns null, second call returns token
    mockGetValidAccessToken
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockToken)

    const { result } = renderHook(() => useStravaToken(), {
      wrapper: TestWrapper,
    })

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.accessToken).toBeNull()

    // Manual refresh
    await result.current.refreshToken()

    await waitFor(() => {
      expect(result.current.accessToken).toBe(mockToken)
    })

    expect(mockGetValidAccessToken).toHaveBeenCalledWith('user-123')
    expect(mockGetValidAccessToken.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('clears token when user changes to null', async () => {
    const mockUser = createMockUser('user-123')
    const mockToken = 'access-token-123'

    // Initial state with user
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      signOut: jest.fn(),
      refreshUser: jest.fn()
    })
    
    mockGetValidAccessToken.mockResolvedValue(mockToken)

    const { result, rerender } = renderHook(() => useStravaToken(), {
      wrapper: TestWrapper,
    })

    // Wait for token to be loaded
    await waitFor(() => {
      expect(result.current.accessToken).toBe(mockToken)
    })

    // Change to no user
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      signOut: jest.fn(),
      refreshUser: jest.fn()
    })

    rerender()

    expect(result.current.accessToken).toBeNull()
  })
}) 