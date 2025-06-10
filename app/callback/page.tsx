'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useStravaAuth } from '@/hooks/use-strava-auth'

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const hasProcessed = useRef(false)
  const processingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Debug logging
  console.log('🚀 CallbackContent mounted')
  console.log('🔍 Current URL params:', {
    code: searchParams.get('code'),
    error: searchParams.get('error'),
    errorDescription: searchParams.get('error_description'),
    allParams: Array.from(searchParams.entries())
  })
  
  // Auth mutation
  const { 
    mutate: exchangeToken, 
    isPending: isAuthing,
    isError: hasMutationError
  } = useStravaAuth()

  // Exchange code for tokens with comprehensive error handling
  useEffect(() => {
    console.log('🔄 useEffect triggered')
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    console.log('📥 Extracted params:', { code: !!code, error, errorDescription })

    // Handle OAuth errors from Strava
    if (error) {
      console.error('❌ OAuth error from Strava:', { error, errorDescription })
      setError(
        errorDescription || 
        (error === 'access_denied' ? 'Access denied by user' : 'Authorization failed')
      )
      return
    }

    // Handle missing code
    if (!code) {
      console.error('❌ No authorization code received')
      setError('No authorization code received from Strava')
      return
    }

    // Prevent duplicate processing
    if (hasProcessed.current || isProcessing || isAuthing) {
      console.log('⏭️ Skipping duplicate processing')
      return
    }

    // Set processing state
    setIsProcessing(true)
    hasProcessed.current = true

    console.log('🔄 Starting token exchange...')

    // Set a timeout to prevent hanging
    processingTimeout.current = setTimeout(() => {
      if (isProcessing) {
        console.error('⏰ Token exchange timeout')
        setError('Token exchange is taking too long. Please try again.')
        setIsProcessing(false)
      }
    }, 30000) // 30 second timeout

    exchangeToken(code, {
      onSuccess: (data) => {
        console.log('✅ Successfully connected to Strava:', data)
        
        // Clear timeout
        if (processingTimeout.current) {
          clearTimeout(processingTimeout.current)
        }
        
        setIsProcessing(false)
        
        // Redirect to dashboard (OAuth will be handled there)
        router.push('/dashboard')
      },
      onError: (error) => {
        console.error('❌ Failed to connect to Strava:', error)
        
        // Clear timeout
        if (processingTimeout.current) {
          clearTimeout(processingTimeout.current)
        }
        
        setIsProcessing(false)
        
        // Handle specific error types
        let errorMessage = 'Failed to connect to Strava'
        
        if (error instanceof Error) {
          if (error.message.includes('401')) {
            errorMessage = 'Invalid authorization code. Please try connecting again.'
          } else if (error.message.includes('403')) {
            errorMessage = 'Access forbidden. Please check your Strava permissions.'
          } else if (error.message.includes('429')) {
            errorMessage = 'Too many requests. Please wait a moment and try again.'
          } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.'
          } else {
            errorMessage = error.message
          }
        }
        
        // Redirect to dashboard (error will be handled there)
        router.push('/dashboard')
      }
    })

    // Cleanup function
    return () => {
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current)
      }
    }
  }, []) // Empty dependency array to run only once

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current)
      }
    }
  }, [])

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Failed</h3>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Return to Dashboard
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'} // Force refresh
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connecting to Strava</h3>
          <p className="text-sm text-gray-500 mb-4">
            {isProcessing || isAuthing ? 'Exchanging authorization code for access tokens...' : 'Please wait while we connect your Strava account.'}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading fallback component
function CallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
          <p className="text-sm text-gray-500">Preparing Strava connection</p>
        </div>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <CallbackContent />
    </Suspense>
  )
} 