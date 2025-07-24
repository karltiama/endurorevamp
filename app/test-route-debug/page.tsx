import { RouteDataDebugger } from '@/components/debug/RouteDataDebugger'
import { MapboxTokenTester } from '@/components/debug/MapboxTokenTester'

export default function TestRouteDebugPage() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Route Data & Mapbox Debugger</h1>
        <p className="text-gray-600">
          Use these tools to debug why route data isn't showing up on your Mapbox maps.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MapboxTokenTester />
        <RouteDataDebugger />
      </div>
    </div>
  )
} 