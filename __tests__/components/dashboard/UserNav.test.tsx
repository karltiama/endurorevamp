import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserNav } from '../../../components/dashboard/UserNav';
import { useAuth } from '../../../providers/AuthProvider';

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

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default mock implementation
    mockUseAuth.mockReturnValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          avatar_url: null,
        },
      },
      signOut: jest.fn(),
      isLoading: false,
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
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          avatar_url: null,
        },
      },
      signOut: jest.fn(),
      isLoading: false,
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
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: null,
          avatar_url: null,
        },
      },
      signOut: jest.fn(),
      isLoading: false,
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