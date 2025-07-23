'use client'

import React from 'react'

export const WeatherSkeleton = () => (
  <div className="p-4 border rounded-lg animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
)

export function WeatherErrorFallback() {
  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <p className="text-sm text-muted-foreground">Weather data unavailable</p>
    </div>
  )
} 