'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SchemaComparisonAnalyzer() {
  // Your actual database schema
  const actualSchema = [
    { field: 'id', type: 'string', status: 'match' },
    { field: 'user_id', type: 'string', status: 'match' },
    { field: 'strava_activity_id', type: 'number', status: 'match' },
    { field: 'name', type: 'string', status: 'match' },
    { field: 'sport_type', type: 'string', status: 'match' },
    { field: 'start_date', type: 'string', status: 'match' },
    { field: 'start_date_local', type: 'string', status: 'match' },
    { field: 'timezone', type: 'string', status: 'match' },
    { field: 'distance', type: 'number', status: 'match' },
    { field: 'moving_time', type: 'number', status: 'match' },
    { field: 'elapsed_time', type: 'number', status: 'match' },
    { field: 'total_elevation_gain', type: 'number', status: 'match' },
    { field: 'average_speed', type: 'number', status: 'match' },
    { field: 'max_speed', type: 'number', status: 'match' },
    { field: 'average_heartrate', type: 'number', status: 'match' },
    { field: 'max_heartrate', type: 'number', status: 'match' },
    { field: 'has_heartrate', type: 'boolean', status: 'match' },
    { field: 'average_watts', type: 'number', status: 'match' },
    { field: 'max_watts', type: 'number', status: 'match' },
    { field: 'weighted_average_watts', type: 'number', status: 'match' },
    { field: 'kilojoules', type: 'number', status: 'match' },
    { field: 'has_power', type: 'boolean', status: 'extra' }, // Not in migration
    { field: 'trainer', type: 'boolean', status: 'match' },
    { field: 'commute', type: 'boolean', status: 'match' },
    { field: 'manual', type: 'boolean', status: 'match' },
    { field: 'achievement_count', type: 'number', status: 'match' },
    { field: 'kudos_count', type: 'number', status: 'match' },
    { field: 'comment_count', type: 'number', status: 'match' },
    // Extra computed fields not in migration
    { field: 'week_number', type: 'number', status: 'extra' },
    { field: 'month_number', type: 'number', status: 'extra' },
    { field: 'year_number', type: 'number', status: 'extra' },
    { field: 'day_of_week', type: 'number', status: 'extra' },
    { field: 'average_pace', type: 'number', status: 'extra' }, // This might be causing pace string issues!
    { field: 'elevation_per_km', type: 'number', status: 'extra' },
    { field: 'efficiency_score', type: 'number', status: 'extra' },
    { field: 'created_at', type: 'string', status: 'match' },
    { field: 'updated_at', type: 'string', status: 'match' }
  ]

  // Fields expected by migration but missing in actual schema
  const missingFromActual = [
    'activity_type', 'private', 'device_name', 'device_watts', 
    'athlete_count', 'photo_count', 'pr_count', 'calories', 
    'description', 'gear_id', 'start_latlng', 'end_latlng',
    'average_cadence', 'last_synced_at'
  ]

  const coreFields = actualSchema.filter(f => f.status === 'match')
  const extraFields = actualSchema.filter(f => f.status === 'extra')

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔍 Schema Reality Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{coreFields.length}</div>
            <div className="text-sm text-gray-600">Fields Match</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{extraFields.length}</div>
            <div className="text-sm text-gray-600">Extra Fields</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{missingFromActual.length}</div>
            <div className="text-sm text-gray-600">Migration Missing</div>
          </div>
        </div>

        {/* Extra Fields in Your DB */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 bg-blue-50 font-medium text-blue-800 border-b">
            ➕ Extra Fields in Your Database (Not in Migration)
          </div>
          <div className="p-3 space-y-2">
            {extraFields.map((field, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <div className="flex items-center gap-2">
                  <code className="font-mono">{field.field}</code>
                  <Badge variant="outline">{field.type}</Badge>
                  {field.field === 'average_pace' && (
                    <Badge variant="destructive" className="text-xs">⚠️ Pace Issue Source</Badge>
                  )}
                </div>
                <Badge variant="secondary">Custom Field</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Fields */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 bg-orange-50 font-medium text-orange-800 border-b">
            ❌ Fields in Migration but Missing from Your DB
          </div>
          <div className="p-3">
            <div className="flex flex-wrap gap-2">
              {missingFromActual.map((field, index) => (
                <Badge key={index} variant="outline" className="text-xs">{field}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">🔑 Key Insights</h4>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li><strong>average_pace field:</strong> This is likely where "07:04 /km" strings are being stored, causing type errors</li>
            <li><strong>has_power field:</strong> Exists in your DB but not expected by sync code</li>
            <li><strong>Computed fields:</strong> week_number, efficiency_score etc. suggest custom analytics were added</li>
            <li><strong>Missing social fields:</strong> athlete_count, photo_count, pr_count not in your schema</li>
            <li><strong>No location fields:</strong> start_latlng, end_latlng missing</li>
          </ul>
        </div>

        {/* Recommended Fixes */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">✅ Recommended Fixes</h4>
          <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
            <li><strong>Update sync code</strong> to match your actual schema (remove missing fields)</li>
            <li><strong>Handle average_pace</strong> field properly - it might need pace string conversion</li>
            <li><strong>Add has_power</strong> to sync code or remove from DB</li>
            <li><strong>Skip computed fields</strong> in sync (week_number, efficiency_score etc.)</li>
            <li><strong>Document custom fields</strong> to understand their purpose</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
} 