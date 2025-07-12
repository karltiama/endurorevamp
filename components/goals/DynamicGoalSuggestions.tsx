'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddGoalModal } from '@/components/goals/AddGoalModal'
import { useUserActivities } from '@/hooks/use-user-activities'
import { useUserGoals } from '@/hooks/useGoals'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatDistance, formatPace, convertDistance, convertPace } from '@/lib/utils'
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
  const activeGoals = useMemo(() => goalsData?.goals || [], [goalsData?.goals])
  
  const [profile, setProfile] = useState<UserPerformanceProfile | null>(null)
  const [suggestions, setSuggestions] = useState<DynamicGoalSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<DynamicGoalSuggestion | null>(null)
  const [suggestionToCreate, setSuggestionToCreate] = useState<DynamicGoalSuggestion | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

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
      const goalSuggestions = DynamicGoalEngine.generateDynamicSuggestions(userProfile, activeGoals)
      
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

  const handleCreateGoalFromSuggestion = (suggestion: DynamicGoalSuggestion) => {
    setSuggestionToCreate(suggestion)
    setShowAddModal(true)
  }

  const handleCloseAddModal = () => {
    setShowAddModal(false)
    setSuggestionToCreate(null)
  }

  if (isAnalyzing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
            <span className="text-sm text-gray-600">Analyzing your performance...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile || suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Suggestions Yet</h3>
          <p className="text-gray-600">
            Complete more activities to unlock personalized goal recommendations.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
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
                  onCreateGoal={handleCreateGoalFromSuggestion}
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
                    onCreateGoal={handleCreateGoalFromSuggestion}
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
                    onCreateGoal={handleCreateGoalFromSuggestion}
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
          onCreateGoal={handleCreateGoalFromSuggestion}
        />
      )}

      {/* Enhanced Add Goal Modal */}
      <AddGoalModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        suggestion={suggestionToCreate || undefined}
        title={suggestionToCreate ? `Create Goal: ${suggestionToCreate.title}` : "Add New Goal"}
        description={suggestionToCreate ? "Review and customize your AI-suggested goal" : "Choose a goal type and set your target"}
      />
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
  const { preferences } = useUnitPreferences();
  
  // Format description with proper units
  const formatDescriptionWithUnits = (description: string): string => {
    if (preferences.distance === 'miles') {
      // Replace km with mi in descriptions
      return description
        .replace(/(\d+(?:\.\d+)?)\s*km/g, (match, value) => {
          const km = parseFloat(value);
          const miles = convertDistance(km * 1000, 'miles');
          return `${miles.toFixed(1)} mi`;
        })
        .replace(/\/km/g, '/mi');
    }
    return description;
  };

  // Format target with proper units
  const formatTargetWithUnits = (target: number, unit: string): string => {
    if (unit === 'km' && preferences.distance === 'miles') {
      // Convert km to miles
      const miles = convertDistance(target * 1000, 'miles');
      return `${miles.toFixed(1)} mi`;
    } else if (unit === 'min/km' && preferences.pace === 'min/mile') {
      // Convert pace from min/km to min/mile
      const pacePerMile = convertPace(target, 'min/mile');
      const minutes = Math.floor(pacePerMile / 60);
      const seconds = Math.floor(pacePerMile % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`;
    } else if (unit === 'min/km') {
      // Keep as min/km but format properly
      const minutes = Math.floor(target / 60);
      const seconds = Math.floor(target % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
    } else {
      // For other units, just append the unit
      return `${target}${unit}`;
    }
  };

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
          <p className="text-gray-600 text-sm mb-2">{formatDescriptionWithUnits(suggestion.description)}</p>
          <p className="text-xs text-gray-500 italic">{suggestion.reasoning}</p>
        </div>
        
        <div className="text-right space-y-1">
          <Badge className={`${getPriorityColor(suggestion.priority)} border text-xs px-2 py-1`}>
            {suggestion.priority}
          </Badge>
          <div className="text-xs text-gray-500">{suggestion.timeframe}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4 text-blue-500" />
            <span>{formatTargetWithUnits(suggestion.suggestedTarget, suggestion.targetUnit)}</span>
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
            <Button 
              size="sm" 
              onClick={() => onCreateGoal(suggestion)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="h-4 w-4 mr-1" />
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
  const { preferences } = useUnitPreferences();
  
  // Format description with proper units
  const formatDescriptionWithUnits = (description: string): string => {
    if (preferences.distance === 'miles') {
      // Replace km with mi in descriptions
      return description
        .replace(/(\d+(?:\.\d+)?)\s*km/g, (match, value) => {
          const km = parseFloat(value);
          const miles = convertDistance(km * 1000, 'miles');
          return `${miles.toFixed(1)} mi`;
        })
        .replace(/\/km/g, '/mi');
    }
    return description;
  };

  // Format target with proper units
  const formatTargetWithUnits = (target: number, unit: string): string => {
    if (unit === 'km' && preferences.distance === 'miles') {
      // Convert km to miles
      const miles = convertDistance(target * 1000, 'miles');
      return `${miles.toFixed(1)} mi`;
    } else if (unit === 'min/km' && preferences.pace === 'min/mile') {
      // Convert pace from min/km to min/mile
      const pacePerMile = convertPace(target, 'min/mile');
      const minutes = Math.floor(pacePerMile / 60);
      const seconds = Math.floor(pacePerMile % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`;
    } else if (unit === 'min/km') {
      // Keep as min/km but format properly
      const minutes = Math.floor(target / 60);
      const seconds = Math.floor(target % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
    } else {
      // For other units, just append the unit
      return `${target}${unit}`;
    }
  };
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
              <p className="text-gray-600 mt-1">{formatDescriptionWithUnits(suggestion.description)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Goal Details */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-blue-500" />
              <span>{formatTargetWithUnits(suggestion.suggestedTarget, suggestion.targetUnit)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-purple-500" />
              <span>{suggestion.successProbability}% success rate</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span>{suggestion.difficulty} difficulty</span>
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Why This Goal?
            </h4>
            <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
              {suggestion.reasoning}
            </p>
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
              <Button 
                onClick={() => onCreateGoal(suggestion)} 
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
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