import type { Activity } from '@/lib/strava/types'
import type { TrainingLoadMetrics } from './training-load'
import type { UserGoal } from '@/types/goals'

export interface EnhancedWorkoutRecommendation {
  id: string
  type: 'easy' | 'tempo' | 'threshold' | 'long' | 'recovery' | 'strength' | 'cross-training' | 'interval' | 'fartlek' | 'hill'
  sport: 'Run' | 'Ride' | 'Swim' | 'Workout' | 'WeightTraining' | 'Yoga' | 'CrossTraining' | 'Walk'
  duration: number // minutes
  intensity: number // 1-10 scale
  distance?: number // km, for distance-based workouts
  reasoning: string // Why this workout is recommended
  alternatives: EnhancedWorkoutRecommendation[]
  goalAlignment?: string // How it aligns with user goals
  weatherConsideration?: string // Weather-based adjustments
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  energyCost: number // 1-10 scale
  recoveryTime: number // hours needed
  equipment?: string[] // Required equipment
  instructions?: string[] // Step-by-step instructions
  tips?: string[] // Pro tips for the workout
  modifications?: {
    easier?: string
    harder?: string
    shorter?: string
    longer?: string
  }
}

export interface WeeklyWorkoutPlan {
  id: string
  weekStart: string // ISO date
  workouts: {
    [dayOfWeek: number]: EnhancedWorkoutRecommendation | null // 0 = Sunday, 1 = Monday, etc.
  }
  totalTSS: number
  totalDistance: number
  totalTime: number
  periodizationPhase: 'base' | 'build' | 'peak' | 'recovery'
  notes?: string
  isEditable: boolean
}

export interface WorkoutPlanningContext {
  userId: string
  currentTrainingLoad: TrainingLoadMetrics
  recentActivities: Activity[]
  userGoals: UserGoal[]
  userPreferences: {
    preferredSports: string[]
    availableTime: number // minutes per day
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
    unitPreferences?: {
      distance: string
      pace: string
    }
    weatherConditions?: {
      temperature: number
      precipitation: number
      windSpeed: number
    }
    equipment?: string[]
    injuries?: string[]
    limitations?: string[]
  }
}

export class EnhancedWorkoutPlanner {
  private context: WorkoutPlanningContext

  constructor(context: WorkoutPlanningContext) {
    this.context = context
  }

  /**
   * Generate today's workout with enhanced reasoning
   */
  generateTodaysWorkout(): EnhancedWorkoutRecommendation | null {
    const { currentTrainingLoad, recentActivities, userGoals } = this.context

    // Check recovery needs first
    if (this.shouldRecommendRecovery()) {
      return this.createRecoveryWorkout()
    }

    // Check for goal-specific workouts
    const goalSpecificWorkout = this.createGoalSpecificWorkout()
    if (goalSpecificWorkout) {
      return goalSpecificWorkout
    }

    // Check for long run day
    if (this.shouldRecommendLongWorkout()) {
      return this.createLongWorkout()
    }

    // Check for intensity work
    if (this.shouldRecommendIntensityWork()) {
      return this.createIntensityWorkout()
    }

    // Default to moderate workout
    return this.createModerateWorkout()
  }

  /**
   * Generate weekly plan with periodization
   */
  generateWeeklyPlan(): WeeklyWorkoutPlan {
    const weekStart = this.getWeekStart()
    const workouts: { [dayOfWeek: number]: EnhancedWorkoutRecommendation | null } = {}
    
    console.log('--- generateWeeklyPlan DEBUG ---')
    console.log('weekStart:', weekStart)
    console.log('context.currentTrainingLoad:', this.context.currentTrainingLoad)
    console.log('context.recentActivities.length:', this.context.recentActivities.length)
    console.log('context.userGoals:', this.context.userGoals)
    console.log('context.userPreferences:', this.context.userPreferences)

    // Generate workouts for each day
    for (let day = 0; day < 7; day++) {
      const workout = this.generateWorkoutForDay(day)
      console.log(`Day ${day}:`, workout)
      workouts[day] = workout
    }

    // If all workouts are null, log a warning
    if (Object.values(workouts).every(w => w === null)) {
      console.warn('All generated workouts are null! Check input data and generation logic.')
    }

    // Calculate totals
    const totalTSS = this.calculateWeeklyTSS(workouts)
    const totalDistance = this.calculateWeeklyDistance(workouts)
    const totalTime = this.calculateWeeklyTime(workouts)
    const periodizationPhase = this.determinePeriodizationPhase()

    const result = {
      id: `week-${weekStart}`,
      weekStart,
      workouts,
      totalTSS,
      totalDistance,
      totalTime,
      periodizationPhase,
      isEditable: true
    }
    
    return result
  }

