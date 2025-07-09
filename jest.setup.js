// Global test setup
import '@testing-library/jest-dom'

// Mock Next.js server-side functions globally
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
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
}))

jest.mock('@/hooks/use-user-activities', () => ({
  useUserActivities: jest.fn(() => ({ data: [], isLoading: false, error: null, refetch: jest.fn() })),
}))

jest.mock('@/hooks/useUnitPreferences', () => ({
  useUnitPreferences: jest.fn(() => ({
    preferences: { distance: 'km', pace: 'min/km' },
    updatePreferences: jest.fn(),
    setDistanceUnit: jest.fn(),
    toggleUnits: jest.fn(),
    isLoading: false
  })),
}))

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

// Mock console methods to reduce noise in tests
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
}

beforeEach(() => {
  // Reset all mocks between tests
  jest.clearAllMocks()
  
  // Restore console methods for clean test output
  console.log = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterEach(() => {
  // Restore console for debugging if needed
  console.log = originalConsole.log
  console.warn = originalConsole.warn
  console.error = originalConsole.error
})

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

// Skip problematic window.location mock that causes JSDOM issues
// Tests can mock this individually if needed

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