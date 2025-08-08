import { NextResponse } from 'next/server'
import { StravaWebhooks } from '@/lib/strava/webhooks'

// Setup webhook subscription
export async function POST() {
  try {
    const success = await StravaWebhooks.setupWebhook()
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Webhook subscription created successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to create webhook subscription'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Webhook setup error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Get webhook subscription status
export async function GET() {
  try {
    const subscriptions = await StravaWebhooks.listSubscriptions()
    
    return NextResponse.json({
      success: true,
      subscriptions,
      hasActiveWebhook: subscriptions.length > 0
    })
  } catch (error) {
    console.error('Webhook status error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Delete webhook subscriptions
export async function DELETE() {
  try {
    await StravaWebhooks.cleanupWebhooks()
    
    return NextResponse.json({
      success: true,
      message: 'All webhook subscriptions deleted'
    })
  } catch (error) {
    console.error('Webhook cleanup error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
