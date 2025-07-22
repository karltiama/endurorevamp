import type { EnhancedWorkoutRecommendation } from './enhanced-workout-planning'

export interface DynamicContentContext {
  workoutType: string
  sport: string
  intensity: number
  duration: number
  distance?: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  timeOfDay?: 'morning' | 'afternoon' | 'evening'
  weatherConditions?: {
    temperature: number
    precipitation: number
    windSpeed: number
  }
}

export class DynamicWorkoutContent {
  /**
   * Generate dynamic instructions based on workout characteristics
   */
  static generateInstructions(context: DynamicContentContext): string[] {
    const { workoutType, sport, intensity, difficulty, timeOfDay, weatherConditions } = context

    const instructions: string[] = []

    // Sport-specific warm-up
    instructions.push(...this.getWarmupInstructions(sport, intensity, timeOfDay))

    // Main workout instructions
          instructions.push(...this.getMainWorkoutInstructions(workoutType, sport))

    // Cool-down instructions
    instructions.push(...this.getCooldownInstructions(sport, intensity))

    // Weather-specific adjustments
    if (weatherConditions) {
      instructions.push(...this.getWeatherAdjustments(weatherConditions))
    }

    // Difficulty-specific modifications
          instructions.push(...this.getDifficultyModifications(difficulty))

    return instructions
  }

  /**
   * Generate dynamic tips based on workout characteristics
   */
  static generateTips(context: DynamicContentContext): string[] {
    const { workoutType, sport, intensity, duration, difficulty, timeOfDay, weatherConditions } = context

    const tips: string[] = []

    // General tips based on workout type
    tips.push(...this.getWorkoutTypeTips(workoutType, sport))

    // Intensity-specific tips
    tips.push(...this.getIntensityTips(intensity))

    // Duration-specific tips
    tips.push(...this.getDurationTips(duration))

    // Time of day tips
    if (timeOfDay) {
              tips.push(...this.getTimeOfDayTips(timeOfDay))
    }

    // Weather-specific tips
    if (weatherConditions) {
      tips.push(...this.getWeatherTips(weatherConditions))
    }

    // Difficulty-specific tips
            tips.push(...this.getDifficultyTips(difficulty))

    return tips
  }

  private static getWarmupInstructions(sport: string, intensity: number, timeOfDay?: string): string[] {
    const instructions: string[] = []

    if (sport === 'Run') {
      if (intensity <= 3) {
        instructions.push('5 min walk → easy jog')
      } else if (intensity <= 6) {
        instructions.push('5 min easy jog + dynamic stretches')
      } else {
        instructions.push('8-10 min progressive jog + strides')
      }
    } else if (sport === 'WeightTraining') {
      instructions.push('5-10 min cardio + bodyweight exercises')
    }

    if (timeOfDay === 'morning') {
      instructions.push('Extra warm-up time needed')
    }

    return instructions
  }

  private static getMainWorkoutInstructions(workoutType: string, sport: string): string[] {
    const instructions: string[] = []

    if (sport === 'Run') {
      switch (workoutType) {
        case 'recovery':
          instructions.push('Conversational pace only')
          instructions.push('Take walking breaks as needed')
          break

        case 'easy':
          instructions.push('Comfortable, talkable pace')
          instructions.push('Focus on rhythm and breathing')
          break

        case 'tempo':
          instructions.push('10 min easy → tempo pace → 10 min easy')
          instructions.push('Tempo = "comfortably hard"')
          break

        case 'threshold':
          instructions.push('15 min easy → threshold intervals')
          instructions.push('Threshold = 1-hour race pace')
          break

        case 'long':
          instructions.push('Start slow, build gradually')
          instructions.push('Plan nutrition and hydration')
          break

        case 'interval':
          instructions.push('High intensity ↔ active recovery')
          instructions.push('Focus on form during work periods')
          break

        case 'hill':
          instructions.push('Find 5-8% gradient hill')
          instructions.push('Run up, walk/jog down')
          break
      }
    } else if (sport === 'WeightTraining') {
      switch (workoutType) {
        case 'strength':
          instructions.push('Compound movements: squats, deadlifts, presses')
          instructions.push('3-5 sets, 5-8 reps, 2-3 min rest')
          break

        case 'easy':
          instructions.push('Light weights, high reps')
          instructions.push('Focus on technique')
          break

        case 'interval':
          instructions.push('Strength + cardio intervals')
          instructions.push('Short rest periods')
          break
      }
    }

    return instructions
  }

