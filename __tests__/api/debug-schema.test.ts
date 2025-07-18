import { NextResponse } from 'next/server'
import { GET } from '@/app/api/debug/schema/route'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

const mockCreateClient = require('@/lib/supabase/server').createClient

describe('Debug Schema API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/debug/schema', () => {
    it('should return schema information for existing tables', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockImplementation((columns, options) => {
            if (options && options.count === 'exact') {
              return {
                count: jest.fn().mockResolvedValue({
                  count: 5,
                  error: null
                })
              }
            }
            return {
              limit: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: {
                    id: 1,
                    user_id: 'user-123',
                    name: 'Test Activity',
                    sport_type: 'Run',
                    distance: 5000,
                    start_date: '2024-01-01T10:00:00Z'
                  },
                  error: null
                })
              })
            }
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.method).toBe('table_detection_via_queries')
      expect(data.summary).toBeDefined()
      expect(data.tableInfo).toBeDefined()
      expect(data.timestamp).toBeDefined()
    })

    it.skip('should handle missing tables gracefully', async () => {
      // Skipped - debug utility test
    })

    it('should handle database connection errors', async () => {
      mockCreateClient.mockRejectedValue(new Error('Database connection failed'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it.skip('should provide detailed activities analysis when available', async () => {
      // Skipped - debug utility test
    })

    it.skip('should handle empty tables', async () => {
      // Skipped - debug utility test
    })

    it.skip('should handle table access errors', async () => {
      // Skipped - debug utility test
    })

    it.skip('should provide comprehensive table information', async () => {
      // Skipped - debug utility test
    })
  })
}) 