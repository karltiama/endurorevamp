import { GoalType, UserGoal } from '@/types/goals';
import { DynamicGoalSuggestion, DynamicGoalEngine, UserPerformanceProfile } from './dynamic-suggestions';
import { Activity } from '@/lib/strava/types';

export interface SmartGoalGeneratorOptions {
  includeCategories?: string[];
  excludeCategories?: string[];
  maxSuggestions?: number;
  experienceOverride?: 'beginner' | 'intermediate' | 'advanced';
}

export class SmartGoalGenerator {
  
  /**
   * Map GoalType categories to DynamicGoalSuggestion categories
   */
  private static mapCategory(goalTypeCategory: string): 'distance' | 'pace' | 'frequency' | 'duration' | 'challenge' {
    switch (goalTypeCategory) {
      case 'distance':
      case 'pace':
      case 'frequency':
      case 'duration':
        return goalTypeCategory as 'distance' | 'pace' | 'frequency' | 'duration';
      case 'elevation':
      case 'heart_rate':
      case 'event':
        return 'challenge';
      default:
        return 'challenge';
    }
  }

  /**
   * Remove duplicate and similar suggestions
   */
  private static removeDuplicateSuggestions(suggestions: DynamicGoalSuggestion[]): DynamicGoalSuggestion[] {
    const uniqueSuggestions: DynamicGoalSuggestion[] = [];
    const seenCategories = new Set<string>();
    const seenGoalTypes = new Set<string>();

    for (const suggestion of suggestions) {
      // Skip if we already have a suggestion for this category
      if (seenCategories.has(suggestion.category)) {
        continue;
      }
      
      // Skip if we already have a suggestion for this goal type
      if (seenGoalTypes.has(suggestion.goalType.name)) {
        continue;
      }

      uniqueSuggestions.push(suggestion);
      seenCategories.add(suggestion.category);
      seenGoalTypes.add(suggestion.goalType.name);
    }

    return uniqueSuggestions;
  }
  
  /**
   * Generate dynamic suggestions for all goal categories
   */
  static async generateAllCategorySuggestions(
    userProfile: UserPerformanceProfile,
    goalTypes: GoalType[],
    existingGoals: UserGoal[],
    options: SmartGoalGeneratorOptions = {},
    unitPreferences?: { distance: 'km' | 'miles'; pace: 'min/km' | 'min/mile' }
  ): Promise<DynamicGoalSuggestion[]> {
    const suggestions: DynamicGoalSuggestion[] = [];
    
    // Get categories to process
    const allCategories = [...new Set(goalTypes.map(gt => gt.category))];
    let targetCategories = allCategories;
    
    if (options.includeCategories) {
      targetCategories = targetCategories.filter(cat => options.includeCategories!.includes(cat));
    }
    
    if (options.excludeCategories) {
      targetCategories = targetCategories.filter(cat => !options.excludeCategories!.includes(cat));
    }
    
    // Generate suggestions for each category
    for (const category of targetCategories) {
      const categoryGoalTypes = goalTypes.filter(gt => gt.category === category);
      
      for (const goalType of categoryGoalTypes) {
        const suggestion = await this.generateSuggestionForGoalType(
          goalType,
          userProfile,
          existingGoals,
          options,
          unitPreferences
        );
        
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }
    
    // Remove duplicates and similar suggestions
    const uniqueSuggestions = this.removeDuplicateSuggestions(suggestions);
    
    // Sort by priority and limit
    return uniqueSuggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, options.maxSuggestions || 12);
  }
  
  /**
   * Generate a dynamic suggestion for a specific goal type
   */
  private static async generateSuggestionForGoalType(
    goalType: GoalType,
    userProfile: UserPerformanceProfile,
    existingGoals: UserGoal[],
    options: SmartGoalGeneratorOptions,
    unitPreferences?: { distance: 'km' | 'miles'; pace: 'min/km' | 'min/mile' }
  ): Promise<DynamicGoalSuggestion | null> {
    
    // Check if user already has an active goal of this type
    const hasActiveGoal = existingGoals.some(g => 
      g.is_active && g.goal_type_id === goalType.id
    );
    
    if (hasActiveGoal) {
      return null; // Don't suggest if already active
    }
    
    const experienceLevel = options.experienceOverride || userProfile.runningExperience;
    
    switch (goalType.category) {
      case 'distance':
        return this.generateDistanceSuggestion(goalType, userProfile, experienceLevel);
      
      case 'frequency':
        return this.generateFrequencySuggestion(goalType, userProfile, experienceLevel);
      
      case 'pace':
        return this.generatePaceSuggestion(goalType, userProfile, experienceLevel, unitPreferences);
      
      case 'duration':
        return this.generateDurationSuggestion(goalType, userProfile, experienceLevel);
      
      case 'elevation':
        return this.generateElevationSuggestion(goalType, userProfile, experienceLevel);
      
      case 'heart_rate':
        return this.generateHeartRateSuggestion(goalType, userProfile, experienceLevel);
      
      default:
        return null;
    }
  }
  
