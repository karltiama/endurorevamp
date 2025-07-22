'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'

interface ActivityData {
  id: string
  name: string
  sport_type: string
  distance: number
  moving_time: number
  average_speed: number | null
  average_heartrate: number | null
  total_elevation_gain: number | null
  average_watts: number | null
  start_date: string
  kudos_count: number
}

interface ValidationResult {
  totalActivities: number
  coreFieldsComplete: number
  performanceFieldsPresent: number
  dataQualityIssues: string[]
}

export function CoreDataValidator() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [validation, setValidation] = useState<ValidationResult | null>(null)

  const validateCoreData = async () => {
    if (!user) return
    
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Fetch recent activities
      const { data: activitiesData, error } = await supabase
        .from('activities')
        .select(`
          id, name, sport_type, distance, moving_time, 
          average_speed, average_heartrate, total_elevation_gain,
          average_watts, start_date, kudos_count
        `)
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(5)

      if (error) throw error

      setActivities(activitiesData || [])

      // Validate data quality
      const results = {
        totalActivities: activitiesData?.length || 0,
        coreFieldsComplete: 0,
        performanceFieldsPresent: 0,
        dataQualityIssues: [] as string[]
      }

      activitiesData?.forEach(activity => {
        // Check core fields
        if (activity.name && activity.sport_type && activity.distance > 0 && activity.moving_time > 0) {
          results.coreFieldsComplete++
        }

        // Check performance fields
        if (activity.average_speed || activity.average_heartrate) {
          results.performanceFieldsPresent++
        }

        // Check for data quality issues
        if (activity.distance <= 0) results.dataQualityIssues.push(`${activity.name}: Invalid distance`)
        if (activity.moving_time <= 0) results.dataQualityIssues.push(`${activity.name}: Invalid time`)
        if (activity.average_heartrate && (activity.average_heartrate < 30 || activity.average_heartrate > 220)) {
          results.dataQualityIssues.push(`${activity.name}: Invalid heart rate`)
        }
      })

      setValidation(results)

    } catch (error) {
      console.error('Validation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2) + ' km'
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const formatSpeed = (mps: number | null) => {
    if (!mps) return 'N/A'
    const kmh = mps * 3.6
    return `${kmh % 1 === 0 ? kmh.toFixed(0) : kmh.toFixed(1)} km/h`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Phase 1 Core Data Validator</CardTitle>
        <p className="text-sm text-gray-600">
          Tests that essential activity data is parsing, storing, and displaying correctly
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={validateCoreData} 
          disabled={isLoading || !user}
          className="w-full"
        >
          {isLoading ? 'Validating...' : 'Validate Core Data'}
        </Button>

        {validation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm font-medium text-blue-600">Total Activities</div>
                <div className="text-lg font-bold text-blue-900">{validation.totalActivities}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm font-medium text-green-600">Core Complete</div>
                <div className="text-lg font-bold text-green-900">
                  {validation.coreFieldsComplete}/{validation.totalActivities}
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <div className="text-sm font-medium text-yellow-600">Performance Data</div>
                <div className="text-lg font-bold text-yellow-900">
                  {validation.performanceFieldsPresent}/{validation.totalActivities}
                </div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-sm font-medium text-red-600">Issues</div>
                <div className="text-lg font-bold text-red-900">{validation.dataQualityIssues.length}</div>
              </div>
            </div>

            {validation.dataQualityIssues.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="font-medium text-red-800 mb-2">Data Quality Issues:</div>
                <ul className="text-sm text-red-700 space-y-1">
                  {validation.dataQualityIssues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activities.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Recent Activities Display Test</h3>
            {activities.map((activity) => (
              <div key={activity.id} className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{activity.name}</h4>
                  <Badge variant="outline">{activity.sport_type}</Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Distance:</span>
                    <div className="font-medium">{formatDistance(activity.distance)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <div className="font-medium">{formatTime(activity.moving_time)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Speed:</span>
                    <div className="font-medium">{formatSpeed(activity.average_speed)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">HR:</span>
                    <div className="font-medium">
                      {activity.average_heartrate ? `${activity.average_heartrate} bpm` : 'N/A'}
                    </div>
                  </div>
                </div>

                {(activity.total_elevation_gain || activity.average_watts) && (
                  <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                    {activity.total_elevation_gain && (
                      <div>
                        <span className="text-gray-500">Elevation:</span>
                        <div className="font-medium">{activity.total_elevation_gain}m</div>
                      </div>
                    )}
                    {activity.average_watts && (
                      <div>
                        <span className="text-gray-500">Power:</span>
                        <div className="font-medium">{activity.average_watts}w</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>💝 {activity.kudos_count}</span>
                  <span>📅 {new Date(activity.start_date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 