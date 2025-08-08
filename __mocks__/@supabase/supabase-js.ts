export const createClient = jest.fn()

export interface User {
  id: string
  email?: string
  created_at?: string
  app_metadata?: any
}

export interface AuthResponse {
  data: {
    user: User | null
  }
  error: any
}

export interface Session {
  user: User
  access_token: string
}

// Mock database operations
const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnValue({
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    }),
    limit: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      })
    }),
    upsert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      })
    })
  }),
  insert: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    })
  }),
  upsert: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    })
  }),
  delete: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ data: null, error: null })
  }),
  update: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ data: null, error: null })
  })
})

const mockAuth = {
  getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null })
}

// Mock client with proper method chaining
const mockClient = {
  from: mockFrom,
  auth: mockAuth,
  rpc: jest.fn().mockResolvedValue({ data: null, error: null })
}

createClient.mockReturnValue(mockClient)

export { createClient as default } 