  private static generateDistanceSuggestion(
    goalType: GoalType,
    profile: UserPerformanceProfile,
    experience: string
  ): DynamicGoalSuggestion {
    let suggestedTarget: number;
    let difficulty: 'conservative' | 'moderate' | 'ambitious';
    let successProbability: number;
    
    if (goalType.name === 'weekly_distance') {
      const current = profile.weeklyDistance || 10;
      
      if (experience === 'beginner') {
        suggestedTarget = Math.max(15, Math.round(current * 1.2));
        difficulty = 'conservative';
        successProbability = 90;
      } else if (experience === 'intermediate') {
        suggestedTarget = Math.round(current * 1.3);
        difficulty = 'moderate';
        successProbability = 85;
      } else {
        suggestedTarget = Math.round(current * 1.4);
        difficulty = 'ambitious';
        successProbability = 75;
      }
    } else if (goalType.name === 'monthly_distance') {
      const current = profile.monthlyDistance || 40;
      suggestedTarget = Math.round(current * 1.25);
      difficulty = 'moderate';
      successProbability = 80;
    } else {
      // long_run_distance
      const current = profile.longestRun || 5;
      suggestedTarget = Math.round(current * 1.5);
      difficulty = 'moderate';
      successProbability = 85;
    }
    
    return {
      id: `smart-${goalType.name}`,
      title: `Build Your ${goalType.display_name}`,
      description: `Target: ${suggestedTarget}${goalType.unit} based on your current fitness`,
      reasoning: this.generateReasoning(goalType, profile, suggestedTarget, experience),
      priority: this.determinePriority(goalType, profile),
      category: this.mapCategory(goalType.category),
      goalType,
      suggestedTarget,
      targetUnit: goalType.unit || 'km',
      timeframe: goalType.name.includes('weekly') ? '4 weeks' : '8 weeks',
      difficulty,
      benefits: this.generateBenefits(goalType, experience),
      strategies: this.generateStrategies(goalType, experience),
      successProbability,
      requiredCommitment: this.determineCommitment(goalType, difficulty),
      warnings: this.generateWarnings(goalType, difficulty, experience)
    };
  }
  
  private static generateFrequencySuggestion(
    goalType: GoalType,
    profile: UserPerformanceProfile,
    experience: string
  ): DynamicGoalSuggestion {
    let suggestedTarget: number;
    const current = profile.runFrequency || 2;
    
    if (goalType.name === 'weekly_run_frequency') {
      if (experience === 'beginner') {
        suggestedTarget = Math.min(4, Math.max(3, Math.ceil(current * 1.2)));
      } else if (experience === 'intermediate') {
        suggestedTarget = Math.min(5, Math.max(4, Math.ceil(current * 1.3)));
      } else {
        suggestedTarget = Math.min(6, Math.max(5, Math.ceil(current * 1.2)));
      }
    } else {
      // monthly_run_frequency - calculate based on weekly target
      const weeklyTarget = experience === 'beginner' ? 3 : experience === 'intermediate' ? 4 : 5;
      suggestedTarget = Math.round(weeklyTarget * 4.3); // weeks to month - ensure it's a whole number
    }
    
    return {
      id: `smart-${goalType.name}`,
      title: `Build Your Running Consistency`,
      description: `Target: ${suggestedTarget} ${goalType.unit} for stronger habits`,
      reasoning: `Your current frequency of ${Math.round(current)} runs/week shows you're ready to build more consistency. Regular training leads to better adaptations and reduced injury risk.`,
      priority: profile.consistencyScore < 70 ? 'high' : 'medium',
      category: this.mapCategory(goalType.category),
      goalType,
      suggestedTarget,
      targetUnit: goalType.unit || 'runs',
      timeframe: '6 weeks',
      difficulty: 'conservative',
      benefits: [
        'Stronger habit formation',
        'Better fitness adaptations',
        'Reduced injury risk',
        'Improved mental discipline',
        'More consistent energy levels'
      ],
      strategies: [
        'Schedule runs like appointments',
        'Start with shorter, easier runs',
        'Focus on showing up, not performance',
        'Track your streak daily',
        'Plan backup indoor alternatives'
      ],
      successProbability: 85,
      requiredCommitment: 'medium'
    };
  }
  
