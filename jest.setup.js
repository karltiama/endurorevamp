import '@testing-library/jest-dom'
import * as dotenv from 'dotenv'
import path from 'path'

// Load real environment variables for schema validation tests
const testEnvPath = path.resolve(process.cwd(), '.env.test.local')
dotenv.config({ path: testEnvPath })

// Only use mock environment variables if real ones aren't available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('test.supabase.co')) {
  console.log('⚠️  Using mock Supabase credentials - schema validation tests will be skipped')
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  redirect: jest.fn(),
}))

// Global test utilities
global.mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  app_metadata: {
    provider: 'email'
  }
} 