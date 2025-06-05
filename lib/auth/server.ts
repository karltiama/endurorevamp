import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User } from '@supabase/supabase-js'

/**
 * Get the current user on the server side
 * Returns null if not authenticated
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Require authentication on the server side
 * Redirects to login if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  return user
}

/**
 * Get user and redirect to dashboard if already authenticated
 * Useful for auth pages (login/signup)
 */
export async function redirectIfAuthenticated(): Promise<void> {
  const user = await getUser()
  
  if (user) {
    redirect('/dashboard')
  }
} 