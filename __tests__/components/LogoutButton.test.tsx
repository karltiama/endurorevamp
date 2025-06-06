import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LogoutButton from '@/components/LogoutButton'
import { useAuth } from '@/providers/AuthProvider'

// Mock the auth provider
jest.mock('@/providers/AuthProvider')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('LogoutButton', () => {
  const mockSignOut = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render sign out button when not loading', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' } as any,
      isLoading: false,
      isAuthenticated: true,
      signOut: mockSignOut,
      refreshUser: jest.fn(),
    })

    render(<LogoutButton />)

    const button = screen.getByRole('button', { name: /sign out/i })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('should render signing out text when loading', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' } as any,
      isLoading: true,
      isAuthenticated: true,
      signOut: mockSignOut,
      refreshUser: jest.fn(),
    })

    render(<LogoutButton />)

    const button = screen.getByRole('button', { name: /signing out/i })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('should call signOut when clicked', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' } as any,
      isLoading: false,
      isAuthenticated: true,
      signOut: mockSignOut,
      refreshUser: jest.fn(),
    })

    render(<LogoutButton />)

    const button = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })

  it('should be disabled when loading', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' } as any,
      isLoading: true,
      isAuthenticated: true,
      signOut: mockSignOut,
      refreshUser: jest.fn(),
    })

    render(<LogoutButton />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
}) 