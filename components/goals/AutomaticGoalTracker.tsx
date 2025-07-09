'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { AutomaticGoalProgress } from '@/lib/goals/automatic-progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  TrendingUp, 
  RefreshCw, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Zap,
  User
} from 'lucide-react';

interface GoalStats {
  total: number;
  autoTracked: number;
  manualTracked: number;
  autoTrackingPercentage: number;
}

interface AutoTrackedGoal {
  id: string;
  goal_type: {
    name: string;
    display_name: string;
    metric_type: string;
    calculation_method: string;
  };
  target_value?: number;
  current_progress: number;
  is_completed: boolean;
  last_progress_update?: string;
}

export function AutomaticGoalTracker() {
  const { user } = useAuth();
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [autoGoals, setAutoGoals] = useState<AutoTrackedGoal[]>([]);
  const [manualGoals, setManualGoals] = useState<AutoTrackedGoal[]>([]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGoalStats = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await AutomaticGoalProgress.getQuantifiableGoals(user.id);
      
      setStats(result.stats);
      setAutoGoals(result.quantifiable);
      setManualGoals(result.manual);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goal stats');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadGoalStats();
    }
  }, [user, loadGoalStats]);

  const handleRecalculateProgress = async () => {
    if (!user) return;
    
    try {
      setIsRecalculating(true);
      setError(null);
      
      await AutomaticGoalProgress.recalculateAllProgress(user.id);
      
      // Reload stats after recalculation
      await loadGoalStats();
      
      alert('✅ Goal progress recalculated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate progress');
    } finally {
      setIsRecalculating(false);
    }
  };

  const formatLastUpdate = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Recently';
    }
  };

  const getProgressPercentage = (goal: AutoTrackedGoal) => {
    if (!goal.target_value) return 0;
    return Math.min(100, Math.round((goal.current_progress / goal.target_value) * 100));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading goal tracking info...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Automatic Goal Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {stats && (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.autoTracked}</div>
                <div className="text-sm text-muted-foreground">Auto-Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.manualTracked}</div>
                <div className="text-sm text-muted-foreground">Manual</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.autoTrackingPercentage}%</div>
                <div className="text-sm text-muted-foreground">Automated</div>
              </div>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t">
            <Button 
              onClick={handleRecalculateProgress}
              disabled={isRecalculating}
              className="w-full sm:w-auto"
            >
              {isRecalculating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Recalculating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recalculate All Progress
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This will rebuild progress from all your activities. Use if goal progress seems incorrect.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Tracked Goals */}
      {autoGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Automatically Tracked Goals ({autoGoals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              These goals update automatically based on your Strava activities:
            </p>
            <div className="space-y-4">
              {autoGoals.map((goal) => (
                <div key={goal.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{goal.goal_type.display_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {goal.goal_type.calculation_method}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {goal.is_completed ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          In Progress
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>
                        {goal.current_progress.toFixed(1)} / {goal.target_value?.toFixed(1) || '∞'}
                      </span>
                    </div>
                    <Progress value={getProgressPercentage(goal)} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Updated: {formatLastUpdate(goal.last_progress_update)}
                      </span>
                      <span>{getProgressPercentage(goal)}% complete</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Goals */}
      {manualGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              Manual Goals ({manualGoals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              These goals require manual updates or special data not available from basic activity metrics:
            </p>
            <div className="space-y-4">
              {manualGoals.map((goal) => (
                <div key={goal.id} className="border rounded-lg p-4 bg-orange-50/50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{goal.goal_type.display_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {goal.goal_type.calculation_method}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-orange-200 text-orange-800">
                      Manual
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    This goal type requires:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                    {goal.goal_type.metric_type.includes('zone') && (
                      <li>Heart rate zone data from compatible devices</li>
                    )}
                    {goal.goal_type.metric_type.includes('race') && (
                      <li>Manual entry of race results</li>
                    )}
                    {goal.goal_type.metric_type.includes('weight') && (
                      <li>Manual weight tracking</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <strong>Automatic Tracking:</strong> Distance, pace, frequency, and time-based goals 
                are calculated automatically from your Strava activities as they sync.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <strong>Real-time Updates:</strong> Every time you complete a run, your progress 
                updates immediately without any manual input.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <strong>Smart Calculation:</strong> Weekly goals reset each week, monthly goals 
                reset each month, and personal records track your best performances.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 