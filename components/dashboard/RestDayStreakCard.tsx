'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Flame, Calendar, Settings, Coffee, AlertTriangle, CheckCircle } from 'lucide-react'
import { useRestDayStreak } from '@/hooks/useRestDayStreak'

interface RestDayStreakCardProps {
  userId: string
  className?: string
}

export function RestDayStreakCard({ userId, className = '' }: RestDayStreakCardProps) {
  const { 
    streakData, 
    preferences, 
    updatePreferences, 
    useRestDay, 
    isLoading, 
    error 
  } = useRestDayStreak(userId)

  const [showRestDayDialog, setShowRestDayDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)

  const getStreakIcon = () => {
    switch (streakData.streakType) {
      case 'active':
        return <Flame className="h-5 w-5 text-orange-500" />
      case 'rest_day':
        return <Coffee className="h-5 w-5 text-blue-500" />
      default:
        return <Flame className="h-5 w-5 text-gray-400" />
    }
  }

  const getStreakColor = () => {
    switch (streakData.streakType) {
      case 'active':
        return 'text-orange-600'
      case 'rest_day':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStreakBadge = () => {
    switch (streakData.streakType) {
      case 'active':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Active</Badge>
      case 'rest_day':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Rest Day</Badge>
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Broken</Badge>
    }
  }

  const handleUseRestDay = () => {
    if (useRestDay()) {
      setShowRestDayDialog(false)
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Training Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Training Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">
            Error loading streak data
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              {getStreakIcon()}
              Training Streak
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsDialog(true)}
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Streak Display */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              {getStreakIcon()}
              <span className={`text-3xl font-bold ${getStreakColor()}`}>
                {streakData.current}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Day{streakData.current !== 1 ? 's' : ''} Training Streak
            </div>
            <div className="flex items-center justify-center gap-2">
              {getStreakBadge()}
              {streakData.restDaysRemaining > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {streakData.restDaysRemaining} rest day{streakData.restDaysRemaining !== 1 ? 's' : ''} left
                </Badge>
              )}
            </div>
          </div>

          {/* Rest Day Usage */}
          {streakData.streakType === 'broken' && streakData.canUseRestDay && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Coffee className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Rest Day Available</span>
              </div>
              <div className="text-sm text-blue-700 mb-3">
                Use a rest day to maintain your streak? Rest days are healthy and count toward your streak.
              </div>
              <Button 
                size="sm" 
                onClick={() => setShowRestDayDialog(true)}
                className="w-full"
              >
                Use Rest Day
              </Button>
            </div>
          )}

          {/* Additional Stats */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-700">{streakData.longest}</div>
              <div className="text-xs text-gray-600">Longest Streak</div>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-700">{streakData.consistency}%</div>
              <div className="text-xs text-gray-600">Consistency</div>
            </div>
          </div>

          {/* Next Rest Day Info */}
          {streakData.nextRestDayAvailable && (
            <div className="text-xs text-gray-500 text-center">
              <Calendar className="h-3 w-3 inline mr-1" />
              Rest days reset {streakData.nextRestDayAvailable.toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rest Day Confirmation Dialog */}
      <Dialog open={showRestDayDialog} onOpenChange={setShowRestDayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-blue-500" />
              Use Rest Day?
            </DialogTitle>
            <DialogDescription>
              Rest days are an important part of training. Using a rest day will maintain your streak while promoting recovery.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">Rest days count toward your streak</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">Recovery is essential for progress</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestDayDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUseRestDay}>
              Use Rest Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Rest Day Settings
            </DialogTitle>
            <DialogDescription>
              Configure how rest days work with your training streak.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restDayCredits">Rest Days Per Week</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="restDayCredits"
                  value={[preferences.restDayCredits]}
                  onValueChange={(values: number[]) => updatePreferences({ restDayCredits: values[0] })}
                  max={3}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-8">{preferences.restDayCredits}</span>
              </div>
              <p className="text-xs text-gray-500">
                Number of rest days allowed per week to maintain streak
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="autoUseRestDays">Auto-use Rest Days</Label>
                <p className="text-xs text-gray-500">
                  Automatically use rest days when streak would break
                </p>
              </div>
              <Switch
                id="autoUseRestDays"
                checked={preferences.autoUseRestDays}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePreferences({ autoUseRestDays: e.target.checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showRestDayPrompts">Show Rest Day Prompts</Label>
                <p className="text-xs text-gray-500">
                  Ask before using rest days
                </p>
              </div>
              <Switch
                id="showRestDayPrompts"
                checked={preferences.showRestDayPrompts}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePreferences({ showRestDayPrompts: e.target.checked })}
              />
            </div>

            <div className="pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => updatePreferences({ restDaysUsed: 0 })}
                className="w-full"
              >
                Reset Rest Days Used This Week
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 