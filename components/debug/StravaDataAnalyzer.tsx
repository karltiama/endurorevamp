'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStravaToken } from '@/hooks/strava/useStravaToken'
import { useAuth } from '@/providers/AuthProvider'

interface FieldAnalysis {
  fieldName: string
  dataType: string
  sampleValue: string | number | boolean | null
  sqlType: string
  frequency: number
  isUsedInApp: boolean
  priority: 'high' | 'medium' | 'low'
  phase: 1 | 2 | 3
}

export function StravaDataAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<FieldAnalysis[]>([])
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([])
  const { accessToken } = useStravaToken()
  const { user } = useAuth()

  // Define which fields are currently used in the app
  const currentlyUsedFields = new Set([
    'id', 'name', 'sport_type', 'distance', 'moving_time', 'elapsed_time',
    'start_date', 'start_date_local', 'average_speed', 'max_speed',
    'average_heartrate', 'max_heartrate', 'kudos_count', 'comment_count',
    'achievement_count', 'trainer', 'commute', 'manual', 'private',
    // Analytics fields that ARE actually used in components
    'total_elevation_gain', 'average_watts', 'max_watts', 'weighted_average_watts',
    'kilojoules', 'has_heartrate', 'has_power'
  ])

  const getFieldPriority = (fieldName: string): { priority: 'high' | 'medium' | 'low', phase: 1 | 2 | 3 } => {
    // High priority - currently used and critical
    const highPriority = ['id', 'name', 'sport_type', 'distance', 'moving_time', 'elapsed_time', 'start_date', 'start_date_local']
    if (highPriority.includes(fieldName)) return { priority: 'high', phase: 1 }
    
    // Medium priority - used in analytics/performance
    const mediumPriority = ['average_speed', 'max_speed', 'average_heartrate', 'max_heartrate', 'total_elevation_gain', 'average_watts', 'max_watts']
    if (mediumPriority.includes(fieldName)) return { priority: 'medium', phase: 2 }
    
    // Low priority - social, location, advanced features
    return { priority: 'low', phase: 3 }
  }

  const getSQLType = (value: unknown, fieldName: string): string => {
    if (value === null || value === undefined) return 'NULL'
    
    const type = typeof value
    switch (type) {
      case 'boolean': return 'BOOLEAN'
      case 'number': 
        if (Number.isInteger(value)) {
          if (fieldName.includes('id')) return 'BIGINT'
          return 'INTEGER'
        }
        return 'FLOAT'
      case 'string':
        if (fieldName.includes('date') || fieldName.includes('time')) return 'TIMESTAMPTZ'
        if (fieldName.includes('id')) return 'VARCHAR(50)'
        if ((value as string).length > 255) return 'TEXT'
        return 'VARCHAR(255)'
      case 'object':
        if (Array.isArray(value)) {
          if (value.length === 2 && typeof value[0] === 'number') return 'POINT -- lat/lng'
          return 'JSONB -- array'
        }
        return 'JSONB -- object'
      default:
        return 'TEXT'
    }
  }

  const analyzeStravaData = async () => {
    if (!accessToken || !user) return

    setIsAnalyzing(true)
    setAnalysis([])
    setRawData([])

    try {
      // Fetch recent activities from Strava
      const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=10`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Strava data')
      }

      const activities = await response.json()
      setRawData(activities)

      if (activities.length === 0) {
        setAnalysis([])
        return
      }

      // Analyze field usage across all activities
      const fieldStats = new Map<string, {
        values: unknown[]
        types: Set<string>
        frequency: number
      }>()

      activities.forEach((activity: Record<string, unknown>) => {
        Object.entries(activity).forEach(([key, value]) => {
          if (!fieldStats.has(key)) {
            fieldStats.set(key, { values: [], types: new Set(), frequency: 0 })
          }
          
          const stats = fieldStats.get(key)!
          if (value !== null && value !== undefined) {
            stats.values.push(value)
            stats.types.add(typeof value)
            stats.frequency++
          }
        })
      })

      // Convert to analysis format
      const analysisResults: FieldAnalysis[] = Array.from(fieldStats.entries()).map(([fieldName, stats]) => {
        const sampleValue = stats.values[0] as string | number | boolean | null
        const { priority, phase } = getFieldPriority(fieldName)
        
        return {
          fieldName,
          dataType: Array.from(stats.types).join(' | '),
          sampleValue,
          sqlType: getSQLType(sampleValue, fieldName),
          frequency: stats.frequency,
          isUsedInApp: currentlyUsedFields.has(fieldName),
          priority,
          phase
        }
      })

      // Sort by priority and frequency
      analysisResults.sort((a, b) => {
        if (a.priority !== b.priority) {
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        return b.frequency - a.frequency
      })

      setAnalysis(analysisResults)

    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateSchemaSQL = () => {
    const phase1Fields = analysis.filter(f => f.phase === 1)
    const phase2Fields = analysis.filter(f => f.phase === 2)
    
    let sql = `-- PHASE 1: Core Activities Table\n`
    sql += `CREATE TABLE activities (\n`
    sql += `  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n`
    sql += `  user_id UUID NOT NULL REFERENCES auth.users(id),\n`
    
    phase1Fields.forEach(field => {
      if (field.fieldName === 'id') {
        sql += `  strava_activity_id ${field.sqlType} NOT NULL,\n`
      } else if (field.fieldName !== 'athlete' && field.fieldName !== 'map') {
        sql += `  ${field.fieldName} ${field.sqlType}${field.priority === 'high' ? ' NOT NULL' : ''},\n`
      }
    })
    
    sql += `  created_at TIMESTAMPTZ DEFAULT NOW(),\n`
    sql += `  updated_at TIMESTAMPTZ DEFAULT NOW(),\n`
    sql += `  UNIQUE(user_id, strava_activity_id)\n`
    sql += `);\n\n`
    
    if (phase2Fields.length > 0) {
      sql += `-- PHASE 2: Extended Metrics Table\n`
      sql += `CREATE TABLE activity_metrics (\n`
      sql += `  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,\n`
      
      phase2Fields.forEach(field => {
        if (!['athlete', 'map'].includes(field.fieldName)) {
          sql += `  ${field.fieldName} ${field.sqlType},\n`
        }
      })
      
      sql += `  created_at TIMESTAMPTZ DEFAULT NOW()\n`
      sql += `);\n`
    }
    
    return sql
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          📊 Strava Data Structure Analyzer
          <Button onClick={analyzeStravaData} size="sm" disabled={isAnalyzing || !accessToken || !user}>
            {isAnalyzing ? 'Analyzing...' : 'Analyze Strava Data'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This analyzes your actual Strava data to help design an optimal schema based on what fields are available and how they&apos;re used.
          </p>

          {!analysis.length && !isAnalyzing && (
            <div className="text-center py-8 text-gray-500">
              Click &quot;Analyze Strava Data&quot; to examine your activity data structure
            </div>
          )}

          {analysis.length > 0 && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{analysis.length}</div>
                  <div className="text-sm text-gray-600">Total Fields</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.filter(f => f.isUsedInApp).length}
                  </div>
                  <div className="text-sm text-gray-600">Currently Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {analysis.filter(f => !f.isUsedInApp).length}
                  </div>
                  <div className="text-sm text-gray-600">Unused/Future</div>
                </div>
              </div>

              {/* Phase Breakdown */}
              {[1, 2, 3].map(phase => {
                const phaseFields = analysis.filter(f => f.phase === phase)
                if (phaseFields.length === 0) return null

                return (
                  <div key={phase} className="border rounded-lg overflow-hidden">
                    <div className={`p-3 font-medium ${
                      phase === 1 ? 'bg-red-50 text-red-800' :
                      phase === 2 ? 'bg-yellow-50 text-yellow-800' :
                      'bg-green-50 text-green-800'
                    }`}>
                      Phase {phase}: {phase === 1 ? 'Core Data' : phase === 2 ? 'Analytics' : 'Advanced Features'} 
                      ({phaseFields.length} fields)
                    </div>
                    <div className="p-3 space-y-2">
                      {phaseFields.map((field, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-center gap-2">
                            <code className="font-mono">{field.fieldName}</code>
                            {field.isUsedInApp && <Badge variant="default" className="text-xs">Used</Badge>}
                            <Badge variant="outline" className="text-xs">{field.sqlType}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{field.frequency}/{rawData.length} activities</span>
                            <Badge variant={field.priority === 'high' ? 'default' : field.priority === 'medium' ? 'secondary' : 'outline'}>
                              {field.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Generated SQL */}
              <div className="border rounded-lg">
                <div className="p-3 bg-blue-50 font-medium text-blue-800 border-b">
                  🏗️ Generated Schema SQL
                </div>
                <div className="p-3">
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96">
                    {generateSchemaSQL()}
                  </pre>
                </div>
              </div>

              {/* Raw Data Sample */}
              <details className="border rounded-lg">
                <summary className="p-3 bg-gray-50 cursor-pointer font-medium">
                  🔍 Raw Strava Data Sample (click to expand)
                </summary>
                <div className="p-3">
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96">
                    {JSON.stringify(rawData[0], null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 