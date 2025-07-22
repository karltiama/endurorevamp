import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Schema validation tests to ensure relationships work correctly
describe('Database Schema Validation', () => {
  let supabase: SupabaseClient | null = null
  
  beforeAll(() => {
    // Check if we have real environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
        !process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('test.supabase.co')) {
      console.log('⚠️  Skipping schema validation - no real database credentials')
      return
    }
    
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  describe('Core Table Existence', () => {
    const requiredTables = [
      'activities',
      'strava_tokens', 
      'sync_state',
      'goal_types',
      'user_goals',
      'goal_progress',
      'user_onboarding'
    ]

    requiredTables.forEach(table => {
      it(`should have ${table} table`, async () => {
        if (!supabase) {
          console.log('Skipping test - no database connection')
          return
        }
        
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        expect(error).toBeNull()
      })
    })
  })

  describe('Foreign Key Relationships', () => {
    it('user_goals should reference goal_types correctly', async () => {
      if (!supabase) {
        console.log('Skipping test - no database connection')
        return
      }
      
      // Get a goal type
      const { data: goalTypes } = await supabase
        .from('goal_types')
        .select('id, name')
        .limit(1)

      if (goalTypes && goalTypes.length > 0) {
        // Check if any user_goals reference this goal_type
        const { data: userGoals, error } = await supabase
          .from('user_goals')
          .select(`
            id,
            goal_type_id,
            goal_types (
              id,
              name,
              display_name
            )
          `)
          .eq('goal_type_id', goalTypes[0].name)
          .limit(1)

        expect(error).toBeNull()
        
        if (userGoals && userGoals.length > 0) {
          expect(userGoals[0].goal_types).toBeTruthy()
          expect((userGoals[0].goal_types as any).name).toBe(goalTypes[0].name)
        }
      }
    })

    it('goal_progress should reference user_goals correctly', async () => {
      if (!supabase) {
        console.log('Skipping test - no database connection')
        return
      }
      
      const { data: userGoals } = await supabase
        .from('user_goals')
        .select('id')
        .limit(1)

      if (userGoals && userGoals.length > 0) {
        const { data: progress, error } = await supabase
          .from('goal_progress')
          .select(`
            id,
            user_goal_id,
            user_goals (
              id,
              goal_type_id
            )
          `)
          .eq('user_goal_id', userGoals[0].id)
          .limit(1)

        expect(error).toBeNull()

        if (progress && progress.length > 0) {
          expect(progress[0].user_goals).toBeTruthy()
          expect((progress[0].user_goals as any).id).toBe(userGoals[0].id)
        }
      }
    })

    it('user_onboarding should have unique user_id constraint', async () => {
      if (!supabase) {
        console.log('Skipping test - no database connection')
        return
      }
      
      const { data: onboarding, error } = await supabase
        .from('user_onboarding')
        .select('user_id')

      expect(error).toBeNull()

      if (onboarding && onboarding.length > 0) {
        const userIds = onboarding.map((o: any) => o.user_id)
        const uniqueUserIds = [...new Set(userIds)]
        
        // Should have same length if all user_ids are unique
        expect(userIds.length).toBe(uniqueUserIds.length)
      }
    })
  })

  describe('Data Integrity Checks', () => {
    it('goal_types should have valid categories', async () => {
      if (!supabase) {
        console.log('Skipping test - no database connection')
        return
      }
      
      const validCategories = [
        'distance', 'pace', 'frequency', 'duration', 
        'elevation', 'heart_rate', 'event'
      ]

      const { data: goalTypes, error } = await supabase
        .from('goal_types')
        .select('category')

      expect(error).toBeNull()

      if (goalTypes) {
        goalTypes.forEach((goalType: any) => {
          expect(validCategories).toContain(goalType.category)
        })
      }
    })

    it('user_goals should have valid time_periods', async () => {
      if (!supabase) {
        console.log('Skipping test - no database connection')
        return
      }
      
      const validTimePeriods = ['weekly', 'monthly', 'single_activity', 'ongoing']

      const { data: userGoals, error } = await supabase
        .from('user_goals')
        .select('time_period')

      expect(error).toBeNull()

      if (userGoals) {
        userGoals.forEach((goal: any) => {
          expect(validTimePeriods).toContain(goal.time_period)
        })
      }
    })

    it('activities should have user_id that matches UUID format', async () => {
      if (!supabase) {
        console.log('Skipping test - no database connection')
        return
      }
      
      const { data: activities, error } = await supabase
        .from('activities')
        .select('user_id')
        .limit(5)

      expect(error).toBeNull()

      if (activities) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        
        activities.forEach((activity: any) => {
          expect(activity.user_id).toMatch(uuidRegex)
        })
      }
    })
  })

  describe('Dashboard Goals Feature Readiness', () => {
    it('goal_data should support dashboard preferences', async () => {
      if (!supabase) {
        console.log('Skipping test - no database connection')
        return
      }
      
      const { data: userGoals, error } = await supabase
        .from('user_goals')
        .select('goal_data')
        .not('goal_data', 'is', null)
        .limit(1)

      expect(error).toBeNull()

      if (userGoals && userGoals.length > 0) {
        const goalData = userGoals[0].goal_data
        
        // Should be valid JSON and support our dashboard fields
        expect(typeof goalData).toBe('object')
        
        // These fields might not exist yet, but the structure should support them
        if (goalData.show_on_dashboard !== undefined) {
          expect(typeof goalData.show_on_dashboard).toBe('boolean')
        }
        
        if (goalData.dashboard_priority !== undefined) {
          expect(typeof goalData.dashboard_priority).toBe('number')
          expect(goalData.dashboard_priority).toBeGreaterThan(0)
          expect(goalData.dashboard_priority).toBeLessThanOrEqual(3)
        }
      }
    })

    it('user_onboarding should track goals completion', async () => {
      if (!supabase) {
        console.log('Skipping test - no database connection')
        return
      }
      
      const { data: onboarding, error } = await supabase
        .from('user_onboarding')
        .select('goals_completed, current_step')

      expect(error).toBeNull()

      if (onboarding && onboarding.length > 0) {
        onboarding.forEach((record: any) => {
          // goals_completed should be boolean
          expect(typeof record.goals_completed).toBe('boolean')
          
          // current_step should be valid value
          expect(['goals', 'strava', 'complete']).toContain(record.current_step)
        })
      }
    })

    it('complete user goal flow should be queryable', async () => {
      // Test the complete chain: user → user_goals → goal_types → goal_progress
      if (!supabase) {
        console.log('Skipping test - no database connection')
        return
      }
      
      const { data, error } = await supabase
        .from('user_goals')
        .select(`
          id,
          target_value,
          current_progress,
          is_completed,
          goal_types (
            display_name,
            category,
            unit
          ),
          goal_progress (
            id,
            value_achieved,
            contribution_amount
          )
        `)
        .limit(1)

      expect(error).toBeNull()

      if (data && data.length > 0) {
        const goal = data[0]
        
        // Should have goal details
        expect(goal.target_value).toBeDefined()
        expect(goal.current_progress).toBeDefined()
        expect(typeof goal.is_completed).toBe('boolean')
        
        // Should have goal type info
        if (goal.goal_types) {
          expect((goal.goal_types as any).display_name).toBeDefined()
          expect((goal.goal_types as any).category).toBeDefined()
        }
        
        // Might or might not have progress records
        if (goal.goal_progress && goal.goal_progress.length > 0) {
          expect(goal.goal_progress[0].value_achieved).toBeDefined()
        }
      }
    })
  })

  describe('Performance Validation', () => {
    it('should have indexes on foreign keys', async () => {
      // This would require a more complex query to check actual indexes
      // For now, we'll just verify that foreign key queries perform reasonably
      
      if (!supabase) {
        console.log('Skipping test - no database connection')
        return
      }
      
      const start = Date.now()
      
      const { data, error } = await supabase
        .from('user_goals')
        .select(`
          id,
          goal_types (display_name),
          goal_progress (count)
        `)
        .limit(10)

      const duration = Date.now() - start
      
      expect(error).toBeNull()
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })

  describe('Data Flow Validation', () => {
    it('complete user goal flow should be queryable', async () => {
      // Test the complete chain: user → user_goals → goal_types → goal_progress
      if (!supabase) {
        console.log('Skipping test - no database connection')
        return
      }
      
      const { data, error } = await supabase
        .from('user_goals')
        .select(`
          id,
          target_value,
          current_progress,
          is_completed,
          goal_types (
            display_name,
            category,
            unit
          ),
          goal_progress (
            id,
            value_achieved,
            contribution_amount
          )
        `)
        .limit(1)

      expect(error).toBeNull()

      if (data && data.length > 0) {
        const goal = data[0]
        
        // Should have goal details
        expect(goal.target_value).toBeDefined()
        expect(goal.current_progress).toBeDefined()
        expect(typeof goal.is_completed).toBe('boolean')
        
        // Should have goal type info
        if (goal.goal_types) {
          expect((goal.goal_types as any).display_name).toBeDefined()
          expect((goal.goal_types as any).category).toBeDefined()
        }
        
        // Might or might not have progress records
        if (goal.goal_progress && goal.goal_progress.length > 0) {
          expect(goal.goal_progress[0].value_achieved).toBeDefined()
        }
      }
    })
  })
})

// Helper function to create test data (useful for development)
export async function createTestGoalData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // This would create test data for development/testing
  // Implementation depends on your auth setup
  
  return {
    goalType: {
      name: 'test_weekly_distance',
      display_name: 'Test Weekly Distance',
      description: 'Test goal for weekly distance',
      category: 'distance',
      metric_type: 'total_distance',
      unit: 'km',
      calculation_method: 'Sum of weekly distances'
    }
  }
}

// Schema health check - run this regularly
export async function runSchemaHealthCheck() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const results: {
    tables: Record<string, any>;
    relationships: Record<string, any>;
    dataIntegrity: Record<string, any>;
    performance: Record<string, any>;
  } = {
    tables: {},
    relationships: {},
    dataIntegrity: {},
    performance: {}
  }

  try {
    // Check table accessibility
    const tables = ['goal_types', 'user_goals', 'goal_progress', 'user_onboarding']
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        results.tables[table] = { 
          accessible: !error, 
          recordCount: count,
          error: error?.message 
        }
      } catch (e) {
        results.tables[table] = { 
          accessible: false, 
          error: e instanceof Error ? e.message : 'Unknown error'
        }
      }
    }

    console.log('Schema Health Check Results:', results)
    return results
    
  } catch (error) {
    console.error('Schema health check failed:', error)
    return null
  }
} 