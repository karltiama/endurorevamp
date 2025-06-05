'use client'

import { useAthleteData } from '@/hooks/use-athlete-data'
import { UserCircle } from 'lucide-react'

export function AthleteHeader() {
  const { data: athlete, isLoading, error } = useAthleteData()
  
  if (isLoading) {
    return (
      <header className="flex items-center justify-end p-4 bg-white shadow-sm">
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-8 w-32 bg-gray-200 rounded" />
          <div className="h-8 w-8 rounded-full bg-gray-200" />
        </div>
      </header>
    )
  }

  if (error) {
    return (
      <header className="flex items-center justify-end p-4 bg-white shadow-sm">
        <div className="text-red-600">Unable to load athlete data</div>
      </header>
    )
  }

  return (
    <header className="flex items-center justify-end p-4 bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-gray-700">
          Welcome back, <span className="font-semibold">{athlete?.firstname}</span>!
        </span>
        {athlete?.profile ? (
          <img 
            src={athlete.profile} 
            alt={`${athlete.firstname}'s profile`}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <UserCircle className="h-8 w-8 text-gray-400" />
        )}
      </div>
    </header>
  )
} 