  /**
   * Create a recovery workout with detailed instructions
   */
  private createRecoveryWorkout(): EnhancedWorkoutRecommendation {
    const baseRecommendation: EnhancedWorkoutRecommendation = {
      id: `recovery-${Date.now()}`,
      type: 'recovery',
      sport: 'Run',
      duration: 30,
      intensity: 3,
      difficulty: 'beginner',
      energyCost: 2,
      recoveryTime: 2,
      reasoning: 'Your training stress balance is low, indicating high fatigue. A light recovery session will help you bounce back.',
      alternatives: [
        {
          id: `recovery-yoga-${Date.now()}`,
          type: 'recovery',
          sport: 'Yoga',
          duration: 45,
          intensity: 2,
          difficulty: 'beginner',
          energyCost: 1,
          recoveryTime: 1,
          reasoning: 'Gentle yoga can help with recovery and flexibility.',
          alternatives: [],
          instructions: [
            'Start with 5 minutes of gentle breathing',
            'Move through basic sun salutations slowly',
            'Hold poses for 30-60 seconds',
            'Focus on deep breathing throughout',
            'End with 5 minutes of relaxation'
          ],
          tips: [
            'Listen to your body - don\'t push into discomfort',
            'Focus on breathing rather than perfect form',
            'Use props if needed for support'
          ]
        },
        {
          id: `recovery-swim-${Date.now()}`,
          type: 'recovery',
          sport: 'Swim',
          duration: 20,
          intensity: 2,
          difficulty: 'intermediate',
          energyCost: 3,
          recoveryTime: 2,
          reasoning: 'Low-impact swimming is excellent for active recovery.',
          alternatives: [],
          instructions: [
            'Start with 5 minutes of easy freestyle',
            'Include 5 minutes of backstroke',
            'Add 5 minutes of gentle kicking',
            'Finish with 5 minutes of easy freestyle'
          ],
          tips: [
            'Focus on technique over speed',
            'Keep effort very light',
            'Stop if you feel any discomfort'
          ]
        }
      ],
      instructions: [
        'Start with 5 minutes of walking',
        'Gradually increase to a very easy jog',
        'Keep pace conversational - you should be able to talk easily',
        'Include 2-3 walking breaks if needed',
        'Finish with 5 minutes of walking'
      ],
      tips: [
        'Keep heart rate below 65% of max',
        'Focus on good form and relaxation',
        'Stop if you feel any pain or excessive fatigue'
      ],
      modifications: {
        easier: 'Walk instead of run, or reduce duration to 20 minutes',
        harder: 'Add 5 minutes of very light stretching',
        shorter: 'Reduce to 20 minutes',
        longer: 'Extend to 45 minutes but keep intensity very low'
      }
    }

    return this.adjustForWeather(baseRecommendation)
  }

  /**
   * Create goal-specific workouts
   */
  private createGoalSpecificWorkout(): EnhancedWorkoutRecommendation | null {
    const { userGoals, recentActivities } = this.context
    
    // Find active goals
    const activeGoals = userGoals.filter(g => g.is_active && !g.is_completed)
    
    if (activeGoals.length === 0) return null

    // Prioritize goals by type
    const distanceGoals = activeGoals.filter(g => g.goal_type?.metric_type === 'total_distance')
    const paceGoals = activeGoals.filter(g => g.goal_type?.metric_type === 'average_pace')
    const frequencyGoals = activeGoals.filter(g => g.goal_type?.metric_type === 'run_count')

    // Create goal-specific workouts
    if (distanceGoals.length > 0) {
      return this.createDistanceGoalWorkout(distanceGoals[0])
    }

    if (paceGoals.length > 0) {
      return this.createPaceGoalWorkout(paceGoals[0])
    }

    if (frequencyGoals.length > 0) {
      return this.createFrequencyGoalWorkout(frequencyGoals[0])
    }

    return null
  }

