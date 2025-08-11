'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface DebugInfo {
  timestamp: string
  url: string
  userAgent: string
  cookies: string
  localStorage: string
  sessionStorage: string
  environment: string
  hasWindow: boolean
  hasDocument: boolean
  hasNavigator: boolean
  hasLocalStorage: boolean
  hasSessionStorage: boolean
  hasCookies: boolean
  supabaseData: string
}

export function ProductionDebugger() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | Record<string, never>>({})
  const [isLoading, setIsLoading] = useState(false)

  const collectDebugInfo = async () => {
    setIsLoading(true)
    
    try {
      const info: DebugInfo = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        cookies: document.cookie ? 'Present' : 'None',
        localStorage: localStorage.length > 0 ? 'Present' : 'None',
        sessionStorage: sessionStorage.length > 0 ? 'Present' : 'None',
        environment: process.env.NODE_ENV,
        hasWindow: typeof window !== 'undefined',
        hasDocument: typeof document !== 'undefined',
        hasNavigator: typeof navigator !== 'undefined',
        hasLocalStorage: typeof localStorage !== 'undefined',
        hasSessionStorage: typeof sessionStorage !== 'undefined',
        hasCookies: typeof document?.cookie !== 'undefined',
        supabaseData: 'None'
      }

      // Check for Supabase-related data
      try {
        const supabaseData = localStorage.getItem('sb-') || 'No Supabase data'
        info.supabaseData = supabaseData !== 'No Supabase data' ? 'Present' : 'None'
      } catch {
        info.supabaseData = 'Error accessing'
      }

      setDebugInfo(info)
    } catch (error) {
      console.error('Debug info collection failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearStorage = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      })
      alert('Storage cleared. Page will refresh.')
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear storage:', error)
    }
  }

  useEffect(() => {
    // Only collect debug info in production
    if (process.env.NODE_ENV === 'production') {
      collectDebugInfo()
    }
  }, [])

  // Only show in production
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🚨 Production Debugger
          <Badge variant="destructive">Production Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This component helps debug authentication issues that only occur in production.
            Use it to identify what&apos;s different between your local and live environments.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button 
            onClick={collectDebugInfo} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Debug Info
          </Button>
          <Button 
            onClick={clearStorage} 
            variant="destructive" 
            size="sm"
          >
            Clear All Storage
          </Button>
        </div>

        {Object.keys(debugInfo).length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Environment Information:</h3>
            <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
              {Object.entries(debugInfo).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium">{key}:</span>
                  <span className={value === 'Present' ? 'text-green-600' : value === 'None' ? 'text-red-600' : 'text-gray-600'}>
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="font-medium text-sm">Common Production Issues:</h3>
          <ul className="text-xs space-y-1 text-gray-600">
            <li>• Missing environment variables in Vercel</li>
            <li>• Incorrect Supabase URL/keys in production</li>
            <li>• Cookie domain/path issues</li>
            <li>• HTTPS vs HTTP protocol mismatches</li>
            <li>• CORS configuration problems</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
