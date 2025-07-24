'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Map, Source, Layer, NavigationControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import polyline from '@mapbox/polyline'
import { MapPin, Database, AlertCircle, CheckCircle } from 'lucide-react'

interface RouteDataActivity {
  id: string
  name: string
  start_date: string
  summary_polyline: string | null
  polyline: string | null
  start_latlng: string | null
  end_latlng: string | null
  map_id: string | null
  sport_type: string
}

// Simple Mapbox component for testing
function SimpleRouteMap({ 
  polyline: polylineData, 
  startLatLng, 
  endLatLng, 
  className = "h-64 w-full" 
}: {
  polyline?: string
  startLatLng?: string
  endLatLng?: string
  className?: string
}) {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([])
  const [viewport, setViewport] = useState<{
    longitude: number
    latitude: number
    zoom: number
  } | null>(null)

  const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  useEffect(() => {
    console.log('SimpleRouteMap: Setting up with', { polyline: !!polylineData, startLatLng, endLatLng })
    
    if (polylineData) {
      try {
        const coordinates = polyline.decode(polylineData)
        console.log('SimpleRouteMap: Decoded polyline', coordinates.length, coordinates.slice(0, 3))
        setRouteCoordinates(coordinates)
        
        if (coordinates.length > 0) {
          const centerLng = coordinates.reduce((sum: number, coord: [number, number]) => sum + coord[0], 0) / coordinates.length
          const centerLat = coordinates.reduce((sum: number, coord: [number, number]) => sum + coord[1], 0) / coordinates.length
          
          console.log('SimpleRouteMap: Setting viewport from polyline', { centerLng, centerLat })
          setViewport({
            longitude: centerLng,
            latitude: centerLat,
            zoom: 13
          })
        }
      } catch (error) {
        console.error('SimpleRouteMap: Error decoding polyline', error)
      }
    } else if (startLatLng && endLatLng) {
      try {
        const [startLat, startLng] = startLatLng.split(',').map(Number)
        const [endLat, endLng] = endLatLng.split(',').map(Number)
        
        const centerLat = (startLat + endLat) / 2
        const centerLng = (startLng + endLng) / 2
        
        console.log('SimpleRouteMap: Setting viewport from coordinates', { centerLng, centerLat })
        setViewport({
          longitude: centerLng,
          latitude: centerLat,
          zoom: 11
        })
      } catch (error) {
        console.error('SimpleRouteMap: Error parsing coordinates', error)
      }
    }
  }, [polylineData, startLatLng, endLatLng])

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🗺️</div>
          <div className="text-sm">Mapbox token required</div>
          <div className="text-xs mt-1">Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local</div>
        </div>
      </div>
    )
  }

  if (!viewport) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">⏳</div>
          <div className="text-sm">Loading map...</div>
        </div>
      </div>
    )
  }

  console.log('SimpleRouteMap: Rendering map', { 
    viewport, 
    routeCoordinatesLength: routeCoordinates.length,
    mapboxToken: MAPBOX_ACCESS_TOKEN ? 'Present' : 'Missing',
    tokenPrefix: MAPBOX_ACCESS_TOKEN?.substring(0, 10)
  })

  return (
    <div className={`${className} rounded-lg overflow-hidden border border-gray-200`}>
      <Map
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        initialViewState={viewport}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={false}
        onError={(e) => {
          console.error('Mapbox error:', e)
          console.error('Mapbox error details:', {
            error: e.error,
            target: e.target,
            type: e.type,
            message: e.error?.message
          })
        }}
        onLoad={() => {
          console.log('Mapbox map loaded successfully')
          console.log('Mapbox token used:', MAPBOX_ACCESS_TOKEN?.substring(0, 10) + '...')
        }}
        reuseMaps={false}
      >
        {/* Route line */}
        {routeCoordinates.length > 0 && (
          <Source
            id="route"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates
              }
            }}
          >
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 3,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* Start point */}
        {startLatLng && (
          <Source
            id="start"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: (() => {
                  const [lat, lng] = startLatLng.split(',').map(Number)
                  return [lng, lat]
                })()
              }
            }}
          >
            <Layer
              id="start-point"
              type="circle"
              paint={{
                'circle-radius': 6,
                'circle-color': '#10b981',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2
              }}
            />
          </Source>
        )}

        {/* End point */}
        {endLatLng && (
          <Source
            id="end"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: (() => {
                  const [lat, lng] = endLatLng.split(',').map(Number)
                  return [lng, lat]
                })()
              }
            }}
          >
            <Layer
              id="end-point"
              type="circle"
              paint={{
                'circle-radius': 6,
                'circle-color': '#ef4444',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2
              }}
            />
          </Source>
        )}

        <NavigationControl position="top-right" showCompass={false} />
      </Map>
    </div>
  )
}

