'use client'

import { useState, useEffect } from 'react'
import { Map } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export function MapboxTokenTester() {
  const [token, setToken] = useState<string>('')
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    setToken(mapboxToken || '')
  }, [])

  const testToken = async () => {
    if (!token) {
      setError('No token found')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Test the token by making a request to Mapbox API
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/London.json?access_token=${token}`)
      
      if (response.ok) {
        setIsValid(true)
        setError('')
      } else {
        const errorData = await response.json()
        setIsValid(false)
        setError(`Token validation failed: ${errorData.message || 'Unknown error'}`)
      }
    } catch (err) {
      setIsValid(false)
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getTokenStatus = () => {
    if (!token) {
      return { status: 'missing', label: 'Token Missing', color: 'bg-red-100 text-red-800' }
    }
    if (isValid === null) {
      return { status: 'unknown', label: 'Not Tested', color: 'bg-gray-100 text-gray-800' }
    }
    if (isValid) {
      return { status: 'valid', label: 'Valid Token', color: 'bg-green-100 text-green-800' }
    }
    return { status: 'invalid', label: 'Invalid Token', color: 'bg-red-100 text-red-800' }
  }

  const tokenStatus = getTokenStatus()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🗺️ Mapbox Token Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Status */}
        <div className="flex items-center gap-2 p-3 rounded-lg border">
          {tokenStatus.status === 'valid' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : tokenStatus.status === 'invalid' ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-gray-600" />
          )}
          <span className="text-sm">
            Token Status: <Badge className={tokenStatus.color}>{tokenStatus.label}</Badge>
          </span>
        </div>

        {/* Token Display */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium mb-1">Current Token:</div>
          <div className="text-xs font-mono break-all">
            {token ? `${token.substring(0, 20)}...` : 'Not configured'}
          </div>
        </div>

        {/* Test Button */}
        <Button 
          onClick={testToken} 
          disabled={isLoading || !token}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing Token...
            </>
          ) : (
            'Test Mapbox Token'
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Map Preview */}
        {isValid && token && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Map Preview (London):</h4>
            <div className="h-48 border rounded-lg overflow-hidden">
              <Map
                mapboxAccessToken={token}
                initialViewState={{
                  longitude: -0.1276,
                  latitude: 51.5074,
                  zoom: 10
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                attributionControl={false}
              />
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Setup Instructions:</h4>
          <ol className="text-xs space-y-1">
            <li>1. Go to <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Mapbox Access Tokens</a></li>
            <li>2. Copy your default public token (starts with "pk.")</li>
            <li>3. Add to your <code className="bg-gray-100 px-1 rounded">.env.local</code> file:</li>
            <li>4. <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token_here</code></li>
            <li>5. Restart your development server</li>
            <li>6. Test the token using the button above</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
} 