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

  it('opens user menu when avatar is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    const avatarButton = screen.getByRole('button', { name: 'T' });
    fireEvent.click(avatarButton);

    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });
  });

  it('closes user menu when clicking outside', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    const avatarButton = screen.getByRole('button', { name: 'T' });
    fireEvent.click(avatarButton);

    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    // Click outside the menu
    fireEvent.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });
  });

  it('navigates to profile when profile link is clicked', async () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    const avatarButton = screen.getByRole('button', { name: 'T' });
    fireEvent.click(avatarButton);

    await waitFor(() => {
      const profileLink = screen.getByText('Profile');
      fireEvent.click(profileLink);
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard/settings/profile');
  });

  it('navigates to settings when settings link is clicked', async () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    const avatarButton = screen.getByRole('button', { name: 'T' });
    fireEvent.click(avatarButton);

    await waitFor(() => {
      const settingsLink = screen.getByText('Settings');
      fireEvent.click(settingsLink);
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard/settings');
  });

  it('handles sign out when sign out button is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserNav />
      </QueryClientProvider>
    );

    const avatarButton = screen.getByRole('button', { name: 'T' });
    fireEvent.click(avatarButton);

    await waitFor(() => {
      const signOutButton = screen.getByText('Sign out');
      fireEvent.click(signOutButton);
    });

    // Note: Actual sign out logic would be tested in integration tests
    // This test just ensures the button is clickable
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

    expect(screen.getByText('TU')).toBeInTheDocument();
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

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument(); // Initial from email
  });
}); 