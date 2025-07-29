import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get the user's training profile
    const { data: profile, error } = await supabase
      .from('user_training_profiles')
      .select('*')
      .eq('user_id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found, return null
        return NextResponse.json(null)
      }
      throw error
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching user training profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training profile' },
      { status: 500 }
    )
  }
}