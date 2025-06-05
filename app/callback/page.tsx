'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useStravaAuth } from '@/hooks/use-strava-auth'
import { useAthleteData } from '@/hooks/use-athlete-data'
import { RecentActivities } from '@/components/RecentActivities'
import { AthleteHeader } from '@/components/AthleteHeader'
export default function CallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Auth mutation
  const { 
    mutate: exchangeToken, 
    data: authData, 
    error: authError, 
    isPending: isAuthing 
  } = useStravaAuth()

  // Pass the access token to useAthleteData
  const { 
    data: athleteData,
    isLoading: isLoadingAthlete,
    error: athleteError
  } = useAthleteData(authData?.access_token)

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      exchangeToken(code)
    }
  }, [searchParams, exchangeToken])

  // Add console logs for debugging
  console.log('Auth Data:', authData)
  console.log('Athlete Data:', athleteData)

  if (isAuthing) {
    return <div>Authenticating with Strava...</div>
  }

  if (authError) {
    return <div>Auth Error: {authError.message}</div>
  }

  if (isLoadingAthlete) {
    return <div>Loading athlete data...</div>
  }

  if (athleteError) {
    return <div>Error loading athlete: {athleteError.message}</div>
  }

  if (!athleteData) {
    return <div>No athlete data available</div>
  }

  return (
    <div>
      <h1>Welcome, {athleteData.firstname}!</h1>
      <pre>{JSON.stringify(athleteData, null, 2)}</pre>
      {athleteData && authData?.access_token && (
        <div className="mt-8">
          <AthleteHeader />
          <RecentActivities accessToken={authData.access_token} />
        </div>
      )}
    </div>
  )
} 