  private static generatePaceSuggestion(
    goalType: GoalType,
    profile: UserPerformanceProfile,
    experience: string,
    unitPreferences?: { distance: 'km' | 'miles'; pace: 'min/km' | 'min/mile' }
  ): DynamicGoalSuggestion {
    const currentPace = profile.averagePace || 360; // 6:00/km default
    let improvement: number;
    
    if (experience === 'beginner') {
      improvement = 30; // 30 seconds improvement
    } else if (experience === 'intermediate') {
      improvement = 20; // 20 seconds improvement  
    } else {
      improvement = 15; // 15 seconds improvement
    }
    
    const suggestedTarget = Math.max(240, currentPace - improvement); // Don't go below 4:00/km
    
    // Format pace based on user preferences
    const formatPaceWithUnits = (secondsPerKm: number) => {
      const minutes = Math.floor(secondsPerKm / 60);
      const seconds = Math.floor(secondsPerKm % 60);
      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      if (unitPreferences?.pace === 'min/mile') {
        // Convert to min/mile
        const pacePerMile = secondsPerKm * 1.60934;
        const mileMinutes = Math.floor(pacePerMile / 60);
        const mileSeconds = Math.floor(pacePerMile % 60);
        return `${mileMinutes}:${mileSeconds.toString().padStart(2, '0')}/mi`;
      } else {
        return `${timeStr}/km`;
      }
    };
    
    const currentPaceFormatted = formatPaceWithUnits(currentPace);
    const targetPaceFormatted = formatPaceWithUnits(suggestedTarget);
    
    return {
      id: `smart-${goalType.name}`,
      title: `Get Faster and Stronger`,
      description: `Target: ${targetPaceFormatted} (improve from ${currentPaceFormatted})`,
      reasoning: `Your current pace of ${currentPaceFormatted} shows potential for improvement. With focused training, a ${improvement}-second improvement is achievable and will significantly boost your confidence.`,
      priority: profile.paceTrend === 'declining' ? 'high' : 'medium',
      category: this.mapCategory(goalType.category),
      goalType,
      suggestedTarget,
      targetUnit: 'min/km',
      timeframe: '10 weeks',
      difficulty: 'moderate',
      benefits: [
        'Increased running efficiency',
        'Better race performance potential',
        'Enhanced cardiovascular fitness',
        'Improved confidence and motivation',
        'Greater training variety'
      ],
      strategies: [
        'Include weekly tempo runs',
        'Add interval training sessions',
        'Focus on running form improvements',
        'Maintain aerobic base with easy runs',
        'Track progress with GPS watch'
      ],
      successProbability: 75,
      requiredCommitment: 'high',
      warnings: [
        'Avoid increasing intensity too quickly',
        'Maintain 80/20 easy/hard training ratio',
        'Listen to your body for injury signs'
      ]
    };
  }
  
  private static generateDurationSuggestion(
    goalType: GoalType,
    profile: UserPerformanceProfile,
    experience: string
  ): DynamicGoalSuggestion {
    const currentDuration = profile.averageActivityDuration || 30; // minutes
    let suggestedTarget: number;
    
    if (goalType.name === 'weekly_time_target') {
      const weeklyHours = (currentDuration * profile.runFrequency) / 60;
      suggestedTarget = Math.round(weeklyHours * 1.3);
    } else {
      // long_run_duration
      suggestedTarget = Math.round(currentDuration * 1.5);
    }
    
    return {
      id: `smart-${goalType.name}`,
      title: `Build Your Endurance Base`,
      description: `Target: ${suggestedTarget} ${goalType.unit} for better stamina`,
      reasoning: `Your current average of ${currentDuration} minutes per run shows you're ready to build more endurance. Time-based goals help develop your aerobic system effectively.`,
      priority: 'medium',
      category: this.mapCategory(goalType.category),
      goalType,
      suggestedTarget,
      targetUnit: goalType.unit || 'minutes',
      timeframe: '8 weeks',
      difficulty: 'moderate',
      benefits: [
        'Improved aerobic capacity',
        'Better fat burning efficiency',
        'Enhanced mental toughness',
        'Stronger cardiovascular system',
        'Foundation for longer distances'
      ],
      strategies: [
        'Increase duration gradually (10% per week)',
        'Focus on conversational pace',
        'Practice nutrition during longer runs',
        'Build mental resilience',
        'Track by time, not distance'
      ],
      successProbability: 80,
      requiredCommitment: 'medium'
    };
  }
  
