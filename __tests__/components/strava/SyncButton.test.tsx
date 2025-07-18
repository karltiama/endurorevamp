import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SyncButton } from '@/components/strava/SyncButton';

// Mock the working hook
jest.mock('@/hooks/use-strava-sync', () => ({
  useStravaSync: jest.fn(() => ({
    forceFullSync: jest.fn(),
    isSyncing: false,
    syncError: null,
    syncResult: null,
    syncStatus: { canSync: true, activityCount: 0 },
    isLoadingStatus: false,
  })),
}));

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('SyncButton (Fixed)', () => {
  it('renders sync button', () => {
    renderWithQueryClient(<SyncButton />);
    expect(screen.getByText('Sync Strava Data')).toBeInTheDocument();
  });

  it('shows syncing state', () => {
    const mockUseStravaSync = require('@/hooks/use-strava-sync').useStravaSync;
    mockUseStravaSync.mockReturnValue({
      forceFullSync: jest.fn(),
      isSyncing: true,
      syncError: null,
      syncResult: null,
      syncStatus: { canSync: true, activityCount: 0 },
      isLoadingStatus: false,
    });

    renderWithQueryClient(<SyncButton />);
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const mockUseStravaSync = require('@/hooks/use-strava-sync').useStravaSync;
    mockUseStravaSync.mockReturnValue({
      forceFullSync: jest.fn(),
      isSyncing: false,
      syncError: { message: 'Test error' },
      syncResult: null,
      syncStatus: { canSync: true, activityCount: 0 },
      isLoadingStatus: false,
    });

    renderWithQueryClient(<SyncButton />);
    expect(screen.getByText('Error:')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('shows success state', () => {
    const mockUseStravaSync = require('@/hooks/use-strava-sync').useStravaSync;
    mockUseStravaSync.mockReturnValue({
      forceFullSync: jest.fn(),
      isSyncing: false,
      syncError: null,
      syncResult: {
        success: true,
        data: {
          activitiesProcessed: 5,
          newActivities: 3,
          updatedActivities: 2,
          syncDuration: 2000,
        },
      },
      syncStatus: { canSync: true, activityCount: 10 },
      isLoadingStatus: false,
    });

    renderWithQueryClient(<SyncButton />);
    expect(screen.getByText('Last Sync Results:')).toBeInTheDocument();
    expect(screen.getByText(/Activities processed:/)).toBeInTheDocument();
    expect(screen.getByText(/New activities:/)).toBeInTheDocument();
  });

  it('calls forceFullSync when clicked', () => {
    const mockForceFullSync = jest.fn();
    const mockUseStravaSync = require('@/hooks/use-strava-sync').useStravaSync;
    mockUseStravaSync.mockReturnValue({
      forceFullSync: mockForceFullSync,
      isSyncing: false,
      syncError: null,
      syncResult: null,
      syncStatus: { canSync: true, activityCount: 0 },
      isLoadingStatus: false,
    });

    renderWithQueryClient(<SyncButton />);
    
    const button = screen.getByText('Sync Strava Data');
    fireEvent.click(button);
    
    expect(mockForceFullSync).toHaveBeenCalled();
  });
}); 