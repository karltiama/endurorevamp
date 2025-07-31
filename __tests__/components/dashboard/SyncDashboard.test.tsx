import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SyncDashboard from '@/components/dashboard/SyncDashboard'
import { useStravaSync, useSyncStatusInfo } from '@/hooks/use-strava-sync'

// Mock the hooks
jest.mock('@/hooks/use-strava-sync')

const mockUseStravaSync = useStravaSync as jest.MockedFunction<typeof useStravaSync>
const mockUseSyncStatusInfo = useSyncStatusInfo as jest.MockedFunction<typeof useSyncStatusInfo>

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('SyncDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display loading skeleton when status is loading', () => {
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
        lastSyncText: '',
        canSync: false,
        syncDisabledReason: null,
        activityCount: 0,
        todaySyncs: 0,
        maxSyncs: 5,
        consecutiveErrors: 0,
        lastError: undefined
      }
    })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: '',
      canSync: false,
      syncDisabledReason: '',
      activityCount: 0,
      todaySyncs: 0,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: undefined
    })

    renderWithQueryClient(<SyncDashboard />)
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('should display sync status and daily counter', () => {
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
        activityCount: 42,
        todaySyncs: 2,
        maxSyncs: 5,
        consecutiveErrors: 0,
        lastError: undefined
      }
    })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: '2 hours ago',
      canSync: true,
      syncDisabledReason: '',
      activityCount: 42,
      todaySyncs: 2,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: undefined
    })

    renderWithQueryClient(<SyncDashboard />)
    
    expect(screen.getByText('Activity Sync')).toBeInTheDocument()
    expect(screen.getByText('2 hours ago')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Daily Sync Usage')).toBeInTheDocument()
    expect(screen.getByText('3 syncs remaining today')).toBeInTheDocument()
    
    // Check for the daily sync counter in the dedicated card
    expect(screen.getByText('2', { selector: '.text-lg.font-bold.text-blue-700' })).toBeInTheDocument()
    // The "5" is in a div with text "/ 5" so we need to check for the full text
    expect(screen.getByText('/ 5')).toBeInTheDocument()
  })

  it('should display detailed sync result with new activities', async () => {
    const mockForceFullSync = jest.fn()
    
    mockUseStravaSync.mockReturnValue({
      syncStatus: undefined,
      isLoadingStatus: false,
      statusError: null,
      syncLatest: jest.fn(),
      syncLastWeek: jest.fn(),
      syncLastMonth: jest.fn(),
      forceFullSync: mockForceFullSync,
      customSync: jest.fn(),
      isSyncing: false,
      syncError: null,
      syncResult: {
        success: true,
        message: 'Sync completed successfully',
        data: {
          activitiesProcessed: 15,
          newActivities: 8,
          updatedActivities: 3,
          syncDuration: 2500
        }
      },
      refetchStatus: jest.fn(),
      refreshStatus: jest.fn(),
      syncStatusInfo: {
        lastSyncText: 'Just now',
        canSync: true,
        syncDisabledReason: null,
        activityCount: 50,
        todaySyncs: 3,
        maxSyncs: 5,
        consecutiveErrors: 0,
        lastError: undefined
      }
    })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: 'Just now',
      canSync: true,
      syncDisabledReason: '',
      activityCount: 50,
      todaySyncs: 3,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: undefined
    })

    renderWithQueryClient(<SyncDashboard />)
    
    // Check sync summary format
    expect(screen.getByText('📊 Sync summary: 8 new, 3 updated')).toBeInTheDocument()
    
    // Check processing details
    expect(screen.getByText('Processed 15 activities in 3s')).toBeInTheDocument()
  })

  it('should display sync result with no new activities', () => {
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
      syncResult: {
        success: true,
        message: 'Sync completed successfully',
        data: {
          activitiesProcessed: 10,
          newActivities: 0,
          updatedActivities: 0,
          syncDuration: 1200
        }
      },
      refetchStatus: jest.fn(),
      refreshStatus: jest.fn(),
      syncStatusInfo: {
        lastSyncText: 'Just now',
        canSync: true,
        syncDisabledReason: null,
        activityCount: 50,
        todaySyncs: 1,
        maxSyncs: 5,
        consecutiveErrors: 0,
        lastError: undefined
      }
    })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: 'Just now',
      canSync: true,
      syncDisabledReason: '',
      activityCount: 50,
      todaySyncs: 1,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: undefined
    })

    renderWithQueryClient(<SyncDashboard />)
    
    // Check sync summary format for zero activities
    expect(screen.getByText('📊 Sync summary: 0 new, 0 updated')).toBeInTheDocument()
    expect(screen.getByText('Processed 10 activities in 1s')).toBeInTheDocument()
  })

  it('should display daily limit reached state', () => {
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
        lastSyncText: '1 hour ago',
        canSync: false,
        syncDisabledReason: 'Daily sync limit reached (5/5)',
        activityCount: 50,
        todaySyncs: 5,
        maxSyncs: 5,
        consecutiveErrors: 0,
        lastError: undefined
      }
    })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: '1 hour ago',
      canSync: false,
      syncDisabledReason: 'Daily sync limit reached (5/5)',
      activityCount: 50,
      todaySyncs: 5,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: undefined
    })

    renderWithQueryClient(<SyncDashboard />)
    
    // Check for the daily limit message in the dedicated card
    expect(screen.getByText('Daily limit reached. Try again tomorrow.')).toBeInTheDocument()
    
    expect(screen.getByText('Daily Limit Reached')).toBeInTheDocument()
    
    const syncButton = screen.getByTestId('sync-button')
    expect(syncButton).toBeDisabled()
    expect(syncButton).toHaveAttribute('data-disabled', 'true')
  })

  it('should handle sync button click when available', async () => {
    const mockForceFullSync = jest.fn()
    
    mockUseStravaSync.mockReturnValue({
      syncStatus: undefined,
      isLoadingStatus: false,
      statusError: null,
      syncLatest: jest.fn(),
      syncLastWeek: jest.fn(),
      syncLastMonth: jest.fn(),
      forceFullSync: mockForceFullSync,
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
        activityCount: 42,
        todaySyncs: 2,
        maxSyncs: 5,
        consecutiveErrors: 0,
        lastError: undefined
      }
    })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: '2 hours ago',
      canSync: true,
      syncDisabledReason: '',
      activityCount: 42,
      todaySyncs: 2,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: undefined
    })

    renderWithQueryClient(<SyncDashboard />)
    
    const syncButton = screen.getByTestId('sync-button')
    expect(syncButton).toBeEnabled()
    expect(syncButton).toHaveAttribute('data-can-sync', 'true')
    
    fireEvent.click(syncButton)
    
    expect(mockForceFullSync).toHaveBeenCalledTimes(1)
  })

  it('should display sync progress when syncing', () => {
    mockUseStravaSync.mockReturnValue({
      syncStatus: undefined,
      isLoadingStatus: false,
      statusError: null,
      syncLatest: jest.fn(),
      syncLastWeek: jest.fn(),
      syncLastMonth: jest.fn(),
      forceFullSync: jest.fn(),
      customSync: jest.fn(),
      isSyncing: true,
      syncError: null,
      syncResult: undefined,
      refetchStatus: jest.fn(),
      refreshStatus: jest.fn(),
      syncStatusInfo: {
        lastSyncText: '2 hours ago',
        canSync: true,
        syncDisabledReason: null,
        activityCount: 42,
        todaySyncs: 2,
        maxSyncs: 5,
        consecutiveErrors: 0,
        lastError: undefined
      }
    })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: '2 hours ago',
      canSync: true,
      syncDisabledReason: '',
      activityCount: 42,
      todaySyncs: 2,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: undefined
    })

    renderWithQueryClient(<SyncDashboard />)
    
    // Check for syncing status in the status indicator
    const syncingStatus = screen.getByText('Syncing...', { selector: '.text-xs.text-muted-foreground' })
    expect(syncingStatus).toBeInTheDocument()
    
    // Check for syncing button text - there are multiple instances, so use getAllByText
    const syncingElements = screen.getAllByText('Syncing...')
    expect(syncingElements.length).toBeGreaterThan(0)
    
    const syncButton = screen.getByTestId('sync-button')
    expect(syncButton).toBeDisabled()
    expect(syncButton).toHaveAttribute('data-is-syncing', 'true')
  })

  it('should display sync errors', () => {
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
      syncError: new Error('Network timeout'),
      syncResult: undefined,
      refetchStatus: jest.fn(),
      refreshStatus: jest.fn(),
      syncStatusInfo: {
        lastSyncText: '2 hours ago',
        canSync: true,
        syncDisabledReason: null,
        activityCount: 42,
        todaySyncs: 2,
        maxSyncs: 5,
        consecutiveErrors: 1,
        lastError: 'Network timeout'
      }
    })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: '2 hours ago',
      canSync: true,
      syncDisabledReason: '',
      activityCount: 42,
      todaySyncs: 2,
      maxSyncs: 5,
      consecutiveErrors: 1,
      lastError: 'Network timeout'
    })

    renderWithQueryClient(<SyncDashboard />)
    
    expect(screen.getByText('Sync Failed')).toBeInTheDocument()
    
    // Check for error messages (there might be multiple instances)
    const errorMessages = screen.getAllByText('Network timeout')
    expect(errorMessages.length).toBeGreaterThan(0)
    
    expect(screen.getByText('Last sync failed')).toBeInTheDocument()
  })

  it('should display consecutive errors', () => {
    mockUseStravaSync.mockReturnValue({
      syncStatus: undefined,
      isLoadingStatus: false,
      statusError: null,
      syncLatest: jest.fn(),
      syncLastWeek: jest.fn(),
      syncLastMonth: jest.fn(),
      forceFullSync: jest.fn(),
      customSync: jest.fn(),
      refetchStatus: jest.fn(),
      refreshStatus: jest.fn(),
      isSyncing: false,
      syncError: null,
      syncResult: undefined,
      syncStatusInfo: {
        lastSyncText: '2 hours ago',
        canSync: true,
        syncDisabledReason: null,
        activityCount: 42,
        todaySyncs: 2,
        maxSyncs: 5,
        consecutiveErrors: 3,
        lastError: 'API rate limit exceeded'
      }
    })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: '2 hours ago',
      canSync: true,
      syncDisabledReason: '',
      activityCount: 42,
      todaySyncs: 2,
      maxSyncs: 5,
      consecutiveErrors: 3,
      lastError: 'API rate limit exceeded'
    })

    renderWithQueryClient(<SyncDashboard />)
    
    expect(screen.getByText('3 failures')).toBeInTheDocument()
    expect(screen.getByText('API rate limit exceeded')).toBeInTheDocument()
  })

  it('should display progress bar for daily sync usage', () => {
    mockUseStravaSync.mockReturnValue({
      syncStatus: undefined,
      isLoadingStatus: false,
      statusError: null,
      syncLatest: jest.fn(),
      syncLastWeek: jest.fn(),
      syncLastMonth: jest.fn(),
      forceFullSync: jest.fn(),
      customSync: jest.fn(),
      refetchStatus: jest.fn(),
      refreshStatus: jest.fn(),
      isSyncing: false,
      syncError: null,
      syncResult: undefined,
      syncStatusInfo: {
        lastSyncText: '2 hours ago',
        canSync: true,
        syncDisabledReason: null,
        activityCount: 42,
        todaySyncs: 3,
        maxSyncs: 5,
        consecutiveErrors: 0,
        lastError: undefined
      }
    })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: '2 hours ago',
      canSync: true,
      syncDisabledReason: '',
      activityCount: 42,
      todaySyncs: 3,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: undefined
    })

    renderWithQueryClient(<SyncDashboard />)
    
    // Check for the progress bar container - find the entire card
    const dailySyncCard = screen.getByText('Daily Sync Usage').closest('.bg-blue-50')
    expect(dailySyncCard).toBeInTheDocument()
    
    // Check that the progress bar container exists
    const progressContainer = dailySyncCard?.querySelector('.w-full.bg-blue-200.rounded-full.h-2')
    expect(progressContainer).toBeInTheDocument()
    
    // Check that there's a progress fill element with 60% width (3/5 = 60%)
    const progressFill = progressContainer?.querySelector('div[style*="width: 60%"]')
    expect(progressFill).toBeInTheDocument()
  })
}) 