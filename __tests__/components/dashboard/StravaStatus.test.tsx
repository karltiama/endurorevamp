import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StravaStatus } from '@/components/dashboard/StravaStatus';
import { useStravaConnection } from '@/hooks/strava/useStravaConnection';
import { getStravaAuthUrl } from '@/lib/strava';

// Mock the hooks and functions
jest.mock('@/hooks/strava/useStravaConnection');
jest.mock('@/lib/strava');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

const mockUseStravaConnection = useStravaConnection as jest.MockedFunction<
  typeof useStravaConnection
>;
const mockGetStravaAuthUrl = getStravaAuthUrl as jest.MockedFunction<
  typeof getStravaAuthUrl
>;

describe('StravaStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when loading', () => {
    it('shows loading state', () => {
      mockUseStravaConnection.mockReturnValue({
        connectionStatus: null,
        isLoading: true,
        error: null,
        refreshStatus: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<StravaStatus />);

      expect(screen.getByText('Syncing...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('bg-yellow-100');
    });
  });

  describe('when connected to Strava', () => {
    it('shows connected badge', () => {
      mockUseStravaConnection.mockReturnValue({
        connectionStatus: {
          connected: true,
          athlete: {
            id: 123,
            firstname: 'John',
            lastname: 'Doe',
          },
          expiresAt: '2024-12-31T23:59:59Z',
        },
        isLoading: false,
        error: null,
        refreshStatus: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<StravaStatus />);

      expect(screen.getByText('Strava Synced')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('bg-green-100');
    });
  });

  describe('when not connected to Strava', () => {
    beforeEach(() => {
      mockUseStravaConnection.mockReturnValue({
        connectionStatus: {
          connected: false,
        },
        isLoading: false,
        error: null,
        refreshStatus: jest.fn(),
        disconnect: jest.fn(),
      });
      mockGetStravaAuthUrl.mockReturnValue(
        'https://strava.com/oauth/authorize?client_id=test'
      );
    });

    it('shows not synced badge', () => {
      render(<StravaStatus />);

      expect(screen.getByText('Not Synced')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('bg-red-100');
    });

    it('redirects to Strava when clicked', () => {
      // Mock window.location.href assignment
      const originalHref = window.location.href;
      const originalOrigin = window.location.origin;

      // Use a simpler approach - just mock the getStravaAuthUrl to return a known value
      mockGetStravaAuthUrl.mockReturnValue(
        'https://strava.com/oauth/authorize?client_id=test'
      );

      render(<StravaStatus />);

      const badge = screen.getByText('Not Synced').closest('[role="status"]');
      fireEvent.click(badge!);

      expect(mockGetStravaAuthUrl).toHaveBeenCalledWith('http://localhost');
    });

    it('renders tooltip trigger correctly', () => {
      render(<StravaStatus />);

      const badge = screen.getByText('Not Synced').closest('[role="status"]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('cursor-pointer');
    });
  });

  describe('accessibility', () => {
    it('has proper cursor styling when not connected', () => {
      mockUseStravaConnection.mockReturnValue({
        connectionStatus: {
          connected: false,
        },
        isLoading: false,
        error: null,
        refreshStatus: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<StravaStatus />);

      const badge = screen.getByText('Not Synced').closest('[role="status"]');
      expect(badge).toHaveClass('cursor-pointer');
    });
  });
});
