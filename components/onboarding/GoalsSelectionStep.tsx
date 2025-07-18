'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  Calendar,
  Activity,
  Clock,
  MapPin,
  Trophy,
  Award,
  CheckCircle,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { UserGoal } from '@/types/goals';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import { convertDistance, convertPace } from '@/lib/utils';
import { SmartGoalCard } from '@/components/goals/SmartGoalCard';

interface GoalsSelectionStepProps {
  onGoalsSelected: (goals: UserGoal[]) => void;
  selectedGoals: UserGoal[];
}

interface GoalSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'distance' | 'frequency' | 'duration' | 'intensity';
  target: number;
  unit: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  difficulty: 'conservative' | 'moderate' | 'ambitious';
  successProbability: number;
  benefits: string[];
  strategies: string[];
  warnings?: string[];
}

const defaultSuggestions: GoalSuggestion[] = [
  {
    id: 'weekly-distance',
    title: 'Build Weekly Distance',
    description: 'Gradually increase your weekly running distance',
    type: 'distance',
    target: 25,
    unit: 'km',
    icon: <MapPin className="h-5 w-5" />,
    priority: 'high',
    reasoning: 'Start with a conservative weekly distance goal',
    difficulty: 'conservative',
    successProbability: 85,
    benefits: [
      'Builds endurance gradually',
      'Reduces injury risk',
      'Establishes consistent training habits'
    ],
    strategies: [
      'Increase distance by 10% each week',
      'Include rest days between runs',
      'Listen to your body and adjust as needed'
    ]
  },
  {
    id: 'weekly-frequency',
    title: 'Establish Training Frequency',
    description: 'Run consistently throughout the week',
    type: 'frequency',
    target: 3,
    unit: 'runs/week',
    icon: <Calendar className="h-5 w-5" />,
    priority: 'high',
    reasoning: 'Consistency is key to long-term progress',
    difficulty: 'moderate',
    successProbability: 80,
    benefits: [
      'Builds training consistency',
      'Improves fitness gradually',
      'Creates sustainable habits'
    ],
    strategies: [
      'Schedule runs on specific days',
      'Start with shorter, easier runs',
      'Gradually increase frequency'
    ]
  },
  {
    id: 'pace-improvement',
    title: 'Improve Running Pace',
    description: 'Work on speed and efficiency',
    type: 'intensity',
    target: 300,
    unit: 'seconds/km',
    icon: <TrendingUp className="h-5 w-5" />,
    priority: 'medium',
    reasoning: 'Focus on form and efficiency before speed',
    difficulty: 'ambitious',
    successProbability: 70,
    benefits: [
      'Improves running economy',
      'Builds speed endurance',
      'Enhances overall fitness'
    ],
    strategies: [
      'Include interval training once per week',
      'Focus on good running form',
      'Gradually increase intensity'
    ],
    warnings: [
      'Don&apos;t increase intensity too quickly',
      'Listen to your body and rest when needed'
    ]
  },
  {
    id: 'long-run',
    title: 'Complete a Long Run',
    description: 'Build endurance with weekly long runs',
    type: 'duration',
    target: 60,
    unit: 'minutes',
    icon: <Clock className="h-5 w-5" />,
    priority: 'medium',
    reasoning: 'Long runs build aerobic endurance',
    difficulty: 'moderate',
    successProbability: 75,
    benefits: [
      'Builds aerobic endurance',
      'Improves fat burning',
      'Prepares for longer races'
    ],
    strategies: [
      'Start with 30-minute runs',
      'Increase duration by 10% weekly',
      'Keep long runs at easy pace'
    ]
  }
];

