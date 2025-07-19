'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SimplifiedDailyDebugger() {
  const [selectedDate1, setSelectedDate1] = useState('2024-07-16')
  const [selectedDate2, setSelectedDate2] = useState('2024-07-18')
  const [analysis, setAnalysis] = useState<{
    date1?: any
    date2?: any
  }>({})

  const analyzeDates = () => {
    console.log('Analyze button clicked!')
    console.log('Date 1:', selectedDate1)
    console.log('Date 2:', selectedDate2)
    
    // Simulate some analysis
    setAnalysis({
      date1: {
        date: selectedDate1,
        totalLoad: 45.2,
        activityCount: 2,
        activities: [
          { name: 'Morning Run', sport_type: 'Run', load: 25.1 },
          { name: 'Weight Training', sport_type: 'WeightTraining', load: 20.1 }
        ]
      },
      date2: {
        date: selectedDate2,
        totalLoad: 52.8,
        activityCount: 1,
        activities: [
          { name: 'Evening Run', sport_type: 'Run', load: 52.8 }
        ]
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Simplified Daily Load Debugger</CardTitle>
          <p className="text-sm text-gray-600">
            Simplified version to test button functionality
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

          {analysis.date1 && analysis.date2 && (
            <div className="space-y-6">
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
                        <Badge variant="outline">{analysis.date1.totalLoad}</Badge>
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
                        <Badge variant="outline">{analysis.date2.totalLoad}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {(!analysis.date1 || !analysis.date2) && (
            <div className="text-center py-8 text-gray-500">
              <p>Click "Analyze" to compare the selected dates</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 