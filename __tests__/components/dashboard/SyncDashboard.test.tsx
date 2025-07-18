import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SyncDashboard from '@/components/dashboard/SyncDashboard'
import { useStravaSync, useSyncStatusInfo } from '@/hooks/use-strava-sync'

// Mock the hooks
jest.mock('@/hooks/use-strava-sync')

const mockUseStravaSync = useStravaSync as jest.MockedFunction<typeof useStravaSync>
const mockUseSyncStatusInfo = useSyncStatusInfo as jest.MockedFunction<typeof useSyncStatusInfo>

describe('SyncDashboard', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
  })

  const renderSyncDashboard = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SyncDashboard />
      </QueryClientProvider>
    )
  }

  it('shows "Limit reached" when daily sync limit is exceeded', () => {
    mockUseStravaSync.mockReturnValue({
      syncStatus: undefined,
      isLoadingStatus: false,
      statusError: null,
      syncLatest: jest.fn(),
      syncLastWeek: jest.fn(),
      syncLastMonth: jest.fn(),
      forceFullSync: jest.fn(),
      customSync: jest.fn(),
      isSyncing: false,
      syncError: null,
      syncResult: undefined,
      refetchStatus: jest.fn(),
      refreshStatus: jest.fn(),
      syncStatusInfo: {
        lastSyncText: '2 hours ago',
        canSync: false,
        syncDisabledReason: 'Daily sync limit reached (5/day)',
        activityCount: 150,
        todaySyncs: 15,
        maxSyncs: 5,
        consecutiveErrors: 0,
        lastError: null
      }
    })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: '2 hours ago',
      canSync: false,
      syncDisabledReason: 'Daily sync limit reached (5/day)',
      activityCount: 150,
      todaySyncs: 15, // Over the limit
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: null
    })

    renderSyncDashboard()

    expect(screen.getByText('Limit reached')).toBeInTheDocument()
    expect(screen.queryByText('15/5')).not.toBeInTheDocument()
    expect(screen.getByText('Daily Sync Limit Reached')).toBeInTheDocument()
  })

  it('shows sync count when under daily limit', () => {
    mockUseStravaSync.mockReturnValue({
      syncStatus: undefined,
      isLoadingStatus: false,
      statusError: null,
      syncLatest: jest.fn(),
      syncLastWeek: jest.fn(),
      syncLastMonth: jest.fn(),
      forceFullSync: jest.fn(),
      customSync: jest.fn(),
      isSyncing: false,
      syncError: null,
      syncResult: undefined,
      refetchStatus: jest.fn(),
      refreshStatus: jest.fn(),
      syncStatusInfo: {
        lastSyncText: '2 hours ago',
        canSync: true,
        syncDisabledReason: null,
        activityCount: 150,
        todaySyncs: 3,
        maxSyncs: 5,
        consecutiveErrors: 0,
        lastError: null
      }
    })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: '2 hours ago',
      canSync: true,
      syncDisabledReason: null,
      activityCount: 150,
      todaySyncs: 3, // Under the limit
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: null
    })

    renderSyncDashboard()

    expect(screen.getByText('3/5')).toBeInTheDocument()
    expect(screen.queryByText('Limit reached')).not.toBeInTheDocument()
    
    // Verify button is enabled
    const syncButton = screen.getByRole('button', { name: /Sync Activities/i })
    expect(syncButton).not.toBeDisabled()
  })

  it('shows friendly message when daily limit is reached', () => {
    mockUseStravaSync.mockReturnValue({
      syncStatus: undefined,
      isLoadingStatus: false,
      statusError: null,
      syncLatest: jest.fn(),
      syncLastWeek: jest.fn(),
      syncLastMonth: jest.fn(),
      forceFullSync: jest.fn(),
      customSync: jest.fn(),
      isSyncing: false,
      syncError: null,
      syncResult: undefined,
      refetchStatus: jest.fn(),
      refreshStatus: jest.fn(),
      syncStatusInfo: {
        lastSyncText: '2 hours ago',
        canSync: false,
        syncDisabledReason: 'Daily sync limit reached (5/day)',
        activityCount: 150,
        todaySyncs: 15,
        maxSyncs: 5,
        consecutiveErrors: 0,
        lastError: null
      }
    })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: '2 hours ago',
      canSync: false,
      syncDisabledReason: 'Daily sync limit reached (5/day)',
      activityCount: 150,
      todaySyncs: 15,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: null
    })

    renderSyncDashboard()

    expect(screen.getByText('Daily Sync Limit Reached')).toBeInTheDocument()
    
    // Use getAllByText to get all instances and check the first one
    const limitMessages = screen.getAllByText(/You've reached your daily sync limit. Please try again tomorrow/)
    expect(limitMessages.length).toBeGreaterThan(0)
    
    expect(screen.getByText('Daily limit reached. Try again tomorrow!')).toBeInTheDocument()
    
    // Verify button is disabled and shows correct text
    const syncButton = screen.getByRole('button', { name: /Daily Limit Reached/i })
    expect(syncButton).toBeDisabled()
  })

  it('shows loading state correctly', () => {
    mockUseStravaSync.mockReturnValue({
      syncStatus: undefined,
      isLoadingStatus: true,
      statusError: null,
      syncLatest: jest.fn(),
      syncLastWeek: jest.fn(),
      syncLastMonth: jest.fn(),
      forceFullSync: jest.fn(),
      customSync: jest.fn(),
      isSyncing: false,
      syncError: null,
      syncResult: undefined,
      refetchStatus: jest.fn(),
      refreshStatus: jest.fn(),
      syncStatusInfo: {
        lastSyncText: 'Never synced',
        canSync: true,
        syncDisabledReason: null,
        activityCount: 0,
        todaySyncs: 0,
        maxSyncs: 5,
        consecutiveErrors: 0,
        lastError: null
      }
    })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: 'Never synced',
      canSync: true,
      syncDisabledReason: null,
      activityCount: 0,
      todaySyncs: 0,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: null
    })

    renderSyncDashboard()

    // Should show loading skeleton
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })
}) 