  private static generateElevationSuggestion(
    goalType: GoalType,
    profile: UserPerformanceProfile,
    experience: string
  ): DynamicGoalSuggestion {
    // Base elevation target on location and experience
    let suggestedTarget: number;
    
    if (goalType.name === 'weekly_elevation_gain') {
      if (experience === 'beginner') {
        suggestedTarget = 300;
      } else if (experience === 'intermediate') {
        suggestedTarget = 500;
      } else {
        suggestedTarget = 800;
      }
    } else {
      // climbing_endurance - elevation per km
      suggestedTarget = experience === 'beginner' ? 20 : experience === 'intermediate' ? 35 : 50;
    }
    
    return {
      id: `smart-${goalType.name}`,
      title: `Conquer the Hills`,
      description: `Target: ${suggestedTarget}${goalType.unit} for stronger legs`,
      reasoning: `Hill training is one of the most effective ways to build strength and power. This target will challenge you without overwhelming your current fitness level.`,
      priority: 'low',
      category: this.mapCategory(goalType.category),
      goalType,
      suggestedTarget,
      targetUnit: goalType.unit || 'm',
      timeframe: '6 weeks',
      difficulty: 'moderate',
      benefits: [
        'Increased leg strength and power',
        'Better running efficiency',
        'Improved race performance',
        'Enhanced mental toughness',
        'Stronger glutes and calves'
      ],
      strategies: [
        'Find local hills or use treadmill incline',
        'Focus on effort, not pace on uphills',
        'Practice downhill running technique',
        'Include hill intervals in training',
        'Strengthen with bodyweight exercises'
      ],
      successProbability: 70,
      requiredCommitment: 'medium'
    };
  }
  
  private static generateHeartRateSuggestion(
    goalType: GoalType,
    profile: UserPerformanceProfile,
    experience: string
  ): DynamicGoalSuggestion {
    const suggestedTarget = goalType.name === 'aerobic_base_building' ? 180 : 45; // minutes per week
    
    return {
      id: `smart-${goalType.name}`,
      title: `Train with Heart Rate Zones`,
      description: `Target: ${suggestedTarget} ${goalType.unit} in optimal zones`,
      reasoning: `Heart rate training ensures you're working at the right intensity for maximum benefit. This target will help you build a strong aerobic base while avoiding overtraining.`,
      priority: profile.averageHeartRate > 0 ? 'medium' : 'low',
      category: this.mapCategory(goalType.category),
      goalType,
      suggestedTarget,
      targetUnit: goalType.unit || 'minutes',
      timeframe: '8 weeks',
      difficulty: 'moderate',
      benefits: [
        'Improved aerobic efficiency',
        'Better recovery between workouts',
        'Reduced risk of overtraining',
        'Enhanced fat burning',
        'Scientific training approach'
      ],
      strategies: [
        'Get a heart rate monitor',
        'Calculate your training zones',
        'Stay disciplined with easy runs',
        'Track zone time during workouts',
        'Learn to run by feel'
      ],
      successProbability: profile.averageHeartRate > 0 ? 85 : 60,
      requiredCommitment: 'high',
      warnings: profile.averageHeartRate === 0 ? [
        'Requires heart rate monitor',
        'May take time to learn proper zones'
      ] : undefined
    };
  }
  
