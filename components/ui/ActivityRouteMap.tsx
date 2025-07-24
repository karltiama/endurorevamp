'use client'

import { useRef, useEffect, useState } from 'react'
import { Map, Source, Layer, NavigationControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import polyline from '@mapbox/polyline'

interface ActivityRouteMapProps {
  polyline?: string
  startLatLng?: string // Format: "lat,lng" like "42.367825,-83.418154"
  endLatLng?: string   // Format: "lat,lng" like "42.367825,-83.418154"
  className?: string
}

// Mapbox access token - you'll need to add this to your .env.local
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

// Use Mapbox's polyline library for proper decoding
function decodePolyline(encoded: string): [number, number][] {
  try {
    return polyline.decode(encoded)
  } catch (error) {
    console.error('Error decoding polyline:', error)
    return []
  }
}

export function ActivityRouteMap({ 
  polyline, 
  startLatLng, 
  endLatLng, 
  className = "h-48 w-full" 
}: ActivityRouteMapProps) {
  console.log('ActivityRouteMap: Component rendered with props', {
    hasPolyline: !!polyline,
    polylineLength: polyline?.length,
    startLatLng,
    endLatLng,
    className
  })

  // Early return if no route data at all
  if (!polyline && !startLatLng && !endLatLng) {
    console.log('ActivityRouteMap: No route data provided, showing placeholder')
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📍</div>
          <div className="text-sm">No route data available</div>
        </div>
      </div>
    )
  }

  const mapRef = useRef<any>(null)
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([])
  const [viewport, setViewport] = useState<{
    longitude: number
    latitude: number
    zoom: number
  } | null>(null) // Start with null to indicate no viewport set yet

  useEffect(() => {
    console.log('ActivityRouteMap: Setting up viewport', { 
      polyline: !!polyline, 
      startLatLng, 
      endLatLng,
      polylineLength: polyline?.length 
    })
    
    if (polyline) {
      try {
        console.log('ActivityRouteMap: Raw polyline:', polyline.substring(0, 50) + '...')
        const coordinates = decodePolyline(polyline)
        console.log('ActivityRouteMap: Decoded coordinates', coordinates.length, coordinates.slice(0, 3))
        
        // Debug: Check if coordinates look reasonable
        if (coordinates.length > 0) {
          const firstCoord = coordinates[0]
          const lastCoord = coordinates[coordinates.length - 1]
          console.log('ActivityRouteMap: Coordinate analysis', {
            firstCoordinate: firstCoord,
            lastCoordinate: lastCoord,
            firstLng: firstCoord[0],
            firstLat: firstCoord[1],
            lastLng: lastCoord[0],
            lastLat: lastCoord[1],
            // Check if coordinates are in reasonable ranges for Michigan
            isFirstCoordReasonable: firstCoord[0] >= -90 && firstCoord[0] <= -80 && firstCoord[1] >= 40 && firstCoord[1] <= 50,
            isLastCoordReasonable: lastCoord[0] >= -90 && lastCoord[0] <= -80 && lastCoord[1] >= 40 && lastCoord[1] <= 50
          })
        }
        
        setRouteCoordinates(coordinates)
        
        // Set initial viewport to center of route
        if (coordinates.length > 0) {
          // Mapbox polyline coordinates are [longitude, latitude]
          const centerLng = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length
          const centerLat = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length
          
          console.log('ActivityRouteMap: Setting route viewport from polyline', { centerLng, centerLat })
          setViewport({
            longitude: centerLng,
            latitude: centerLat,
            zoom: 13
          })
        } else if (startLatLng && endLatLng) {
          // Fallback: Create a simple line between start and end if polyline is empty
          console.log('ActivityRouteMap: Creating fallback route from start/end coordinates')
          const parseLatLng = (latLngStr: string): [number, number] => {
            const [lat, lng] = latLngStr.split(',').map(Number)
            return [lng, lat] // Convert to [longitude, latitude] for Mapbox
          }
          
          const startCoord = parseLatLng(startLatLng)
          const endCoord = parseLatLng(endLatLng)
          const fallbackRoute = [startCoord, endCoord]
          
          console.log('ActivityRouteMap: Fallback route coordinates', fallbackRoute)
          setRouteCoordinates(fallbackRoute)
          
          const centerLng = (startCoord[0] + endCoord[0]) / 2
          const centerLat = (startCoord[1] + endCoord[1]) / 2
          
          setViewport({
            longitude: centerLng,
            latitude: centerLat,
            zoom: 11
          })
        }
      } catch (error) {
        console.error('Error decoding polyline:', error)
      }
    } else if (startLatLng && endLatLng) {
      // Parse string coordinates like "42.367825,-83.418154" (lat, lng)
      const parseLatLng = (latLngStr: string): [number, number] => {
        const [lat, lng] = latLngStr.split(',').map(Number)
        return [lat, lng] // Returns [latitude, longitude]
      }
      
      try {
        const startCoords = parseLatLng(startLatLng) // [lat, lng]
        const endCoords = parseLatLng(endLatLng)     // [lat, lng]
        
        // Calculate center: average of latitudes and longitudes
        const centerLat = (startCoords[0] + endCoords[0]) / 2  // Average latitude
        const centerLng = (startCoords[1] + endCoords[1]) / 2  // Average longitude
        
        console.log('ActivityRouteMap: Setting start/end viewport', { 
          centerLng, 
          centerLat, 
          startCoords, 
          endCoords,
          startLatLng,
          endLatLng
        })
        setViewport({
          longitude: centerLng,
          latitude: centerLat,
          zoom: 11
        })
      } catch (error) {
        console.error('Error parsing coordinates:', error)
      }
    }
  }, [polyline, startLatLng, endLatLng])

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🗺️</div>
          <div className="text-sm">Mapbox token required</div>
          <div className="text-xs">Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local</div>
        </div>
      </div>
    )
  }

  if (!polyline && !startLatLng) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📍</div>
          <div className="text-sm">No route data available</div>
        </div>
      </div>
    )
  }

  // Don't render map until we have valid coordinates
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

  console.log('ActivityRouteMap: Render check', { viewport, routeCoordinatesLength: routeCoordinates.length })

  return (
    <div className={`${className} rounded-lg overflow-hidden border border-gray-200`}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        initialViewState={viewport}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        attributionControl={false}
        reuseMaps={false}
        onError={(e) => {
          console.error('Mapbox error:', e)
        }}
        onLoad={() => {
          console.log('Mapbox map loaded successfully')
        }}
      >
        {/* Route line */}
        {(() => {
          console.log('ActivityRouteMap: Rendering route line', {
            routeCoordinatesLength: routeCoordinates.length,
            firstCoordinate: routeCoordinates[0],
            lastCoordinate: routeCoordinates[routeCoordinates.length - 1],
            sampleCoordinates: routeCoordinates.slice(0, 3)
          })
          
          // Validate coordinates are in reasonable ranges
          const isValidCoordinate = (coord: [number, number]) => {
            const [lng, lat] = coord
            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
          }
          
          const validCoordinates = routeCoordinates.filter(isValidCoordinate)
          console.log('ActivityRouteMap: Coordinate validation', {
            total: routeCoordinates.length,
            valid: validCoordinates.length,
            invalid: routeCoordinates.length - validCoordinates.length
          })
          
          return validCoordinates.length > 0
        })() && (
          <Source
            id="route"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates.filter(coord => {
                  const [lng, lat] = coord
                  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
                })
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