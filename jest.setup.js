// Global test setup
import '@testing-library/jest-dom'

// Create global router mocks that can be overridden in tests
const mockRouterFunctions = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}

// Mock Next.js server-side functions globally
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouterFunctions),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  redirect: jest.fn(),
  __mockRouterFunctions: mockRouterFunctions, // Export for test access
}))

// Mock Next.js cookies and headers (server-side)
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
  headers: () => ({
    get: jest.fn(),
  }),
}))

// Mock Supabase clients globally to prevent server-side call issues
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          limit: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
      insert: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: {}, error: null }),
        })),
      })),
    })),
  })),
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          limit: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  })),
}))

// Mock common application hooks globally
jest.mock('@/hooks/useGoals', () => ({
  useUserGoals: jest.fn(() => ({ data: { goals: [], onboarding: null }, isLoading: false, error: null, refetch: jest.fn() })),
  useUpdateGoal: jest.fn(() => ({ mutate: jest.fn(), isLoading: false, error: null })),
  useCreateGoal: jest.fn(() => ({ mutate: jest.fn(), isLoading: false, error: null })),
  useDeleteGoal: jest.fn(() => ({ mutate: jest.fn(), isLoading: false, error: null })),
  useGoalTypes: jest.fn(() => ({ data: [], isLoading: false, error: null })),
  useCreateMultipleGoals: jest.fn(() => ({ mutate: jest.fn(), isLoading: false, error: null })),
}))

jest.mock('@/hooks/use-user-activities', () => ({
  useUserActivities: jest.fn(() => ({ data: [], isLoading: false, error: null, refetch: jest.fn() })),
}))

// Remove the global mock for use-strava-sync to allow individual tests to control it
// This was causing conflicts with test-specific mocks

jest.mock('@/hooks/useUnitPreferences', () => {
  const mockSetDistanceUnit = jest.fn()
  const mockToggleUnits = jest.fn()
  const mockUpdatePreferences = jest.fn()
  
  return {
    useUnitPreferences: jest.fn(() => ({
      preferences: { distance: 'km', pace: 'min/km' },
      updatePreferences: mockUpdatePreferences,
      setDistanceUnit: mockSetDistanceUnit,
      toggleUnits: mockToggleUnits,
      isLoading: false
    })),
    __mocks: {
      setDistanceUnit: mockSetDistanceUnit,
      toggleUnits: mockToggleUnits,
      updatePreferences: mockUpdatePreferences,
    }
  }
})

jest.mock('@/providers/AuthProvider', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    signOut: jest.fn(),
    refreshUser: jest.fn()
  })),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// REMOVED: Heavy console mocking that was running before every test
// REMOVED: beforeEach/afterEach hooks that were adding overhead

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    statusText: 'OK',
  })
)

// Mock window.location in a safe way that works with JSDOM
delete window.location
window.location = {
  href: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  toString: jest.fn(() => 'http://localhost/'),
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock Next.js Request and Response for API route testing
global.Request = class Request {
  constructor(url, init) {
    this.url = url
    this.method = (init && init.method) || 'GET'
    this.headers = new Headers(init && init.headers)
    this.body = init && init.body
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body || '{}'))
  }
  
  text() {
    return Promise.resolve(this.body || '')
  }
}

global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.status = (init && init.status) || 200
    this.statusText = (init && init.statusText) || 'OK'
    this.headers = new Headers(init && init.headers)
  }
  
  json() {
    return Promise.resolve(this.body)
  }
} 