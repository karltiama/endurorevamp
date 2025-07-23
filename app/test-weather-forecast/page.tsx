import React from 'react'
import { WeatherWidgetEnhanced } from '@/components/weather/WeatherWidgetEnhanced'
import { WeatherWidget } from '@/components/weather/WeatherWidget'

export default function TestWeatherForecastPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Enhanced Weather Widget Demo
        </h1>
        <p className="text-gray-600">
          Compare the enhanced widget with tabs vs the original weather widget
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Widget with Tabs */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Enhanced: Weather Widget with Tabs
          </h2>
          <WeatherWidgetEnhanced showForecastTabs={true} />
        </div>

        {/* Original Weather Widget */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Original: Current Weather Widget
          </h2>
          <WeatherWidget />
        </div>
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          New Features in Enhanced Widget:
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span><strong>Today & Tomorrow Tabs:</strong> Switch between today's and tomorrow's forecast instantly</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span><strong>Hourly Breakdown:</strong> See weather conditions in 3-hour intervals for each day</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span><strong>Running Recommendations:</strong> Best times and tips for each day's conditions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span><strong>Location Management:</strong> Set manual location or use GPS with enhanced controls</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span><strong>Unit Preferences:</strong> Support for metric/imperial units with proper formatting</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span><strong>Weather Impact Analysis:</strong> Performance predictions and risk assessment for each day</span>
          </li>
        </ul>
      </div>

      <div className="mt-6 p-6 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold text-green-900 mb-3">
          How to Use the Enhanced Widget:
        </h3>
        <ul className="space-y-2 text-green-800">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            <span><strong>Switch Tabs:</strong> Click "Today" or "Tomorrow" to see forecast for each day</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            <span><strong>Location Settings:</strong> Click the gear icon to set your location manually</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            <span><strong>Hourly View:</strong> See detailed weather conditions for each 3-hour period</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-1">•</span>
            <span><strong>Running Tips:</strong> Get specific recommendations for each day's conditions</span>
          </li>
        </ul>
      </div>
    </div>
  )
} 