  /**
   * Create workout for distance goals
   */
  private createDistanceGoalWorkout(goal: UserGoal): EnhancedWorkoutRecommendation {
    const currentProgress = goal.current_progress || 0
    const targetValue = goal.target_value || 0
    const progressPercentage = (currentProgress / targetValue) * 100

    if (progressPercentage < 50) {
      // Need to build volume
      return {
        id: `distance-volume-${Date.now()}`,
        type: 'long',
        sport: 'Run',
        duration: 60,
        intensity: 4,
        distance: 8,
        difficulty: 'intermediate',
        energyCost: 6,
        recoveryTime: 24,
        reasoning: `You're ${Math.round(progressPercentage)}% toward your distance goal. This long run will help build the endurance needed.`,
        alternatives: [],
        instructions: [
          'Start with 10 minutes of easy jogging',
          'Gradually increase pace to moderate effort',
          'Maintain steady pace for 40 minutes',
          'Finish with 10 minutes of easy jogging'
        ],
        tips: [
          'Keep effort conversational for most of the run',
          'Fuel with water or sports drink if over 60 minutes',
          'Focus on consistent pace rather than speed'
        ],
        modifications: {
          easier: 'Reduce distance to 6km and duration to 45 minutes',
          harder: 'Increase distance to 10km and add 2-3 tempo segments',
          shorter: 'Reduce to 45 minutes total',
          longer: 'Extend to 90 minutes with more distance'
        }
      }
    } else {
      // Need to maintain or add quality
      return this.createIntensityWorkout()
    }
  }

  /**
   * Create workout for pace goals
   */
  private createPaceGoalWorkout(goal: UserGoal): EnhancedWorkoutRecommendation {
    return {
      id: `pace-interval-${Date.now()}`,
      type: 'interval',
      sport: 'Run',
      duration: 45,
      intensity: 8,
      distance: 6,
      difficulty: 'advanced',
      energyCost: 8,
      recoveryTime: 48,
      reasoning: 'To improve pace, you need structured speed work. This interval session will target your lactate threshold.',
      alternatives: [
        {
          id: `pace-tempo-${Date.now()}`,
          type: 'tempo',
          sport: 'Run',
          duration: 40,
          intensity: 7,
          distance: 8,
          difficulty: 'intermediate',
          energyCost: 7,
          recoveryTime: 36,
          reasoning: 'Tempo runs improve your lactate threshold, which is key for pace improvement.',
          alternatives: []
        }
      ],
      instructions: [
        'Warm up with 10 minutes of easy jogging',
        'Run 6 x 800m at 5K pace with 2-minute recovery',
        'Keep intervals consistent - don\'t start too fast',
        'Cool down with 10 minutes of easy jogging'
      ],
      tips: [
        'Use a track or measured route for accurate intervals',
        'Focus on maintaining pace in later intervals',
        'Don\'t run intervals faster than 5K race pace'
      ],
      modifications: {
        easier: 'Reduce to 4 x 600m intervals',
        harder: 'Increase to 8 x 800m or add 400m intervals',
        shorter: 'Reduce to 4 intervals',
        longer: 'Add 2 more intervals or extend warm-up/cool-down'
      }
    }
  }

