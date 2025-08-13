import { TrainingZoneAnalysis } from '@/lib/training/zone-analysis';

describe('TrainingZoneAnalysis Zone Models', () => {
  let zoneAnalysis: TrainingZoneAnalysis;

  beforeEach(() => {
    zoneAnalysis = new TrainingZoneAnalysis();
  });

  describe('zone model creation', () => {
    it('should create 5-zone model with correct percentages', () => {
      const models = (zoneAnalysis as any).createZoneModels(200);
      const fiveZone = models.find((m: any) => m.name === '5-Zone Model');

      expect(fiveZone).toBeDefined();
      expect(fiveZone.zones).toHaveLength(5);
      expect(fiveZone.zones).toEqual([
        expect.objectContaining({
          number: 1,
          name: 'Recovery',
          minPercent: 50,
          maxPercent: 60,
          minHR: 100,
          maxHR: 120,
        }),
        expect.objectContaining({
          number: 2,
          name: 'Base/Aerobic',
          minPercent: 60,
          maxPercent: 70,
          minHR: 120,
          maxHR: 140,
        }),
        expect.objectContaining({
          number: 3,
          name: 'Tempo',
          minPercent: 70,
          maxPercent: 80,
          minHR: 140,
          maxHR: 160,
        }),
        expect.objectContaining({
          number: 4,
          name: 'Threshold',
          minPercent: 80,
          maxPercent: 90,
          minHR: 160,
          maxHR: 180,
        }),
        expect.objectContaining({
          number: 5,
          name: 'VO2 Max',
          minPercent: 90,
          maxPercent: 100,
          minHR: 180,
          maxHR: 200,
        }),
      ]);
    });

    it('should create 3-zone model with correct percentages', () => {
      const models = (zoneAnalysis as any).createZoneModels(200);
      const threeZone = models.find((m: any) => m.name === '3-Zone Model');

      expect(threeZone).toBeDefined();
      expect(threeZone.zones).toHaveLength(3);
      expect(threeZone.zones).toEqual([
        expect.objectContaining({
          number: 1,
          name: 'Easy',
          minPercent: 50,
          maxPercent: 70,
          minHR: 100,
          maxHR: 140,
        }),
        expect.objectContaining({
          number: 2,
          name: 'Moderate',
          minPercent: 70,
          maxPercent: 85,
          minHR: 140,
          maxHR: 170,
        }),
        expect.objectContaining({
          number: 3,
          name: 'Hard',
          minPercent: 85,
          maxPercent: 100,
          minHR: 170,
          maxHR: 200,
        }),
      ]);
    });

    it('should create Coggan model with correct percentages', () => {
      const models = (zoneAnalysis as any).createZoneModels(200);
      const cogganModel = models.find((m: any) => m.name === 'Coggan Model');

      expect(cogganModel).toBeDefined();
      expect(cogganModel.zones).toHaveLength(5);
      expect(cogganModel.zones[0].name).toBe('Active Recovery');
      expect(cogganModel.zones[1].name).toBe('Endurance');
      expect(cogganModel.zones[2].name).toBe('Tempo');
      expect(cogganModel.zones[3].name).toBe('Threshold');
      expect(cogganModel.zones[4].name).toBe('VO2 Max');
    });

    it('should use estimated max HR when none provided', () => {
      const models = (zoneAnalysis as any).createZoneModels(null);

      // Should use age-based estimation (220 - 30 = 190)
      const fiveZone = models.find((m: any) => m.name === '5-Zone Model');
      expect(fiveZone.zones[4].maxHR).toBe(190);
    });

    it('should use estimated max HR when HR is too low', () => {
      const models = (zoneAnalysis as any).createZoneModels(100); // Unrealistically low

      // Should use age-based estimation (220 - 30 = 190)
      const fiveZone = models.find((m: any) => m.name === '5-Zone Model');
      expect(fiveZone.zones[4].maxHR).toBe(190);
    });
  });

  describe('helper functions', () => {
    it('should normalize sport types correctly', () => {
      expect((zoneAnalysis as any).normalizeSportType('VirtualRun')).toBe(
        'Running'
      );
      expect((zoneAnalysis as any).normalizeSportType('Run')).toBe('Running');
      expect((zoneAnalysis as any).normalizeSportType('Ride')).toBe('Cycling');
      expect((zoneAnalysis as any).normalizeSportType('EBikeRide')).toBe(
        'Cycling'
      );
      expect((zoneAnalysis as any).normalizeSportType('bike')).toBe('Cycling');
      expect((zoneAnalysis as any).normalizeSportType('Swim')).toBe('Swimming');
      expect((zoneAnalysis as any).normalizeSportType('Walk')).toBe('Walking');
      expect((zoneAnalysis as any).normalizeSportType('Hike')).toBe('Walking');
      expect((zoneAnalysis as any).normalizeSportType('Other')).toBe('Other');
    });

    it('should calculate percentiles correctly', () => {
      const data = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190];

      // 50th percentile of 10 values should be average of 5th and 6th values: (140 + 150) / 2 = 145
      expect((zoneAnalysis as any).getPercentile(data, 50)).toBe(145);
      // 90th percentile should be close to the 9th value (index 8): 180
      expect((zoneAnalysis as any).getPercentile(data, 90)).toBe(189);
      // 100th percentile should be the maximum value
      expect((zoneAnalysis as any).getPercentile(data, 100)).toBe(190);
      expect((zoneAnalysis as any).getPercentile([], 50)).toBeNull();
    });

    it('should assess data quality correctly', () => {
      expect((zoneAnalysis as any).assessDataQuality(0, 10, 180)).toBe('none');
      expect((zoneAnalysis as any).assessDataQuality(2, 20, 180)).toBe('poor');
      expect((zoneAnalysis as any).assessDataQuality(8, 20, 180)).toBe('fair');
      expect((zoneAnalysis as any).assessDataQuality(15, 20, 180)).toBe('good');
      expect((zoneAnalysis as any).assessDataQuality(20, 20, 180)).toBe(
        'excellent'
      );
    });

    it('should calculate confidence levels correctly', () => {
      const excellentStats = {
        hrDataQuality: 'excellent',
        activitiesWithHR: 25,
      };
      const goodStats = { hrDataQuality: 'good', activitiesWithHR: 15 };
      const poorStats = { hrDataQuality: 'poor', activitiesWithHR: 5 };

      expect(
        (zoneAnalysis as any).calculateConfidence(excellentStats, [])
      ).toBe('high');
      expect((zoneAnalysis as any).calculateConfidence(goodStats, [])).toBe(
        'medium'
      );
      expect((zoneAnalysis as any).calculateConfidence(poorStats, [])).toBe(
        'low'
      );
    });

    it('should generate appropriate recommendations', () => {
      const poorStats = { hrDataQuality: 'poor', activitiesWithHR: 3 };
      const goodStats = { hrDataQuality: 'good', activitiesWithHR: 15 };
      const sportAnalysis = [
        {
          sport: 'Running',
          maxHR: 185,
          avgHR: 155,
          activityCount: 10,
          suggestedZones: [],
        },
        {
          sport: 'Cycling',
          maxHR: 175,
          avgHR: 145,
          activityCount: 8,
          suggestedZones: [],
        },
      ];

      const poorRecommendations = (zoneAnalysis as any).generateRecommendations(
        poorStats,
        []
      );
      expect(poorRecommendations).toContain(
        'Consider using a heart rate monitor for more activities to improve zone accuracy'
      );
      expect(poorRecommendations).toContain(
        'More heart rate data will improve zone recommendations'
      );

      const multiSportRecommendations = (
        zoneAnalysis as any
      ).generateRecommendations(goodStats, sportAnalysis);
      expect(multiSportRecommendations).toContain(
        'Consider sport-specific zones as your heart rate patterns vary between activities'
      );
    });

    it('should select best zone model appropriately', () => {
      const models = (zoneAnalysis as any).createZoneModels(190);
      const stats = { hrDataQuality: 'good', activitiesWithHR: 15 };

      const selected = (zoneAnalysis as any).selectBestZoneModel(models, stats);
      expect(selected.name).toBe('5-Zone Model');
    });
  });
});
