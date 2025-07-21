'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Calculator, CheckCircle, AlertCircle } from 'lucide-react'

interface TSSUpdateResult {
  success: boolean
  action: string
  updated: number
  errors: number
}

export function TSSUpdateDebugger() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [result, setResult] = useState<TSSUpdateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateTSS = async () => {
    setIsUpdating(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update-tss'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to update TSS')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          TSS Update Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>This will calculate and store Training Stress Score (TSS) for all activities that don't have it yet.</p>
          <p className="mt-2 text-xs">
            TSS is calculated using heart rate data, power data, or duration-based estimation.
          </p>
        </div>

        <Button 
          onClick={updateTSS} 
          disabled={isUpdating}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating TSS...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              Update TSS for All Activities
            </>
          )}
        </Button>

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">TSS Update Complete</span>
            </div>
            <div className="mt-2 text-sm text-green-700">
              <p>✅ Updated: {result.updated} activities</p>
              {result.errors > 0 && (
                <p className="text-orange-600">⚠️ Errors: {result.errors} activities</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 