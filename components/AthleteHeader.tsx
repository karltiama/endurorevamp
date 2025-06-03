'use client'

import { useAthleteData } from '@/hooks/use-athlete-data'

export function AthleteHeader() {
  const { data, isLoading } = useAthleteData()
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <header>
      Welcome back, {data?.firstname}!
    </header>
  )
} 