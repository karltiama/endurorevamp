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
  category: 'distance' | 'pace' | 'frequency' | 'duration'
  
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
    existingGoals: UserGoal[],
    unitPreferences?: { distance: 'km' | 'miles'; pace: 'min/km' | 'min/mile' }
  ): DynamicGoalSuggestion[] {
    const suggestions: DynamicGoalSuggestion[] = []
    
    // Get active goal categories to avoid duplicates
    const activeGoalCategories = existingGoals
      .filter(g => g.is_active && g.goal_type?.category)
      .map(g => g.goal_type!.category)
    
    // 1. Performance Improvement Suggestions
    if (profile.distanceTrend === 'improving' && !activeGoalCategories.includes('distance')) {
      suggestions.push(this.suggestDistanceGoal(profile, unitPreferences))
    }
    
    if (profile.paceTrend === 'improving' && !activeGoalCategories.includes('pace')) {
      suggestions.push(this.suggestPaceGoal(profile, unitPreferences))
    }
    
    // 2. Consistency Improvement Suggestions
    if (profile.consistencyScore < 70 && !activeGoalCategories.includes('frequency')) {
              suggestions.push(this.suggestConsistencyGoal(profile))
    }
    
    // 3. Challenge Progression Suggestions
    if (profile.goalCompletionRate > 80) {
      suggestions.push(...this.suggestChallengeGoals(profile, activeGoalCategories, unitPreferences))
    }
    
    // 4. Weakness Addressing Suggestions
    if (profile.frequencyTrend === 'declining') {
              suggestions.push(this.suggestFrequencyRecoveryGoal(profile))
    }
    
    if (profile.paceTrend === 'declining') {
      suggestions.push(this.suggestSpeedWorkGoal(profile, unitPreferences))
    }
    
    // 5. Experience-Based Suggestions
    suggestions.push(...this.suggestExperienceBasedGoals(profile, unitPreferences))
    
    // 6. Additional suggestions for beginners with some progress
    if (profile.runningExperience === 'beginner' && profile.weeklyDistance >= 10) {
      suggestions.push({
        id: 'dynamic-beginner-progression',
        title: 'Take the Next Step',
        description: 'Add variety to your training with different types of runs',
        reasoning: 'You\'ve built a solid foundation. Now let\'s add some variety to keep things interesting.',
        priority: 'medium',
        category: 'frequency',
        goalType: this.mapCategoryToGoalType('frequency'),
        suggestedTarget: 4,
        targetUnit: 'different run types',
        timeframe: '4 weeks',
        difficulty: 'moderate',
        benefits: [
          'Prevents training boredom',
          'Builds different fitness aspects',
          'Reduces injury risk',
          'Keeps motivation high'
        ],
        strategies: [
          'Try one longer run per week',
          'Include one slightly faster run',
          'Add a recovery run',
          'Keep most runs easy'
        ],
        successProbability: 85,
        requiredCommitment: 'medium'
      })
    }
    
    // Sort by priority and return top 5
    return suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      .slice(0, 6) // Increased from 5 to 6 for more variety
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
    // EXPERIENCE LEVEL THRESHOLDS - Adjust these to change classification
    const BEGINNER_ACTIVITY_THRESHOLD = 20    // Total activities needed for intermediate
    const BEGINNER_DISTANCE_THRESHOLD = 15    // Weekly km needed for intermediate
    const INTERMEDIATE_ACTIVITY_THRESHOLD = 100 // Total activities needed for advanced
    const INTERMEDIATE_DISTANCE_THRESHOLD = 40 // Weekly km needed for advanced
    
    if (totalActivities < BEGINNER_ACTIVITY_THRESHOLD || weeklyDistance < BEGINNER_DISTANCE_THRESHOLD) return 'beginner'
    if (totalActivities < INTERMEDIATE_ACTIVITY_THRESHOLD || weeklyDistance < INTERMEDIATE_DISTANCE_THRESHOLD) return 'intermediate'
    return 'advanced'
  }
  
  private static suggestDistanceGoal(profile: UserPerformanceProfile, unitPreferences?: { distance: 'km' | 'miles'; pace: 'min/km' | 'min/mile' }): DynamicGoalSuggestion {
    const currentWeekly = profile.weeklyDistance
    let suggestedTarget = Math.round(currentWeekly * 1.25) // 25% increase
    let targetUnit = 'km'
    
    // Convert to user's preferred distance unit
    if (unitPreferences?.distance === 'miles') {
      // Convert km to miles (1 km = 0.621371 miles)
      suggestedTarget = Math.round(suggestedTarget * 0.621371 * 10) / 10
      targetUnit = 'miles'
    }
    
    return {
      id: 'dynamic-distance-improvement',
      title: 'Build Your Running Volume',
      description: `Increase your weekly running distance to ${suggestedTarget}${targetUnit === 'miles' ? 'mi' : 'km'}`,
      reasoning: `You've been consistently improving your distance. Your current average of ${unitPreferences?.distance === 'miles' ? 
        (currentWeekly * 0.621371).toFixed(1) : currentWeekly.toFixed(1)}${unitPreferences?.distance === 'miles' ? 'mi' : 'km'}/week shows you're ready for the next challenge.`,
      priority: 'high',
      category: 'distance',
      goalType: this.mapCategoryToGoalType('distance'),
      suggestedTarget,
      targetUnit,
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
  
  private static suggestPaceGoal(profile: UserPerformanceProfile, unitPreferences?: { distance: 'km' | 'miles'; pace: 'min/km' | 'min/mile' }): DynamicGoalSuggestion {
    const currentPace = profile.averagePace
    const targetImprovement = profile.runningExperience === 'beginner' ? 30 : 
                             profile.runningExperience === 'intermediate' ? 20 : 15
    let suggestedTarget = currentPace - targetImprovement
    let targetUnit = 'min/km'
    
    // Convert to user's preferred pace unit
    if (unitPreferences?.pace === 'min/mile') {
      // Convert seconds per km to seconds per mile (1 mile = 1.60934 km)
      suggestedTarget = suggestedTarget * 1.60934
      targetUnit = 'min/mile'
    }
    
    // Format pace based on user preferences
    const formatPaceWithUnits = (secondsPerUnit: number) => {
      const minutes = Math.floor(secondsPerUnit / 60);
      const seconds = Math.floor(secondsPerUnit % 60);
      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      if (unitPreferences?.pace === 'min/mile') {
        return `${timeStr}/mi`;
      } else {
        return `${timeStr}/km`;
      }
    };
    
    const targetPaceFormatted = formatPaceWithUnits(suggestedTarget);
    
    return {
      id: 'dynamic-pace-improvement',
      title: 'Get Faster and Stronger',
      description: `Improve your average pace to ${targetPaceFormatted}`,
      reasoning: `Your pace has been improving, indicating you're ready for focused speed work.`,
      priority: 'medium',
      category: 'pace',
      goalType: this.mapCategoryToGoalType('pace'),
      suggestedTarget,
      targetUnit,
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
      goalType: this.mapCategoryToGoalType('frequency'),
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
  
  private static suggestChallengeGoals(profile: UserPerformanceProfile, activeCategories: string[], unitPreferences?: { distance: 'km' | 'miles'; pace: 'min/km' | 'min/mile' }): DynamicGoalSuggestion[] {
    const suggestions: DynamicGoalSuggestion[] = []
    
    // Suggest milestone challenges based on current performance
    if (profile.longestRun < 10 && !activeCategories.includes('challenge')) {
      let challengeDistance = 10
      let distanceUnit = 'km'
      
      // Convert to user's preferred distance unit
      if (unitPreferences?.distance === 'miles') {
        challengeDistance = Math.round(10 * 0.621371 * 10) / 10 // 10km to miles
        distanceUnit = 'miles'
      }
      
      suggestions.push({
        id: 'dynamic-10k-challenge',
        title: 'Conquer Your First 10K',
        description: `Complete a ${challengeDistance}${distanceUnit === 'miles' ? 'mi' : 'km'} run in a single session`,
        reasoning: `Your longest run is ${unitPreferences?.distance === 'miles' ? 
          (profile.longestRun * 0.621371).toFixed(1) : profile.longestRun.toFixed(1)}${unitPreferences?.distance === 'miles' ? 'mi' : 'km'}. A ${challengeDistance}${distanceUnit === 'miles' ? 'mi' : 'km'} is a perfect next milestone.`,
        priority: 'medium',
        category: 'distance',
        goalType: this.mapCategoryToGoalType('distance'),
        suggestedTarget: challengeDistance,
        targetUnit: distanceUnit,
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
      goalType: this.mapCategoryToGoalType('frequency'),
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
  
  private static suggestSpeedWorkGoal(profile: UserPerformanceProfile, unitPreferences?: { distance: 'km' | 'miles'; pace: 'min/km' | 'min/mile' }): DynamicGoalSuggestion {
    let suggestedPace = profile.averagePace - 15 // 15 seconds improvement
    let paceUnit = 'min/km'
    
    // Convert to user's preferred pace unit
    if (unitPreferences?.pace === 'min/mile') {
      suggestedPace = suggestedPace * 1.60934
      paceUnit = 'min/mile'
    }
    
    return {
      id: 'dynamic-speed-recovery',
      title: 'Rediscover Your Speed',
      description: 'Incorporate speed work to improve pace',
      reasoning: 'Your pace has been slowing. Strategic speed work can help reverse this trend.',
      priority: 'medium',
      category: 'pace',
      goalType: this.mapCategoryToGoalType('pace'),
      suggestedTarget: suggestedPace,
      targetUnit: paceUnit,
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
  
  private static suggestExperienceBasedGoals(profile: UserPerformanceProfile, unitPreferences?: { distance: 'km' | 'miles'; pace: 'min/km' | 'min/mile' }): DynamicGoalSuggestion[] {
    const suggestions: DynamicGoalSuggestion[] = []
    
    // Beginner-specific suggestions
    if (profile.runningExperience === 'beginner') {
      // Core foundation goal
      suggestions.push({
        id: 'dynamic-beginner-foundation',
        title: 'Build Your Running Foundation',
        description: 'Establish a solid base with consistent easy runs',
        reasoning: 'As a beginning runner, consistency is more important than intensity.',
        priority: 'high',
        category: 'frequency',
        goalType: this.mapCategoryToGoalType('frequency'),
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

      // Distance building goal (if they have some activity)
      if (profile.weeklyDistance > 0) {
        let suggestedDistance = Math.round(profile.weeklyDistance * 1.5)
        let distanceUnit = 'km'
        
        // Convert to user's preferred distance unit
        if (unitPreferences?.distance === 'miles') {
          suggestedDistance = Math.round(suggestedDistance * 0.621371 * 10) / 10
          distanceUnit = 'miles'
        }
        
        suggestions.push({
          id: 'dynamic-beginner-distance',
          title: 'Gradually Increase Distance',
          description: `Build your weekly distance to ${suggestedDistance}${distanceUnit === 'miles' ? 'mi' : 'km'}`,
          reasoning: `You're currently running ${unitPreferences?.distance === 'miles' ? 
            (profile.weeklyDistance * 0.621371).toFixed(1) : profile.weeklyDistance.toFixed(1)}${unitPreferences?.distance === 'miles' ? 'mi' : 'km'} per week. Let's build on that foundation.`,
          priority: 'medium',
          category: 'distance',
          goalType: this.mapCategoryToGoalType('distance'),
          suggestedTarget: suggestedDistance,
          targetUnit: distanceUnit,
          timeframe: '4 weeks',
          difficulty: 'conservative',
          benefits: [
            'Improved endurance',
            'Better cardiovascular fitness',
            'Increased confidence',
            'Preparation for longer runs'
          ],
          strategies: [
            'Increase distance by 10% each week',
            'Keep the same easy pace',
            'Include one longer run per week',
            'Listen to your body and rest when needed'
          ],
          successProbability: 85,
          requiredCommitment: 'medium'
        })
      }

      // Duration goal (if they have some activity)
      if (profile.averageActivityDuration > 0) {
        const suggestedDuration = Math.round(profile.averageActivityDuration * 1.3)
        const durationUnit = 'minutes'
        
        suggestions.push({
          id: 'dynamic-beginner-duration',
          title: 'Extend Your Workout Time',
          description: `Build up to ${suggestedDuration} ${durationUnit} per run`,
          reasoning: `Your current average run is ${Math.round(profile.averageActivityDuration)} ${durationUnit}. Let's gradually increase that.`,
          priority: 'medium',
          category: 'duration',
          goalType: this.mapCategoryToGoalType('duration'),
          suggestedTarget: suggestedDuration,
          targetUnit: durationUnit,
          timeframe: '6 weeks',
          difficulty: 'conservative',
          benefits: [
            'Better aerobic fitness',
            'Improved endurance',
            'More time for mental benefits',
            'Foundation for longer distances'
          ],
          strategies: [
            'Add 5 minutes to one run per week',
            'Keep the same easy pace',
            'Focus on enjoyment over speed',
            'Include walk breaks if needed'
          ],
          successProbability: 90,
          requiredCommitment: 'low'
        })
      }

      // If they show some consistency, suggest a pace goal
      if (profile.runFrequency >= 2 && profile.weeklyDistance >= 5) {
        let suggestedPace = profile.averagePace - 10 // Small improvement
        let paceUnit = 'min/km'
        
        // Convert to user's preferred pace unit
        if (unitPreferences?.pace === 'min/mile') {
          suggestedPace = suggestedPace * 1.60934
          paceUnit = 'min/mile'
        }
        
        suggestions.push({
          id: 'dynamic-beginner-pace',
          title: 'Improve Your Running Efficiency',
          description: 'Focus on maintaining a steady, comfortable pace',
          reasoning: 'You\'ve built good consistency. Now let\'s work on maintaining a steady pace.',
          priority: 'low',
          category: 'pace',
          goalType: this.mapCategoryToGoalType('pace'),
          suggestedTarget: suggestedPace,
          targetUnit: paceUnit,
          timeframe: '8 weeks',
          difficulty: 'conservative',
          benefits: [
            'Better running efficiency',
            'Reduced effort for same distance',
            'Improved confidence',
            'Foundation for future speed work'
          ],
          strategies: [
            'Focus on steady breathing',
            'Maintain conversational pace',
            'Include one slightly faster run per week',
            'Don\'t worry about speed initially'
          ],
          successProbability: 80,
          requiredCommitment: 'medium'
        })
      }
    }
    
    return suggestions
  }

  /**
   * Map goal categories to actual goal type IDs from the database
   * This ensures suggestions reference valid goal types
   */
  private static mapCategoryToGoalType(category: string): GoalType {
    // These should match the goal_types table in the database using names as IDs
    const goalTypeMap: Record<string, GoalType> = {
      'distance': {
        name: 'weekly_distance',
        display_name: 'Weekly Distance Target',
        description: 'Run a specific total distance each week',
        category: 'distance',
        metric_type: 'total_distance',
        unit: 'km',
        target_guidance: 'Beginners: 15-25km, Intermediate: 30-50km, Advanced: 60km+',
        calculation_method: 'Sum of all run distances in the week',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      'pace': {
        name: 'general_pace_improvement',
        display_name: 'Overall Pace Improvement',
        description: 'Improve your general running pace across all distances',
        category: 'pace',
        metric_type: 'average_pace',
        unit: 'min/km',
        target_guidance: 'Aim to improve by 10-20 seconds per km over 2-3 months',
        calculation_method: 'Average pace across all runs weighted by distance',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      'frequency': {
        name: 'weekly_run_frequency',
        display_name: 'Weekly Running Consistency',
        description: 'Run a specific number of times per week',
        category: 'frequency',
        metric_type: 'run_count',
        unit: 'runs',
        target_guidance: 'Beginners: 3 runs, Intermediate: 4-5 runs, Advanced: 6+ runs',
        calculation_method: 'Count of running activities per week',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      'duration': {
        name: 'weekly_time_target',
        display_name: 'Weekly Time on Feet',
        description: 'Spend a target amount of time running each week',
        category: 'duration',
        metric_type: 'total_time',
        unit: 'hours',
        target_guidance: 'Beginners: 2-4 hours, Intermediate: 5-8 hours, Advanced: 10+ hours',
        calculation_method: 'Sum of all running activity durations in the week',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      'elevation': {
        name: 'weekly_elevation_gain',
        display_name: 'Weekly Elevation Challenge',
        description: 'Climb a target amount of elevation each week',
        category: 'elevation',
        metric_type: 'total_elevation',
        unit: 'm',
        target_guidance: 'Varies by location: 200-1000m per week',
        calculation_method: 'Sum of elevation gain from all runs in the week',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    return goalTypeMap[category] || goalTypeMap['distance'];
  }
} 