  private static getCooldownInstructions(sport: string, intensity: number): string[] {
    const instructions: string[] = []

    if (sport === 'Run') {
      if (intensity >= 7) {
        instructions.push('10 min easy jog + 5 min walk')
        instructions.push('Static stretches')
      } else {
        instructions.push('5 min easy jog + 5 min walk')
        instructions.push('Gentle leg/hip stretches')
      }
    } else if (sport === 'WeightTraining') {
      instructions.push('5-10 min light cardio')
      instructions.push('Stretch worked muscles')
    }

    return instructions
  }

  private static getWeatherAdjustments(weather: { temperature: number; precipitation: number; windSpeed: number }): string[] {
    const instructions: string[] = []

    if (weather.temperature < 10) {
      instructions.push('Dress in layers')
    } else if (weather.temperature > 25) {
      instructions.push('Stay hydrated, run in shade')
    }

    if (weather.precipitation > 0) {
      instructions.push('Wear appropriate footwear')
    }

    if (weather.windSpeed > 20) {
      instructions.push('Plan route to minimize headwind')
    }

    return instructions
  }

  private static getDifficultyModifications(difficulty: string): string[] {
    const instructions: string[] = []

    if (difficulty === 'beginner') {
      instructions.push('Focus on completion, not pace')
      instructions.push('Take breaks as needed')
    } else if (difficulty === 'advanced') {
      instructions.push('Push limits, maintain form')
      instructions.push('Add challenges if feeling strong')
    }

    return instructions
  }

  private static getWorkoutTypeTips(workoutType: string, sport: string): string[] {
    const tips: string[] = []

    if (sport === 'Run') {
      switch (workoutType) {
        case 'recovery':
          tips.push('Keep HR below 65% max')
          tips.push('Focus on form and relaxation')
          break

        case 'easy':
          tips.push('Conversational pace')
          tips.push('Build endurance, not speed')
          break

        case 'tempo':
          tips.push('"Comfortably hard" pace')
          tips.push('Build into the pace')
          break

        case 'threshold':
          tips.push('1-hour race pace')
          tips.push('Even pacing throughout')
          break

        case 'long':
          tips.push('Start conservatively')
          tips.push('Practice nutrition strategy')
          break

        case 'interval':
          tips.push('Quality over quantity')
          tips.push('Recovery = work')
          break

        case 'hill':
          tips.push('Drive with arms uphill')
          tips.push('Use downhill for recovery')
          break
      }
    } else if (sport === 'WeightTraining') {
      switch (workoutType) {
        case 'strength':
          tips.push('Compound movements first')
          tips.push('Progressive overload')
          break

        case 'easy':
          tips.push('Mind-muscle connection')
          tips.push('Form over weight')
          break

        case 'interval':
          tips.push('Short rest periods')
          tips.push('Full-body movements')
          break
      }
    }

    return tips
  }

  private static getIntensityTips(intensity: number): string[] {
    const tips: string[] = []

    if (intensity <= 3) {
      tips.push('Active recovery - keep effort light')
    } else if (intensity <= 5) {
      tips.push('Comfortable effort')
    } else if (intensity <= 7) {
      tips.push('Moderate effort - sweet spot')
    } else if (intensity <= 9) {
      tips.push('High effort - be well-rested')
    } else {
      tips.push('Max effort - use sparingly')
    }

    return tips
  }

  private static getDurationTips(duration: number): string[] {
    const tips: string[] = []

    if (duration <= 30) {
      tips.push('Short session - quality over quantity')
    } else if (duration <= 60) {
      tips.push('Standard session length')
    } else if (duration <= 90) {
      tips.push('Longer session - plan nutrition')
    } else {
      tips.push('Extended session - plan carefully')
    }

    return tips
  }

  private static getTimeOfDayTips(timeOfDay: string): string[] {
    const tips: string[] = []

    if (timeOfDay === 'morning') {
      tips.push('Extra warm-up time needed')
      tips.push('Light snack before workout')
    } else if (timeOfDay === 'afternoon') {
      tips.push('Peak performance time')
      tips.push('Mindful of heat outdoors')
    } else if (timeOfDay === 'evening') {
      tips.push('Avoid high-intensity near bedtime')
      tips.push('Great stress-reliever')
    }

    return tips
  }

  private static getWeatherTips(weather: { temperature: number; precipitation: number; windSpeed: number }): string[] {
    const tips: string[] = []

    if (weather.temperature < 10) {
      tips.push('Dress in layers')
      tips.push('Cold affects performance')
    } else if (weather.temperature > 25) {
      tips.push('Heat affects performance')
      tips.push('Stay hydrated')
    }

    if (weather.precipitation > 0) {
      tips.push('Wet conditions - be careful')
    }

    if (weather.windSpeed > 20) {
      tips.push('Wind makes workouts harder')
    }

    return tips
  }

