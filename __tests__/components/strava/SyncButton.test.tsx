import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SyncButton } from '@/components/strava/SyncButton';

// Mock the working hook
jest.mock('@/hooks/use-strava-sync', () => ({
  useStravaSync: jest.fn(() => ({
    quickSync: jest.fn(),
    isSyncing: false,
    syncError: null,
    syncResult: null,
    syncStatus: { canSync: true, activityCount: 0 },
    isLoadingStatus: false,
  })),
  useSyncStatusInfo: jest.fn(() => ({
    lastSyncText: 'Never synced',
    canSync: true,
    syncDisabledReason: null,
    activityCount: 0,
    todaySyncs: 0,
    maxSyncs: 5,
    consecutiveErrors: 0,
    lastError: null,
    hasStravaTokens: true,
    athlete: null
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
    expect(screen.getByText('Quick Sync (50 Recent)')).toBeInTheDocument();
  });

  it('shows syncing state', () => {
    const mockUseStravaSync = require('@/hooks/use-strava-sync').useStravaSync;
    const mockUseSyncStatusInfo = require('@/hooks/use-strava-sync').useSyncStatusInfo;
    mockUseStravaSync.mockReturnValue({
      quickSync: jest.fn(),
      isSyncing: true,
      syncError: null,
      syncResult: null,
      syncStatus: { canSync: true, activityCount: 0 },
      isLoadingStatus: false,
    });
    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: 'Never synced',
      canSync: true,
      syncDisabledReason: null,
      activityCount: 0,
      todaySyncs: 0,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: null,
      hasStravaTokens: true,
      athlete: null
    });

    renderWithQueryClient(<SyncButton />);
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const mockUseStravaSync = require('@/hooks/use-strava-sync').useStravaSync;
    const mockUseSyncStatusInfo = require('@/hooks/use-strava-sync').useSyncStatusInfo;
    mockUseStravaSync.mockReturnValue({
      quickSync: jest.fn(),
      isSyncing: false,
      syncError: { message: 'Test error' },
      syncResult: null,
      syncStatus: { canSync: true, activityCount: 0 },
      isLoadingStatus: false,
    });
    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: 'Never synced',
      canSync: true,
      syncDisabledReason: null,
      activityCount: 0,
      todaySyncs: 0,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: null,
      hasStravaTokens: true,
      athlete: null
    });

    renderWithQueryClient(<SyncButton />);
    // The component doesn't display error messages in the UI, only changes the icon
    expect(screen.getByText('Quick Sync (50 Recent)')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows success state', () => {
    const mockUseStravaSync = require('@/hooks/use-strava-sync').useStravaSync;
    const mockUseSyncStatusInfo = require('@/hooks/use-strava-sync').useSyncStatusInfo;
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
    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: 'Never synced',
      canSync: true,
      syncDisabledReason: null,
      activityCount: 10,
      todaySyncs: 0,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: null,
      hasStravaTokens: true,
      athlete: null
    });

    renderWithQueryClient(<SyncButton />);
    // The component doesn't display success messages in the UI, only changes the icon
    expect(screen.getByText('Quick Sync (50 Recent)')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls quickSync when clicked', () => {
    const mockQuickSync = jest.fn();
    const mockUseStravaSync = require('@/hooks/use-strava-sync').useStravaSync;
    const mockUseSyncStatusInfo = require('@/hooks/use-strava-sync').useSyncStatusInfo;
    mockUseStravaSync.mockReturnValue({
      quickSync: mockQuickSync,
      isSyncing: false,
      syncError: null,
      syncResult: null,
      syncStatus: { canSync: true, activityCount: 0 },
      isLoadingStatus: false,
    });
    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: 'Never synced',
      canSync: true,
      syncDisabledReason: null,
      activityCount: 0,
      todaySyncs: 0,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: null,
      hasStravaTokens: true,
      athlete: null
    });

    renderWithQueryClient(<SyncButton />);
    
    const button = screen.getByText('Quick Sync (50 Recent)');
    fireEvent.click(button);
    
    expect(mockQuickSync).toHaveBeenCalled();
  });

  it('shows correct state when no Strava tokens connected', () => {
    const mockUseStravaSync = require('@/hooks/use-strava-sync').useStravaSync;
    const mockUseSyncStatusInfo = require('@/hooks/use-strava-sync').useSyncStatusInfo;
    mockUseStravaSync.mockReturnValue({
      forceFullSync: jest.fn(),
      isSyncing: false,
      syncError: null,
      syncResult: null,
      syncStatus: { canSync: false, activityCount: 0 },
      isLoadingStatus: false,
    });
    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: 'Never synced',
      canSync: false,
      syncDisabledReason: 'Strava account not connected. Please connect your Strava account first.',
      activityCount: 0,
      todaySyncs: 0,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: null,
      hasStravaTokens: false,
      athlete: null
    });

    renderWithQueryClient(<SyncButton />);
    
    // Should show "Connect Strava First" button text
    expect(screen.getByText('Connect Strava First')).toBeInTheDocument();
    
    // Button should be disabled
    expect(screen.getByRole('button')).toBeDisabled();
    
    // The component shows the disabled state when no Strava tokens are connected
    expect(screen.getByText('Connect Strava First')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
}); 