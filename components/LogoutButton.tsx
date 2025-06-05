'use client'

import { useAuth } from '@/providers/AuthProvider'

export default function LogoutButton() {
  const { signOut, isLoading } = useAuth()

  return (
    <button
      onClick={signOut}
      disabled={isLoading}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
    >
      {isLoading ? 'Signing out...' : 'Sign out'}
    </button>
  )
} 