'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types for future field planning
interface FutureField {
  field: string
  type: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

interface FutureFieldCategories {
  [key: string]: FutureField[]
}

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
    { field: 'has_power', type: 'boolean', status: 'match' },
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
    // Advanced training fields (newer additions)
    { field: 'relative_effort', type: 'number', status: 'extra' },
    { field: 'perceived_exertion', type: 'number', status: 'extra' },
    { field: 'training_load_score', type: 'number', status: 'extra' },
    { field: 'intensity_score', type: 'number', status: 'extra' },
    { field: 'recovery_time', type: 'number', status: 'extra' },
    { field: 'normalized_power', type: 'number', status: 'extra' },
    { field: 'training_stress_score', type: 'number', status: 'extra' },
    { field: 'power_zones', type: 'json', status: 'extra' },
    { field: 'heart_rate_zones', type: 'json', status: 'extra' },
    { field: 'pace_zones', type: 'json', status: 'extra' },
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

  // Future feature fields categorized by use case
  const futureFields: FutureFieldCategories = {
    analytics: [
      { field: 'intensity_factor', type: 'number', description: 'Normalized power / FTP for training zones', priority: 'high' },
      { field: 'variability_index', type: 'number', description: 'Power variability analysis', priority: 'medium' },
      { field: 'power_balance', type: 'number', description: 'Left/right power balance percentage', priority: 'low' },
      { field: 'hrv_score', type: 'number', description: 'Heart rate variability analysis', priority: 'medium' },
      { field: 'fatigue_score', type: 'number', description: 'Cumulative fatigue indicator', priority: 'medium' },
      { field: 'aerobic_decoupling', type: 'number', description: 'Heart rate drift indicator', priority: 'medium' },
      { field: 'efficiency_factor', type: 'number', description: 'Power to heart rate ratio', priority: 'high' }
    ],
    weather: [
      { field: 'temperature', type: 'number', description: 'Temperature during activity (°C)', priority: 'medium' },
      { field: 'humidity', type: 'number', description: 'Humidity percentage', priority: 'low' },
      { field: 'wind_speed', type: 'number', description: 'Wind speed (km/h)', priority: 'medium' },
      { field: 'wind_direction', type: 'number', description: 'Wind direction in degrees', priority: 'low' },
      { field: 'weather_condition', type: 'string', description: 'Weather description (sunny, rainy, etc.)', priority: 'medium' },
      { field: 'air_quality_index', type: 'number', description: 'Air quality during outdoor activities', priority: 'low' }
    ],
    social: [
      { field: 'strava_kudos_count', type: 'number', description: 'Kudos count from Strava', priority: 'low' },
      { field: 'internal_kudos_count', type: 'number', description: 'Kudos within our platform', priority: 'medium' },
      { field: 'shared_publicly', type: 'boolean', description: 'Whether activity is public', priority: 'medium' },
      { field: 'activity_photos', type: 'json', description: 'Array of photo URLs/metadata', priority: 'low' },
      { field: 'tagged_athletes', type: 'json', description: 'Other athletes tagged in activity', priority: 'low' },
      { field: 'activity_notes', type: 'text', description: 'User notes about the activity', priority: 'high' }
    ],
    coaching: [
      { field: 'planned_workout_id', type: 'string', description: 'Link to planned workout', priority: 'high' },
      { field: 'workout_completed', type: 'boolean', description: 'Whether planned workout was completed', priority: 'high' },
      { field: 'workout_rating', type: 'number', description: 'User rating of workout (1-10)', priority: 'medium' },
      { field: 'coach_notes', type: 'text', description: 'Coach feedback on activity', priority: 'medium' },
      { field: 'training_phase', type: 'string', description: 'Current training phase (base, build, peak)', priority: 'medium' }
    ],
    equipment: [
      { field: 'bike_id', type: 'string', description: 'Specific bike used', priority: 'medium' },
      { field: 'wheel_circumference', type: 'number', description: 'For accurate speed/distance', priority: 'low' },
      { field: 'gear_ratios_used', type: 'json', description: 'Gear usage analytics', priority: 'low' },
      { field: 'equipment_wear', type: 'number', description: 'Track equipment usage', priority: 'low' },
      { field: 'tire_pressure', type: 'number', description: 'Pre-ride tire pressure', priority: 'low' }
    ],
    performance: [
      { field: 'vo2_estimate', type: 'number', description: 'Estimated VO2 max contribution', priority: 'high' },
      { field: 'lactate_threshold_power', type: 'number', description: 'Estimated LT power', priority: 'high' },
      { field: 'anaerobic_capacity', type: 'number', description: 'Anaerobic work capacity', priority: 'medium' },
      { field: 'neuromuscular_power', type: 'number', description: 'Peak 5-second power', priority: 'medium' },
      { field: 'critical_power', type: 'number', description: 'Sustainable power for 1 hour', priority: 'high' },
      { field: 'power_curve', type: 'json', description: 'Power duration curve data', priority: 'medium' }
    ],
    location: [
      { field: 'route_id', type: 'string', description: 'Link to saved route', priority: 'high' },
      { field: 'segment_efforts', type: 'json', description: 'Strava segment performance', priority: 'medium' },
      { field: 'elevation_profile', type: 'json', description: 'Detailed elevation data', priority: 'low' },
      { field: 'surface_type', type: 'string', description: 'Road, trail, track, etc.', priority: 'medium' },
      { field: 'location_tags', type: 'json', description: 'Custom location tags', priority: 'low' }
    ]
  }

