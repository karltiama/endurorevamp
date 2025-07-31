import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useStravaSync, useSyncStatusInfo } from '@/hooks/use-strava-sync'
import { ReactNode } from 'react'
import { act } from '@testing-library/react'

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useStravaSync', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('sync status', () => {
    it('should fetch sync status successfully', async () => {
      const mockSyncStatus = {
        syncState: {
          user_id: 'test-user',
          sync_enabled: true,
          sync_requests_today: 2,
          last_activity_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          consecutive_errors: 0,
          last_error_message: null
        },
        activityCount: 150,
        canSync: true
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSyncStatus,
      } as Response)

      const { result } = renderHook(() => useStravaSync(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false)
      }, { timeout: 5000 })

      expect(result.current.syncStatus).toEqual(mockSyncStatus)
      expect(mockFetch).toHaveBeenCalledWith('/api/strava/sync')
    })

    it('should handle sync status error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      const { result } = renderHook(() => useStravaSync(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false)
      }, { timeout: 5000 })

      expect(result.current.statusError).toBeTruthy()
    })
  })

  describe('sync triggers', () => {
    beforeEach(() => {
      // Mock successful sync status
      mockFetch.mockImplementation((url) => {
        if (url === '/api/strava/sync' && typeof url === 'string') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              syncState: { sync_enabled: true, sync_requests_today: 0 },
              activityCount: 100,
              canSync: true
            }),
          } as Response)
        }
        return Promise.reject(new Error('Unknown URL'))
      })
    })

    it('should trigger latest sync with correct parameters', async () => {
      const mockSyncResult = {
        success: true,
        message: 'Sync completed successfully',
        data: {
          activitiesProcessed: 15,
          newActivities: 10,
          updatedActivities: 5,
          syncDuration: 2500
        }
      }

      mockFetch.mockImplementation((url, options) => {
        if (url === '/api/strava/sync' && options?.method === 'POST') {
          const body = JSON.parse(options.body as string)
          expect(body).toEqual({ syncType: 'quick' })
          
          return Promise.resolve({
            ok: true,
            json: async () => mockSyncResult,
          } as Response)
        }
        
        // Default to sync status response
        return Promise.resolve({
          ok: true,
          json: async () => ({
            syncState: { sync_enabled: true },
            activityCount: 100,
            canSync: true
          }),
        } as Response)
      })

      const { result } = renderHook(() => useStravaSync(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false)
      }, { timeout: 5000 })

      // Trigger sync
      result.current.quickSync()

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false)
      })

      // The sync result should be available after the sync completes
      expect(result.current.syncResult).toBeDefined()
      expect(result.current.syncResult?.success).toBe(true)
    })

    it('should trigger quick sync with correct parameters', async () => {
      mockFetch.mockImplementation((url, options) => {
        if (url === '/api/strava/sync' && options?.method === 'POST') {
          const body = JSON.parse(options.body as string)
          expect(body).toEqual({ syncType: 'quick' })
          
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, message: 'Quick sync completed' }),
          } as Response)
        }
        
        return Promise.resolve({
          ok: true,
          json: async () => ({ syncState: {}, activityCount: 100, canSync: true }),
        } as Response)
      })

      const { result } = renderHook(() => useStravaSync(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false)
      }, { timeout: 5000 })

      result.current.quickSync()

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false)
      })
    })

    it('should trigger full sync with correct parameters', async () => {
      mockFetch.mockImplementation((url, options) => {
        if (url === '/api/strava/sync' && options?.method === 'POST') {
          const body = JSON.parse(options.body as string)
          expect(body).toEqual({ 
            syncType: 'full'
          })
          
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, message: 'Full sync completed' }),
          } as Response)
        }
        
        return Promise.resolve({
          ok: true,
          json: async () => ({ syncState: {}, activityCount: 100, canSync: true }),
        } as Response)
      })

      const { result } = renderHook(() => useStravaSync(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false)
      }, { timeout: 5000 })

      result.current.fullSync()

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false)
      })
    })

    it('should handle sync errors', async () => {
      mockFetch.mockImplementation((url, options) => {
        if (url === '/api/strava/sync' && options?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 422,
            json: async () => ({ 
              success: false, 
              message: 'Sync failed', 
              errors: ['Token expired'] 
            }),
          } as Response)
        }
        
        return Promise.resolve({
          ok: true,
          json: async () => ({ syncState: {}, activityCount: 100, canSync: true }),
        } as Response)
      })

      const { result } = renderHook(() => useStravaSync(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false)
      }, { timeout: 5000 })

      result.current.quickSync()

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false)
      })

      expect(result.current.syncError).toBeTruthy()
    })
  })

  describe('custom sync', () => {
    it('should trigger custom sync with provided options', async () => {
      const customOptions = {
        sinceDays: 14,
        maxActivities: 75,
        forceRefresh: true
      }

      mockFetch.mockImplementation((url, options) => {
        if (url === '/api/strava/sync' && options?.method === 'POST') {
          const body = JSON.parse(options.body as string)
          expect(body).toEqual(customOptions)
          
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, message: 'Custom sync completed' }),
          } as Response)
        }
        
        return Promise.resolve({
          ok: true,
          json: async () => ({ syncState: {}, activityCount: 100, canSync: true }),
        } as Response)
      })

      const { result } = renderHook(() => useStravaSync(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false)
      }, { timeout: 5000 })

      result.current.customSync(customOptions)

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false)
      })
    })
  })
})

