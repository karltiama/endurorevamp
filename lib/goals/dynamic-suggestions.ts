import { UserGoal, GoalType } from '@/types/goals'
import { Activity } from '@/lib/strava/types'

export interface UserPerformanceProfile {
  // Current performance metrics
  weeklyDistance: number
  monthlyDistance: number
  averagePace: number // seconds per km
  runFrequency: number // runs per week
  longestRun: number
  averageHeartRate: number
  
  // Trends and patterns
  distanceTrend: 'improving' | 'stable' | 'declining'
  paceTrend: 'improving' | 'stable' | 'declining'
  frequencyTrend: 'improving' | 'stable' | 'declining'
  
  // Activity preferences
  preferredSportTypes: string[]
  preferredDays: number[] // 0-6, Sunday=0
  averageActivityDuration: number // minutes
  
  // Goal achievement patterns
  goalCompletionRate: number // percentage
  consistencyScore: number // 0-100
  
  // Running experience
  totalActivities: number
  runningExperience: 'beginner' | 'intermediate' | 'advanced'
  hasRecentInjuries: boolean
}

export interface DynamicGoalSuggestion {
  id: string
  title: string
  description: string
  reasoning: string
  priority: 'high' | 'medium' | 'low'
  category: 'distance' | 'pace' | 'frequency' | 'duration' | 'challenge'
  
  // Goal details
  goalType: GoalType
  suggestedTarget: number
  targetUnit: string
  timeframe: string
  difficulty: 'conservative' | 'moderate' | 'ambitious'
  
  // Motivation and guidance
  benefits: string[]
  strategies: string[]
  warnings?: string[]
  
  // Success prediction
  successProbability: number
  requiredCommitment: 'low' | 'medium' | 'high'
  
  // Dependencies
  prereqGoals?: string[]
  conflictsWith?: string[]
}

export class DynamicGoalEngine {
  
