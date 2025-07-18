'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Target, TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { DynamicGoalSuggestion } from '@/lib/goals/dynamic-suggestions';
import { useUnitPreferences } from '@/hooks/useUnitPreferences';
import { convertDistance, convertPace } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SmartGoalCardProps {
  suggestion: DynamicGoalSuggestion;
  onSelect: (suggestion: DynamicGoalSuggestion) => void;
  isSelected?: boolean;
  showFullDetails?: boolean;
}

// Shared helper functions
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function SmartGoalCard({ 
  suggestion, 
  onSelect, 
  isSelected = false, 
  showFullDetails = false 
}: SmartGoalCardProps) {
  const { preferences } = useUnitPreferences();
  
  // Format target with proper units based on user preferences
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
  
  const getSuccessColor = (probability: number) => {
    if (probability >= 85) return 'text-green-600';
    if (probability >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCommitmentIcon = (commitment: string) => {
    switch (commitment) {
      case 'high':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Clock className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
        isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:ring-2 hover:ring-primary/50",
        suggestion.priority === 'high' ? "border-l-4 border-l-red-500" : 
        suggestion.priority === 'medium' ? "border-l-4 border-l-yellow-500" : 
        "border-l-4 border-l-green-500"
      )}
      onClick={() => onSelect(suggestion)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <div>
              <CardTitle className="text-lg font-semibold">{suggestion.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDescriptionWithUnits(suggestion.description)}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={cn(getPriorityColor(suggestion.priority), "text-xs px-2 py-1")}>
              {suggestion.priority}
            </Badge>
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {suggestion.category}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Success Probability */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Success Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={suggestion.successProbability} className="w-16 h-2" />
            <span className={cn("text-sm font-bold", getSuccessColor(suggestion.successProbability))}>
              {suggestion.successProbability}%
            </span>
          </div>
        </div>

        {/* Target & Commitment */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-sm font-semibold">
                {formatTargetWithUnits(suggestion.suggestedTarget, suggestion.targetUnit)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getCommitmentIcon(suggestion.requiredCommitment)}
            <div>
              <p className="text-xs text-muted-foreground">Commitment</p>
              <p className="text-sm font-semibold capitalize">
                {suggestion.requiredCommitment}
              </p>
            </div>
          </div>
        </div>

        {/* Reasoning */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-900 leading-relaxed">
            <strong>Why this works:</strong> {suggestion.reasoning}
          </p>
        </div>

        {/* Strategies Preview */}
        {suggestion.strategies && suggestion.strategies.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Strategies:</h4>
            <div className="space-y-1">
              {suggestion.strategies.slice(0, showFullDetails ? undefined : 2).map((strategy, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-600">{strategy}</span>
                </div>
              ))}
              {!showFullDetails && suggestion.strategies.length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{suggestion.strategies.length - 2} more strategies
                </p>
              )}
            </div>
          </div>
        )}

        {/* Warnings */}
        {suggestion.warnings && suggestion.warnings.length > 0 && (
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">Keep in mind:</p>
                <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                  {suggestion.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Timeframe */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Duration: {suggestion.timeframe}</span>
          <span className="capitalize">{suggestion.difficulty} difficulty</span>
        </div>

        {/* Action Button */}
        <Button 
          className="w-full" 
          variant={isSelected ? "default" : "outline"}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(suggestion);
          }}
        >
          {isSelected ? "Selected" : "Choose This Goal"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* Compact version for lists */
export function SmartGoalCardCompact({ 
  suggestion, 
  onSelect, 
  isSelected = false 
}: SmartGoalCardProps) {
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

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:ring-2 hover:ring-primary/50"
      )}
      onClick={() => onSelect(suggestion)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <div>
              <h3 className="font-semibold text-sm">{suggestion.title}</h3>
              <p className="text-xs text-muted-foreground">{formatDescriptionWithUnits(suggestion.description)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-bold", getSuccessColor(suggestion.successProbability))}>
              {suggestion.successProbability}%
            </span>
            <Badge variant="outline" className={cn(getPriorityColor(suggestion.priority), "text-xs px-2 py-1")}>
              {suggestion.priority}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* Loading skeleton */
export function SmartGoalCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-48 bg-gray-200 rounded animate-pulse mt-2"></div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </CardContent>
    </Card>
  );
}

/* Helper function for getting success color */
function getSuccessColor(probability: number): string {
  if (probability >= 85) return 'text-green-600';
  if (probability >= 70) return 'text-yellow-600';
  return 'text-red-600';
} 