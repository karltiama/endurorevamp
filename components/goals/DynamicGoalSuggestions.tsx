'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUserActivities } from '@/hooks/use-user-activities'
import { useUserGoals } from '@/hooks/useGoals'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatDistance, formatPace } from '@/lib/utils'
import { DynamicGoalEngine, DynamicGoalSuggestion, UserPerformanceProfile } from '@/lib/goals/dynamic-suggestions'
import { 
  TrendingUp, 
  Target, 
  Award,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Sparkles
} from 'lucide-react'

interface DynamicGoalSuggestionsProps {
  userId: string
  onCreateGoal?: (suggestion: DynamicGoalSuggestion) => void
}

export function DynamicGoalSuggestions({ userId, onCreateGoal }: DynamicGoalSuggestionsProps) {
  const { data: activities = [] } = useUserActivities(userId)
  const { data: goalsData } = useUserGoals()
  const { preferences } = useUnitPreferences()
  const activeGoals = goalsData?.goals || []
  
  const [profile, setProfile] = useState<UserPerformanceProfile | null>(null)
  const [suggestions, setSuggestions] = useState<DynamicGoalSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<DynamicGoalSuggestion | null>(null)

  const analyzePerformance = useCallback(async () => {
    setIsAnalyzing(true)
    
    try {
      // Convert database activities to the format expected by DynamicGoalEngine
      const formattedActivities = activities.map(activity => ({
        ...activity,
        start_date: activity.start_date_local,
        sport_type: activity.sport_type || activity.activity_type || 'Run'
      }))

      const userProfile = DynamicGoalEngine.analyzeUserPerformance(formattedActivities, activeGoals)
      const goalSuggestions = DynamicGoalEngine.generateDynamicSuggestions(userProfile, activeGoals, [])
      
      setProfile(userProfile)
      setSuggestions(goalSuggestions)
    } catch (error) {
      console.error('Error analyzing performance:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [activities, activeGoals])

  useEffect(() => {
    if (activities.length > 0) {
      analyzePerformance()
    }
  }, [activities, activeGoals, analyzePerformance])

  if (isAnalyzing) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600">Analyzing your performance patterns...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Smart Goal Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Keep logging activities to get personalized goal suggestions!
            </p>
            <Button onClick={analyzePerformance} variant="outline">
              Analyze My Performance
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Your Performance Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {formatDistance(profile.weeklyDistance * 1000, preferences.distance)}
              </div>
              <div className="text-sm text-gray-600">Weekly Distance</div>
              <Badge variant="outline" className="mt-1">
                {profile.distanceTrend === 'improving' ? '📈' : 
                 profile.distanceTrend === 'declining' ? '📉' : '➡️'} 
                {profile.distanceTrend}
              </Badge>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {formatPace(profile.averagePace, preferences.pace)}
              </div>
              <div className="text-sm text-gray-600">Avg Pace</div>
              <Badge variant="outline" className="mt-1">
                {profile.paceTrend === 'improving' ? '📈' : 
                 profile.paceTrend === 'declining' ? '📉' : '➡️'} 
                {profile.paceTrend}
              </Badge>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {profile.runFrequency.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Runs/Week</div>
              <Badge variant="outline" className="mt-1">
                {profile.frequencyTrend === 'improving' ? '📈' : 
                 profile.frequencyTrend === 'declining' ? '📉' : '➡️'} 
                {profile.frequencyTrend}
              </Badge>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {profile.consistencyScore}%
              </div>
              <div className="text-sm text-gray-600">Consistency</div>
              <Badge variant={profile.consistencyScore > 70 ? 'default' : 'secondary'} className="mt-1">
                {profile.runningExperience}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goal Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Personalized Goal Suggestions
          </CardTitle>
          <p className="text-sm text-gray-600">
            Based on your performance trends and activity patterns
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Suggestions</TabsTrigger>
              <TabsTrigger value="high">High Priority</TabsTrigger>
              <TabsTrigger value="improvement">Improvement</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {suggestions.map((suggestion) => (
                <SuggestionCard 
                  key={suggestion.id}
                  suggestion={suggestion}
                  onSelect={setSelectedSuggestion}
                  onCreateGoal={onCreateGoal}
                />
              ))}
            </TabsContent>
            
            <TabsContent value="high" className="space-y-4">
              {suggestions
                .filter(s => s.priority === 'high')
                .map((suggestion) => (
                  <SuggestionCard 
                    key={suggestion.id}
                    suggestion={suggestion}
                    onSelect={setSelectedSuggestion}
                    onCreateGoal={onCreateGoal}
                  />
                ))}
            </TabsContent>
            
            <TabsContent value="improvement" className="space-y-4">
              {suggestions
                .filter(s => s.category === 'pace' || s.category === 'distance')
                .map((suggestion) => (
                  <SuggestionCard 
                    key={suggestion.id}
                    suggestion={suggestion}
                    onSelect={setSelectedSuggestion}
                    onCreateGoal={onCreateGoal}
                  />
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detailed View Modal */}
      {selectedSuggestion && (
        <SuggestionDetailModal 
          suggestion={selectedSuggestion}
          onClose={() => setSelectedSuggestion(null)}
          onCreateGoal={onCreateGoal}
        />
      )}
    </div>
  )
}

function SuggestionCard({ 
  suggestion, 
  onSelect, 
  onCreateGoal 
}: {
  suggestion: DynamicGoalSuggestion
  onSelect: (suggestion: DynamicGoalSuggestion) => void
  onCreateGoal?: (suggestion: DynamicGoalSuggestion) => void
}) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'low': return 'border-green-200 bg-green-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${getPriorityColor(suggestion.priority)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{suggestion.title}</h3>
            <span className="text-lg">{getDifficultyIcon(suggestion.difficulty)}</span>
          </div>
          <p className="text-gray-600 text-sm mb-2">{suggestion.description}</p>
          <p className="text-xs text-gray-500 italic">{suggestion.reasoning}</p>
        </div>
        
        <div className="text-right space-y-1">
          <Badge className={`${getPriorityColor(suggestion.priority)} border`}>
            {suggestion.priority} priority
          </Badge>
          <div className="text-xs text-gray-500">{suggestion.timeframe}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4 text-blue-500" />
            <span>{suggestion.suggestedTarget} {suggestion.targetUnit}</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4 text-purple-500" />
            <span>{suggestion.successProbability}% success rate</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onSelect(suggestion)}>
            View Details
          </Button>
          {onCreateGoal && (
            <Button size="sm" onClick={() => onCreateGoal(suggestion)}>
              Create Goal
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function SuggestionDetailModal({ 
  suggestion, 
  onClose, 
  onCreateGoal 
}: {
  suggestion: DynamicGoalSuggestion
  onClose: () => void
  onCreateGoal?: (suggestion: DynamicGoalSuggestion) => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{getDifficultyIcon(suggestion.difficulty)}</span>
                {suggestion.title}
              </CardTitle>
              <p className="text-gray-600 mt-1">{suggestion.description}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm text-blue-600">Target</div>
              <div className="text-lg font-bold text-blue-900">
                {suggestion.suggestedTarget} {suggestion.targetUnit}
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-sm text-green-600">Success Rate</div>
              <div className="text-lg font-bold text-green-900">
                {suggestion.successProbability}%
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Why This Goal?
            </h4>
            <p className="text-gray-700">{suggestion.reasoning}</p>
          </div>

          {/* Benefits */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Benefits
            </h4>
            <ul className="space-y-1">
              {suggestion.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Strategies */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Strategies
            </h4>
            <ul className="space-y-1">
              {suggestion.strategies.map((strategy, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-gray-700">{strategy}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Warnings */}
          {suggestion.warnings && suggestion.warnings.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Important Notes
              </h4>
              <ul className="space-y-1">
                {suggestion.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-500 mt-1">•</span>
                    <span className="text-gray-700">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            {onCreateGoal && (
              <Button onClick={() => onCreateGoal(suggestion)} className="flex-1">
                Create This Goal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getDifficultyIcon(difficulty: string) {
  switch (difficulty) {
    case 'conservative': return '🛡️'
    case 'moderate': return '🎯'
    case 'ambitious': return '⚡'
    default: return '📈'
  }
} 