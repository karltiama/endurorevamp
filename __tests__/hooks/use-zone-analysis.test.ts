import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useZoneAnalysis, useCustomZoneAnalysis, useZoneInfo, useZoneCalculations } from '@/hooks/use-zone-analysis'

// Mock fetch globally
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock zone analysis data
const mockZoneAnalysisData = {
  overall: {
    maxHeartRate: 190,
    averageHeartRate: 145,
    restingHeartRate: 60,
    activitiesWithHR: 25,
    totalActivities: 30,
    hrDataQuality: 'excellent' as const,
    percentiles: {
      p50: 180,
      p75: 185,
      p85: 188,
      p90: 190,
      p95: 192,
      p99: 195
    }
  },
  sportSpecific: [
    {
      sport: 'Running',
      maxHR: 190,
      avgHR: 155,
      activityCount: 15,
      suggestedZones: []
    }
  ],
  suggestedZoneModel: {
    name: '5-Zone Model',
    description: 'Classic 5-zone heart rate training model',
    zones: [
      {
        number: 1,
        name: 'Recovery',
        description: 'Active recovery, very easy effort',
        minPercent: 50,
        maxPercent: 60,
        minHR: 95,
        maxHR: 114,
        color: '#22c55e'
      },
      {
        number: 2,
        name: 'Base/Aerobic',
        description: 'Comfortable, conversational pace',
        minPercent: 60,
        maxPercent: 70,
        minHR: 114,
        maxHR: 133,
        color: '#3b82f6'
      }
    ]
  },
  alternativeModels: [],
  recommendations: ['More data would improve accuracy'],
  confidence: 'high' as const,
  needsMoreData: false
}

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  // Return a component function
  const Wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
  
  return Wrapper
}

describe('useZoneAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch zone analysis data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockZoneAnalysisData })
    } as Response)

    const { result } = renderHook(() => useZoneAnalysis(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockZoneAnalysisData)
    expect(mockFetch).toHaveBeenCalledWith('/api/training/zones', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })

  it('should handle zone analysis errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'No heart rate data found' })
    } as Response)

    const { result } = renderHook(() => useZoneAnalysis(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('No heart rate data found')
  })

  it('should not retry on 4xx errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Not found' })
    } as Response)

    const { result } = renderHook(() => useZoneAnalysis(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Should only be called once (no retries for 4xx)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

describe('useCustomZoneAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should perform custom zone analysis with parameters', async () => {
    const customParams = {
      maxHeartRate: 185,
      zoneModel: '3-zone' as const
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { ...mockZoneAnalysisData, customized: true } })
    } as Response)

    const { result } = renderHook(() => useCustomZoneAnalysis(), {
      wrapper: createWrapper()
    })

    result.current.mutate(customParams)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/training/zones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customParams)
    })
  })

  it('should handle custom analysis errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid parameters' })
    } as Response)

    const { result } = renderHook(() => useCustomZoneAnalysis(), {
      wrapper: createWrapper()
    })

    result.current.mutate({ maxHeartRate: 185 })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Invalid parameters')
  })
})

describe('useZoneInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should format zone data for display', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockZoneAnalysisData })
    } as Response)

    const { result } = renderHook(() => useZoneInfo(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.zones).toBeDefined()
    })

    const firstZone = result.current.zones[0]
    expect(firstZone).toMatchObject({
      number: 1,
      name: 'Recovery',
      range: '95-114 BPM',
      percentRange: '50-60%',
      colorStyle: expect.objectContaining({
        backgroundColor: '#22c55e',
        borderColor: '#22c55e'
      })
    })
  })

  it('should format confidence levels correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockZoneAnalysisData })
    } as Response)

    const { result } = renderHook(() => useZoneInfo(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.analysis).toBeDefined()
    })

    const confidenceInfo = result.current.formatConfidenceLevel('high')
    expect(confidenceInfo).toEqual({
      text: 'High Confidence',
      color: 'text-green-600',
      description: 'Based on extensive heart rate data'
    })

    const mediumConfidence = result.current.formatConfidenceLevel('medium')
    expect(mediumConfidence.text).toBe('Medium Confidence')

    const lowConfidence = result.current.formatConfidenceLevel('low')
    expect(lowConfidence.text).toBe('Low Confidence')
  })

  it('should format data quality info correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockZoneAnalysisData })
    } as Response)

    const { result } = renderHook(() => useZoneInfo(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.analysis).toBeDefined()
    })

    const qualityInfo = result.current.getDataQualityInfo('excellent')
    expect(qualityInfo).toEqual({
      text: 'Excellent',
      color: 'text-green-600',
      icon: '🟢',
      description: 'Plenty of heart rate data available'
    })

    const poorQuality = result.current.getDataQualityInfo('poor')
    expect(poorQuality.text).toBe('Poor')
    expect(poorQuality.icon).toBe('🟠')
  })

  it('should provide quick access to commonly used data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockZoneAnalysisData })
    } as Response)

    const { result } = renderHook(() => useZoneInfo(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.analysis).toBeDefined()
    })

    expect(result.current.maxHeartRate).toBe(190)
    expect(result.current.dataQuality).toBe('excellent')
    expect(result.current.confidence).toBe('high')
    expect(result.current.needsMoreData).toBe(false)
  })
})

