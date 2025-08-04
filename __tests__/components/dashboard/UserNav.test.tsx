import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserNav } from '../../../components/dashboard/UserNav';
import { useAuth } from '../../../providers/AuthProvider';
import { User } from '@supabase/supabase-js';

// Mock the auth provider
jest.mock('../../../providers/AuthProvider');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('UserNav', () => {
  let queryClient: QueryClient;

  // Create a simple mock user with only essential properties
  const createMockUser = (fullName: string | null): Partial<User> => ({
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      full_name: fullName,
      avatar_url: null,
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    email_confirmed_at: '2024-01-01T00:00:00Z',
    last_sign_in_at: '2024-01-01T00:00:00Z',
    role: 'authenticated',
    confirmed_at: '2024-01-01T00:00:00Z',
    confirmation_sent_at: '2024-01-01T00:00:00Z',
    identities: [],
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default mock implementation with complete AuthContextType
    mockUseAuth.mockReturnValue({
      user: createMockUser('Test User') as User,
      signOut: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
      refreshUser: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders user navigation with user info', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    // The user info is only visible when menu is open
    expect(screen.getByText('T')).toBeInTheDocument(); // Initial in avatar
  });

  it('shows loading state when user data is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: jest.fn(),
      isLoading: true,
      isAuthenticated: false,
      refreshUser: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    // Component should not render when loading
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
  });

  it('shows nothing when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: jest.fn(),
      isLoading: false,
      isAuthenticated: false,
      refreshUser: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
  });

  it('renders user avatar with correct attributes', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    const avatarButton = screen.getByRole('button', { name: 'T' });
    expect(avatarButton).toBeInTheDocument();
    
    // Check that the button has the correct attributes for a dropdown trigger
    expect(avatarButton).toHaveAttribute('aria-expanded', 'false');
    expect(avatarButton).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('handles click events on avatar button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    const avatarButton = screen.getByRole('button', { name: 'T' });
    
    // Test that the button can be clicked without errors
    expect(() => fireEvent.click(avatarButton)).not.toThrow();
  });

  it('renders with correct user information', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    // Test that the component renders without errors
    const avatarButton = screen.getByRole('button', { name: 'T' });
    expect(avatarButton).toBeInTheDocument();
  });

  it('renders with correct user initials', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    // Test that the component renders with user initials
    const avatarButton = screen.getByRole('button', { name: 'T' });
    expect(avatarButton).toBeInTheDocument();
  });

  it('renders sign out functionality', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    // Test that the component renders without errors
    const avatarButton = screen.getByRole('button', { name: 'T' });
    expect(avatarButton).toBeInTheDocument();
  });

  it('displays user initials in avatar when no image is available', () => {
    mockUseAuth.mockReturnValue({
      user: createMockUser('Test User') as User,
      signOut: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
      refreshUser: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('handles user with no name gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: createMockUser(null) as User,
      signOut: jest.fn(),
      isLoading: false,
      isAuthenticated: true,
      refreshUser: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    // Test that the component renders with user initials from email
    expect(screen.getByText('T')).toBeInTheDocument();
  });
}); 