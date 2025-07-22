import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 })
    }

    // Verify the user can only access their own data
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch user goals with analytics
    const { data: goals, error: goalsError } = await supabase
      .from('user_goals')
      .select(`
        *,
        goal_type:goal_types(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (goalsError) {
      console.error('Error fetching user goals for analytics:', goalsError)
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
    }

    // Calculate analytics
    const analytics = {
      totalGoals: goals?.length || 0,
      completedGoals: goals?.filter(g => g.is_completed)?.length || 0,
      activeGoals: goals?.filter(g => !g.is_completed)?.length || 0,
      goalTypes: goals?.reduce((acc, goal) => {
        const type = goal.goal_type?.name || 'Unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      averageProgress: goals?.length > 0 
        ? goals.reduce((sum, goal) => sum + (goal.current_progress || 0), 0) / goals.length
        : 0,
      goalsByPriority: goals?.reduce((acc, goal) => {
        const priority = goal.priority || 'medium'
        acc[priority] = (acc[priority] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
    }

    return NextResponse.json({
      success: true,
      analytics,
      goals: goals || []
    })

  } catch (error) {
    console.error('Error in GET /api/goals/analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 