import { createClient } from '@supabase/supabase-js'

describe('Schema Extractor', () => {
  let supabase: any
  
  beforeAll(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
        !process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('test.supabase.co')) {
      console.log('⚠️  No real database credentials - skipping schema extraction')
      return
    }
    
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  test('extract complete database schema', async () => {
    if (!supabase) {
      console.log('Skipping - no database connection')
      return
    }

    console.log('\n🔍 EXTRACTING DATABASE SCHEMA...\n')

    // Get all tables
    const { data: tables, error: tablesError } = await supabase.rpc('get_table_info')
    
    if (tablesError) {
      // Fallback to manual query
      const { data: tablesData, error: fallbackError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE')

      if (fallbackError) {
        console.log('❌ Could not get table list:', fallbackError.message)
        return
      }

      // Extract schema for each table manually
      for (const table of tablesData || []) {
        await extractTableSchema(supabase, table.table_name)
      }
    }

    expect(true).toBe(true) // Test always passes, we just want the output
  })
})

async function extractTableSchema(supabase: any, tableName: string) {
  console.log(`\n📊 TABLE: ${tableName.toUpperCase()}`)
  console.log('=' + '='.repeat(tableName.length + 8))

  // Get columns
  const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
    table_name_input: tableName
  })

  if (columnsError) {
    // Fallback to information_schema query
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      ORDER BY ordinal_position
    `
    
    const { data: fallbackColumns, error: fallbackError } = await supabase.rpc('exec_sql', {
      sql: query
    })

    if (fallbackError) {
      console.log(`❌ Could not get columns for ${tableName}:`, fallbackError.message)
      return
    }

    // Display columns
    if (fallbackColumns && fallbackColumns.length > 0) {
      fallbackColumns.forEach((col: any) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : ''
        console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(15)} ${nullable}${defaultVal}`)
      })
    }
  } else {
    // Use RPC result
    console.log('Columns:', columns)
  }

  // Get constraints (PKs, FKs, etc.)
  await getTableConstraints(supabase, tableName)

  // Get indexes
  await getTableIndexes(supabase, tableName)

  // Get sample data count
  try {
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
    
    console.log(`📈 Record count: ${count || 0}`)
  } catch (e) {
    console.log('📈 Record count: Unable to query')
  }
}

async function getTableConstraints(supabase: any, tableName: string) {
  const constraintsQuery = `
    SELECT 
      tc.constraint_name,
      tc.constraint_type,
      ku.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage ku 
      ON tc.constraint_name = ku.constraint_name
    LEFT JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'public' 
      AND tc.table_name = '${tableName}'
    ORDER BY tc.constraint_type, ku.column_name
  `

  try {
    const { data: constraints } = await supabase.rpc('exec_sql', { sql: constraintsQuery })
    
    if (constraints && constraints.length > 0) {
      console.log('\n🔗 Constraints:')
      constraints.forEach((constraint: any) => {
        if (constraint.constraint_type === 'PRIMARY KEY') {
          console.log(`  🔑 PRIMARY KEY: ${constraint.column_name}`)
        } else if (constraint.constraint_type === 'FOREIGN KEY') {
          console.log(`  🔗 FOREIGN KEY: ${constraint.column_name} → ${constraint.foreign_table_name}(${constraint.foreign_column_name})`)
        } else if (constraint.constraint_type === 'UNIQUE') {
          console.log(`  ⭐ UNIQUE: ${constraint.column_name}`)
        }
      })
    }
  } catch (e) {
    console.log('Could not get constraints')
  }
}

async function getTableIndexes(supabase: any, tableName: string) {
  const indexQuery = `
    SELECT 
      indexname,
      indexdef
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = '${tableName}'
      AND indexname NOT LIKE '%pkey'
  `

  try {
    const { data: indexes } = await supabase.rpc('exec_sql', { sql: indexQuery })
    
    if (indexes && indexes.length > 0) {
      console.log('\n📊 Indexes:')
      indexes.forEach((index: any) => {
        console.log(`  📊 ${index.indexname}: ${index.indexdef}`)
      })
    }
  } catch (e) {
    console.log('Could not get indexes')
  }
}

// Utility function you can call from anywhere
export async function generateSchemaReport() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('test.supabase.co')) {
    console.log('⚠️  No real database credentials available')
    return null
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get simplified schema info
  const schema: {
    tables: Record<string, any>;
    relationships: any[];
    summary: Record<string, any>;
  } = {
    tables: {},
    relationships: [],
    summary: {}
  }

  const tables = [
    'activities', 'strava_tokens', 'sync_state', 
    'goal_types', 'user_goals', 'goal_progress', 'user_onboarding'
  ]

  for (const tableName of tables) {
    try {
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      schema.tables[tableName] = {
        exists: true,
        recordCount: count || 0
      }
    } catch (error) {
      schema.tables[tableName] = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  console.log('\n📋 SCHEMA SUMMARY')
  console.log('================')
  Object.entries(schema.tables).forEach(([table, info]: [string, any]) => {
    const status = info.exists ? '✅' : '❌'
    const count = info.exists ? `(${info.recordCount} records)` : `(${info.error})`
    console.log(`${status} ${table.padEnd(20)} ${count}`)
  })

  return schema
} 