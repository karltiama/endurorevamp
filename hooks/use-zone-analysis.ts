import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ZoneAnalysisResult } from '@/lib/training/zone-analysis'

interface CustomZoneParams {
  maxHeartRate?: number
  zoneModel?: '5-zone' | '3-zone' | 'coggan'
  sportFilter?: string
}

interface ZoneAnalysisError {
  message: string
  details?: string
}

/**
 * Hook for automatic zone analysis based on user's activity data
 */
export function useZoneAnalysis() {
  return useQuery<ZoneAnalysisResult, ZoneAnalysisError>({
    queryKey: ['zone-analysis'],
    queryFn: async () => {
      console.log('🎯 Fetching zone analysis...')
      
      const response = await fetch('/api/training/zones', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze zones')
      }

      const data = await response.json()
      console.log('✅ Zone analysis fetched:', data.data)
      return data.data
    },
    staleTime: 60 * 60 * 1000, // 1 hour (zones don't change often)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: (failureCount, error) => {
      // Don't retry if it's a client error (4xx)
      if (error.message.includes('404') || error.message.includes('400')) {
        return false
      }
      return failureCount < 2
    }
  })
}

/**
 * Hook for custom zone analysis with user-provided parameters
 */
export function useCustomZoneAnalysis() {
  const queryClient = useQueryClient()

  return useMutation<ZoneAnalysisResult, ZoneAnalysisError, CustomZoneParams>({
    mutationFn: async (params: CustomZoneParams) => {
      console.log('🎯 Performing custom zone analysis:', params)
      
      const response = await fetch('/api/training/zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to perform custom zone analysis')
      }

      const data = await response.json()
      console.log('✅ Custom zone analysis completed:', data.data)
      return data.data
    },
    onSuccess: (data) => {
      // Update the main zone analysis cache with custom results
      queryClient.setQueryData(['zone-analysis'], data)
    }
  })
}

/**
 * Helper hook to get formatted zone information
 */
export function useZoneInfo() {
  const { data: analysis, isLoading, error } = useZoneAnalysis()

  const formatZoneForDisplay = (zone: any) => ({
    ...zone,
    range: `${zone.minHR}-${zone.maxHR} BPM`,
    percentRange: `${zone.minPercent}-${zone.maxPercent}%`,
    colorStyle: { backgroundColor: zone.color, opacity: 0.1, borderColor: zone.color }
  })

  const formatConfidenceLevel = (confidence: string) => {
    const levels = {
      high: { 
        text: 'High Confidence', 
        color: 'text-green-600',
        description: 'Based on extensive heart rate data'
      },
      medium: { 
        text: 'Medium Confidence', 
        color: 'text-yellow-600',
        description: 'Based on moderate heart rate data'
      },
      low: { 
        text: 'Low Confidence', 
        color: 'text-red-600',
        description: 'Based on limited heart rate data'
      }
    }
    return levels[confidence as keyof typeof levels] || levels.low
  }

  const getDataQualityInfo = (quality: string) => {
    const qualities = {
      excellent: { 
        text: 'Excellent', 
        color: 'text-green-600',
        icon: '🟢',
        description: 'Plenty of heart rate data available'
      },
      good: { 
        text: 'Good', 
        color: 'text-blue-600',
        icon: '🔵',
        description: 'Good amount of heart rate data'
      },
      fair: { 
        text: 'Fair', 
        color: 'text-yellow-600',
        icon: '🟡',
        description: 'Some heart rate data available'
      },
      poor: { 
        text: 'Poor', 
        color: 'text-orange-600',
        icon: '🟠',
        description: 'Limited heart rate data'
      },
      none: { 
        text: 'No Data', 
        color: 'text-red-600',
        icon: '🔴',
        description: 'No heart rate data found'
      }
    }
    return qualities[quality as keyof typeof qualities] || qualities.none
  }

  return {
    analysis,
    isLoading,
    error,
    formatZoneForDisplay,
    formatConfidenceLevel,
    getDataQualityInfo,
    // Quick access to commonly used data
    zones: analysis?.suggestedZoneModel?.zones?.map(formatZoneForDisplay) || [],
    maxHeartRate: analysis?.overall?.maxHeartRate,
    dataQuality: analysis?.overall?.hrDataQuality,
    confidence: analysis?.confidence,
    needsMoreData: analysis?.needsMoreData || false
  }
}

/**
 * Hook for zone-specific calculations and utilities
 */
export function useZoneCalculations() {
  const { analysis } = useZoneInfo()

  const calculateZoneFromHeartRate = (heartRate: number) => {
    if (!analysis?.suggestedZoneModel?.zones) return null

    const zone = analysis.suggestedZoneModel.zones.find(z => 
      heartRate >= z.minHR && heartRate <= z.maxHR
    )

    return zone || null
  }

  const calculateZoneTime = (heartRate: number, duration: number) => {
    const zone = calculateZoneFromHeartRate(heartRate)
    return zone ? { zone, duration } : null
  }

  const getZoneDistribution = (heartRateData: { hr: number; duration: number }[]) => {
    if (!analysis?.suggestedZoneModel?.zones) return []

    const distribution = analysis.suggestedZoneModel.zones.map(zone => ({
      ...zone,
      totalTime: 0,
      percentage: 0
    }))

    const totalTime = heartRateData.reduce((sum, data) => sum + data.duration, 0)

    heartRateData.forEach(data => {
      const zone = calculateZoneFromHeartRate(data.hr)
      if (zone) {
        const zoneIndex = distribution.findIndex(z => z.number === zone.number)
        if (zoneIndex >= 0) {
          distribution[zoneIndex].totalTime += data.duration
        }
      }
    })

    // Calculate percentages
    distribution.forEach(zone => {
      zone.percentage = totalTime > 0 ? (zone.totalTime / totalTime) * 100 : 0
    })

    return distribution
  }

  const getTargetZoneRecommendation = (workoutType: string) => {
    if (!analysis?.suggestedZoneModel?.zones) return null

    const recommendations = {
      'easy': 1, // Zone 1-2
      'base': 2, // Zone 2
      'tempo': 3, // Zone 3
      'threshold': 4, // Zone 4
      'vo2max': 5, // Zone 5
      'recovery': 1 // Zone 1
    }

    const targetZone = recommendations[workoutType.toLowerCase() as keyof typeof recommendations]
    return analysis.suggestedZoneModel.zones.find(z => z.number === targetZone) || null
  }

  return {
    calculateZoneFromHeartRate,
    calculateZoneTime,
    getZoneDistribution,
    getTargetZoneRecommendation
  }
}

/**
 * Hook for managing user zone preferences
 */
export function useZonePreferences() {
  const queryClient = useQueryClient()

  const saveZonePreference = (zoneModel: string) => {
    // For now, just update local state
    // Later can be saved to user preferences in database
    console.log('💾 Saving zone preference:', zoneModel)
    
    // Could invalidate and refetch with new preference
    queryClient.invalidateQueries({ queryKey: ['zone-analysis'] })
  }

  const resetToAutoZones = () => {
    console.log('🔄 Resetting to automatic zones')
    queryClient.invalidateQueries({ queryKey: ['zone-analysis'] })
  }

  return {
    saveZonePreference,
    resetToAutoZones
  }
} 