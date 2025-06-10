import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TrainingZoneAnalysis } from '@/lib/training/zone-analysis'

export async function GET(request: NextRequest) {
  console.log('🎯 Zone Analysis API - GET request')

  try {
    // Get current user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('❌ Unauthorized zone analysis request')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log(`🔍 Analyzing zones for user: ${user.id}`)

    // Initialize zone analysis service
    const zoneAnalysis = new TrainingZoneAnalysis()

    // Perform zone analysis
    const analysis = await zoneAnalysis.analyzeUserZones(user.id)

    console.log(`✅ Zone analysis completed:`, {
      dataQuality: analysis.overall.hrDataQuality,
      activitiesWithHR: analysis.overall.activitiesWithHR,
      suggestedModel: analysis.suggestedZoneModel.name,
      confidence: analysis.confidence
    })

    return NextResponse.json({
      success: true,
      data: analysis
    })

  } catch (error) {
    console.error('❌ Zone analysis failed:', error)

    // Handle specific errors
    let errorMessage = 'Failed to analyze training zones'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        errorMessage = 'No activity data found for zone analysis'
        statusCode = 404
      } else if (error.message.includes('insufficient')) {
        errorMessage = 'Insufficient heart rate data for reliable zone analysis'
        statusCode = 400
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: statusCode }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('🎯 Zone Analysis API - POST request (custom analysis)')

  try {
    // Get current user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('❌ Unauthorized zone analysis request')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body for custom parameters
    const body = await request.json()
    const { 
      maxHeartRate, 
      zoneModel = '5-zone',
      sportFilter 
    } = body

    console.log(`🔍 Custom zone analysis for user: ${user.id}`, {
      maxHeartRate,
      zoneModel,
      sportFilter
    })

    // Initialize zone analysis service
    const zoneAnalysis = new TrainingZoneAnalysis()

    // Get base analysis
    const analysis = await zoneAnalysis.analyzeUserZones(user.id)

    // Apply custom parameters if provided
    if (maxHeartRate && typeof maxHeartRate === 'number' && maxHeartRate > 100) {
      // Override with custom max HR
      const customZoneAnalysis = new TrainingZoneAnalysis()
      const customModels = (customZoneAnalysis as any).createZoneModels(maxHeartRate)
      
      analysis.suggestedZoneModel = customModels.find((m: any) => 
        m.name.toLowerCase().includes(zoneModel.toLowerCase())
      ) || customModels[0]
      
      analysis.alternativeModels = customModels.filter((m: any) => 
        m.name !== analysis.suggestedZoneModel.name
      )
      
      analysis.recommendations.unshift(`Using custom max heart rate of ${maxHeartRate} BPM`)
    }

    console.log(`✅ Custom zone analysis completed`)

    return NextResponse.json({
      success: true,
      data: analysis
    })

  } catch (error) {
    console.error('❌ Custom zone analysis failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform custom zone analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 