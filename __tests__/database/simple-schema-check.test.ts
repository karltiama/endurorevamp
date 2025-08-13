import { createClient } from '@supabase/supabase-js';

describe('Simple Schema Check', () => {
  let supabase: any;

  beforeAll(() => {
    // Check if we have real environment variables
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('test.supabase.co')
    ) {
      console.log('⚠️  No real database credentials - skipping all tests');
      return;
    }

    console.log('✅ Using real database for schema validation');
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  });

  const requiredTables = [
    'activities',
    'strava_tokens',
    'sync_state',
    'goal_types',
    'user_goals',
    'goal_progress',
    'user_onboarding',
  ];

  test('all required tables should exist', async () => {
    if (!supabase) {
      console.log('Skipping - no database connection');
      return;
    }

    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select('*').limit(1);

      if (error) {
        console.error(`❌ Table '${table}' error:`, error.message);
      } else {
        console.log(`✅ Table '${table}' accessible`);
      }

      expect(error).toBeNull();
    }
  });

  test('goal relationships should work', async () => {
    if (!supabase) {
      console.log('Skipping - no database connection');
      return;
    }

    // Test the basic goal relationship query
    const { data, error } = await supabase
      .from('user_goals')
      .select(
        `
        id,
        target_value,
        goal_types (
          display_name,
          category
        )
      `
      )
      .limit(1);

    if (error) {
      console.error('❌ Goal relationship error:', error.message);
    } else {
      console.log('✅ Goal relationships work');
      if (data && data.length > 0) {
        console.log('Sample goal data:', data[0]);
      }
    }

    expect(error).toBeNull();
  });

  test('dashboard goals feature readiness', async () => {
    if (!supabase) {
      console.log('Skipping - no database connection');
      return;
    }

    // Check if goal_data field supports dashboard preferences
    const { data, error } = await supabase
      .from('user_goals')
      .select('goal_data')
      .not('goal_data', 'is', null)
      .limit(1);

    expect(error).toBeNull();

    if (data && data.length > 0) {
      const goalData = data[0].goal_data;
      console.log('✅ Goal data structure:', goalData);

      // The structure should support our dashboard fields
      expect(typeof goalData).toBe('object');
    } else {
      console.log(
        'ℹ️  No goals with data found - this is okay for new databases'
      );
    }
  });
});

// Utility function to run a quick schema health check
export async function quickSchemaCheck() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('test.supabase.co')
  ) {
    console.log('⚠️  No real database credentials available');
    return false;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const tables = ['goal_types', 'user_goals', 'activities'];
  const results = [];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      results.push({
        table,
        accessible: !error,
        recordCount: count || 0,
        error: error?.message,
      });
    } catch (e) {
      results.push({
        table,
        accessible: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  }

  console.log('Schema Health Check:');
  results.forEach(result => {
    const status = result.accessible ? '✅' : '❌';
    console.log(`${status} ${result.table}: ${result.recordCount} records`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  return results.every(r => r.accessible);
}
