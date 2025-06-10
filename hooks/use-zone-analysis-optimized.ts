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
 * Optimized hook for zone analysis that minimizes unnecessary recalculations
 * Only recalculates when:
 * 1. New activities are synced (detects via last_sync timestamp)
 * 2. Data is truly stale (24 hours)
 * 3. User forces refresh
 */
export function useZoneAnalysisOptimized() {
  return useQuery<ZoneAnalysisResult, ZoneAnalysisError>({
    queryKey: ['zone-analysis-optimized'],
    queryFn: async () => {
      console.log('🎯 Fetching optimized zone analysis...')
      
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
    // Much longer stale time - zones don't change often
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    // Keep in cache for a week
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days (was cacheTime)
    // Only retry on network errors, not data errors
    retry: (failureCount, error) => {
      if (error.message.includes('404') || error.message.includes('400')) {
        return false
      }
      return failureCount < 2
    },
    // Don't refetch on window focus - zones don't change that often
    refetchOnWindowFocus: false,
    // Don't refetch on reconnect unless data is stale
    refetchOnReconnect: 'always',
  })
}

/**
 * Hook to check if zone analysis should be invalidated based on recent sync activity
 */
export function useZoneAnalysisInvalidation() {
  const queryClient = useQueryClient()

  // Check if we need to invalidate based on recent sync
  const checkAndInvalidateZones = async () => {
    try {
      // Get the current zone analysis cache
      const cachedZones = queryClient.getQueryData(['zone-analysis-optimized'])
      if (!cachedZones) return false

      // Check when zones were last calculated
      const zonesCacheTime = queryClient.getQueryState(['zone-analysis-optimized'])?.dataUpdatedAt
      if (!zonesCacheTime) return false

      // Get latest sync timestamp from sync status
      const syncResponse = await fetch('/api/strava/sync')
      if (!syncResponse.ok) return false
      
      const syncData = await syncResponse.json()
      const lastSyncTime = syncData.syncState?.last_activity_sync
      
      if (!lastSyncTime) return false

      // If activities were synced after zones were calculated, invalidate
      const lastSync = new Date(lastSyncTime).getTime()
      const zonesCalculated = new Date(zonesCacheTime).getTime()
      
      if (lastSync > zonesCalculated) {
        console.log('🔄 New activities detected - invalidating zone cache')
        queryClient.invalidateQueries({ queryKey: ['zone-analysis-optimized'] })
        return true
      }

      return false
    } catch (error) {
      console.error('Error checking zone invalidation:', error)
      return false
    }
  }

  const forceRefreshZones = () => {
    console.log('🔄 Force refreshing zone analysis')
    queryClient.invalidateQueries({ queryKey: ['zone-analysis-optimized'] })
  }

  return {
    checkAndInvalidateZones,
    forceRefreshZones
  }
}

/**
 * Smart hook that automatically invalidates zones when new activities are synced
 */
export function useSmartZoneAnalysis() {
  const zoneQuery = useZoneAnalysisOptimized()
  const { checkAndInvalidateZones } = useZoneAnalysisInvalidation()

  // Check for invalidation only on mount
  React.useEffect(() => {
    // Check on mount
    checkAndInvalidateZones()
    
    // No periodic checking - zones will be invalidated when sync completes
    // This reduces unnecessary API calls to check sync status
  }, [checkAndInvalidateZones])

  return zoneQuery
}

/**
 * Hook for zone-specific calculations with optimized data
 */
export function useZoneCalculationsOptimized() {
  const { data: analysis } = useZoneAnalysisOptimized()

  const calculateZoneFromHeartRate = React.useMemo(() => {
    return (heartRate: number) => {
      if (!analysis?.suggestedZoneModel?.zones) return null

      const zone = analysis.suggestedZoneModel.zones.find(z => 
        heartRate >= z.minHR && heartRate <= z.maxHR
      )

      return zone || null
    }
  }, [analysis])

  const getZoneDistribution = React.useMemo(() => {
    return (heartRateData: { hr: number; duration: number }[]) => {
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
  }, [analysis, calculateZoneFromHeartRate])

  return {
    analysis,
    calculateZoneFromHeartRate,
    getZoneDistribution,
    // Other calculations...
  }
}

/**
 * Migration helper - use this to gradually replace the old hook
 */
export function useZoneAnalysis() {
  // During migration, you can switch this to use the optimized version
  return useZoneAnalysisOptimized()
}

// Re-export other hooks for compatibility
export {
  useCustomZoneAnalysis,
  useZoneInfo,
  useZoneCalculations,
  useZonePreferences
} from './use-zone-analysis'

// Add React import
import React from 'react' 