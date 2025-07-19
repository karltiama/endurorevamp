'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUserActivities } from '@/hooks/use-user-activities'
import { useAuth } from '@/providers/AuthProvider'
import { TrainingLoadCalculator } from '@/lib/training/training-load'
import { estimateAthleteThresholds } from '@/lib/training/training-load'

interface ActivityAnalysis {
  id: string
  name: string
  sport_type: string
  date: string
  duration: number
  avgHR?: number
  avgPower?: number
  trimp: number
  tss: number
  normalizedLoad: number
  hasHR: boolean
  hasPower: boolean
}

interface DailyAnalysis {
  date: string
  activities: ActivityAnalysis[]
  totalTrimp: number
  totalTss: number
  totalLoad: number
  activityCount: number
}

export function DailyLoadDebugger() {
  const [selectedDate1, setSelectedDate1] = useState('2024-07-16')
  const [selectedDate2, setSelectedDate2] = useState('2024-07-18')
  const [analysis, setAnalysis] = useState<{
    date1?: DailyAnalysis
    date2?: DailyAnalysis
  }>({})
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  
  const { user } = useAuth()
  const { data: activities = [], isLoading, error: activitiesError } = useUserActivities(user?.id || '')

  const analyzeDates = () => {
    console.log('🔍 DailyLoadDebugger: analyzeDates called')
    setError(null)
    setDebugInfo([])
    
    try {
      // Debug info collection
      const debug: string[] = []
      debug.push(`User ID: ${user?.id || 'undefined'}`)
      debug.push(`Activities loaded: ${activities.length}`)
      debug.push(`Activities loading: ${isLoading}`)
      debug.push(`Activities error: ${activitiesError?.message || 'none'}`)
      
      if (!user?.id) {
        setError('No user ID available')
        setDebugInfo(debug)
        return
      }

      if (activities.length === 0) {
        setError('No activities available')
        setDebugInfo(debug)
        return
      }

      debug.push('Estimating athlete thresholds...')
      const athleteThresholds = estimateAthleteThresholds(activities)
      debug.push(`Athlete thresholds: ${JSON.stringify(athleteThresholds)}`)
      
      debug.push('Creating TrainingLoadCalculator...')
      const calculator = new TrainingLoadCalculator(athleteThresholds)
      debug.push('Calculator created successfully')

      const analyzeDate = (targetDate: string): DailyAnalysis | undefined => {
        debug.push(`Analyzing date: ${targetDate}`)
        const dayActivities = activities.filter(activity => {
          const activityDate = activity.start_date_local?.split('T')[0]
          return activityDate === targetDate
        })

        debug.push(`Found ${dayActivities.length} activities for ${targetDate}`)

        if (dayActivities.length === 0) return undefined

        const activityAnalyses: ActivityAnalysis[] = dayActivities.map(activity => {
          try {
            const trimp = calculator.calculateTRIMP(activity)
            const tss = calculator.calculateTSS(activity)
            const normalizedLoad = calculator.calculateNormalizedLoad(activity)

            return {
              id: activity.id || '',
              name: activity.name,
              sport_type: activity.sport_type,
              date: activity.start_date_local?.split('T')[0] || '',
              duration: activity.moving_time,
              avgHR: activity.average_heartrate || undefined,
              avgPower: activity.average_watts || undefined,
              trimp,
              tss,
              normalizedLoad,
              hasHR: !!(activity.has_heartrate && activity.average_heartrate),
              hasPower: !!activity.average_watts
            }
          } catch (err) {
            debug.push(`Error processing activity ${activity.id}: ${err}`)
            return {
              id: activity.id || '',
              name: activity.name,
              sport_type: activity.sport_type,
              date: activity.start_date_local?.split('T')[0] || '',
              duration: activity.moving_time,
              avgHR: activity.average_heartrate || undefined,
              avgPower: activity.average_watts || undefined,
              trimp: 0,
              tss: 0,
              normalizedLoad: 0,
              hasHR: !!(activity.has_heartrate && activity.average_heartrate),
              hasPower: !!activity.average_watts
            }
          }
        })

        const totalTrimp = activityAnalyses.reduce((sum, act) => sum + act.trimp, 0)
        const totalTss = activityAnalyses.reduce((sum, act) => sum + act.tss, 0)
        const totalLoad = activityAnalyses.reduce((sum, act) => sum + act.normalizedLoad, 0)

        debug.push(`Date ${targetDate} totals: TRIMP=${totalTrimp}, TSS=${totalTss}, Load=${totalLoad}`)

        return {
          date: targetDate,
          activities: activityAnalyses,
          totalTrimp,
          totalTss,
          totalLoad,
          activityCount: activityAnalyses.length
        }
      }

      const date1Analysis = analyzeDate(selectedDate1)
      const date2Analysis = analyzeDate(selectedDate2)

      setAnalysis({ date1: date1Analysis, date2: date2Analysis })
      setDebugInfo(debug)
      
      console.log('✅ Analysis completed successfully')
      
    } catch (err) {
      console.error('❌ Error in analyzeDates:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setDebugInfo(debugInfo)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Daily Load Comparison Debugger</CardTitle>
          <p className="text-sm text-gray-600">
            Compare daily load calculations between two specific dates
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="date1">Date 1</Label>
              <Input
                id="date1"
                type="date"
                value={selectedDate1}
                onChange={(e) => setSelectedDate1(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="date2">Date 2</Label>
              <Input
                id="date2"
                type="date"
                value={selectedDate2}
                onChange={(e) => setSelectedDate2(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={analyzeDates}>Analyze</Button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <h4 className="font-medium text-red-800 mb-2">❌ Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {debugInfo.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <h4 className="font-medium text-blue-800 mb-2">🔍 Debug Info</h4>
              <div className="text-xs text-blue-700 space-y-1">
                {debugInfo.map((info, index) => (
                  <div key={index}>{info}</div>
                ))}
              </div>
            </div>
          )}

          {analysis.date1 && analysis.date2 && (
            <div className="space-y-6">
              {/* Comparison Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{selectedDate1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Activities:</span>
                        <Badge>{analysis.date1.activityCount}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Load:</span>
                        <Badge variant="outline">{analysis.date1.totalLoad.toFixed(1)}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Total TRIMP:</span>
                        <span className="text-sm">{analysis.date1.totalTrimp.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total TSS:</span>
                        <span className="text-sm">{analysis.date1.totalTss.toFixed(1)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{selectedDate2}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Activities:</span>
                        <Badge>{analysis.date2.activityCount}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Load:</span>
                        <Badge variant="outline">{analysis.date2.totalLoad.toFixed(1)}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Total TRIMP:</span>
                        <span className="text-sm">{analysis.date2.totalTrimp.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total TSS:</span>
                        <span className="text-sm">{analysis.date2.totalTss.toFixed(1)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Activity Breakdown */}
              <div className="space-y-4">
                <h4 className="font-medium">Activity Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">{selectedDate1} Activities:</h5>
                    {analysis.date1.activities.map((activity, index) => (
                      <div key={index} className="border rounded p-3 mb-2">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">{activity.name}</span>
                          <Badge variant="outline">{activity.sport_type}</Badge>
                        </div>
                        <div className="text-xs space-y-1">
                          <div>Duration: {Math.round(activity.duration / 60)}min</div>
                          {activity.avgHR && <div>Avg HR: {activity.avgHR}</div>}
                          {activity.avgPower && <div>Avg Power: {activity.avgPower}W</div>}
                          <div className="flex justify-between">
                            <span>TRIMP: {activity.trimp.toFixed(1)}</span>
                            <span>TSS: {activity.tss.toFixed(1)}</span>
                          </div>
                          <div className="font-medium">Load: {activity.normalizedLoad.toFixed(1)}</div>
                          <div className="flex gap-1">
                            {activity.hasHR && <Badge variant="secondary" className="text-xs">HR</Badge>}
                            {activity.hasPower && <Badge variant="secondary" className="text-xs">Power</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">{selectedDate2} Activities:</h5>
                    {analysis.date2.activities.map((activity, index) => (
                      <div key={index} className="border rounded p-3 mb-2">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">{activity.name}</span>
                          <Badge variant="outline">{activity.sport_type}</Badge>
                        </div>
                        <div className="text-xs space-y-1">
                          <div>Duration: {Math.round(activity.duration / 60)}min</div>
                          {activity.avgHR && <div>Avg HR: {activity.avgHR}</div>}
                          {activity.avgPower && <div>Avg Power: {activity.avgPower}W</div>}
                          <div className="flex justify-between">
                            <span>TRIMP: {activity.trimp.toFixed(1)}</span>
                            <span>TSS: {activity.tss.toFixed(1)}</span>
                          </div>
                          <div className="font-medium">Load: {activity.normalizedLoad.toFixed(1)}</div>
                          <div className="flex gap-1">
                            {activity.hasHR && <Badge variant="secondary" className="text-xs">HR</Badge>}
                            {activity.hasPower && <Badge variant="secondary" className="text-xs">Power</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(!analysis.date1 || !analysis.date2) && !error && (
            <div className="text-center py-8 text-gray-500">
              <p>Click "Analyze" to compare the selected dates</p>
              <p className="text-sm mt-2">
                Make sure you have activities on both dates: {selectedDate1} and {selectedDate2}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 