  /**
   * Create workout for frequency goals
   */
  private createFrequencyGoalWorkout(goal: UserGoal): EnhancedWorkoutRecommendation {
    return {
      id: `frequency-easy-${Date.now()}`,
      type: 'easy',
      sport: 'Run',
      duration: 30,
      intensity: 3,
      distance: 4,
      difficulty: 'beginner',
      energyCost: 3,
      recoveryTime: 12,
      reasoning: 'To build consistency, focus on easy, enjoyable runs that you can complete regularly.',
      alternatives: [
        {
          id: `frequency-walk-${Date.now()}`,
          type: 'easy',
          sport: 'Walk',
          duration: 45,
          intensity: 2,
          difficulty: 'beginner',
          energyCost: 2,
          recoveryTime: 6,
          reasoning: 'Walking is a great way to build the habit of daily activity.',
          alternatives: []
        }
      ],
      instructions: [
        'Start with 5 minutes of walking',
        'Gradually increase to a very easy jog',
        'Keep pace very comfortable - you should be able to talk easily',
        'Include walking breaks if needed',
        'Finish with 5 minutes of walking'
      ],
      tips: [
        'Focus on consistency over intensity',
        'Make it enjoyable - listen to music or podcasts',
        'Don\'t worry about pace or distance initially'
      ],
      modifications: {
        easier: 'Walk-run intervals (1 min run, 2 min walk)',
        harder: 'Add 5 minutes of moderate pace in the middle',
        shorter: 'Reduce to 20 minutes',
        longer: 'Extend to 45 minutes but keep intensity low'
      }
    }
  }

  /**
   * Create intensity workout with variety
   */
  private createIntensityWorkout(): EnhancedWorkoutRecommendation {
    const { userPreferences } = this.context
    const isAdvanced = userPreferences.experienceLevel === 'advanced'

    if (isAdvanced) {
      return {
        id: `advanced-interval-${Date.now()}`,
        type: 'interval',
        sport: 'Run',
        duration: 60,
        intensity: 9,
        distance: 8,
        difficulty: 'advanced',
        energyCost: 9,
        recoveryTime: 48,
        reasoning: 'Advanced interval training will push your VO2 max and improve race performance.',
        alternatives: [
          {
            id: `advanced-fartlek-${Date.now()}`,
            type: 'fartlek',
            sport: 'Run',
            duration: 50,
            intensity: 8,
            distance: 10,
            difficulty: 'advanced',
            energyCost: 8,
            recoveryTime: 36,
            reasoning: 'Fartlek training improves both aerobic and anaerobic capacity.',
            alternatives: []
          }
        ],
        instructions: [
          'Warm up with 15 minutes of easy jogging',
          'Run 8 x 400m at mile pace with 90-second recovery',
          'Follow with 4 x 200m at 800m pace with 2-minute recovery',
          'Cool down with 15 minutes of easy jogging'
        ],
        tips: [
          'Use a track for accurate distances',
          'Focus on maintaining form when tired',
          'Don\'t run intervals faster than mile race pace'
        ]
      }
    } else {
      return {
        id: `tempo-${Date.now()}`,
        type: 'tempo',
        sport: 'Run',
        duration: 45,
        intensity: 7,
        distance: 8,
        difficulty: 'intermediate',
        energyCost: 7,
        recoveryTime: 36,
        reasoning: 'Tempo runs improve your lactate threshold, which is key for race performance.',
        alternatives: [
          {
            id: `threshold-${Date.now()}`,
            type: 'threshold',
            sport: 'Run',
            duration: 30,
            intensity: 8,
            distance: 5,
            difficulty: 'intermediate',
            energyCost: 8,
            recoveryTime: 48,
            reasoning: 'Threshold intervals will improve your aerobic capacity.',
            alternatives: []
          }
        ],
        instructions: [
          'Warm up with 10 minutes of easy jogging',
          'Run 20 minutes at half-marathon pace',
          'Keep effort steady - you should be able to speak in short phrases',
          'Cool down with 10 minutes of easy jogging'
        ],
        tips: [
          'Don\'t start too fast - build into the pace',
          'Focus on maintaining consistent effort',
          'Use heart rate monitor if available (85-90% of max HR)'
        ]
      }
    }
  }

