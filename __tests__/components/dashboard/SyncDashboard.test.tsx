import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SyncDashboard from '@/components/dashboard/SyncDashboard'
import { ReactNode } from 'react'

// Mock the hooks
jest.mock('@/hooks/use-strava-sync', () => ({
  useStravaSync: jest.fn(),
  useSyncStatusInfo: jest.fn()
}))

import { useStravaSync, useSyncStatusInfo } from '@/hooks/use-strava-sync'

const mockUseStravaSync = useStravaSync as jest.MockedFunction<typeof useStravaSync>
const mockUseSyncStatusInfo = useSyncStatusInfo as jest.MockedFunction<typeof useSyncStatusInfo>

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('SyncDashboard', () => {
  beforeEach(() => {
    // Default mock implementations
         mockUseStravaSync.mockReturnValue({
       syncLatest: jest.fn(),
       syncLastWeek: jest.fn(),
       syncLastMonth: jest.fn(),
       forceFullSync: jest.fn(),
       customSync: jest.fn(),
       isSyncing: false,
       syncError: null,
       syncResult: undefined,
       isLoadingStatus: false,
       syncStatus: undefined,
       statusError: null,
       refetchStatus: jest.fn(),
       refreshStatus: jest.fn()
     })

    mockUseSyncStatusInfo.mockReturnValue({
      lastSyncText: '2 hours ago',
      canSync: true,
      syncDisabledReason: null,
      activityCount: 125,
      todaySyncs: 2,
      maxSyncs: 5,
      consecutiveErrors: 0,
      lastError: null
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders sync dashboard with status information', () => {
    render(<SyncDashboard />, { wrapper: createWrapper() })

    expect(screen.getByText('Activity Sync')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByText('2 hours ago')).toBeInTheDocument()
    expect(screen.getByText('125')).toBeInTheDocument()
    expect(screen.getByText('2/5')).toBeInTheDocument()
  })

     it('shows loading state when fetching status', () => {
     mockUseStravaSync.mockReturnValue({
       ...mockUseStravaSync(),
       isLoadingStatus: true
     })

     render(<SyncDashboard />, { wrapper: createWrapper() })

     // When loading, it shows skeleton loading state
     const pulseElements = screen.getAllByRole('generic')
     expect(pulseElements.some(el => el.classList.contains('animate-pulse'))).toBe(true)
   })

  it('displays sync buttons and handles clicks', () => {
    const mockSyncLatest = jest.fn()
    const mockSyncLastWeek = jest.fn()
    
    mockUseStravaSync.mockReturnValue({
      ...mockUseStravaSync(),
      syncLatest: mockSyncLatest,
      syncLastWeek: mockSyncLastWeek
    })

    render(<SyncDashboard />, { wrapper: createWrapper() })

    const latestButton = screen.getByText('Latest (50)')
    const weekButton = screen.getByText('Last Week')

    fireEvent.click(latestButton)
    fireEvent.click(weekButton)

    expect(mockSyncLatest).toHaveBeenCalledTimes(1)
    expect(mockSyncLastWeek).toHaveBeenCalledTimes(1)
  })

  it('disables sync buttons when syncing', () => {
    mockUseStravaSync.mockReturnValue({
      ...mockUseStravaSync(),
      isSyncing: true
    })

    render(<SyncDashboard />, { wrapper: createWrapper() })

    const buttons = screen.getAllByRole('button').filter(btn => 
      btn.textContent?.includes('Syncing...') || 
      btn.hasAttribute('disabled')
    )

    expect(buttons.length).toBeGreaterThan(0)
    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })

  it('disables sync buttons when sync not allowed', () => {
    mockUseSyncStatusInfo.mockReturnValue({
      ...mockUseSyncStatusInfo(),
      canSync: false,
      syncDisabledReason: 'Daily sync limit reached (5/5)'
    })

    render(<SyncDashboard />, { wrapper: createWrapper() })

    expect(screen.getByText('Daily sync limit reached (5/5)')).toBeInTheDocument()
    
    const syncButtons = ['Latest (50)', 'Last Week', 'Last Month', 'Full Sync']
    syncButtons.forEach(buttonText => {
      const button = screen.getByText(buttonText)
      expect(button).toBeDisabled()
    })
  })

  it('displays sync success result', () => {
    mockUseStravaSync.mockReturnValue({
      ...mockUseStravaSync(),
      syncResult: {
        success: true,
        message: 'Sync completed successfully',
        data: {
          activitiesProcessed: 25,
          newActivities: 15,
          updatedActivities: 10,
          syncDuration: 3500
        }
      }
    })

    render(<SyncDashboard />, { wrapper: createWrapper() })

    expect(screen.getByText('Sync completed successfully')).toBeInTheDocument()
    expect(screen.getByText(/Processed 25 activities \(15 new, 10 updated\)/)).toBeInTheDocument()
    expect(screen.getByText('Completed in 4s')).toBeInTheDocument()
  })

  it('displays sync error result', () => {
    mockUseStravaSync.mockReturnValue({
      ...mockUseStravaSync(),
      syncResult: {
        success: false,
        message: 'Sync failed',
        errors: ['Token expired', 'Network error'],
        data: {
          activitiesProcessed: 5,
          newActivities: 0,
          updatedActivities: 5,
          syncDuration: 1200
        }
      }
    })

    render(<SyncDashboard />, { wrapper: createWrapper() })

    expect(screen.getByText('Sync failed')).toBeInTheDocument()
    expect(screen.getByText('Errors:')).toBeInTheDocument()
    expect(screen.getByText('Token expired')).toBeInTheDocument()
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('displays consecutive error warning', () => {
    mockUseSyncStatusInfo.mockReturnValue({
      ...mockUseSyncStatusInfo(),
      consecutiveErrors: 3,
      lastError: 'Strava API rate limit exceeded'
    })

    render(<SyncDashboard />, { wrapper: createWrapper() })

    expect(screen.getByText('3 consecutive sync failures')).toBeInTheDocument()
    expect(screen.getByText('Strava API rate limit exceeded')).toBeInTheDocument()
  })

  it('shows and handles advanced options', async () => {
    const mockCustomSync = jest.fn()
    
    mockUseStravaSync.mockReturnValue({
      ...mockUseStravaSync(),
      customSync: mockCustomSync
    })

    render(<SyncDashboard />, { wrapper: createWrapper() })

    // Open advanced options
    const advancedButton = screen.getByText('Advanced Options')
    fireEvent.click(advancedButton)

         // Wait for advanced options to appear
     await waitFor(() => {
       expect(screen.getByDisplayValue('7')).toBeInTheDocument()
     })

     // Change values
     const daysInput = screen.getByDisplayValue('7')
     const activitiesInput = screen.getByDisplayValue('50')
    
    fireEvent.change(daysInput, { target: { value: '14' } })
    fireEvent.change(activitiesInput, { target: { value: '100' } })

    // Trigger custom sync
    const customSyncButton = screen.getByText('Custom Sync')
    fireEvent.click(customSyncButton)

    expect(mockCustomSync).toHaveBeenCalledWith({
      sinceDays: 14,
      maxActivities: 100
    })
  })

  it('displays sync error from hook', () => {
    mockUseStravaSync.mockReturnValue({
      ...mockUseStravaSync(),
      syncError: new Error('Network connection failed')
    })

    render(<SyncDashboard />, { wrapper: createWrapper() })

    expect(screen.getByText('Sync Failed')).toBeInTheDocument()
    expect(screen.getByText('Network connection failed')).toBeInTheDocument()
  })
}) 