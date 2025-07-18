'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
}

interface ConstraintInfo {
  constraint_name: string
  constraint_type: string
}

export function DatabaseSchemaChecker() {
  const [isChecking, setIsChecking] = useState(false)
  const [schemaInfo, setSchemaInfo] = useState<{
    columns: ColumnInfo[]
    constraints: ConstraintInfo[]
    error?: string
  } | null>(null)
  const { user } = useAuth()

  const checkSchema = async () => {
    if (!user) return

    setIsChecking(true)
    setSchemaInfo(null)

    try {
      const supabase = createClient()

      // Get column information
      const { data: columnsData, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
        .eq('table_name', 'activities')
        .eq('table_schema', 'public')
        .order('ordinal_position')

      if (columnsError) {
        console.error('Error fetching columns:', columnsError)
        setSchemaInfo({ 
          columns: [], 
          constraints: [], 
          error: `Failed to fetch columns: ${columnsError.message}` 
        })
        return
      }

      // Get constraint information (simplified)
      const { data: constraintsData } = await supabase
        .from('information_schema.table_constraints')
        .select('constraint_name, constraint_type')
        .eq('table_name', 'activities')
        .eq('table_schema', 'public')

      console.log('Raw columns data:', columnsData)
      console.log('Raw constraints data:', constraintsData)

      setSchemaInfo({
        columns: columnsData || [],
        constraints: constraintsData || [],
      })

    } catch (error) {
      console.error('Schema check error:', error)
      setSchemaInfo({ 
        columns: [], 
        constraints: [], 
        error: `Failed to check schema: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setIsChecking(false)
    }
  }

  const checkWithDirectSQL = async () => {
    if (!user) return

    setIsChecking(true)
    setSchemaInfo(null)

    try {
      const supabase = createClient()

      // Try using RPC call with raw SQL
      const { data: columnsData, error: columnsError } = await supabase
        .rpc('get_table_schema', { table_name: 'activities' })

      if (columnsError) {
        // If RPC doesn't exist, try a simpler approach
        console.log('RPC failed, trying simple query...')
        
        // Let's try to get a sample row to see what fields exist
        const { data: sampleData, error: sampleError } = await supabase
          .from('activities')
          .select('*')
          .limit(1)

        if (sampleError) {
          setSchemaInfo({ 
            columns: [], 
            constraints: [], 
            error: `Cannot access activities table: ${sampleError.message}` 
          })
          return
        }

        // Extract column info from sample data
        const columns = sampleData && sampleData.length > 0 
          ? Object.keys(sampleData[0]).map(key => ({
              column_name: key,
              data_type: typeof sampleData[0][key],
              is_nullable: 'unknown',
              column_default: null,
              character_maximum_length: null
            }))
          : []

        setSchemaInfo({
          columns,
          constraints: [],
          error: columns.length === 0 ? 'No data found in activities table' : undefined
        })
      } else {
        setSchemaInfo({
          columns: columnsData || [],
          constraints: [],
        })
      }

    } catch (error) {
      console.error('Direct SQL check error:', error)
      setSchemaInfo({ 
        columns: [], 
        constraints: [], 
        error: `Failed to check schema: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          🔍 Database Schema Checker
          <div className="flex gap-2">
            <Button onClick={checkSchema} size="sm" disabled={isChecking || !user}>
              {isChecking ? 'Checking...' : 'Check Schema'}
            </Button>
            <Button onClick={checkWithDirectSQL} size="sm" variant="outline" disabled={isChecking || !user}>
              {isChecking ? 'Checking...' : 'Simple Check'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will check what fields actually exist in your activities table vs what the migration files suggest.
          </p>

          {!schemaInfo && !isChecking && (
            <div className="text-center py-8 text-gray-500">
              Click &quot;Check Schema&quot; to see your actual database structure
            </div>
          )}

          {schemaInfo?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-600">{schemaInfo.error}</p>
            </div>
          )}

          {schemaInfo && schemaInfo.columns.length > 0 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">
                  Activities Table Columns ({schemaInfo.columns.length})
                </h4>
                <div className="grid gap-2">
                  {schemaInfo.columns.map((col, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">{col.column_name}</code>
                        <Badge variant="outline" className="text-xs">
                          {col.data_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {col.is_nullable === 'YES' && <Badge variant="secondary">nullable</Badge>}
                        {col.character_maximum_length && (
                          <span>max: {col.character_maximum_length}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {schemaInfo.constraints.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">
                    Constraints ({schemaInfo.constraints.length})
                  </h4>
                  <div className="grid gap-2">
                    {schemaInfo.constraints.map((constraint, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <code className="text-sm font-mono">{constraint.constraint_name}</code>
                        <Badge variant="outline">{constraint.constraint_type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Next Steps</h4>
                <p className="text-sm text-yellow-700">
                  Compare this with your migration files. If they don&apos;t match, you may need to:
                </p>
                <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                  <li>Run missing migrations</li>
                  <li>Update your code to match the actual schema</li>
                  <li>Create new migrations to add missing fields</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 