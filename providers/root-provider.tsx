'use client'

import { QueryProvider } from './query'

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  )
}