export function RouteDataDebugger() {
  const [activities, setActivities] = useState<RouteDataActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<RouteDataActivity | null>(null)
  const [mapboxToken, setMapboxToken] = useState<string>('')
  const [tokenTestResult, setTokenTestResult] = useState<string>('')

  useEffect(() => {
    // Check if Mapbox token is available
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    setMapboxToken(token || '')
  }, [])

  const testMapboxToken = async () => {
    if (!mapboxToken) {
      setTokenTestResult('No token to test')
      return
    }

    try {
      // Test the token by making a simple API call
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/Los%20Angeles.json?access_token=${mapboxToken}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setTokenTestResult(`✅ Token valid - Found ${data.features?.length || 0} results`)
      } else {
        setTokenTestResult(`❌ Token invalid - Status: ${response.status}`)
      }
    } catch (error) {
      setTokenTestResult(`❌ Token test failed: ${error}`)
    }
  }

  const fetchActivitiesWithRouteData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('activities')
        .select(`
          id,
          name,
          start_date,
          summary_polyline,
          polyline,
          start_latlng,
          end_latlng,
          map_id,
          sport_type
        `)
        .or('summary_polyline.not.is.null,start_latlng.not.is.null')
        .order('start_date', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching activities with route data:', error)
        return
      }

      console.log('Activities with route data:', data)
      setActivities(data || [])
    } catch (error) {
      console.error('Error in fetchActivitiesWithRouteData:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRouteDataStatus = (activity: RouteDataActivity) => {
    const hasPolyline = !!(activity.summary_polyline || activity.polyline)
    const hasCoordinates = !!(activity.start_latlng || activity.end_latlng)
    
    if (hasPolyline && hasCoordinates) {
      return { status: 'complete', label: 'Full Route Data', color: 'bg-green-100 text-green-800' }
    } else if (hasPolyline) {
      return { status: 'partial', label: 'Polyline Only', color: 'bg-yellow-100 text-yellow-800' }
    } else if (hasCoordinates) {
      return { status: 'partial', label: 'Coordinates Only', color: 'bg-blue-100 text-blue-800' }
    } else {
      return { status: 'none', label: 'No Route Data', color: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Route Data Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mapbox Token Status */}
        <div className="flex items-center gap-2 p-3 rounded-lg border">
          {mapboxToken ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <span className="text-sm">
            Mapbox Token: {mapboxToken ? '✅ Configured' : '❌ Missing'}
          </span>
          {!mapboxToken && (
            <span className="text-xs text-gray-500">
              Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local
            </span>
          )}
        </div>

        {/* Token Test Button */}
        <Button 
          onClick={testMapboxToken} 
          disabled={!mapboxToken || loading}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Mapbox Token'}
        </Button>
        {tokenTestResult && (
          <div className="p-3 rounded-lg border text-sm text-gray-800">
            {tokenTestResult}
          </div>
        )}

        {/* Fetch Button */}
        <Button 
          onClick={fetchActivitiesWithRouteData} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Loading...' : 'Fetch Activities with Route Data'}
        </Button>

        {/* Activities List */}
        {activities.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Activities with Route Data ({activities.length})</h3>
            {activities.map((activity) => {
              const routeStatus = getRouteDataStatus(activity)
              return (
                <div 
                  key={activity.id} 
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedActivity(activity)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{activity.name}</h4>
                    <Badge className={routeStatus.color}>
                      {routeStatus.label}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Date: {new Date(activity.start_date).toLocaleDateString()}</div>
                    <div>Sport: {activity.sport_type}</div>
                    <div>Map ID: {activity.map_id || 'None'}</div>
                    <div>Polyline: {activity.summary_polyline ? `${activity.summary_polyline.length} chars` : 'None'}</div>
                    <div>Start: {activity.start_latlng || 'None'}</div>
                    <div>End: {activity.end_latlng || 'None'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Selected Activity Map */}
        {selectedActivity && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Route Map Preview (Simple Component)</h3>
            <div className="p-3 border rounded-lg">
              <div className="mb-2">
                <h4 className="font-medium">{selectedActivity.name}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(selectedActivity.start_date).toLocaleDateString()}
                </p>
              </div>
              <SimpleRouteMap
                polyline={selectedActivity.summary_polyline || undefined}
                startLatLng={selectedActivity.start_latlng || undefined}
                endLatLng={selectedActivity.end_latlng || undefined}
                className="h-64 w-full"
              />
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Debugging Steps:</h4>
          <ol className="text-xs space-y-1">
            <li>1. Check if Mapbox token is configured above</li>
            <li>2. Click "Fetch Activities" to see what route data exists</li>
            <li>3. Click on an activity to preview its route map</li>
            <li>4. If the simple map works, we'll copy it to the modal</li>
            <li>5. Check browser console for any Mapbox errors</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
} 