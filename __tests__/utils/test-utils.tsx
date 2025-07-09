import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a test-specific QueryClient that doesn't retry
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
})

// Custom render function that includes QueryClient provider
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Export everything from testing-library/react
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Utility to render components that need QueryClient
export const renderWithQueryClient = (
  component: ReactElement,
  queryClient?: QueryClient
) => {
  const client = queryClient || createTestQueryClient()
  
  return render(
    <QueryClientProvider client={client}>
      {component}
    </QueryClientProvider>
  )
}

// Mock implementation helpers
export const createMockApiResponse = <T,>(data: T, error = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK'
})

// Common test data generators
export const generateTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const generateTestActivity = (overrides = {}) => ({
  id: 1,
  user_id: 'test-user-id',
  strava_activity_id: 12345,
  name: 'Test Run',
  sport_type: 'Run',
  distance: 5000,
  moving_time: 1800,
  start_date_local: '2024-01-01T10:00:00Z',
  ...overrides
})

// Wait for async operations in tests
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

// Mock console methods for cleaner test output
export const suppressConsoleErrors = () => {
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })
  afterAll(() => {
    console.error = originalError
  })
} 