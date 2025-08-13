import { createClient } from '@/lib/supabase/server';

export interface HeartRateStats {
  maxHeartRate: number | null;
  averageHeartRate: number | null;
  restingHeartRate: number | null; // Can be estimated from lowest recorded
  activitiesWithHR: number;
  totalActivities: number;
  hrDataQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  percentiles: {
    p50: number | null; // Median
    p75: number | null;
    p85: number | null;
    p90: number | null;
    p95: number | null;
    p99: number | null;
  };
}

export interface TrainingZone {
  number: number;
  name: string;
  description: string;
  minHR: number;
  maxHR: number;
  minPercent: number;
  maxPercent: number;
  color: string;
}

export interface ZoneModel {
  name: string;
  description: string;
  zones: TrainingZone[];
}

export interface SportSpecificAnalysis {
  sport: string;
  maxHR: number | null;
  avgHR: number | null;
  activityCount: number;
  suggestedZones: TrainingZone[];
}

export interface ZoneAnalysisResult {
  overall: HeartRateStats;
  sportSpecific: SportSpecificAnalysis[];
  suggestedZoneModel: ZoneModel;
  alternativeModels: ZoneModel[];
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
  needsMoreData: boolean;
}

export class TrainingZoneAnalysis {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Main analysis function - analyzes user's activities and suggests training zones
   */
  async analyzeUserZones(userId: string): Promise<ZoneAnalysisResult> {
    console.log(`🔍 Starting zone analysis for user: ${userId}`);

    try {
      // 1. Get heart rate statistics from activities
      const hrStats = await this.getHeartRateStatistics(userId);
      console.log(`📊 HR Stats:`, hrStats);

      // 2. Get sport-specific analysis
      const sportAnalysis = await this.getSportSpecificAnalysis(userId);
      console.log(`🏃‍♂️ Sport analysis:`, sportAnalysis);

      // 3. Generate zone recommendations
      const recommendations = this.generateRecommendations(
        hrStats,
        sportAnalysis
      );

      // 4. Create zone models
      const zoneModels = this.createZoneModels(hrStats.maxHeartRate);

      // 5. Select best zone model
      const suggestedModel = this.selectBestZoneModel(zoneModels);

      // 6. Determine confidence level
      const confidence = this.calculateConfidence(hrStats);

      return {
        overall: hrStats,
        sportSpecific: sportAnalysis,
        suggestedZoneModel: suggestedModel,
        alternativeModels: zoneModels.filter(
          m => m.name !== suggestedModel.name
        ),
        recommendations,
        confidence,
        needsMoreData:
          hrStats.hrDataQuality === 'poor' || hrStats.hrDataQuality === 'none',
      };
    } catch (error) {
      console.error('❌ Zone analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze heart rate data from user's activities
   */
  private async getHeartRateStatistics(
    userId: string
  ): Promise<HeartRateStats> {
    const supabase = await this.supabase;

    // Get all activities with heart rate data
    const { data: activities, error } = await supabase
      .from('activities')
      .select('average_heartrate, max_heartrate, has_heartrate, sport_type')
      .eq('user_id', userId)
      .order('start_date_local', { ascending: false });

    if (error) {
      throw error;
    }

    if (!activities || activities.length === 0) {
      return this.getEmptyHeartRateStats();
    }

    // Filter activities with heart rate data
    const hrActivities = activities.filter(
      a => a.has_heartrate && a.average_heartrate
    );
    const totalActivities = activities.length;
    const activitiesWithHR = hrActivities.length;

    if (hrActivities.length === 0) {
      return {
        ...this.getEmptyHeartRateStats(),
        totalActivities,
        activitiesWithHR: 0,
      };
    }

    // Calculate statistics
    const maxHeartRate = Math.max(
      ...hrActivities.map(a => a.max_heartrate || a.average_heartrate)
    );
    const avgHeartRates = hrActivities
      .map(a => a.average_heartrate)
      .filter(hr => hr > 0);
    const averageHeartRate =
      avgHeartRates.reduce((sum, hr) => sum + hr, 0) / avgHeartRates.length;

    // Estimate resting HR (lowest 5th percentile of average HRs)
    const sortedAvgHR = avgHeartRates.sort((a, b) => a - b);
    const restingHeartRate =
      sortedAvgHR[Math.floor(sortedAvgHR.length * 0.05)] || null;

    // Calculate percentiles of max heart rates
    const maxHRs = hrActivities
      .map(a => a.max_heartrate || a.average_heartrate)
      .sort((a, b) => a - b);
    const percentiles = {
      p50: this.getPercentile(maxHRs, 50),
      p75: this.getPercentile(maxHRs, 75),
      p85: this.getPercentile(maxHRs, 85),
      p90: this.getPercentile(maxHRs, 90),
      p95: this.getPercentile(maxHRs, 95),
      p99: this.getPercentile(maxHRs, 99),
    };

    // Determine data quality
    const hrDataQuality = this.assessDataQuality(
      activitiesWithHR,
      totalActivities
    );

    return {
      maxHeartRate,
      averageHeartRate: Math.round(averageHeartRate),
      restingHeartRate: restingHeartRate ? Math.round(restingHeartRate) : null,
      activitiesWithHR,
      totalActivities,
      hrDataQuality,
      percentiles,
    };
  }

  /**
   * Analyze heart rate patterns by sport type
   */
  private async getSportSpecificAnalysis(
    userId: string
  ): Promise<SportSpecificAnalysis[]> {
    const supabase = await this.supabase;

    const { data: sportData, error } = await supabase
      .from('activities')
      .select('sport_type, average_heartrate, max_heartrate, has_heartrate')
      .eq('user_id', userId)
      .eq('has_heartrate', true)
      .not('average_heartrate', 'is', null);

    if (error || !sportData) {
      return [];
    }

    // Group by sport type
    const sportGroups = sportData.reduce(
      (groups, activity) => {
        const sport = this.normalizeSportType(activity.sport_type);
        if (!groups[sport]) groups[sport] = [];
        groups[sport].push(activity);
        return groups;
      },
      {} as Record<
        string,
        Array<{
          sport_type: string;
          max_heartrate?: number;
          average_heartrate?: number;
        }>
      >
    );

    // Analyze each sport
    return Object.entries(sportGroups)
      .filter(([, activities]) => activities.length >= 3) // Minimum 3 activities for analysis
      .map(([sport, activities]) => {
        const heartRates = activities
          .map(a => a.max_heartrate || a.average_heartrate)
          .filter((hr): hr is number => hr !== undefined && hr > 0);
        const maxHR = heartRates.length > 0 ? Math.max(...heartRates) : 0;

        const avgHRs = activities
          .map(a => a.average_heartrate)
          .filter((hr): hr is number => hr !== undefined && hr > 0);
        const avgHR =
          avgHRs.length > 0
            ? Math.round(
                avgHRs.reduce((sum, hr) => sum + hr, 0) / avgHRs.length
              )
            : 0;

        return {
          sport,
          maxHR,
          avgHR,
          activityCount: activities.length,
          suggestedZones: this.createZoneModels(maxHR)[0].zones, // Use 5-zone model
        };
      })
      .sort((a, b) => b.activityCount - a.activityCount); // Sort by activity count
  }

  /**
   * Create different zone models based on max heart rate
   */
  public createZoneModels(maxHR: number | null): ZoneModel[] {
    if (!maxHR || maxHR < 120) {
      // Use age-based estimation if no valid max HR
      const estimatedMaxHR = 220 - 30; // Assume 30 years old as default
      maxHR = estimatedMaxHR;
    }

    return [
      this.createFiveZoneModel(maxHR),
      this.createThreeZoneModel(maxHR),
      this.createCoganModel(maxHR),
    ];
  }

  /**
   * 5-Zone Heart Rate Model (Most common)
   */
  private createFiveZoneModel(maxHR: number): ZoneModel {
    const zones: TrainingZone[] = [
      {
        number: 1,
        name: 'Recovery',
        description: 'Active recovery, very easy effort',
        minPercent: 50,
        maxPercent: 60,
        minHR: Math.round(maxHR * 0.5),
        maxHR: Math.round(maxHR * 0.6),
        color: '#22c55e', // green
      },
      {
        number: 2,
        name: 'Base/Aerobic',
        description: 'Comfortable, conversational pace',
        minPercent: 60,
        maxPercent: 70,
        minHR: Math.round(maxHR * 0.6),
        maxHR: Math.round(maxHR * 0.7),
        color: '#3b82f6', // blue
      },
      {
        number: 3,
        name: 'Tempo',
        description: 'Comfortably hard, moderate effort',
        minPercent: 70,
        maxPercent: 80,
        minHR: Math.round(maxHR * 0.7),
        maxHR: Math.round(maxHR * 0.8),
        color: '#f59e0b', // yellow
      },
      {
        number: 4,
        name: 'Threshold',
        description: 'Hard effort, lactate threshold',
        minPercent: 80,
        maxPercent: 90,
        minHR: Math.round(maxHR * 0.8),
        maxHR: Math.round(maxHR * 0.9),
        color: '#f97316', // orange
      },
      {
        number: 5,
        name: 'VO2 Max',
        description: 'Very hard, maximum effort',
        minPercent: 90,
        maxPercent: 100,
        minHR: Math.round(maxHR * 0.9),
        maxHR: maxHR,
        color: '#ef4444', // red
      },
    ];

    return {
      name: '5-Zone Model',
      description: 'Classic 5-zone heart rate training model',
      zones,
    };
  }

  /**
   * 3-Zone Simplified Model
   */
  private createThreeZoneModel(maxHR: number): ZoneModel {
    const zones: TrainingZone[] = [
      {
        number: 1,
        name: 'Easy',
        description: 'Easy, aerobic base building',
        minPercent: 50,
        maxPercent: 70,
        minHR: Math.round(maxHR * 0.5),
        maxHR: Math.round(maxHR * 0.7),
        color: '#22c55e',
      },
      {
        number: 2,
        name: 'Moderate',
        description: 'Moderate, tempo efforts',
        minPercent: 70,
        maxPercent: 85,
        minHR: Math.round(maxHR * 0.7),
        maxHR: Math.round(maxHR * 0.85),
        color: '#f59e0b',
      },
      {
        number: 3,
        name: 'Hard',
        description: 'Hard, threshold and VO2 max',
        minPercent: 85,
        maxPercent: 100,
        minHR: Math.round(maxHR * 0.85),
        maxHR: maxHR,
        color: '#ef4444',
      },
    ];

    return {
      name: '3-Zone Model',
      description: 'Simplified 3-zone model for beginners',
      zones,
    };
  }

  /**
   * Coggan Power-Based Zones Adapted for HR
   */
  private createCoganModel(maxHR: number): ZoneModel {
    const zones: TrainingZone[] = [
      {
        number: 1,
        name: 'Active Recovery',
        description: 'Active recovery, < 68% max HR',
        minPercent: 50,
        maxPercent: 68,
        minHR: Math.round(maxHR * 0.5),
        maxHR: Math.round(maxHR * 0.68),
        color: '#22c55e',
      },
      {
        number: 2,
        name: 'Endurance',
        description: 'Endurance, 69-83% max HR',
        minPercent: 69,
        maxPercent: 83,
        minHR: Math.round(maxHR * 0.69),
        maxHR: Math.round(maxHR * 0.83),
        color: '#3b82f6',
      },
      {
        number: 3,
        name: 'Tempo',
        description: 'Tempo, 84-94% max HR',
        minPercent: 84,
        maxPercent: 94,
        minHR: Math.round(maxHR * 0.84),
        maxHR: Math.round(maxHR * 0.94),
        color: '#f59e0b',
      },
      {
        number: 4,
        name: 'Threshold',
        description: 'Lactate threshold, 95-105% max HR',
        minPercent: 95,
        maxPercent: 105,
        minHR: Math.round(maxHR * 0.95),
        maxHR: Math.min(Math.round(maxHR * 1.05), maxHR),
        color: '#f97316',
      },
      {
        number: 5,
        name: 'VO2 Max',
        description: 'VO2 max, 106%+ max HR',
        minPercent: 106,
        maxPercent: 120,
        minHR: Math.round(maxHR * 1.06),
        maxHR: Math.round(maxHR * 1.2),
        color: '#ef4444',
      },
    ];

    return {
      name: 'Coggan Model',
      description: 'Coggan-style zones adapted for heart rate',
      zones,
    };
  }

  /**
   * Helper functions
   */
  private getEmptyHeartRateStats(): HeartRateStats {
    return {
      maxHeartRate: null,
      averageHeartRate: null,
      restingHeartRate: null,
      activitiesWithHR: 0,
      totalActivities: 0,
      hrDataQuality: 'none',
      percentiles: {
        p50: null,
        p75: null,
        p85: null,
        p90: null,
        p95: null,
        p99: null,
      },
    };
  }

  private getPercentile(
    sortedArray: number[],
    percentile: number
  ): number | null {
    if (sortedArray.length === 0) return null;

    // Use linear interpolation method (R-6/Excel method)
    const n = sortedArray.length;
    const rank = (percentile / 100) * (n + 1);

    if (rank <= 1) return sortedArray[0];
    if (rank >= n) return sortedArray[n - 1];

    const lowerIndex = Math.floor(rank) - 1;
    const upperIndex = Math.ceil(rank) - 1;
    const weight = rank - Math.floor(rank);

    return (
      sortedArray[lowerIndex] +
      weight * (sortedArray[upperIndex] - sortedArray[lowerIndex])
    );
  }

  private assessDataQuality(
    hrActivities: number,
    totalActivities: number
  ): HeartRateStats['hrDataQuality'] {
    const hrPercentage =
      totalActivities > 0 ? (hrActivities / totalActivities) * 100 : 0;

    if (hrPercentage === 0) return 'none';
    if (hrPercentage < 20 || hrActivities < 5) return 'poor';
    if (hrPercentage < 50 || hrActivities < 10) return 'fair';
    if (hrPercentage < 80 || hrActivities < 20) return 'good';
    return 'excellent';
  }

  private normalizeSportType(sportType: string): string {
    const sport = sportType.toLowerCase();
    if (sport.includes('run')) return 'Running';
    if (
      sport.includes('ride') ||
      sport.includes('bike') ||
      sport.includes('cycling')
    )
      return 'Cycling';
    if (sport.includes('swim')) return 'Swimming';
    if (sport.includes('walk') || sport.includes('hike')) return 'Walking';
    return sportType;
  }

  private selectBestZoneModel(models: ZoneModel[]): ZoneModel {
    // For now, default to 5-zone model
    // Could be more intelligent based on user data in the future
    return models.find(m => m.name === '5-Zone Model') || models[0];
  }

  private calculateConfidence(
    stats: HeartRateStats
  ): 'high' | 'medium' | 'low' {
    if (stats.hrDataQuality === 'excellent' && stats.activitiesWithHR >= 20)
      return 'high';
    if (stats.hrDataQuality === 'good' && stats.activitiesWithHR >= 10)
      return 'medium';
    return 'low';
  }

  private generateRecommendations(
    stats: HeartRateStats,
    sportAnalysis: SportSpecificAnalysis[]
  ): string[] {
    const recommendations: string[] = [];

    if (stats.hrDataQuality === 'poor' || stats.hrDataQuality === 'none') {
      recommendations.push(
        'Consider using a heart rate monitor for more activities to improve zone accuracy'
      );
    }

    if (stats.activitiesWithHR < 10) {
      recommendations.push(
        'More heart rate data will improve zone recommendations'
      );
    }

    if (sportAnalysis.length > 1) {
      recommendations.push(
        'Consider sport-specific zones as your heart rate patterns vary between activities'
      );
    }

    if (stats.maxHeartRate && stats.maxHeartRate < 160) {
      recommendations.push(
        'Your max heart rate seems low - consider a max HR test for better accuracy'
      );
    }

    return recommendations;
  }
}
