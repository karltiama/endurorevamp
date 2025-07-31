import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FullSyncButton } from '@/components/strava/FullSyncButton';
import { useStravaSync, useSyncStatusInfo } from '@/hooks/use-strava-sync';

// Mock the useStravaSync hook
jest.mock('@/hooks/use-strava-sync');

const mockUseStravaSync = useStravaSync as jest.MockedFunction<typeof useStravaSync>;
const mockUseSyncStatusInfo = useSyncStatusInfo as jest.MockedFunction<typeof useSyncStatusInfo>;

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

describe('FullSyncButton', () => {
  const defaultMockReturn = {
    fullSync: jest.fn(),
    isSyncing: false,
    syncError: null,
    syncResult: null,
    syncStatus: {
      canSync: true,
      activityCount: 0,
      syncState: { sync_requests_today: 0 }
    },
    isLoadingStatus: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStravaSync.mockReturnValue(defaultMockReturn);
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
  });

  it('renders full sync button', () => {
    renderWithQueryClient(<FullSyncButton />);
    
    expect(screen.getByText('Full Sync All Activities')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows warning on first click', () => {
    renderWithQueryClient(<FullSyncButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Confirm Full Sync')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Full Sync Warning')).toBeInTheDocument();
    expect(screen.getByText(/This will fetch ALL your Strava activities/)).toBeInTheDocument();
  });

  it('calls fullSync on second click after warning', async () => {
    const mockFullSync = jest.fn();
    mockUseStravaSync.mockReturnValue({
      ...defaultMockReturn,
      fullSync: mockFullSync
    });

    renderWithQueryClient(<FullSyncButton />);
    
    const button = screen.getByRole('button');
    
    // First click shows warning
    fireEvent.click(button);
    expect(screen.getByText('Confirm Full Sync')).toBeInTheDocument();
    
    // Second click triggers sync
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockFullSync).toHaveBeenCalledTimes(1);
    });
  });

  it('shows syncing state', () => {
    mockUseStravaSync.mockReturnValue({
      ...defaultMockReturn,
      isSyncing: true
    });

    renderWithQueryClient(<FullSyncButton />);
    
    expect(screen.getByText('Full Sync in Progress...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows error state', () => {
    mockUseStravaSync.mockReturnValue({
      ...defaultMockReturn,
      syncError: new Error('Sync failed')
    });

    renderWithQueryClient(<FullSyncButton />);
    
    expect(screen.getByText(/Error:/)).toBeInTheDocument();
    expect(screen.getByText('Sync failed')).toBeInTheDocument();
  });

  it('shows success state', () => {
    mockUseStravaSync.mockReturnValue({
      ...defaultMockReturn,
      syncResult: {
        success: true,
        data: {
          activitiesProcessed: 150,
          newActivities: 25,
          updatedActivities: 5,
          syncDuration: 5000
        }
      }
    });

    renderWithQueryClient(<FullSyncButton />);
    
    expect(screen.getByText('✅ Full Sync Completed!')).toBeInTheDocument();
    expect(screen.getByText('📊 Activities processed: 150')).toBeInTheDocument();
    expect(screen.getByText('🆕 New activities: 25')).toBeInTheDocument();
  });

  it('disables button when sync is not available', () => {
    mockUseStravaSync.mockReturnValue({
      ...defaultMockReturn,
      syncStatus: {
        canSync: false,
        activityCount: 0,
        syncState: { sync_requests_today: 5 }
      }
    });

    renderWithQueryClient(<FullSyncButton />);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows sync status information', () => {
    mockUseStravaSync.mockReturnValue({
      ...defaultMockReturn,
      syncStatus: {
        canSync: true,
        activityCount: 42,
        syncState: { sync_requests_today: 2 }
      }
    });

    renderWithQueryClient(<FullSyncButton />);
    
    expect(screen.getByText('Status: ✅ Ready to sync')).toBeInTheDocument();
    expect(screen.getByText('Current activities: 42')).toBeInTheDocument();
    expect(screen.getByText('Daily syncs used: 2/5')).toBeInTheDocument();
  });
}); 