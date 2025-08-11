'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AuthContextType } from '@/lib/auth/types'
import { User } from '@supabase/supabase-js'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const keepAliveInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Session error:', error)
        }
        setUser(session?.user ?? null)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to get initial session:', error)
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.id ? 'User logged in' : 'User logged out')
        
        setUser(session?.user ?? null)
        setIsLoading(false)
        
        // Start/stop keep-alive based on auth state
        if (session?.user) {
          startKeepAlive()
        } else {
          stopKeepAlive()
        }
        
        // Only refresh on specific events, not all auth changes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          // Use replace instead of refresh to avoid full page reload
          router.replace(window.location.pathname)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      stopKeepAlive()
    }
  }, [supabase, router])

  // Session keep-alive to prevent automatic logouts
  const startKeepAlive = () => {
    stopKeepAlive() // Clear any existing interval
    
    // Refresh session every 30 minutes to prevent expiration
    keepAliveInterval.current = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Keep-alive session check failed:', error)
          return
        }
        
        if (session) {
          console.log('🔐 Keep-alive: Session refreshed')
        } else {
          console.log('🔐 Keep-alive: No active session, stopping keep-alive')
          stopKeepAlive()
        }
      } catch (error) {
        console.error('Keep-alive error:', error)
      }
    }, 30 * 60 * 1000) // 30 minutes
  }

  const stopKeepAlive = () => {
    if (keepAliveInterval.current) {
      clearInterval(keepAliveInterval.current)
      keepAliveInterval.current = null
    }
  }

  const signOut = async () => {
    try {
      stopKeepAlive()
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Sign out error:', error)
      // Force redirect even if sign out fails
      router.push('/auth/login')
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Failed to refresh user:', error)
        return
      }
      setUser(user)
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 