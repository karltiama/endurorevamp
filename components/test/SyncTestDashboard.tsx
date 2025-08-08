'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, 
  TestTube,
  AlertCircle, 
  Webhook, 
  Clock, 
  PlayCircle, 
  CheckCircle, 
  XCircle,
  Activity,
  User,
  Trash2
} from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'

interface TestResult {
  success: boolean
  message?: string
  data?: Record<string, unknown>
  error?: string
  timestamp: string
}

export function SyncTestDashboard() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [stravaAthleteId, setStravaAthleteId] = useState('')
  const [activityId, setActivityId] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Load user's Strava athlete ID on mount
  useEffect(() => {
    if (user) {
      loadUserStravaData()
    }
  }, [user])

  const loadUserStravaData = async () => {
    try {
      const response = await fetch('/api/auth/strava/token')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.athlete?.id) {
          setStravaAthleteId(data.athlete.id.toString())
        } else if (!data.has_strava_tokens) {
          setError('No Strava connection found. Please connect your Strava account first.')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to load Strava connection status')
      }
    } catch (error) {
      console.error('Failed to load Strava data:', error)
      setError('Failed to check Strava connection')
    }
  }

  const addTestResult = (result: Omit<TestResult, 'timestamp'>) => {
    setTestResults(prev => [{
      ...result,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev.slice(0, 9)]) // Keep last 10 results
  }

  const runTest = async (testName: string, testFn: () => Promise<Record<string, unknown>>) => {
    console.log(`🧪 Starting test: ${testName}`)
    setIsLoading(true)
    setError(null) // Clear any previous errors
    
    try {
      const result = await testFn()
      console.log(`✅ Test ${testName} completed:`, result)
      addTestResult({
        success: true,
        message: `${testName} completed successfully`,
        data: result
      })
    } catch (error) {
      console.error(`❌ Test ${testName} failed:`, error)
      addTestResult({
        success: false,
        message: `${testName} failed`,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Test webhook simulation
  const testWebhookSimulation = async (eventType: string, aspectType: string) => {
    if (!stravaAthleteId) {
      throw new Error('Strava Athlete ID is required')
    }

    const response = await fetch('/api/test/webhook-simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        aspectType,
        ownerID: stravaAthleteId,
        objectID: activityId || undefined
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  }

  // Test background sync
  const testBackgroundSync = async () => {
    const response = await fetch('/api/sync/background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${process.env.NEXT_PUBLIC_BACKGROUND_SYNC_API_KEY || 'test-key'}`
      },
      body: JSON.stringify({
        syncType: 'quick',
        maxUsers: 1,
        skipRecentlySynced: false
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  }

  // Test manual sync
  const testManualSync = async () => {
    const response = await fetch('/api/strava/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syncType: 'quick' })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  }

  // Test webhook status
  const testWebhookStatus = async () => {
    console.log('🔍 Testing webhook status...')
    const response = await fetch('/api/webhooks/setup')
    
    console.log('📡 Webhook status response:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Webhook status error:', errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('📊 Webhook status data:', data)
    return data
  }

  // Test token status
  const testTokenStatus = async () => {
    console.log('🔍 Testing token status...')
    const response = await fetch('/api/auth/strava/token')
    
    console.log('🎫 Token status response:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Token status error:', errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('📊 Token status data:', data)
    return data
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Automatic Sync Testing Dashboard
          </CardTitle>
          <CardDescription>
            Test webhook delivery, background sync, and token management
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="webhook">Webhook Tests</TabsTrigger>
          <TabsTrigger value="sync">Sync Tests</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Connection Issue:</strong> {error}
                    <br />
                    <span className="text-sm">Please connect your Strava account first, then refresh this page.</span>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="athleteId">Strava Athlete ID</Label>
                <Input
                  id="athleteId"
                  value={stravaAthleteId}
                  onChange={(e) => setStravaAthleteId(e.target.value)}
                  placeholder="Your Strava athlete ID"
                />
                <p className="text-sm text-muted-foreground">
                  This should auto-populate from your connected Strava account
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityId">Activity ID (Optional)</Label>
                <Input
                  id="activityId"
                  value={activityId}
                  onChange={(e) => setActivityId(e.target.value)}
                  placeholder="Specific activity ID for testing"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => runTest('Token Status Check', testTokenStatus)}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Check Token Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runTest('Webhook Status Check', testWebhookStatus)}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Check Webhook Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Simulation Tests
              </CardTitle>
              <CardDescription>
                Simulate webhook events to test your automatic sync system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => runTest(
                    'New Activity Webhook',
                    () => testWebhookSimulation('activity', 'create')
                  )}
                  disabled={isLoading || !stravaAthleteId}
                  className="h-20 flex-col"
                >
                  <Activity className="h-6 w-6 mb-2" />
                  Simulate New Activity
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runTest(
                    'Activity Update Webhook',
                    () => testWebhookSimulation('activity', 'update')
                  )}
                  disabled={isLoading || !stravaAthleteId}
                  className="h-20 flex-col"
                >
                  <PlayCircle className="h-6 w-6 mb-2" />
                  Simulate Activity Update
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runTest(
                    'Activity Delete Webhook',
                    () => testWebhookSimulation('activity', 'delete')
                  )}
                  disabled={isLoading || !stravaAthleteId}
                  className="h-20 flex-col"
                >
                  <Trash2 className="h-6 w-6 mb-2" />
                  Simulate Activity Delete
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => runTest(
                    'User Deauth Webhook',
                    () => testWebhookSimulation('athlete', 'update')
                  )}
                  disabled={isLoading || !stravaAthleteId}
                  className="h-20 flex-col"
                >
                  <User className="h-6 w-6 mb-2" />
                  Simulate Deauthorization
                </Button>
              </div>

              {!stravaAthleteId && (
                <Alert>
                  <AlertDescription>
                    Please enter your Strava Athlete ID in the Setup tab to run webhook tests. 
                    If your Athlete ID is not auto-populating, make sure you have connected your Strava account.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Sync Function Tests
              </CardTitle>
              <CardDescription>
                Test manual sync, background sync, and token refresh
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => runTest('Manual Sync', testManualSync)}
                  disabled={isLoading}
                  className="h-20 flex-col"
                >
                  <PlayCircle className="h-6 w-6 mb-2" />
                  Test Manual Sync
                </Button>

                <Button
                  variant="outline"
                  onClick={() => runTest('Background Sync', testBackgroundSync)}
                  disabled={isLoading}
                  className="h-20 flex-col"
                >
                  <Clock className="h-6 w-6 mb-2" />
                  Test Background Sync
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Recent test execution results</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No test results yet. Run some tests to see results here.
                </p>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">{result.message}</span>
                        </div>
                        <Badge variant="outline">{result.timestamp}</Badge>
                      </div>
                      
                      {result.error && (
                        <Alert className="mt-2">
                          <AlertDescription className="text-red-600">
                            {result.error}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {result.data && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-muted-foreground">
                            Show Details
                          </summary>
                          <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