  /**
   * Create long workout for endurance
   */
  private createLongWorkout(): EnhancedWorkoutRecommendation {
    const { userPreferences } = this.context
    const isAdvanced = userPreferences.experienceLevel === 'advanced'

    return {
      id: `long-${Date.now()}`,
      type: 'long',
      sport: 'Run',
      duration: isAdvanced ? 90 : 60,
      intensity: 4,
      distance: isAdvanced ? 16 : 10,
      difficulty: isAdvanced ? 'advanced' : 'intermediate',
      energyCost: 7,
      recoveryTime: 48,
      reasoning: 'Long runs build endurance and prepare you for longer races. This is the foundation of your training.',
      alternatives: [
        {
          id: `long-ride-${Date.now()}`,
          type: 'long',
          sport: 'Ride',
          duration: isAdvanced ? 120 : 90,
          intensity: 4,
          distance: isAdvanced ? 40 : 25,
          difficulty: isAdvanced ? 'advanced' : 'intermediate',
          energyCost: 6,
          recoveryTime: 36,
          reasoning: 'Long cycling sessions provide excellent endurance training with less impact.',
          alternatives: []
        }
      ],
      instructions: [
        'Start with 10 minutes of easy jogging',
        'Gradually increase to moderate pace',
        'Maintain steady effort for the middle portion',
        'Include 2-3 walking breaks if needed',
        'Finish with 10 minutes of easy jogging'
      ],
      tips: [
        'Keep effort conversational for most of the run',
        'Fuel with water and energy gels if over 90 minutes',
        'Focus on time on feet rather than speed',
        'Plan your route to include water stops'
      ],
      modifications: {
        easier: 'Reduce duration to 45 minutes and add walking breaks',
        harder: 'Add 2-3 tempo segments of 5 minutes each',
        shorter: 'Reduce to 45 minutes total',
        longer: 'Extend to 2 hours but keep intensity low'
      }
    }
  }

  /**
   * Create moderate workout for general fitness
   */
  private createModerateWorkout(): EnhancedWorkoutRecommendation {
    return {
      id: `moderate-${Date.now()}`,
      type: 'easy',
      sport: 'Run',
      duration: 45,
      intensity: 5,
      distance: 6,
      difficulty: 'intermediate',
      energyCost: 5,
      recoveryTime: 24,
      reasoning: 'A moderate session to maintain fitness and build consistency.',
      alternatives: [
        {
          id: `moderate-ride-${Date.now()}`,
          type: 'easy',
          sport: 'Ride',
          duration: 60,
          intensity: 4,
          distance: 20,
          difficulty: 'intermediate',
          energyCost: 4,
          recoveryTime: 18,
          reasoning: 'Cycling provides good aerobic training with less impact.',
          alternatives: []
        }
      ],
      instructions: [
        'Start with 5 minutes of easy jogging',
        'Gradually increase to moderate pace',
        'Maintain steady effort for 30 minutes',
        'Include 1-2 walking breaks if needed',
        'Finish with 5 minutes of easy jogging'
      ],
      tips: [
        'Keep effort conversational',
        'Focus on good form and relaxation',
        'Don\'t push too hard - this is a maintenance run'
      ],
      modifications: {
        easier: 'Add more walking breaks or reduce duration',
        harder: 'Add 2-3 short tempo segments',
        shorter: 'Reduce to 30 minutes',
        longer: 'Extend to 60 minutes but keep intensity moderate'
      }
    }
  }

