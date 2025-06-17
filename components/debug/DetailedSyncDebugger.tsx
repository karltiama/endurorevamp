'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStravaToken } from '@/hooks/strava/useStravaToken'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'

interface DetailedDebugResult {
  step: string
  status: 'pending' | 'success' | 'error' | 'warning'
  message: string
  data?: any
}

export function DetailedSyncDebugger() {
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugResults, setDebugResults] = useState<DetailedDebugResult[]>([])
  const { accessToken } = useStravaToken()
  const { user } = useAuth()

  const addResult = (result: DetailedDebugResult) => {
    setDebugResults(prev => [...prev, result])
  }

  const updateLastResult = (updates: Partial<DetailedDebugResult>) => {
    setDebugResults(prev => {
      const newResults = [...prev]
      const lastIndex = newResults.length - 1
      if (lastIndex >= 0) {
        newResults[lastIndex] = { ...newResults[lastIndex], ...updates }
      }
      return newResults
    })
  }

  const debugSpecificActivity = async () => {
    if (!accessToken || !user) {
      addResult({
        step: 'Prerequisites',
        status: 'error',
        message: 'Missing access token or user authentication'
      })
      return
    }

    setIsDebugging(true)
    setDebugResults([])

    try {
      // Step 1: Get the specific activity from Strava
      addResult({
        step: '1. Fetch Specific Activity',
        status: 'pending',
        message: 'Fetching "Afternoon Run" from Strava API...'
      })

      const stravaResponse = await fetch('/api/strava/activities?limit=10', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!stravaResponse.ok) {
        updateLastResult({
          status: 'error',
          message: 'Failed to fetch from Strava API'
        })
        return
      }

      const stravaActivities = await stravaResponse.json()
      const targetActivity = stravaActivities.find((a: any) => a.id === 14821394327)

      if (!targetActivity) {
        updateLastResult({
          status: 'error',
          message: 'Target activity not found in recent activities',
          data: { availableIds: stravaActivities.map((a: any) => a.id) }
        })
        return
      }

      updateLastResult({
        status: 'success',
        message: `Found "${targetActivity.name}" in Strava API`,
        data: targetActivity
      })

      // Helper function to suggest SQL types
      const getSQLType = (value: any, fieldName: string): string => {
        if (value === null || value === undefined) return 'TEXT -- null value'
        
        const type = typeof value
        switch (type) {
          case 'boolean': return 'BOOLEAN'
          case 'number': 
            if (Number.isInteger(value)) return 'INTEGER'
            return 'FLOAT'
          case 'string':
            if (fieldName.includes('date') || fieldName.includes('time')) return 'TIMESTAMPTZ'
            if (fieldName.includes('id')) return 'BIGINT'
            if (value.length > 255) return 'TEXT'
            return 'VARCHAR(255)'
          case 'object':
            if (Array.isArray(value)) return 'JSONB -- array'
            return 'JSONB -- object'
          default:
            return 'TEXT -- unknown'
        }
      }

      // Log activity data for debugging and schema planning
      console.log('🔍 Raw Strava activity data:', targetActivity)
      console.log('🔍 Strava API fields analysis:')
      
      // Check specifically for pace strings that might be causing issues
      const problematicFields = Object.entries(targetActivity).filter(([key, value]) => {
        return typeof value === 'string' && (
          value.includes('/km') || 
          value.includes('/mi') || 
          value.includes('/ km') || 
          value.includes('/ mi') ||
          (value.includes(':') && value.includes('/'))
        )
      })
      
      if (problematicFields.length > 0) {
        console.log('⚠️ Found pace strings that need conversion:', problematicFields)
      }
      
      const fieldAnalysis = Object.entries(targetActivity).map(([key, value]) => {
        const analysis = {
          field: key,
          type: typeof value,
          value: value,
          sqlType: getSQLType(value, key)
        }
        
        // Check for pace strings
        if (typeof value === 'string') {
          const str = value.trim()
          const pacePatterns = [
            /^\d{1,2}:\d{2}\s*\/\s*(km|mi|mile)$/i,
            /^\d{1,2}:\d{2}\s*\/\s*(km|mi|mile)\s*$/i,
            /^\d{1,2}:\d{2}\/\s*(km|mi|mile)$/i,
            /^\d{1,2}:\d{2}\s+\/\s+(km|mi|mile)$/i
          ]
          
          const isPaceString = pacePatterns.some(pattern => pattern.test(str)) ||
            (str.includes(':') && (str.includes('/km') || str.includes('/mi') || str.includes('/ km') || str.includes('/ mi')))
          
          if (isPaceString) {
            analysis.sqlType = 'INTEGER -- pace in seconds'
            console.log(`  🔄  ${key}: "${value}" (PACE STRING - CONVERT TO SECONDS)`)
          }
        }
        
        return analysis
      })
      
      console.log('📋 Schema suggestions:', fieldAnalysis)

      // Step 2: Check database schema
      addResult({
        step: '2. Check Database Schema',
        status: 'pending',
        message: 'Checking what fields exist in activities table...'
      })

      const supabase = createClient()

      try {
        // Query the database schema to see what columns exist
        const { data: schemaData, error: schemaError } = await supabase
          .from('activities')
          .select('*')
          .limit(1)

        if (schemaError) {
          console.log('Schema check error:', schemaError)
        } else {
          const existingFields = schemaData && schemaData.length > 0 ? Object.keys(schemaData[0]) : []
          console.log('📋 Available fields in activities table:', existingFields)
          updateLastResult({
            status: 'success',
            message: `Found ${existingFields.length} fields in activities table`,
            data: existingFields
          })
        }
      } catch (error) {
        console.log('Schema check failed:', error)
        updateLastResult({
          status: 'warning',
          message: 'Could not check schema, proceeding anyway'
        })
      }

      // Step 3: Check current database state
      addResult({
        step: '3. Check Database State',
        status: 'pending',
        message: 'Checking if activity exists in database...'
      })
      const { data: existingActivity, error: checkError } = await supabase
        .from('activities')
        .select('*')
        .eq('strava_activity_id', 14821394327)
        .eq('user_id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Database check error details:', checkError)
        updateLastResult({
          status: 'error',
          message: `Database check failed: ${checkError.message} (Code: ${checkError.code})`,
          data: checkError
        })
        return
      }

      updateLastResult({
        status: existingActivity ? 'warning' : 'success',
        message: existingActivity ? 'Activity already exists in database' : 'Activity not in database (as expected)',
        data: existingActivity || null
      })

      // Step 3: Attempt manual storage
      addResult({
        step: '3. Manual Storage Test',
        status: 'pending',
        message: 'Attempting to store activity directly...'
      })

      // Helper function to convert pace strings to seconds
      const paceToSeconds = (pace: string): number => {
        // pace = "07:04 /km" → take "07:04"
        const timePart = pace.split(" ")[0].split("/")[0].trim()
        const [minutes, seconds] = timePart.split(":").map(Number)
        return minutes * 60 + seconds // 7*60 + 4 = 424
      }

      // Helper function to safely convert to number
      const safeNumber = (value: any, fieldName?: string): number | null => {
        if (value === null || value === undefined || value === '') return null
        
        // First, check if it's already a number
        if (typeof value === 'number') {
          return isFinite(value) ? value : null
        }
        
        // Handle string values
        if (typeof value === 'string') {
          const str = value.trim()
          
          // Check for any pace-related string (more comprehensive)
          const hasPaceIndicators = str.includes('/') || 
                                   (str.includes(':') && (str.includes('km') || str.includes('mi'))) ||
                                   str.includes(' /') || 
                                   str.includes('/ ')
          
          if (hasPaceIndicators) {
            console.log(`⚠️ Skipping pace string for ${fieldName}: "${value}" (will return null)`)
            return null
          }
          
          // Try to parse as regular number
          const num = Number(str)
          if (isNaN(num)) {
            console.log(`⚠️ Invalid number for ${fieldName}: "${value}"`)
            return null
          }
          return num
        }
        
        // For any other type, try to convert
        const num = Number(value)
        if (isNaN(num)) {
          console.log(`⚠️ Cannot convert to number for ${fieldName}: "${value}" (type: ${typeof value})`)
          return null
        }
        return num
      }

      // Helper for integer fields specifically  
      const safeInteger = (value: any, fieldName?: string): number | null => {
        const num = safeNumber(value, fieldName)
        return num !== null ? Math.round(num) : null
      }

      // Transform Strava activity to database format (ONLY fields that exist in YOUR actual schema)
      const activityData = {
        user_id: user.id,
        strava_activity_id: Number(targetActivity.id),
        name: targetActivity.name || null,
        sport_type: targetActivity.sport_type || null,
        start_date: targetActivity.start_date || null,
        start_date_local: targetActivity.start_date_local || null,
        timezone: targetActivity.timezone || null,
        distance: safeNumber(targetActivity.distance, 'distance'),
        moving_time: safeInteger(targetActivity.moving_time, 'moving_time'),
        elapsed_time: safeInteger(targetActivity.elapsed_time, 'elapsed_time'),
        total_elevation_gain: safeNumber(targetActivity.total_elevation_gain, 'total_elevation_gain'),
        average_speed: safeNumber(targetActivity.average_speed, 'average_speed'),
        max_speed: safeNumber(targetActivity.max_speed, 'max_speed'),
        average_heartrate: safeInteger(targetActivity.average_heartrate, 'average_heartrate'),
        max_heartrate: safeInteger(targetActivity.max_heartrate, 'max_heartrate'),
        has_heartrate: Boolean(targetActivity.has_heartrate),
        average_watts: safeNumber(targetActivity.average_watts, 'average_watts'),
        max_watts: safeNumber(targetActivity.max_watts, 'max_watts'),
        weighted_average_watts: safeNumber(targetActivity.weighted_average_watts, 'weighted_average_watts'),
        kilojoules: safeNumber(targetActivity.kilojoules, 'kilojoules'),
        has_power: Boolean(targetActivity.average_watts || targetActivity.max_watts), // Computed field
        trainer: Boolean(targetActivity.trainer),
        commute: Boolean(targetActivity.commute),
        manual: Boolean(targetActivity.manual),
        achievement_count: safeInteger(targetActivity.achievement_count, 'achievement_count') || 0,
        kudos_count: safeInteger(targetActivity.kudos_count, 'kudos_count') || 0,
        comment_count: safeInteger(targetActivity.comment_count, 'comment_count') || 0,
        
        // Computed fields - calculate from basic data
        week_number: (() => {
          const activityDate = new Date(targetActivity.start_date)
          const yearStart = new Date(activityDate.getFullYear(), 0, 1)
          const weekNumber = Math.ceil((activityDate.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
          return safeInteger(weekNumber)
        })(),
        month_number: safeInteger(new Date(targetActivity.start_date).getMonth() + 1),
        year_number: safeInteger(new Date(targetActivity.start_date).getFullYear()),
        day_of_week: safeInteger(new Date(targetActivity.start_date).getDay()),
        
        // Calculate average pace in seconds per km (for numeric storage)
        average_pace: targetActivity.distance && targetActivity.moving_time ? 
          safeInteger((targetActivity.moving_time / (targetActivity.distance / 1000))) : null,
          
        // Calculate elevation per km
        elevation_per_km: targetActivity.distance && targetActivity.total_elevation_gain ? 
          safeNumber((targetActivity.total_elevation_gain * 1000) / targetActivity.distance) : null,
          
        // Simple efficiency score (distance per minute)
        efficiency_score: targetActivity.distance && targetActivity.moving_time ? 
          safeNumber(targetActivity.distance / (targetActivity.moving_time / 60)) : null
      }

      console.log('🔍 Activity data to insert:', activityData)
      console.log('🔍 Data types:', Object.entries(activityData).map(([key, value]) => ({
        field: key,
        type: typeof value,
        value: value,
        isNull: value === null
      })))

      const { data: insertResult, error: insertError } = await supabase
        .from('activities')
        .upsert(activityData, {
          onConflict: 'user_id,strava_activity_id', // Use the composite unique constraint
          ignoreDuplicates: false
        })
        .select('*')
        .single()

      if (insertError) {
        console.error('Insert error details:', insertError)
        console.error('Activity data that failed:', activityData)
        updateLastResult({
          status: 'error',
          message: `Insert failed: ${insertError.message} (Code: ${insertError.code || 'unknown'})`,
          data: { 
            error: insertError,
            activityData: activityData,
            hint: insertError.hint,
            details: insertError.details
          }
        })
        return
      }

      updateLastResult({
        status: 'success',
        message: 'Activity successfully stored in database!',
        data: insertResult
      })

      // Step 4: Verify storage
      addResult({
        step: '4. Verify Storage',
        status: 'pending',
        message: 'Verifying activity was stored correctly...'
      })

      const { data: verifyData, error: verifyError } = await supabase
        .from('activities')
        .select('*')
        .eq('strava_activity_id', 14821394327)
        .eq('user_id', user.id)
        .single()

      if (verifyError) {
        updateLastResult({
          status: 'error',
          message: `Verification failed: ${verifyError.message}`
        })
        return
      }

      updateLastResult({
        status: 'success',
        message: `✅ Activity verified in database: "${verifyData.name}"`,
        data: {
          stored: verifyData,
          matches: verifyData.strava_activity_id === targetActivity.id
        }
      })

      // Step 5: Test the sync API with this specific activity
      addResult({
        step: '5. Test Production Sync',
        status: 'pending',
        message: 'Testing if production sync would work...'
      })

      const syncResponse = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxActivities: 5,
          forceRefresh: true
        })
      })

      if (!syncResponse.ok) {
        const syncError = await syncResponse.json()
        updateLastResult({
          status: 'error',
          message: `Production sync failed: ${syncError.message || 'Unknown error'}`
        })
        return
      }

      const syncResult = await syncResponse.json()
      updateLastResult({
        status: 'success',
        message: `Production sync completed: ${syncResult.data?.activitiesProcessed || 0} activities processed`,
        data: syncResult
      })

    } catch (error) {
      console.error('Debug error:', error)
      updateLastResult({
        status: 'error',
        message: `Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsDebugging(false)
    }
  }

  const clearResults = () => {
    setDebugResults([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          🔬 Detailed Activity Storage Debug
          <div className="flex gap-2">
            <Button onClick={clearResults} size="sm" variant="outline" disabled={isDebugging}>
              Clear
            </Button>
            <Button onClick={debugSpecificActivity} size="sm" disabled={isDebugging || !accessToken || !user}>
              {isDebugging ? 'Debugging...' : 'Debug "Afternoon Run"'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            This will trace exactly what happens when trying to store your "Afternoon Run" activity in the database.
          </p>

          {debugResults.length === 0 && !isDebugging && (
            <div className="text-center py-8 text-gray-500">
              Click "Debug Afternoon Run" to trace the storage issue
            </div>
          )}

          {debugResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{result.step}</h4>
                <Badge 
                  variant={
                    result.status === 'success' ? 'default' : 
                    result.status === 'error' ? 'destructive' : 
                    result.status === 'warning' ? 'secondary' :
                    'outline'
                  }
                >
                  {result.status === 'pending' && '⏳'}
                  {result.status === 'success' && '✅'}
                  {result.status === 'error' && '❌'}
                  {result.status === 'warning' && '⚠️'}
                  {result.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-700">{result.message}</p>
              
              {result.data && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">View Data</summary>
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 