  private static generateReasoning(
    goalType: GoalType,
    profile: UserPerformanceProfile,
    target: number,
    experience: string
  ): string {
    const trend = profile.distanceTrend;
    const current = goalType.name.includes('weekly') ? profile.weeklyDistance : profile.monthlyDistance;
    
    let reasoning = `Based on your current ${current?.toFixed(1) || 'baseline'} ${goalType.unit}/week, `;
    
    if (trend === 'improving') {
      reasoning += `you've been consistently improving your distance. `;
    } else if (trend === 'stable') {
      reasoning += `you've maintained consistent training. `;
    } else {
      reasoning += `there's great potential to rebuild your fitness. `;
    }
    
    reasoning += `This ${target}${goalType.unit} target represents a ${experience === 'beginner' ? 'gentle' : experience === 'intermediate' ? 'moderate' : 'challenging'} progression that aligns with your current fitness level.`;
    
    return reasoning;
  }
  
  private static determinePriority(goalType: GoalType, profile: UserPerformanceProfile): 'high' | 'medium' | 'low' {
    if (goalType.category === 'frequency' && profile.consistencyScore < 70) {
      return 'high';
    }
    
    if (goalType.category === 'pace' && profile.paceTrend === 'declining') {
      return 'high';
    }
    
    if (goalType.category === 'distance' && profile.distanceTrend === 'improving') {
      return 'high';
    }
    
    return 'medium';
  }
  
  private static generateBenefits(goalType: GoalType, experience: string): string[] {
    const baseBenefits = {
      distance: [
        'Improved cardiovascular endurance',
        'Better fat burning efficiency',
        'Enhanced mental toughness',
        'Foundation for longer races'
      ],
      frequency: [
        'Stronger habit formation',
        'Better fitness adaptations',
        'Reduced injury risk',
        'Improved mental discipline'
      ],
      pace: [
        'Increased running efficiency',
        'Better race performance',
        'Enhanced lactate threshold',
        'Improved confidence'
      ],
      duration: [
        'Improved aerobic capacity',
        'Better fat burning',
        'Enhanced mental toughness',
        'Stronger cardiovascular system'
      ],
      elevation: [
        'Increased leg strength',
        'Better running efficiency',
        'Improved race performance',
        'Enhanced mental toughness'
      ],
      heart_rate: [
        'Improved aerobic efficiency',
        'Better recovery',
        'Reduced overtraining risk',
        'Enhanced fat burning'
      ]
    };
    
    return baseBenefits[goalType.category as keyof typeof baseBenefits] || [];
  }
  
  private static generateStrategies(goalType: GoalType, experience: string): string[] {
    const baseStrategies = {
      distance: [
        'Increase by 10% each week',
        'Include one long run weekly',
        'Maintain conversational pace',
        'Focus on time on feet'
      ],
      frequency: [
        'Schedule runs like appointments',
        'Start with shorter runs',
        'Track consistency daily',
        'Plan backup alternatives'
      ],
      pace: [
        'Include weekly tempo runs',
        'Add interval sessions',
        'Focus on running form',
        'Maintain 80/20 easy/hard ratio'
      ],
      duration: [
        'Increase gradually (10% per week)',
        'Focus on conversational pace',
        'Practice nutrition strategy',
        'Build mental resilience'
      ],
      elevation: [
        'Find local hills or use treadmill',
        'Focus on effort, not pace',
        'Practice downhill technique',
        'Include hill intervals'
      ],
      heart_rate: [
        'Use heart rate monitor',
        'Calculate training zones',
        'Stay disciplined with easy runs',
        'Track zone time'
      ]
    };
    
    return baseStrategies[goalType.category as keyof typeof baseStrategies] || [];
  }
  
  private static determineCommitment(goalType: GoalType, difficulty: string): 'low' | 'medium' | 'high' {
    if (goalType.category === 'pace' || goalType.category === 'heart_rate') {
      return 'high';
    }
    
    if (difficulty === 'ambitious') {
      return 'high';
    }
    
    if (difficulty === 'conservative') {
      return 'low';
    }
    
    return 'medium';
  }
  
  private static generateWarnings(goalType: GoalType, difficulty: string, experience: string): string[] | undefined {
    const warnings: string[] = [];
    
    if (goalType.category === 'pace') {
      warnings.push('Avoid increasing intensity too quickly');
      warnings.push('Maintain 80/20 easy/hard training ratio');
    }
    
    if (goalType.category === 'distance' && difficulty === 'ambitious') {
      warnings.push('Listen to your body for injury signs');
      warnings.push('Don\'t skip rest days');
    }
    
    if (experience === 'beginner') {
      warnings.push('Focus on consistency over intensity');
    }
    
    return warnings.length > 0 ? warnings : undefined;
  }
} 