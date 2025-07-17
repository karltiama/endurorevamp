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
          select: jest.fn().mockReturnValue({
            count: jest.fn().mockResolvedValue({
              count: 5,
              error: null
            }),
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

    it('should handle missing tables gracefully', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            count: jest.fn().mockResolvedValue({
              count: null,
              error: { message: 'Table does not exist' }
            }),
            limit: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Table does not exist' }
              })
            })
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.summary.missingTables).toContain('activities')
    })

    it('should handle database connection errors', async () => {
      mockCreateClient.mockRejectedValue(new Error('Database connection failed'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
    })

    it('should provide detailed activities analysis when available', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            count: jest.fn().mockResolvedValue({
              count: 3,
              error: null
            }),
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
          })
        })
      }

      // Mock the activities table query specifically
      mockSupabase.from.mockImplementation((tableName) => {
        if (tableName === 'activities') {
          return {
            select: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 1,
                    user_id: 'user-123',
                    name: 'Activity 1',
                    sport_type: 'Run',
                    distance: 5000
                  },
                  {
                    id: 2,
                    user_id: 'user-123',
                    name: 'Activity 2',
                    sport_type: 'Bike',
                    distance: 20000
                  }
                ],
                error: null
              })
            })
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            count: jest.fn().mockResolvedValue({
              count: 1,
              error: null
            }),
            limit: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { id: 1 },
                error: null
              })
            })
          })
        }
      })

      mockCreateClient.mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.activitiesAnalysis).toBeDefined()
      expect(data.activitiesAnalysis.totalSamples).toBe(2)
      expect(data.activitiesAnalysis.allColumns).toContain('id')
      expect(data.activitiesAnalysis.allColumns).toContain('user_id')
      expect(data.activitiesAnalysis.allColumns).toContain('name')
    })

    it('should handle empty tables', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            count: jest.fn().mockResolvedValue({
              count: 0,
              error: null
            }),
            limit: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.tableInfo.activities.columns).toBe('unknown (table empty)')
    })

    it('should handle table access errors', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            count: jest.fn().mockResolvedValue({
              count: null,
              error: { message: 'Permission denied' }
            }),
            limit: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Permission denied' }
              })
            })
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.tableInfo.activities.exists).toBe(false)
      expect(data.tableInfo.activities.error).toBe('Permission denied')
    })

    it('should provide comprehensive table information', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            count: jest.fn().mockResolvedValue({
              count: 10,
              error: null
            }),
            limit: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: 1,
                  user_id: 'user-123',
                  name: 'Test Activity',
                  sport_type: 'Run',
                  distance: 5000,
                  start_date: '2024-01-01T10:00:00Z',
                  is_active: true,
                  created_at: '2024-01-01T10:00:00Z'
                },
                error: null
              })
            })
          })
        })
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Check table info structure
      const tableInfo = data.tableInfo.activities
      expect(tableInfo.exists).toBe(true)
      expect(tableInfo.recordCount).toBe(10)
      expect(tableInfo.columns).toContain('id')
      expect(tableInfo.columns).toContain('user_id')
      expect(tableInfo.columns).toContain('name')
      expect(tableInfo.columnTypes).toBeDefined()
      expect(tableInfo.sampleRecord).toBeDefined()
    })
  })
}) 