export function GoalsSelectionStep({ onGoalsSelected, selectedGoals }: GoalsSelectionStepProps) {
  const { preferences } = useUnitPreferences();
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>(defaultSuggestions);
  const [selectedSuggestions, setSelectedSuggestions] = useState<GoalSuggestion[]>([]);

  // Convert suggestions to user's preferred units
  useEffect(() => {
    const convertedSuggestions = defaultSuggestions.map(suggestion => {
      if (suggestion.unit === 'km' && preferences.distance === 'miles') {
        const miles = convertDistance(suggestion.target * 1000, 'miles');
        return {
          ...suggestion,
          target: Math.round(miles * 10) / 10,
          unit: 'mi',
          reasoning: suggestion.reasoning.replace('km', 'mi')
        };
      }
      if (suggestion.unit === 'seconds/km' && preferences.pace === 'min/mile') {
        const pacePerMile = convertPace(suggestion.target, 'min/mile');
        return {
          ...suggestion,
          target: Math.round(pacePerMile),
          unit: 'seconds/mi',
          reasoning: suggestion.reasoning.replace('/km', '/mi')
        };
      }
      return suggestion;
    });
    setSuggestions(convertedSuggestions);
  }, [preferences]);

  const handleSuggestionSelect = (suggestion: GoalSuggestion) => {
    const isSelected = selectedSuggestions.some(s => s.id === suggestion.id);
    if (isSelected) {
      setSelectedSuggestions(selectedSuggestions.filter(s => s.id !== suggestion.id));
    } else {
      setSelectedSuggestions([...selectedSuggestions, suggestion]);
    }
  };

  const handleContinue = () => {
    // Convert suggestions to UserGoal format
    const goals: UserGoal[] = selectedSuggestions.map(suggestion => ({
      id: suggestion.id,
      user_id: '', // Will be set when creating
      goal_type_id: suggestion.id, // Use suggestion id as goal type id
      target_value: suggestion.target,
      target_unit: suggestion.unit,
      time_period: 'weekly' as const,
      current_progress: 0,
      streak_count: 0,
      is_active: true,
      is_completed: false,
      priority: suggestion.priority === 'high' ? 1 : suggestion.priority === 'medium' ? 2 : 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      goal_data: {
        notes: suggestion.reasoning,
        show_on_dashboard: true,
        dashboard_priority: 1,
        creation_context: 'onboarding' as const,
        is_onboarding_goal: true,
        from_suggestion: true,
        suggestion_id: suggestion.id,
        suggestion_title: suggestion.title,
        suggestion_reasoning: suggestion.reasoning,
        difficulty_level: suggestion.difficulty === 'conservative' ? 'beginner' as const : 
                         suggestion.difficulty === 'moderate' ? 'intermediate' as const : 
                         'advanced' as const,
        success_probability: suggestion.successProbability,
        warnings: suggestion.warnings
      }
    }));
    
    onGoalsSelected(goals);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'conservative': return '🛡️';
      case 'moderate': return '🎯';
      case 'ambitious': return '⚡';
      default: return '📈';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Training Goals</h2>
        <p className="text-muted-foreground">
          Select 2-3 goals to focus on. We&apos;ll help you track progress and stay motivated.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((suggestion) => {
          const isSelected = selectedSuggestions.some(s => s.id === suggestion.id);
          return (
            <Card 
              key={suggestion.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getDifficultyIcon(suggestion.difficulty)}</span>
                    <Badge className={`${getPriorityColor(suggestion.priority)} border text-xs`}>
                      {suggestion.priority}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                    <div className="text-lg font-semibold text-green-600">
                      {suggestion.successProbability}%
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 mb-3">
                  <div className="mt-1">
                    {suggestion.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{suggestion.title}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{suggestion.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-blue-500" />
                        <span>{suggestion.target} {suggestion.unit}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-purple-500" />
                        <span>{suggestion.difficulty}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-3 italic">
                  {suggestion.reasoning}
                </p>

                {isSelected && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {selectedSuggestions.length} of 3 goals selected
        </div>
        <Button 
          onClick={handleContinue}
          disabled={selectedSuggestions.length === 0}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Continue with Selected Goals
        </Button>
      </div>
    </div>
  );
} 