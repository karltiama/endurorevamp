import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface TableInfo {
  exists: boolean;
  recordCount?: number;
  error?: string;
  columns?: string[] | string;
  columnTypes?: Record<string, string>;
  sampleRecord?: Record<string, unknown> | null;
  sampleError?: string;
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // List of tables we expect to exist based on the codebase
    const expectedTables = [
      'activities', 
      'athlete_profiles', 
      'sync_state', 
      'strava_tokens', 
      'goals',
      'users' // Auth table
    ]
    
    const tableInfo: Record<string, TableInfo> = {}
    const existingTables: string[] = []
    
    // For each expected table, try to:
    // 1. Query it to see if it exists
    // 2. Get sample data to understand the structure
    // 3. Get a count of records
    
    for (const tableName of expectedTables) {
      try {
        console.log(`Checking table: ${tableName}`)
        
        // First, try to get a count
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (countError) {
          console.log(`Table ${tableName} does not exist or is not accessible:`, countError.message)
          tableInfo[tableName] = {
            exists: false,
            error: countError.message
          }
          continue
        }
        
        existingTables.push(tableName)
        
        // Try to get sample data to understand structure
        const { data: sample, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
          .maybeSingle()
        
        const tableData: TableInfo = {
          exists: true,
          recordCount: count || 0
        }
        
        if (sample && !sampleError) {
          // Extract column information from the sample
          const columns = Object.keys(sample)
          const columnTypes: Record<string, string> = {}
          
          columns.forEach(col => {
            const value = sample[col]
            if (value === null) {
              columnTypes[col] = 'nullable'
            } else if (typeof value === 'string') {
              columnTypes[col] = 'text'
            } else if (typeof value === 'number') {
              columnTypes[col] = Number.isInteger(value) ? 'integer' : 'numeric'
            } else if (typeof value === 'boolean') {
              columnTypes[col] = 'boolean'
            } else if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
              columnTypes[col] = 'timestamp'
            } else {
              columnTypes[col] = 'unknown'
            }
          })
          
          tableData.columns = columns
          tableData.columnTypes = columnTypes
          tableData.sampleRecord = sample
          
        } else if (!sampleError) {
          tableData.columns = 'unknown (table empty)'
          tableData.sampleRecord = null
        } else {
          tableData.columns = 'error getting sample'
          tableData.sampleError = sampleError.message
        }
        
        tableInfo[tableName] = tableData
        
      } catch (e) {
        console.error(`Error checking table ${tableName}:`, e)
        tableInfo[tableName] = {
          exists: false,
          error: e instanceof Error ? e.message : 'Unknown error'
        }
      }
    }
    
    // Special detailed analysis of the activities table since that's our main focus
    let activitiesAnalysis = null
    if (existingTables.includes('activities')) {
      try {
        // Get a few more samples from activities to better understand the structure
        const { data: activitiesSamples } = await supabase
          .from('activities')
          .select('*')
          .limit(3)
        
        if (activitiesSamples && activitiesSamples.length > 0) {
          // Analyze all samples to get a comprehensive view of columns
          const allColumns = new Set<string>()
          activitiesSamples.forEach(activity => {
            Object.keys(activity).forEach(key => allColumns.add(key))
          })
          
          activitiesAnalysis = {
            totalSamples: activitiesSamples.length,
            allColumns: Array.from(allColumns).sort(),
            samples: activitiesSamples
          }
        }
      } catch (e) {
        console.error('Error getting detailed activities analysis:', e)
      }
    }
    
    return NextResponse.json({
      success: true,
      method: 'table_detection_via_queries',
      summary: {
        totalTablesFound: existingTables.length,
        existingTables: existingTables,
        missingTables: expectedTables.filter(t => !existingTables.includes(t))
      },
      tableInfo,
      activitiesAnalysis,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Schema detection error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 