  static analyzeUserPerformance(
    activities: Activity[], 
    existingGoals: UserGoal[]
  ): UserPerformanceProfile {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    
    // Recent activities (last 30 days)
    const recentActivities = activities.filter(a => 
      new Date(a.start_date) >= thirtyDaysAgo
    )
    
    // Historical activities (30-90 days ago for trend analysis)
    const historicalActivities = activities.filter(a => {
      const date = new Date(a.start_date)
      return date >= ninetyDaysAgo && date < thirtyDaysAgo
    })
    
    // Calculate current metrics
    const weeklyDistance = recentActivities.length > 0 
      ? (recentActivities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000) / 4.3 // Convert to km/week
      : 0
    
    const monthlyDistance = recentActivities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000
    
    const runActivities = recentActivities.filter(a => 
      a.sport_type?.toLowerCase().includes('run')
    )
    
    const averagePace = runActivities.length > 0
      ? runActivities.reduce((sum, a) => 
          sum + ((a.moving_time || 0) / ((a.distance || 1) / 1000)), 0
        ) / runActivities.length
      : 0
    
    const runFrequency = recentActivities.length / 4.3 // runs per week
    
    const longestRun = Math.max(...runActivities.map(a => (a.distance || 0) / 1000), 0)
    
    const averageHeartRate = recentActivities
      .filter(a => a.average_heartrate)
      .reduce((sum, a, _, arr) => sum + (a.average_heartrate || 0) / arr.length, 0)
    
    // Calculate trends
    const distanceTrend = this.calculateTrend(
      historicalActivities.reduce((sum, a) => sum + (a.distance || 0), 0),
      recentActivities.reduce((sum, a) => sum + (a.distance || 0), 0)
    )
    
    const historicalPace = this.calculateAveragePace(historicalActivities)
    const recentPace = this.calculateAveragePace(recentActivities)
    const paceTrend = this.calculateTrend(historicalPace, recentPace, true) // reverse for pace
    
    const frequencyTrend = this.calculateTrend(
      historicalActivities.length,
      recentActivities.length
    )
    
    // Activity preferences
    const sportTypeCounts = recentActivities.reduce((acc, a) => {
      const sport = a.sport_type || 'Unknown'
      acc[sport] = (acc[sport] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const preferredSportTypes = Object.entries(sportTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([sport]) => sport)
    
    const dayOfWeekCounts = recentActivities.reduce((acc, a) => {
      const day = new Date(a.start_date).getDay()
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    const preferredDays = Object.entries(dayOfWeekCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => parseInt(day))
    
    const averageActivityDuration = recentActivities.length > 0
      ? recentActivities.reduce((sum, a) => sum + (a.moving_time || 0), 0) / recentActivities.length / 60
      : 0
    
    // Goal achievement analysis
    const completedGoals = existingGoals.filter(g => g.is_completed).length
    const goalCompletionRate = existingGoals.length > 0 
      ? (completedGoals / existingGoals.length) * 100 
      : 50 // Default for new users
    
    const consistencyScore = this.calculateConsistencyScore(recentActivities)
    
    // Experience level
    const totalActivities = activities.length
    const runningExperience = this.determineExperienceLevel(totalActivities, weeklyDistance)
    
    return {
      weeklyDistance,
      monthlyDistance,
      averagePace,
      runFrequency,
      longestRun,
      averageHeartRate,
      distanceTrend,
      paceTrend,
      frequencyTrend,
      preferredSportTypes,
      preferredDays,
      averageActivityDuration,
      goalCompletionRate,
      consistencyScore,
      totalActivities,
      runningExperience,
      hasRecentInjuries: false // Would need injury tracking
    }
  }
  
  static generateDynamicSuggestions(
    profile: UserPerformanceProfile,
    existingGoals: UserGoal[]
  ): DynamicGoalSuggestion[] {
    const suggestions: DynamicGoalSuggestion[] = []
    
    // Get active goal categories to avoid duplicates
    const activeGoalCategories = existingGoals
      .filter(g => g.is_active && g.goal_type?.category)
      .map(g => g.goal_type!.category)
    
    // 1. Performance Improvement Suggestions
    if (profile.distanceTrend === 'improving' && !activeGoalCategories.includes('distance')) {
      suggestions.push(this.suggestDistanceGoal(profile))
    }
    
    if (profile.paceTrend === 'improving' && !activeGoalCategories.includes('pace')) {
      suggestions.push(this.suggestPaceGoal(profile))
    }
    
    // 2. Consistency Improvement Suggestions
    if (profile.consistencyScore < 70 && !activeGoalCategories.includes('frequency')) {
      suggestions.push(this.suggestConsistencyGoal(profile))
    }
    
    // 3. Challenge Progression Suggestions
    if (profile.goalCompletionRate > 80) {
      suggestions.push(...this.suggestChallengeGoals(profile, activeGoalCategories))
    }
    
    // 4. Weakness Addressing Suggestions
    if (profile.frequencyTrend === 'declining') {
      suggestions.push(this.suggestFrequencyRecoveryGoal(profile))
    }
    
    if (profile.paceTrend === 'declining') {
      suggestions.push(this.suggestSpeedWorkGoal(profile))
    }
    
    // 5. Experience-Based Suggestions
    suggestions.push(...this.suggestExperienceBasedGoals(profile))
    
    // Sort by priority and return top 5
    return suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      .slice(0, 5)
  }
  
  private static calculateTrend(historical: number, recent: number, reverse = false): 'improving' | 'stable' | 'declining' {
    if (historical === 0) return 'stable'
    
    const change = ((recent - historical) / historical) * 100
    const threshold = 10
    
    if (reverse) {
      // For pace, lower is better
      if (change < -threshold) return 'improving'
      if (change > threshold) return 'declining'
    } else {
      if (change > threshold) return 'improving'
      if (change < -threshold) return 'declining'
    }
    
    return 'stable'
  }
  
  private static calculateAveragePace(activities: Activity[]): number {
    const runActivities = activities.filter(a => 
      a.sport_type?.toLowerCase().includes('run') && 
      a.distance && a.moving_time
    )
    
    if (runActivities.length === 0) return 0
    
    return runActivities.reduce((sum, a) => 
      sum + ((a.moving_time || 0) / ((a.distance || 1) / 1000)), 0
    ) / runActivities.length
  }
  
  private static calculateConsistencyScore(activities: Activity[]): number {
    if (activities.length === 0) return 0
    
    // Calculate how many days in the last 30 had activities
    const activityDays = new Set(
      activities.map(a => new Date(a.start_date).toDateString())
    ).size
    
    // Ideal is 3-4 activities per week (12-17 days per month)
    const idealDays = 15
    const score = Math.min(100, (activityDays / idealDays) * 100)
    
    return Math.round(score)
  }
  
  private static determineExperienceLevel(totalActivities: number, weeklyDistance: number): 'beginner' | 'intermediate' | 'advanced' {
    if (totalActivities < 20 || weeklyDistance < 15) return 'beginner'
    if (totalActivities < 100 || weeklyDistance < 40) return 'intermediate'
    return 'advanced'
  }
  
  private static suggestDistanceGoal(profile: UserPerformanceProfile): DynamicGoalSuggestion {
    const currentWeekly = profile.weeklyDistance
    const suggestedTarget = Math.round(currentWeekly * 1.25) // 25% increase
    
    return {
      id: 'dynamic-distance-improvement',
      title: 'Build Your Running Volume',
      description: `Increase your weekly running distance to ${suggestedTarget}km`,
      reasoning: `You've been consistently improving your distance. Your current average of ${currentWeekly.toFixed(1)}km/week shows you're ready for the next challenge.`,
      priority: 'high',
      category: 'distance',
      goalType: {} as GoalType, // Would be populated from availableGoalTypes
      suggestedTarget,
      targetUnit: 'km',
      timeframe: '4 weeks',
      difficulty: 'moderate',
      benefits: [
        'Improved cardiovascular endurance',
        'Better fat burning efficiency',
        'Enhanced mental toughness',
        'Preparation for longer races'
      ],
      strategies: [
        'Add 10% distance each week',
        'Include one long run per week',
        'Maintain easy pace for most runs',
        'Focus on time on feet over speed'
      ],
      successProbability: 80,
      requiredCommitment: 'medium'
    }
  }
  
  private static suggestPaceGoal(profile: UserPerformanceProfile): DynamicGoalSuggestion {
    const currentPace = profile.averagePace
    const targetImprovement = profile.runningExperience === 'beginner' ? 30 : 
                             profile.runningExperience === 'intermediate' ? 20 : 15
    const suggestedTarget = currentPace - targetImprovement
    
    return {
      id: 'dynamic-pace-improvement',
      title: 'Get Faster and Stronger',
      description: `Improve your average pace to ${Math.floor(suggestedTarget / 60)}:${String(Math.floor(suggestedTarget % 60)).padStart(2, '0')}/km`,
      reasoning: `Your pace has been improving, indicating you're ready for focused speed work.`,
      priority: 'medium',
      category: 'pace',
      goalType: {} as GoalType,
      suggestedTarget,
      targetUnit: 'min/km',
      timeframe: '8 weeks',
      difficulty: 'moderate',
      benefits: [
        'Increased running efficiency',
        'Better race performance',
        'Enhanced lactate threshold',
        'Improved confidence'
      ],
      strategies: [
        'Include weekly tempo runs',
        'Add interval training sessions',
        'Maintain aerobic base with easy runs',
        'Focus on running form improvements'
      ],
      successProbability: 75,
      requiredCommitment: 'high'
    }
  }
  
  private static suggestConsistencyGoal(profile: UserPerformanceProfile): DynamicGoalSuggestion {
    const targetFrequency = Math.min(6, Math.ceil(profile.runFrequency * 1.5))
    
    return {
      id: 'dynamic-consistency-improvement',
      title: 'Build a Stronger Routine',
      description: `Run ${targetFrequency} times per week consistently`,
      reasoning: `Your consistency score of ${profile.consistencyScore}% suggests there's room to build a stronger routine.`,
      priority: 'high',
      category: 'frequency',
      goalType: {} as GoalType,
      suggestedTarget: targetFrequency,
      targetUnit: 'runs/week',
      timeframe: '4 weeks',
      difficulty: 'conservative',
      benefits: [
        'Stronger habit formation',
        'Better fitness adaptation',
        'Reduced injury risk',
        'Improved mental discipline'
      ],
      strategies: [
        'Schedule runs like appointments',
        'Start with shorter, easier runs',
        'Track your consistency daily',
        'Build gradual progression'
      ],
      successProbability: 85,
      requiredCommitment: 'medium'
    }
  }
  
  private static suggestChallengeGoals(profile: UserPerformanceProfile, activeCategories: string[]): DynamicGoalSuggestion[] {
    const suggestions: DynamicGoalSuggestion[] = []
    
    // Suggest milestone challenges based on current performance
    if (profile.longestRun < 10 && !activeCategories.includes('challenge')) {
      suggestions.push({
        id: 'dynamic-10k-challenge',
        title: 'Conquer Your First 10K',
        description: 'Complete a 10km run in a single session',
        reasoning: `Your longest run is ${profile.longestRun.toFixed(1)}km. A 10K is a perfect next milestone.`,
        priority: 'medium',
        category: 'challenge',
        goalType: {} as GoalType,
        suggestedTarget: 10,
        targetUnit: 'km',
        timeframe: '6 weeks',
        difficulty: 'moderate',
        benefits: [
          'Major confidence boost',
          'Endurance breakthrough',
          'Mental toughness development',
          'Gateway to longer distances'
        ],
        strategies: [
          'Build long run distance gradually',
          'Practice nutrition and hydration',
          'Focus on negative splits',
          'Include recovery weeks'
        ],
        successProbability: 90,
        requiredCommitment: 'medium'
      })
    }
    
    return suggestions
  }
  
  private static suggestFrequencyRecoveryGoal(profile: UserPerformanceProfile): DynamicGoalSuggestion {
    return {
      id: 'dynamic-frequency-recovery',
      title: 'Get Back on Track',
      description: 'Return to consistent weekly running',
      reasoning: 'Your running frequency has decreased recently. Let\'s rebuild that habit.',
      priority: 'high',
      category: 'frequency',
      goalType: {} as GoalType,
      suggestedTarget: Math.max(2, Math.floor(profile.runFrequency)),
      targetUnit: 'runs/week',
      timeframe: '3 weeks',
      difficulty: 'conservative',
      benefits: [
        'Habit re-establishment',
        'Fitness maintenance',
        'Momentum building',
        'Confidence restoration'
      ],
      strategies: [
        'Start with shorter runs',
        'Focus on enjoyment over performance',
        'Remove pressure and expectations',
        'Celebrate small wins'
      ],
      warnings: [
        'Don\'t rush back to previous intensity',
        'Listen to your body carefully',
        'Consider underlying causes of decline'
      ],
      successProbability: 75,
      requiredCommitment: 'low'
    }
  }
  
  private static suggestSpeedWorkGoal(profile: UserPerformanceProfile): DynamicGoalSuggestion {
    return {
      id: 'dynamic-speed-recovery',
      title: 'Rediscover Your Speed',
      description: 'Incorporate speed work to improve pace',
      reasoning: 'Your pace has been slowing. Strategic speed work can help reverse this trend.',
      priority: 'medium',
      category: 'pace',
      goalType: {} as GoalType,
      suggestedTarget: profile.averagePace - 15, // 15 seconds improvement
      targetUnit: 'sec/km',
      timeframe: '6 weeks',
      difficulty: 'moderate',
      benefits: [
        'Pace improvement',
        'Running efficiency',
        'Variety in training',
        'Mental stimulation'
      ],
      strategies: [
        'Add weekly interval sessions',
        'Include tempo runs',
        'Focus on leg turnover',
        'Maintain aerobic base'
      ],
      successProbability: 70,
      requiredCommitment: 'high'
    }
  }
  
  private static suggestExperienceBasedGoals(profile: UserPerformanceProfile): DynamicGoalSuggestion[] {
    const suggestions: DynamicGoalSuggestion[] = []
    
    // Beginner-specific suggestions
    if (profile.runningExperience === 'beginner') {
      suggestions.push({
        id: 'dynamic-beginner-foundation',
        title: 'Build Your Running Foundation',
        description: 'Establish a solid base with consistent easy runs',
        reasoning: 'As a beginning runner, consistency is more important than intensity.',
        priority: 'high',
        category: 'frequency',
        goalType: {} as GoalType,
        suggestedTarget: 3,
        targetUnit: 'runs/week',
        timeframe: '6 weeks',
        difficulty: 'conservative',
        benefits: [
          'Injury prevention',
          'Aerobic base development',
          'Habit formation',
          'Confidence building'
        ],
        strategies: [
          'Keep all runs conversational pace',
          'Focus on time rather than distance',
          'Include walk breaks if needed',
          'Prioritize recovery and sleep'
        ],
        successProbability: 95,
        requiredCommitment: 'low'
      })
    }
    
    return suggestions
  }
} 