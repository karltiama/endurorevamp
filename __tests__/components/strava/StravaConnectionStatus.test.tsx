import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StravaConnectionStatus } from '@/components/strava/StravaConnectionStatus';
import { useStravaConnection } from '@/hooks/strava/useStravaConnection';
import { getStravaAuthUrl } from '@/lib/strava';

// Mock the hooks and functions
jest.mock('@/hooks/strava/useStravaConnection');
jest.mock('@/lib/strava');
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

const mockUseStravaConnection = useStravaConnection as jest.MockedFunction<typeof useStravaConnection>;
const mockGetStravaAuthUrl = getStravaAuthUrl as jest.MockedFunction<typeof getStravaAuthUrl>;

describe('StravaConnectionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStravaAuthUrl.mockReturnValue('https://www.strava.com/oauth/authorize?client_id=test');
  });

  describe('Connection Status Display', () => {
    it('should show loading state when checking connection', () => {
      mockUseStravaConnection.mockReturnValue({
        connectionStatus: null,
        isLoading: true,
        error: null,
        refreshStatus: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<StravaConnectionStatus />);

      expect(screen.getByText('Checking connection status...')).toBeInTheDocument();
    });

    it('should show not connected state when no connection exists', () => {
      mockUseStravaConnection.mockReturnValue({
        connectionStatus: { connected: false },
        isLoading: false,
        error: null,
        refreshStatus: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<StravaConnectionStatus />);

      expect(screen.getByText('Not Connected')).toBeInTheDocument();
      expect(screen.getByText('Connect to start syncing your activities')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /connect to strava/i })).toBeInTheDocument();
    });

    it('should show connected state when connection exists', () => {
      mockUseStravaConnection.mockReturnValue({
        connectionStatus: {
          connected: true,
          athlete: {
            id: 123,
            firstname: 'John',
            lastname: 'Doe',
            profile: 'https://example.com/profile.jpg',
          },
        },
        isLoading: false,
        error: null,
        refreshStatus: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<StravaConnectionStatus />);

      expect(screen.getByText('Connected to Strava')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    });

    it('should show error state when connection check fails', () => {
      mockUseStravaConnection.mockReturnValue({
        connectionStatus: null,
        isLoading: false,
        error: 'Failed to check connection status',
        refreshStatus: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<StravaConnectionStatus />);

      expect(screen.getByText('Failed to check connection status')).toBeInTheDocument();
    });
  });

  describe('Connect Button', () => {
    it('should call getStravaAuthUrl when connect button is clicked', () => {
      mockUseStravaConnection.mockReturnValue({
        connectionStatus: { connected: false },
        isLoading: false,
        error: null,
        refreshStatus: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<StravaConnectionStatus />);

      const connectButton = screen.getByRole('button', { name: /connect to strava/i });
      fireEvent.click(connectButton);

      expect(mockGetStravaAuthUrl).toHaveBeenCalled();
    });
  });

  describe('Disconnect Button', () => {
    it('should call disconnect function when disconnect button is clicked', async () => {
      const mockDisconnect = jest.fn();
      mockUseStravaConnection.mockReturnValue({
        connectionStatus: {
          connected: true,
          athlete: {
            id: 123,
            firstname: 'John',
            lastname: 'Doe',
            profile: 'https://example.com/profile.jpg',
          },
        },
        isLoading: false,
        error: null,
        refreshStatus: jest.fn(),
        disconnect: mockDisconnect,
      });

      render(<StravaConnectionStatus />);

      const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(mockDisconnect).toHaveBeenCalled();
      });
    });
  });

  describe('Component Notes', () => {
    it('should not process OAuth codes (handled by StravaOAuthHandler)', () => {
      // This test documents that OAuth processing has been moved to StravaOAuthHandler
      // StravaConnectionStatus now only handles display and manual actions
      mockUseStravaConnection.mockReturnValue({
        connectionStatus: { connected: false },
        isLoading: false,
        error: null,
        refreshStatus: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<StravaConnectionStatus />);

      // Component should render without any OAuth processing
      expect(screen.getByText('Not Connected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /connect to strava/i })).toBeInTheDocument();
    });
  });
}); 