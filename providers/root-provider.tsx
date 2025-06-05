'use client'

import { QueryProvider } from './query'
import { AuthProvider } from './AuthProvider'

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryProvider>
  )
}