  const coreFields = actualSchema.filter(f => f.status === 'match')
  const extraFields = actualSchema.filter(f => f.status === 'extra')

  const getFieldsByPriority = (category: FutureField[]) => {
    const high = category.filter((f: FutureField) => f.priority === 'high')
    const medium = category.filter((f: FutureField) => f.priority === 'medium')
    const low = category.filter((f: FutureField) => f.priority === 'low')
    return { high, medium, low }
  }

  return (
    <div className="space-y-6">
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
              <li><strong>average_pace field:</strong> This is likely where &quot;07:04 /km&quot; strings are being stored, causing type errors</li>
              <li><strong>Advanced training fields:</strong> You already have TSS, normalized power, RPE, and recovery time!</li>
              <li><strong>Zone data:</strong> power_zones, heart_rate_zones, pace_zones are stored as JSON</li>
              <li><strong>Computed fields:</strong> week_number, efficiency_score etc. suggest custom analytics were added</li>
              <li><strong>Missing social fields:</strong> athlete_count, photo_count, pr_count not in your schema</li>
              <li><strong>No location fields:</strong> start_latlng, end_latlng missing</li>
            </ul>
          </div>

          {/* Already Implemented Features */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">✅ Already Implemented Training Features</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-green-700 mb-1">Training Load:</h5>
                <ul className="text-green-600 space-y-1 list-disc list-inside text-xs">
                  <li>training_stress_score (TSS)</li>
                  <li>training_load_score</li>
                  <li>intensity_score</li>
                  <li>relative_effort</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-green-700 mb-1">Recovery & RPE:</h5>
                <ul className="text-green-600 space-y-1 list-disc list-inside text-xs">
                  <li>recovery_time</li>
                  <li>perceived_exertion (RPE)</li>
                  <li>normalized_power</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-green-700 mb-1">Zone Analysis:</h5>
                <ul className="text-green-600 space-y-1 list-disc list-inside text-xs">
                  <li>power_zones (JSON)</li>
                  <li>heart_rate_zones (JSON)</li>
                  <li>pace_zones (JSON)</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-green-700 mb-1">Analytics:</h5>
                <ul className="text-green-600 space-y-1 list-disc list-inside text-xs">
                  <li>efficiency_score</li>
                  <li>elevation_per_km</li>
                  <li>average_pace</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Recommended Next Steps */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">🎯 Recommended Next Steps</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li><strong>Populate existing training fields</strong> - You have TSS, RPE, recovery time but may not be using them</li>
              <li><strong>Build UI for zone analysis</strong> - power_zones, heart_rate_zones data is stored but needs visualization</li>
              <li><strong>Handle average_pace</strong> field properly - it might need pace string conversion</li>
              <li><strong>Create training load dashboard</strong> - leverage training_stress_score and intensity_score</li>
              <li><strong>Add coaching features</strong> - planned workouts, workout rating, training phases</li>
              <li><strong>Document computed fields</strong> - understand how efficiency_score and elevation_per_km are calculated</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Future Feature Planning */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Future Feature Schema Planning</CardTitle>
          <p className="text-sm text-gray-600">
            Potential fields for upcoming features, organized by priority and use case
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
              {Object.keys(futureFields).map((category) => (
                <TabsTrigger key={category} value={category} className="text-xs">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(futureFields).map(([category, fields]) => {
              const { high, medium, low } = getFieldsByPriority(fields)
              return (
                <TabsContent key={category} value={category} className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    <strong>{category.charAt(0).toUpperCase() + category.slice(1)}</strong> features would enhance your endurance training app
                  </div>

                  {/* High Priority */}
                  {high.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="p-3 bg-red-50 font-medium text-red-800 border-b flex items-center gap-2">
                        🔥 High Priority ({high.length} fields)
                        <Badge variant="destructive" className="text-xs">Implement First</Badge>
                      </div>
                      <div className="p-3 space-y-2">
                        {high.map((field: FutureField, index: number) => (
                          <div key={index} className="p-3 bg-red-50 rounded border border-red-200">
                            <div className="flex items-center justify-between mb-1">
                              <code className="font-mono text-sm">{field.field}</code>
                              <Badge variant="outline">{field.type}</Badge>
                            </div>
                            <p className="text-xs text-gray-600">{field.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medium Priority */}
                  {medium.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="p-3 bg-yellow-50 font-medium text-yellow-800 border-b flex items-center gap-2">
                        ⚡ Medium Priority ({medium.length} fields)
                        <Badge variant="secondary" className="text-xs">Consider Next</Badge>
                      </div>
                      <div className="p-3 space-y-2">
                        {medium.map((field: FutureField, index: number) => (
                          <div key={index} className="p-2 bg-yellow-50 rounded border border-yellow-200">
                            <div className="flex items-center justify-between mb-1">
                              <code className="font-mono text-sm">{field.field}</code>
                              <Badge variant="outline">{field.type}</Badge>
                            </div>
                            <p className="text-xs text-gray-600">{field.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Low Priority */}
                  {low.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="p-3 bg-gray-50 font-medium text-gray-800 border-b flex items-center gap-2">
                        💡 Low Priority ({low.length} fields)
                        <Badge variant="outline" className="text-xs">Future Consideration</Badge>
                      </div>
                      <div className="p-3 space-y-1">
                        {low.map((field: FutureField, index: number) => (
                          <div key={index} className="p-2 bg-gray-50 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <code className="font-mono text-xs">{field.field}</code>
                              <Badge variant="outline" className="text-xs">{field.type}</Badge>
                            </div>
                            <p className="text-xs text-gray-500">{field.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>

          {/* Implementation Strategy */}
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">📋 Updated Implementation Strategy</h4>
            <div className="text-sm text-purple-700 space-y-2">
              <p><strong>Phase 1 (Next):</strong> Build UI for existing training data (TSS dashboard, zone charts, RPE tracking)</p>
              <p><strong>Phase 2:</strong> Add coaching workflow (planned workouts, workout rating, training phases)</p>
              <p><strong>Phase 3:</strong> Implement advanced analytics (VO2 estimates, critical power, power curves)</p>
              <p><strong>Phase 4:</strong> Enhance with weather data and social features</p>
              <p><strong>Phase 5:</strong> Add equipment tracking and advanced location features</p>
              <div className="mt-3 p-2 bg-purple-100 rounded text-xs">
                <strong>💡 Key Insight:</strong> You're further along than expected! Focus on utilizing existing data rather than adding new fields.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 