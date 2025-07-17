import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/training/zones/route'
import { createClient } from '@/lib/supabase/server'
import { TrainingZoneAnalysis } from '@/lib/training/zone-analysis'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

// Mock TrainingZoneAnalysis
jest.mock('@/lib/training/zone-analysis', () => ({
  TrainingZoneAnalysis: jest.fn()
}))

const mockSupabase = {
  auth: {
    getUser: jest.fn()
  }
}

const mockUser = { id: 'test-user-id', email: 'test@example.com' }

const mockZoneAnalysis = {
  overall: {
    hrDataQuality: 'good',
    activitiesWithHR: 15,
    totalActivities: 25,
    averageHR: 150,
    maxHR: 185
  },
  suggestedZoneModel: [
    { name: 'Zone 1', min: 0, max: 147, description: 'Active Recovery' },
    { name: 'Zone 2', min: 148, max: 166, description: 'Aerobic Base' },
    { name: 'Zone 3', min: 167, max: 185, description: 'Aerobic Threshold' },
    { name: 'Zone 4', min: 186, max: 203, description: 'Lactate Threshold' },
    { name: 'Zone 5', min: 204, max: 220, description: 'Anaerobic' }
  ],
  alternativeModels: [
    {
      name: '3-Zone Model',
      zones: [
        { name: 'Easy', min: 0, max: 166, description: 'Easy pace' },
        { name: 'Moderate', min: 167, max: 185, description: 'Moderate pace' },
        { name: 'Hard', min: 186, max: 220, description: 'Hard pace' }
      ]
    }
  ],
  confidence: 0.85,
  recommendations: [
    'Based on 15 activities with heart rate data',
    'Consider using a chest strap for more accurate readings',
    'Your max heart rate appears to be around 185 BPM'
  ]
}

describe('Training Zones API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('GET /api/training/zones', () => {
    it('should return zone analysis successfully', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock successful zone analysis
      const mockZoneAnalysisService = { analyzeUserZones: jest.fn().mockResolvedValue(mockZoneAnalysis) }
      ;(TrainingZoneAnalysis as jest.Mock).mockImplementation(() => mockZoneAnalysisService)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockZoneAnalysis)
      expect(data.data.overall.hrDataQuality).toBe('good')
      expect(data.data.suggestedZoneModel.name).toBe('5-Zone Model')
      expect(data.data.confidence).toBe(0.85)
    })

    it('should handle unauthenticated user', async () => {
      // Mock failed authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle zone analysis errors', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock zone analysis error
      const mockZoneAnalysisService = { analyzeUserZones: jest.fn().mockRejectedValue(new Error('No activity data found')) }
      ;(TrainingZoneAnalysis as jest.Mock).mockImplementation(() => mockZoneAnalysisService)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No activity data found for zone analysis')
      expect(data.details).toBe('No activity data found')
    })

    it('should handle insufficient data errors', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock insufficient data error
      const mockZoneAnalysisService = { analyzeUserZones: jest.fn().mockRejectedValue(new Error('Insufficient heart rate data')) }
      ;(TrainingZoneAnalysis as jest.Mock).mockImplementation(() => mockZoneAnalysisService)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Insufficient heart rate data for reliable zone analysis')
      expect(data.details).toBe('Insufficient heart rate data')
    })

    it('should handle general analysis errors', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock general error
      const mockZoneAnalysisService = { analyzeUserZones: jest.fn().mockRejectedValue(new Error('Database connection failed')) }
      ;(TrainingZoneAnalysis as jest.Mock).mockImplementation(() => mockZoneAnalysisService)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to analyze training zones')
      expect(data.details).toBe('Database connection failed')
    })
  })

  describe('POST /api/training/zones', () => {
    it('should perform custom zone analysis successfully', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock successful zone analysis with custom parameters
      const mockZoneAnalysisService = {
        analyzeUserZones: jest.fn().mockResolvedValue(mockZoneAnalysis),
        createZoneModels: jest.fn().mockReturnValue([
          {
            name: '5-Zone Model',
            zones: [
              { name: 'Zone 1', min: 0, max: 150, description: 'Active Recovery' },
              { name: 'Zone 2', min: 151, max: 170, description: 'Aerobic Base' },
              { name: 'Zone 3', min: 171, max: 190, description: 'Aerobic Threshold' },
              { name: 'Zone 4', min: 191, max: 210, description: 'Lactate Threshold' },
              { name: 'Zone 5', min: 211, max: 230, description: 'Anaerobic' }
            ]
          }
        ])
      }
      ;(TrainingZoneAnalysis as jest.Mock).mockImplementation(() => mockZoneAnalysisService)

      const request = new NextRequest(new URL('http://localhost:3000/api/training/zones'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxHeartRate: 200,
          zoneModel: '5',
          sportFilter: 'running'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.recommendations[0]).toContain('custom max heart rate of 200 BPM')
    })

    it('should handle unauthenticated user for POST', async () => {
      // Mock failed authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      })

      const request = new NextRequest(new URL('http://localhost:3000/api/training/zones'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle invalid max heart rate', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock successful zone analysis
      const mockZoneAnalysisService = { analyzeUserZones: jest.fn().mockResolvedValue(mockZoneAnalysis) }
      ;(TrainingZoneAnalysis as jest.Mock).mockImplementation(() => mockZoneAnalysisService)

      const request = new NextRequest(new URL('http://localhost:3000/api/training/zones'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxHeartRate: 50, // Invalid - too low
          zoneModel: '5'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // Should use default analysis without custom max HR
      expect(data.data.suggestedZoneModel.name).toBe('5e Model')
    })

    it('should handle missing request body', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock successful zone analysis
      const mockZoneAnalysisService = { analyzeUserZones: jest.fn().mockResolvedValue(mockZoneAnalysis) }
      ;(TrainingZoneAnalysis as jest.Mock).mockImplementation(() => mockZoneAnalysisService)

      const request = new NextRequest(new URL('http://localhost:3000/api/training/zones'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
        // No body
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
    })

    it('should handle zone analysis errors in POST', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock zone analysis error
      const mockZoneAnalysisService = { analyzeUserZones: jest.fn().mockRejectedValue(new Error('Analysis failed')) }
      ;(TrainingZoneAnalysis as jest.Mock).mockImplementation(() => mockZoneAnalysisService)

      const request = new NextRequest(new URL('http://localhost:3000/api/training/zones'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxHeartRate: 200
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to perform custom zone analysis')
      expect(data.details).toBe('Analysis failed')
    })

    it('should handle malformed request body', async () => {
      // Mock successful user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock successful zone analysis
      const mockZoneAnalysisService = { analyzeUserZones: jest.fn().mockResolvedValue(mockZoneAnalysis) }
      ;(TrainingZoneAnalysis as jest.Mock).mockImplementation(() => mockZoneAnalysisService)

      const request = new NextRequest(new URL('http://localhost:3000/api/training/zones'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to perform custom zone analysis')
    })
  })
}) 