describe('useZoneCalculations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should calculate zone from heart rate', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockZoneAnalysisData })
    } as Response)

    const { result } = renderHook(() => useZoneCalculations(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.calculateZoneFromHeartRate).toBeDefined()
    })

    // Test zone 1 (95-114 BPM)
    const zone1 = result.current.calculateZoneFromHeartRate(100)
    expect(zone1?.number).toBe(1)
    expect(zone1?.name).toBe('Recovery')

    // Test zone 2 (114-133 BPM)
    const zone2 = result.current.calculateZoneFromHeartRate(125)
    expect(zone2?.number).toBe(2)
    expect(zone2?.name).toBe('Base/Aerobic')

    // Test out of range
    const noZone = result.current.calculateZoneFromHeartRate(50)
    expect(noZone).toBeNull()
  })

  it('should calculate zone distribution from heart rate data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockZoneAnalysisData })
    } as Response)

    const { result } = renderHook(() => useZoneCalculations(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.getZoneDistribution).toBeDefined()
    })

    const heartRateData = [
      { hr: 100, duration: 600 }, // Zone 1
      { hr: 100, duration: 300 }, // Zone 1
      { hr: 125, duration: 300 }, // Zone 2
    ]

    const distribution = result.current.getZoneDistribution(heartRateData)
    expect(distribution).toHaveLength(2) // 2 zones in mock data

    // Zone 1 should have 900 seconds (75%)
    const zone1 = distribution.find(z => z.number === 1)
    expect(zone1?.totalTime).toBe(900)
    expect(zone1?.percentage).toBe(75)

    // Zone 2 should have 300 seconds (25%)
    const zone2 = distribution.find(z => z.number === 2)
    expect(zone2?.totalTime).toBe(300)
    expect(zone2?.percentage).toBe(25)
  })

  it('should provide workout zone recommendations', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockZoneAnalysisData })
    } as Response)

    const { result } = renderHook(() => useZoneCalculations(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.getTargetZoneRecommendation).toBeDefined()
    })

    const recoveryZone = result.current.getTargetZoneRecommendation('recovery')
    expect(recoveryZone?.number).toBe(1)

    const baseZone = result.current.getTargetZoneRecommendation('base')
    expect(baseZone?.number).toBe(2)

    // Test case insensitive
    const easyZone = result.current.getTargetZoneRecommendation('EASY')
    expect(easyZone?.number).toBe(1)
  })

  it('should handle missing zone data gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: { 
          ...mockZoneAnalysisData, 
          suggestedZoneModel: { ...mockZoneAnalysisData.suggestedZoneModel, zones: [] }
        }
      })
    } as Response)

    const { result } = renderHook(() => useZoneCalculations(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.calculateZoneFromHeartRate).toBeDefined()
    })

    const zone = result.current.calculateZoneFromHeartRate(150)
    expect(zone).toBeNull()

    const distribution = result.current.getZoneDistribution([{ hr: 150, duration: 300 }])
    expect(distribution).toEqual([])

    const recommendation = result.current.getTargetZoneRecommendation('base')
    expect(recommendation).toBeNull()
  })
}) 