  /**
   * Generate workout for specific day with periodization
   */
  private generateWorkoutForDay(dayOffset: number): EnhancedWorkoutRecommendation | null {
    const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
    const targetDay = (today + dayOffset) % 7
    const mondayBasedDay = targetDay === 0 ? 6 : targetDay - 1

    console.log(`generateWorkoutForDay(dayOffset=${dayOffset})`)
    console.log('  today:', today, 'targetDay:', targetDay, 'mondayBasedDay:', mondayBasedDay)
    console.log('  currentTrainingLoad:', this.context.currentTrainingLoad)
    console.log('  recentActivities.length:', this.context.recentActivities.length)
    console.log('  userGoals:', this.context.userGoals)

    // Weekly periodization pattern
    switch (mondayBasedDay) {
      case 0: // Monday - Start of week
        return this.createModerateWorkout()
      
      case 1: // Tuesday - Quality session
        if (this.shouldRecommendIntensityWork()) {
          return this.createIntensityWorkout()
        }
        return this.createModerateWorkout()
      
      case 2: // Wednesday - Recovery or easy
        if (this.shouldRecommendRecovery()) {
          return this.createRecoveryWorkout()
        }
        return this.createEasyWorkout()
      
      case 3: // Thursday - Quality session
        if (this.shouldRecommendIntensityWork()) {
          return this.createIntensityWorkout()
        }
        return this.createModerateWorkout()
      
      case 4: // Friday - Easy or recovery
        if (this.shouldRecommendRecovery()) {
          return this.createRecoveryWorkout()
        }
        return this.createEasyWorkout()
      
      case 5: // Saturday - Long workout
        if (this.shouldRecommendLongWorkout()) {
          return this.createLongWorkout()
        }
        return this.createModerateWorkout()
      
      case 6: // Sunday - Recovery or rest
        if (this.shouldRecommendRecovery()) {
          return this.createRecoveryWorkout()
        }
        // Only rest if we have a lot of training load, otherwise provide an easy workout
        if (this.context.currentTrainingLoad && this.context.currentTrainingLoad.acute > 50) {
          return null // Rest day
        }
        return this.createEasyWorkout() // Default to easy workout instead of rest
      
      default:
        return this.createModerateWorkout()
    }
  }

  /**
   * Create easy workout
   */
  private createEasyWorkout(): EnhancedWorkoutRecommendation {
    return {
      id: `easy-${Date.now()}`,
      type: 'easy',
      sport: 'Run',
      duration: 30,
      intensity: 3,
      distance: 4,
      difficulty: 'beginner',
      energyCost: 3,
      recoveryTime: 12,
      reasoning: 'An easy session to promote recovery and maintain aerobic fitness.',
      alternatives: [
        {
          id: `easy-ride-${Date.now()}`,
          type: 'easy',
          sport: 'Ride',
          duration: 45,
          intensity: 3,
          distance: 15,
          difficulty: 'beginner',
          energyCost: 3,
          recoveryTime: 12,
          reasoning: 'Easy cycling is great for active recovery.',
          alternatives: []
        }
      ],
      instructions: [
        'Start with 5 minutes of walking',
        'Gradually increase to very easy jogging',
        'Keep pace very comfortable',
        'Include walking breaks if needed',
        'Finish with 5 minutes of walking'
      ],
      tips: [
        'Focus on enjoyment and relaxation',
        'Don\'t worry about pace or distance',
        'Make it social if possible'
      ]
    }
  }

  /**
   * Check if user needs recovery
   */
  private shouldRecommendRecovery(): boolean {
    const { currentTrainingLoad, recentActivities } = this.context
    
    // If we don't have enough data, don't force recovery
    if (!currentTrainingLoad || recentActivities.length < 3) {
      return false
    }
    
    // Only recommend recovery if there's clear evidence of overtraining
    if (currentTrainingLoad.balance < -30) {
      return true
    }
    if (currentTrainingLoad.acute > 100) {
      return true
    }

    const recentIntenseWorkouts = recentActivities
      .slice(0, 3)
      .filter(activity => {
        const load = (activity as Activity & { training_load_score?: number }).training_load_score || 0
        return load > 80 // Higher threshold for "intense"
      })

    return recentIntenseWorkouts.length >= 3
  }

  /**
   * Check if user should do intensity work
   */
  private shouldRecommendIntensityWork(): boolean {
    const { currentTrainingLoad } = this.context
    
    // Good for intensity if TSB is positive and ATL isn't too high
    return currentTrainingLoad && currentTrainingLoad.balance > 0 && currentTrainingLoad.acute < 70
  }

  /**
   * Check if user should do long workout
   */
  private shouldRecommendLongWorkout(): boolean {
    const { currentTrainingLoad } = this.context
    
    // Good for long run if TSB is positive and CTL supports it
    return currentTrainingLoad && currentTrainingLoad.balance > -10 && currentTrainingLoad.chronic > 70
  }