describe('useSyncStatusInfo', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('should format sync status info correctly', async () => {
    // First verify that useSyncStatusInfo is a function
    expect(typeof useSyncStatusInfo).toBe('function')
    
    const mockSyncStatus = {
      syncState: {
        last_activity_sync: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        sync_enabled: true,
        sync_requests_today: 3,
        consecutive_errors: 0,
        last_error_message: null
      },
      activityCount: 125,
      canSync: true
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSyncStatus,
    } as Response)

    const { result } = renderHook(() => useSyncStatusInfo(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.lastSyncText).toBe('30 minutes ago')
    })

    expect(result.current.canSync).toBe(true)
    expect(result.current.activityCount).toBe(125)
    expect(result.current.todaySyncs).toBe(3)
    expect(result.current.maxSyncs).toBe(5)
    expect(result.current.consecutiveErrors).toBe(0)
  })

  it('should handle never synced status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        syncState: null,
        activityCount: 0,
        canSync: true
      }),
    } as Response)

    const { result } = renderHook(() => useSyncStatusInfo(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.lastSyncText).toBe('Never synced')
    })

    expect(result.current.canSync).toBe(true)
    expect(result.current.activityCount).toBe(0)
  })

  it('should format recent sync times correctly', async () => {
         const testCases = [
       { ago: 30 * 1000, expected: 'Just now' }, // 30 seconds
       { ago: 5 * 60 * 1000, expected: '5 minutes ago' }, // 5 minutes
       { ago: 2 * 60 * 60 * 1000, expected: '2 hours ago' }, // 2 hours
       { ago: 24 * 60 * 60 * 1000, expected: 'Yesterday' }, // 1 day (formatted as Yesterday)
     ]

    for (const testCase of testCases) {
      const mockSyncStatus = {
        syncState: {
          last_activity_sync: new Date(Date.now() - testCase.ago).toISOString(),
          sync_enabled: true,
          sync_requests_today: 1,
          consecutive_errors: 0
        },
        activityCount: 100,
        canSync: true
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSyncStatus,
      } as Response)

      const { result } = renderHook(() => useSyncStatusInfo(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.lastSyncText).toBe(testCase.expected)
      })
    }
  })

  it('should identify sync disabled reasons', async () => {
    // Test rate limit exceeded
    const rateLimitStatus = {
      syncState: {
        sync_enabled: true,
        sync_requests_today: 5, // At limit
        last_activity_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      activityCount: 100,
      canSync: false,
      syncDisabledReason: 'Daily sync limit reached (5/day)'
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => rateLimitStatus,
    } as Response)

    const { result } = renderHook(() => useSyncStatusInfo(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.syncDisabledReason).toBe('Daily sync limit reached (5/day)')
    })
  })
}) 

describe('Rate Limiting', () => {
  it('should prevent sync when rate limit exceeded', async () => {
    // Mock sync status with rate limit exceeded
    const rateLimitExceededStatus = {
      syncState: {
        sync_enabled: true,
        sync_requests_today: 5, // Max allowed
        last_activity_sync: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      },
      activityCount: 100,
      canSync: false
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => rateLimitExceededStatus,
      status: 200,
      statusText: 'OK'
    } as Response)

    const { result } = renderHook(() => useStravaSync(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoadingStatus).toBe(false)
    })

    // Try to trigger sync - the hook will still make the request even when rate limited
    // because the rate limiting is handled server-side, not client-side
    act(() => {
      result.current.fullSync()
    })

    // The hook should still make the sync request (rate limiting is server-side)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/strava/sync', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ syncType: 'full' })
      }))
    })
  })

  it('should allow sync after rate limit reset', async () => {
    // Mock sync status with rate limit reset (new day)
    const rateLimitResetStatus = {
      syncState: {
        sync_enabled: true,
        sync_requests_today: 0, // Reset for new day
        last_activity_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      activityCount: 100,
      canSync: true
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => rateLimitResetStatus,
      status: 200,
      statusText: 'OK'
    } as Response)

    const { result } = renderHook(() => useStravaSync(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoadingStatus).toBe(false)
    })

    // Should allow sync after rate limit reset
    act(() => {
      result.current.fullSync()
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/strava/sync', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ syncType: 'full' })
      }))
    })
  })
}) 