  private static getDifficultyTips(difficulty: string): string[] {
    const tips: string[] = []

    if (difficulty === 'beginner') {
      tips.push('Consistency over intensity')
      tips.push('Every workout is progress')
    } else if (difficulty === 'intermediate') {
      tips.push('Balance challenge with recovery')
      tips.push('Focus on volume and intensity')
    } else if (difficulty === 'advanced') {
      tips.push('Fine-tune with specific goals')
      tips.push('Recovery is crucial')
    }

    return tips
  }

  /**
   * Generate dynamic modifications based on workout characteristics
   */
  static generateModifications(context: DynamicContentContext): {
    easier?: string
    harder?: string
    shorter?: string
    longer?: string
  } {
    const { workoutType, sport, intensity, duration } = context
    const modifications: { easier?: string; harder?: string; shorter?: string; longer?: string } = {}

    // Easier modifications
    if (intensity > 4) {
      modifications.easier = this.getEasierModification(workoutType, sport)
    }

    // Harder modifications
    if (intensity < 8) {
      modifications.harder = this.getHarderModification(workoutType, sport)
    }

    // Shorter modifications
    if (duration > 45) {
      modifications.shorter = this.getShorterModification(workoutType, sport)
    }

    // Longer modifications
    if (duration < 90) {
      modifications.longer = this.getLongerModification(workoutType, sport)
    }

    return modifications
  }

  private static getEasierModification(workoutType: string, sport: string): string {
    if (sport === 'Run') {
      switch (workoutType) {
        case 'tempo':
          return 'Reduce tempo duration by 50%'
        case 'threshold':
          return 'Shorten threshold intervals'
        case 'interval':
          return 'Reduce interval intensity'
        case 'hill':
          return 'Walk uphill instead of running'
        default:
          return 'Reduce pace by 10-15%'
      }
    } else if (sport === 'WeightTraining') {
      return 'Use lighter weights'
    }
    return 'Reduce intensity by 1-2 levels'
  }

  private static getHarderModification(workoutType: string, sport: string): string {
    if (sport === 'Run') {
      switch (workoutType) {
        case 'easy':
          return 'Add 2-3 short tempo segments'
        case 'recovery':
          return 'Increase pace slightly'
        case 'long':
          return 'Add 3-4 short hill climbs'
        default:
          return 'Increase pace by 10-15%'
      }
    } else if (sport === 'WeightTraining') {
      return 'Increase weight by 5-10%'
    }
    return 'Increase intensity by 1-2 levels'
  }

  private static getShorterModification(workoutType: string, sport: string): string {
    if (sport === 'Run') {
      switch (workoutType) {
        case 'long':
          return 'Reduce to 60-75 minutes'
        case 'tempo':
          return 'Focus on 20-30 minutes tempo'
        case 'threshold':
          return 'Reduce to 30-40 minutes'
        default:
          return 'Cut duration by 25-30%'
      }
    } else if (sport === 'WeightTraining') {
      return 'Focus on compound movements'
    }
    return 'Reduce duration by 25-30%'
  }

  private static getLongerModification(workoutType: string, sport: string): string {
    if (sport === 'Run') {
      switch (workoutType) {
        case 'easy':
          return 'Extend to 90-120 minutes'
        case 'long':
          return 'Add 30-45 minutes'
        case 'recovery':
          return 'Extend to 60-75 minutes'
        default:
          return 'Add 20-30 minutes'
      }
    } else if (sport === 'WeightTraining') {
      return 'Add 2-3 additional exercises'
    }
    return 'Extend duration by 25-30%'
  }

  /**
   * Generate dynamic content for a workout
   */
  static generateDynamicContent(workout: EnhancedWorkoutRecommendation, context?: Partial<DynamicContentContext>): {
    instructions: string[]
    tips: string[]
    modifications: {
      easier?: string
      harder?: string
      shorter?: string
      longer?: string
    }
  } {
    const dynamicContext: DynamicContentContext = {
      workoutType: workout.type,
      sport: workout.sport,
      intensity: workout.intensity,
      duration: workout.duration,
      distance: workout.distance,
      difficulty: workout.difficulty,
      ...context
    }

    return {
      instructions: this.generateInstructions(dynamicContext),
      tips: this.generateTips(dynamicContext),
      modifications: this.generateModifications(dynamicContext)
    }
  }
} 