  /**
   * Adjust workout for weather conditions
   */
  private adjustForWeather(workout: EnhancedWorkoutRecommendation): EnhancedWorkoutRecommendation {
    const { userPreferences } = this.context
    const weather = userPreferences.weatherConditions

    if (!weather) return workout

    const { temperature, precipitation, windSpeed } = weather

    // Hot weather adjustments
    if (temperature > 25) {
      workout.weatherConsideration = 'High temperature - reduce intensity by 1-2 points and stay hydrated'
      workout.intensity = Math.max(1, workout.intensity - 1)
      workout.duration = Math.min(workout.duration, 45) // Cap duration in heat
    }

    // Cold weather adjustments
    if (temperature < 5) {
      workout.weatherConsideration = 'Cold weather - warm up thoroughly and dress in layers'
      workout.duration += 5 // Extra warm-up time
    }

    // Rain adjustments
    if (precipitation > 0.5) {
      workout.weatherConsideration = 'Wet conditions - reduce intensity and be extra careful on turns'
      workout.intensity = Math.max(1, workout.intensity - 1)
    }

    // Windy conditions
    if (windSpeed > 20) {
      workout.weatherConsideration = 'High winds - consider indoor alternatives or reduce intensity'
      workout.alternatives.push({
        id: `indoor-${Date.now()}`,
        type: 'easy',
        sport: 'Workout',
        duration: workout.duration,
        intensity: workout.intensity - 1,
        difficulty: workout.difficulty,
        energyCost: workout.energyCost - 1,
        recoveryTime: workout.recoveryTime,
        reasoning: 'Indoor workout to avoid windy conditions',
        alternatives: []
      })
    }

    return workout
  }

  /**
   * Calculate weekly TSS
   */
  private calculateWeeklyTSS(workouts: { [dayOfWeek: number]: EnhancedWorkoutRecommendation | null }): number {
    return Object.values(workouts)
      .filter(workout => workout !== null)
      .reduce((total, workout) => {
        // Rough TSS calculation based on duration and intensity
        const tss = (workout!.duration / 60) * (workout!.intensity / 10) * 100
        return total + tss
      }, 0)
  }

  /**
   * Calculate weekly distance
   */
  private calculateWeeklyDistance(workouts: { [dayOfWeek: number]: EnhancedWorkoutRecommendation | null }): number {
    return Object.values(workouts)
      .filter(workout => workout !== null)
      .reduce((total, workout) => total + (workout!.distance || 0), 0)
  }

  /**
   * Calculate weekly time
   */
  private calculateWeeklyTime(workouts: { [dayOfWeek: number]: EnhancedWorkoutRecommendation | null }): number {
    return Object.values(workouts)
      .filter(workout => workout !== null)
      .reduce((total, workout) => total + workout!.duration, 0)
  }

  /**
   * Determine periodization phase
   */
  private determinePeriodizationPhase(): 'base' | 'build' | 'peak' | 'recovery' {
    const { currentTrainingLoad } = this.context
    
    if (currentTrainingLoad.balance < -15) return 'recovery'
    if (currentTrainingLoad.chronic < 30) return 'base'
    if (currentTrainingLoad.chronic > 60) return 'peak'
    return 'build'
  }

  /**
   * Get week start date
   */
  private getWeekStart(): string {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const monday = new Date(today)
    monday.setDate(today.getDate() - daysToMonday)
    return monday.toISOString().split('T')[0]
  }
}

/**
 * Generate enhanced workout recommendations
 */
export function generateEnhancedWorkoutRecommendations(
  userId: string,
  activities: Activity[],
  trainingLoadMetrics: TrainingLoadMetrics,
  userGoals: UserGoal[],
  userPreferences: any
): {
  todaysWorkout: EnhancedWorkoutRecommendation | null
  weeklyPlan: WeeklyWorkoutPlan | null
} {
  const context: WorkoutPlanningContext = {
    userId,
    currentTrainingLoad: trainingLoadMetrics,
    recentActivities: activities.slice(0, 20),
    userGoals,
    userPreferences: {
      preferredSports: ['Run', 'Ride', 'Swim'],
      availableTime: 60,
      experienceLevel: 'intermediate',
      ...userPreferences
    }
  }

  const planner = new EnhancedWorkoutPlanner(context)
  
  return {
    todaysWorkout: planner.generateTodaysWorkout(),
    weeklyPlan: planner.generateWeeklyPlan()
  }
} 