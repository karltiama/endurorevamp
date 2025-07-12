'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Target, 
  Calendar, 
  Settings, 
  TrendingUp, 
  Clock,
  Play,
  BarChart3,
  Bug,
  Database,
  RefreshCw
} from 'lucide-react'

import { useCompleteTrainingProfile } from '@/hooks/useTrainingProfile'
import { 
  ExperienceLevel, 
  PrimaryGoal, 
  TrainingPhilosophy,
  Units,
  UserProfileFormData,
  TrainingPreferencesFormData 
} from '@/types/training-profile-simplified'

interface UserTrainingProfileProps {
  userId: string
}

export function UserTrainingProfile({ userId }: UserTrainingProfileProps) {
  const {
    profile,
    analysis,
    personalizedTSSTarget,
    isLoading,
    isError,
    error,
    updateProfile,
    updatePreferences,
    isUpdatingProfile,
    isUpdatingPreferences,
    refetchProfile
  } = useCompleteTrainingProfile(userId)

  const [profileForm, setProfileForm] = useState<UserProfileFormData>({})
  const [preferencesForm, setPreferencesForm] = useState<TrainingPreferencesFormData>({})
  const [debugExpanded, setDebugExpanded] = useState(false)
  const [displayWeight, setDisplayWeight] = useState<number | undefined>(undefined)
  const [currentWeightUnits, setCurrentWeightUnits] = useState<'metric' | 'imperial'>('metric')

  // Initialize forms when profile data loads
  useEffect(() => {
    if (profile) {
      const units = profile.profile.preferred_units || 'metric'
      setCurrentWeightUnits(units)
      
      // Convert weight for display based on preferred units
      const weightForDisplay = profile.profile.weight 
        ? units === 'imperial' 
          ? Math.round(profile.profile.weight * 2.20462 * 10) / 10
          : profile.profile.weight
        : undefined
      
      setDisplayWeight(weightForDisplay)
      
      setProfileForm({
        age: profile.profile.age,
        weight: profile.profile.weight, // Always keep original kg value for database
        sex: profile.profile.sex,
        experience_level: profile.profile.experience_level,
        preferred_units: profile.profile.preferred_units
      })
      setPreferencesForm({
        primary_goal: profile.preferences.primary_goal,
        goal_description: profile.preferences.goal_description,
        preferred_training_days: profile.preferences.preferred_training_days,
        max_weekly_training_time: profile.preferences.max_weekly_training_time,
        preferred_workout_duration: profile.preferences.preferred_workout_duration,
        training_philosophy: profile.preferences.training_philosophy,
        easy_percentage: profile.preferences.easy_percentage,
        moderate_percentage: profile.preferences.moderate_percentage,
        hard_percentage: profile.preferences.hard_percentage,
        mandatory_rest_days: profile.preferences.mandatory_rest_days,
        weekly_progress_emails: profile.preferences.weekly_progress_emails,
        goal_milestone_alerts: profile.preferences.goal_milestone_alerts,
        training_reminders: profile.preferences.training_reminders
      })
    }
  }, [profile])

  // Handle unit preference changes - convert display weight when units change
  useEffect(() => {
    const selectedUnits = profileForm.preferred_units || profile?.profile.preferred_units || 'metric'
    
    if (selectedUnits !== currentWeightUnits && displayWeight !== undefined) {
      if (selectedUnits === 'imperial' && currentWeightUnits === 'metric') {
        // Converting from kg to lbs
        setDisplayWeight(Math.round(displayWeight * 2.20462 * 10) / 10)
      } else if (selectedUnits === 'metric' && currentWeightUnits === 'imperial') {
        // Converting from lbs to kg
        setDisplayWeight(Math.round(displayWeight / 2.20462 * 10) / 10)
      }
      setCurrentWeightUnits(selectedUnits)
    }
  }, [profileForm.preferred_units, profile?.profile.preferred_units, currentWeightUnits, displayWeight])

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({ userId, data: profileForm })
      refetchProfile()
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleUpdatePreferences = async () => {
    try {
      await updatePreferences({ userId, data: preferencesForm })
      refetchProfile()
    } catch (error) {
      console.error('Failed to update preferences:', error)
    }
  }

  const DebugSection = ({ title, data, className = "" }: { title: string, data: any, className?: string }) => (
    <div className={`mt-4 border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Bug className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-medium text-gray-700">DEBUG: {title}</span>
      </div>
      <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Training Profile</h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Training Profile</h2>
        </div>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-red-600">Error loading profile: {error?.message}</p>
            <Button onClick={() => refetchProfile()} className="mt-4">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Training Profile</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchProfile()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDebugExpanded(!debugExpanded)}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            {debugExpanded ? 'Hide' : 'Show'} Debug
          </Button>
        </div>
      </div>

      {/* Profile Completeness */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Profile Completeness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {analysis.completeness_score}% Complete
                </span>
                <Badge variant={analysis.completeness_score >= 80 ? 'default' : 'secondary'}>
                  {analysis.completeness_score >= 80 ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>
              <Progress value={analysis.completeness_score} className="h-2" />
              
              {analysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recommendations:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {analysis.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-xs mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {personalizedTSSTarget && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Personalized TSS Target</span>
                    <span className="text-lg font-bold text-blue-600">{personalizedTSSTarget}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculated from experience level and training philosophy
                  </p>
                </div>
              )}
            </div>

            {debugExpanded && (
              <DebugSection 
                title="Profile Completeness Analysis" 
                data={{
                  completeness_score: analysis.completeness_score,
                  missing_fields: analysis.missing_fields,
                  recommendations: analysis.recommendations,
                  scoring_breakdown: {
                    basic_info_possible: "40% (8 points each: age, weight, sex, experience, units)",
                    preferences_possible: "60% (goal:12, description:8, schedule:10, weekly_time:8, philosophy:12, rest_days:10)",
                    total_possible: "100%"
                  },
                  calculated_points: analysis.completeness_score
                }} 
              />
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Basic Info</TabsTrigger>
          <TabsTrigger value="preferences">Training Preferences</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profileForm.age || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
                    placeholder="Enter your age"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">
                    Weight ({currentWeightUnits === 'imperial' ? 'lbs' : 'kg'})
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={displayWeight || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      if (isNaN(value)) {
                        setDisplayWeight(undefined)
                        setProfileForm(prev => ({ ...prev, weight: undefined }))
                      } else {
                        setDisplayWeight(value)
                        // Always store weight in kg in the database
                        const weightInKg = currentWeightUnits === 'imperial' 
                          ? value / 2.20462  // lbs to kg
                          : value
                        setProfileForm(prev => ({ ...prev, weight: Math.round(weightInKg * 10) / 10 }))
                      }
                    }}
                    placeholder={
                      currentWeightUnits === 'imperial' 
                        ? "Enter weight in lbs" 
                        : "Enter weight in kg"
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sex">Sex</Label>
                  <Select value={profileForm.sex || ''} onValueChange={(value) => setProfileForm(prev => ({ ...prev, sex: value as 'M' | 'F' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="experience">Experience Level</Label>
                  <Select value={profileForm.experience_level || ''} onValueChange={(value) => setProfileForm(prev => ({ ...prev, experience_level: value as ExperienceLevel }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="elite">Elite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="units">Preferred Units</Label>
                <Select value={profileForm.preferred_units || ''} onValueChange={(value) => setProfileForm(prev => ({ ...prev, preferred_units: value as Units }))}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Select units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (km, kg)</SelectItem>
                    <SelectItem value="imperial">Imperial (miles, lbs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleUpdateProfile} 
                disabled={isUpdatingProfile}
                className="w-full"
              >
                {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
              </Button>

              {debugExpanded && profile && (
                <DebugSection 
                  title="Raw Profile Data from Database" 
                  data={{
                    profile: profile.profile,
                    form_data: profileForm,
                    display_weight: displayWeight,
                    display_units: currentWeightUnits,
                    weight_in_database_kg: profile.profile.weight,
                    last_updated: profile.profile.updated_at,
                    user_id: userId
                  }} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Training Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="goal">Primary Goal</Label>
                <Select value={preferencesForm.primary_goal || ''} onValueChange={(value) => setPreferencesForm(prev => ({ ...prev, primary_goal: value as PrimaryGoal }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_fitness">General Fitness</SelectItem>
                    <SelectItem value="weight_loss">Weight Loss</SelectItem>
                    <SelectItem value="endurance_building">Endurance Building</SelectItem>
                    <SelectItem value="speed_improvement">Speed Improvement</SelectItem>
                    <SelectItem value="race_preparation">Race Preparation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="goal-description">Goal Description</Label>
                <Input
                  id="goal-description"
                  type="text"
                  value={preferencesForm.goal_description || ''}
                  onChange={(e) => setPreferencesForm(prev => ({ ...prev, goal_description: e.target.value || undefined }))}
                  placeholder="Describe your specific training goal (e.g., 'Complete my first marathon', 'Lose 10 pounds')"
                />
              </div>

              <div>
                <Label htmlFor="philosophy">Training Philosophy</Label>
                <Select value={preferencesForm.training_philosophy || ''} onValueChange={(value) => setPreferencesForm(prev => ({ ...prev, training_philosophy: value as TrainingPhilosophy }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select training philosophy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="volume">Volume-focused</SelectItem>
                    <SelectItem value="intensity">Intensity-focused</SelectItem>
                    <SelectItem value="polarized">Polarized</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workout-duration">Preferred Workout Duration (min)</Label>
                  <Input
                    id="workout-duration"
                    type="number"
                    value={preferencesForm.preferred_workout_duration || ''}
                    onChange={(e) => setPreferencesForm(prev => ({ ...prev, preferred_workout_duration: parseInt(e.target.value) || undefined }))}
                    placeholder="60"
                  />
                </div>
                <div>
                  <Label htmlFor="weekly-time">Max Weekly Training Time (min)</Label>
                  <Input
                    id="weekly-time"
                    type="number"
                    value={preferencesForm.max_weekly_training_time || ''}
                    onChange={(e) => setPreferencesForm(prev => ({ ...prev, max_weekly_training_time: parseInt(e.target.value) || undefined }))}
                    placeholder="300"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rest-days">Mandatory Rest Days per Week</Label>
                <Input
                  id="rest-days"
                  type="number"
                  min="0"
                  max="7"
                  value={preferencesForm.mandatory_rest_days || ''}
                  onChange={(e) => setPreferencesForm(prev => ({ ...prev, mandatory_rest_days: parseInt(e.target.value) || undefined }))}
                  placeholder="1"
                />
              </div>

              <Button 
                onClick={handleUpdatePreferences} 
                disabled={isUpdatingPreferences}
                className="w-full"
              >
                {isUpdatingPreferences ? 'Updating...' : 'Update Preferences'}
              </Button>

              {debugExpanded && profile && (
                <DebugSection 
                  title="Raw Preferences Data from Database" 
                  data={{
                    preferences: profile.preferences,
                    form_data: preferencesForm,
                    last_updated: profile.preferences.updated_at,
                    intensity_distribution: {
                      easy: profile.preferences.easy_percentage,
                      moderate: profile.preferences.moderate_percentage,
                      hard: profile.preferences.hard_percentage
                    }
                  }} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Advanced Training Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Weekly TSS Target</Label>
                  <div className="text-2xl font-bold">
                    {personalizedTSSTarget || profile?.profile.weekly_tss_target || 400}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on your experience level and training philosophy
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Intensity Distribution</Label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Easy</span>
                      <span>{profile?.preferences.easy_percentage || 80}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Moderate</span>
                      <span>{profile?.preferences.moderate_percentage || 15}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Hard</span>
                      <span>{profile?.preferences.hard_percentage || 5}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">For detailed training analysis:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" asChild>
                    <a href="/dashboard/training">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Training Zones
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/dashboard/training">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Training Load Analysis
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use our existing sophisticated training analysis tools for detailed threshold calculations and zone analysis.
                </p>
              </div>

              {debugExpanded && (
                <DebugSection 
                  title="TSS Calculation Debug" 
                  data={{
                    base_tss: 400,
                    experience_level: profile?.profile.experience_level,
                    training_philosophy: profile?.preferences.training_philosophy,
                    calculated_tss: personalizedTSSTarget,
                    database_tss: profile?.profile.weekly_tss_target,
                    calculation_time: new Date().toISOString()
                  }} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 