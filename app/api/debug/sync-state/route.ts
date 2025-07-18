import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  // Only allow in development and test environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoints not available in production' },
      { status: 403 }
    )
  }

  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Get current sync state
    const { data: syncState, error: fetchError } = await supabase
      .from('sync_state')
      .select('*')
      .eq('user_id', userId)
      .single()

    console.log(`📊 GET - Current sync state for user ${userId}:`, syncState)
    console.log(`❌ GET - Fetch error:`, fetchError)

    return NextResponse.json({
      success: true,
      syncState,
      error: fetchError
    })

  } catch (error) {
    console.error('❌ Debug GET error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Simple test endpoint that doesn't require auth
export async function PUT() {
  // Only allow in development and test environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoints not available in production' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'API endpoint is working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  // Only allow in development and test environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoints not available in production' },
      { status: 403 }
    )
  }

  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = user.id
    const body = await request.json()
    const { action, count } = body

    console.log(`🔧 Debug action: ${action} for user ${userId}`)
    console.log(`📦 Request body:`, body)

    // Get current sync state
    const { data: syncState, error: fetchError } = await supabase
      .from('sync_state')
      .select('*')
      .eq('user_id', userId)
      .single()

    console.log(`📊 Current sync state:`, syncState)
    console.log(`❌ Fetch error:`, fetchError)

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'add_sync':
        const currentSyncs = syncState?.sync_requests_today || 0
        updateData.sync_requests_today = currentSyncs + 1
        console.log(`➕ Adding sync: ${currentSyncs} -> ${updateData.sync_requests_today}`)
        break

      case 'remove_sync':
        const currentSyncsRemove = syncState?.sync_requests_today || 0
        updateData.sync_requests_today = Math.max(0, currentSyncsRemove - 1)
        console.log(`➖ Removing sync: ${currentSyncsRemove} -> ${updateData.sync_requests_today}`)
        break

      case 'set_syncs':
        updateData.sync_requests_today = count
        console.log(`🎯 Setting syncs to: ${count}`)
        break

      case 'reset_timer':
        // Set last sync to 2 hours ago
        updateData.last_activity_sync = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        console.log(`⏰ Resetting timer to 2 hours ago`)
        break

      case 'set_recent_sync':
        // Set last sync to 30 minutes ago
        updateData.last_activity_sync = new Date(Date.now() - 30 * 60 * 1000).toISOString()
        console.log(`⏰ Setting recent sync to 30 minutes ago`)
        break

      case 'set_just_now':
        // Set last sync to just now
        updateData.last_activity_sync = new Date().toISOString()
        console.log(`⏰ Setting sync to just now`)
        break

      case 'add_error':
        const currentErrors = syncState?.consecutive_errors || 0
        updateData.consecutive_errors = currentErrors + 1
        updateData.last_error_message = 'Debug: Added consecutive error'
        updateData.last_error_at = new Date().toISOString()
        console.log(`❌ Adding error: ${currentErrors} -> ${updateData.consecutive_errors}`)
        break

      case 'clear_errors':
        updateData.consecutive_errors = 0
        updateData.last_error_message = null
        updateData.last_error_at = null
        console.log(`✅ Clearing all errors`)
        break

      case 'disable_sync':
        updateData.sync_enabled = false
        console.log(`🚫 Disabling sync`)
        break

      case 'enable_sync':
        updateData.sync_enabled = true
        console.log(`✅ Enabling sync`)
        break

      case 'reset_all':
        // Reset to fresh state
        updateData = {
          sync_requests_today: 0,
          consecutive_errors: 0,
          last_error_message: null,
          last_error_at: null,
          sync_enabled: true,
          last_activity_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          last_sync_date: new Date().toDateString()
        }
        console.log(`🔄 Resetting all state`)
        break

      case 'reset_clean':
        // Fix date issues and clear errors while keeping activities
        updateData = {
          sync_requests_today: 0,
          consecutive_errors: 0,
          last_error_message: null,
          last_error_at: null,
          sync_enabled: true,
          last_activity_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          last_sync_date: new Date().toDateString(),
          // Clear the last_sync_error field if it exists
          last_sync_error: null
        }
        console.log(`🧹 Resetting to clean state (keeping activities)`)
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    console.log(`📝 Update data:`, updateData)

    // Update the sync state
    const { error: updateError } = await supabase
      .from('sync_state')
      .upsert({
        user_id: userId,
        ...updateData,
        updated_at: new Date().toISOString()
      })

    console.log(`💾 Update error:`, updateError)

    if (updateError) {
      console.error('❌ Debug update error:', updateError)
      throw updateError
    }

    console.log(`✅ Debug action ${action} completed successfully`)

    return NextResponse.json({
      success: true,
      message: `Debug action ${action} completed`,
      updatedData: updateData
    })

  } catch (error) {
    console.error('❌ Debug API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 