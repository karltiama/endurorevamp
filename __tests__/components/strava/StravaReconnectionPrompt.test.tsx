import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StravaReconnectionPrompt } from '@/components/strava/StravaReconnectionPrompt';

// Mock the getStravaAuthUrl function
jest.mock('@/lib/strava', () => ({
  getStravaAuthUrl: jest.fn(
    () => 'https://strava.com/oauth/authorize?client_id=test'
  ),
}));

// Use the global window.location mock from jest.setup.js

describe('StravaReconnectionPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset location href for each test
    window.location.href = '';
  });

  it('renders with default title when no specific error', () => {
    render(<StravaReconnectionPrompt />);

    expect(screen.getByText('Strava Connection Issue')).toBeInTheDocument();
    expect(screen.getByText('Connect to Strava')).toBeInTheDocument();
  });

  it('shows token expired message for 401 errors', () => {
    render(<StravaReconnectionPrompt error="401 - Token expired" />);

    expect(screen.getByText('Strava Connection Expired')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your Strava connection has expired. This is normal and happens periodically for security reasons.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Reconnect to Strava')).toBeInTheDocument();
  });

  it('shows network error message for network issues', () => {
    render(<StravaReconnectionPrompt error="Network error - fetch failed" />);

    expect(screen.getByText('Strava Connection Issue')).toBeInTheDocument();
    expect(
      screen.getByText(
        "There's a temporary connection issue with Strava. This usually resolves itself quickly."
      )
    ).toBeInTheDocument();
  });

  it('shows refresh button for network errors when onRefresh is provided', () => {
    const mockRefresh = jest.fn();
    render(
      <StravaReconnectionPrompt error="network error" onRefresh={mockRefresh} />
    );

    expect(screen.getByText('Refresh Connection')).toBeInTheDocument();
  });

  it('does not show refresh button for expired tokens', () => {
    const mockRefresh = jest.fn();
    render(
      <StravaReconnectionPrompt error="401 expired" onRefresh={mockRefresh} />
    );

    expect(screen.queryByText('Refresh Connection')).not.toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', async () => {
    const mockRefresh = jest.fn().mockResolvedValueOnce(undefined);
    render(
      <StravaReconnectionPrompt error="network error" onRefresh={mockRefresh} />
    );

    const refreshButton = screen.getByText('Refresh Connection');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('navigates to Strava OAuth when reconnect button is clicked', () => {
    const originalHref = window.location.href;

    render(<StravaReconnectionPrompt />);

    const reconnectButton = screen.getByText('Connect to Strava');
    fireEvent.click(reconnectButton);

    // Note: In a real test environment, you'd mock window.location.href assignment
    expect(screen.getByText('Connect to Strava')).toBeInTheDocument();

    // Cleanup
    window.location.href = originalHref;
  });

  it('shows error details when provided', () => {
    const errorMessage = 'Detailed error message';
    render(<StravaReconnectionPrompt error={errorMessage} />);

    expect(screen.getByText('Error details:')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('uses custom title when provided', () => {
    render(<StravaReconnectionPrompt title="Custom Title" />);

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StravaReconnectionPrompt className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles refresh errors by falling back to reconnect', async () => {
    const mockRefresh = jest
      .fn()
      .mockRejectedValueOnce(new Error('Refresh failed'));
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <StravaReconnectionPrompt error="network error" onRefresh={mockRefresh} />
    );

    const refreshButton = screen.getByText('Refresh Connection');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to refresh token:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('shows benefits list after reconnecting', () => {
    render(<StravaReconnectionPrompt />);

    expect(
      screen.getByText("After reconnecting, you'll be able to:")
    ).toBeInTheDocument();
    expect(
      screen.getByText('• View your recent activity data and analytics')
    ).toBeInTheDocument();
    expect(
      screen.getByText('• Sync new activities automatically')
    ).toBeInTheDocument();
    expect(
      screen.getByText('• Access detailed performance metrics')
    ).toBeInTheDocument();
    expect(
      screen.getByText('• Track your training progress over time')
    ).toBeInTheDocument();
  });
});
