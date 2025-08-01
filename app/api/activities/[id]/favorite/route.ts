import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: activityId } = await params
    
    // Get current favorite status
    const { data: currentActivity, error: fetchError } = await supabase
      .from('activities')
      .select('is_favorite, user_id')
      .eq('strava_activity_id', activityId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Toggle favorite status
    const newFavoriteStatus = !currentActivity.is_favorite
    
    const { data: updatedActivity, error: updateError } = await supabase
      .from('activities')
      .update({ is_favorite: newFavoriteStatus })
      .eq('strava_activity_id', activityId)
      .eq('user_id', user.id)
      .select('is_favorite')
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update favorite status' }, { status: 500 })
    }

    return NextResponse.json({ 
      is_favorite: updatedActivity.is_favorite,
      message: updatedActivity.is_favorite ? 'Activity added to favorites' : 'Activity removed from favorites'
    })

  } catch (error) {
    console.error('Error toggling favorite status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 