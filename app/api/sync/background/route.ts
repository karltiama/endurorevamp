import { NextRequest, NextResponse } from 'next/server'
import { BackgroundSyncService } from '@/lib/strava/background-sync'

// Background sync trigger endpoint
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (you might want to add API key auth here)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.BACKGROUND_SYNC_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    
    const result = await BackgroundSyncService.runBackgroundSync({
      syncType: body.syncType || 'quick',
      maxUsers: body.maxUsers || 100,
      delayBetweenUsers: body.delayBetweenUsers || 500,
      skipRecentlySynced: body.skipRecentlySynced !== false,
      minTimeSinceLastSync: body.minTimeSinceLastSync || (2 * 60 * 60 * 1000),
    })

    return NextResponse.json({
      success: true,
      stats: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Background sync API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Get sync statistics
export async function GET() {
  try {
    const stats = await BackgroundSyncService.getSyncStatistics()
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Sync stats API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
