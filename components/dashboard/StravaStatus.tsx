"use client"

import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { useStravaConnection } from '@/hooks/strava/useStravaConnection'
import { Badge } from '@/components/ui/badge'

export function StravaStatus() {
  const { connectionStatus, isLoading } = useStravaConnection()

  if (isLoading) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse mr-2"></div>
        <RefreshCw className="w-3 h-3 animate-spin mr-1" />
        <span>Syncing...</span>
      </Badge>
    )
  }

  const isConnected = connectionStatus?.connected || false

  return (
    <Badge 
      variant={isConnected ? "default" : "destructive"}
      className={isConnected 
        ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100" 
        : "bg-red-100 text-red-800 border-red-200 hover:bg-red-100"
      }
    >
      {isConnected ? (
        <>
          <CheckCircle className="w-3 h-3 mr-1" />
          <span>Strava Synced</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-3 h-3 mr-1" />
          <span>Not Synced</span>
        </>
      )}
    </Badge>
  )
} 