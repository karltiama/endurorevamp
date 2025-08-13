'use client';

import { useState } from 'react';
import {
  useZoneInfo,
  useCustomZoneAnalysis,
  useZoneCalculations,
} from '@/hooks/use-zone-analysis';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function ZoneAnalysisDashboard() {
  const {
    analysis,
    isLoading,
    error,
    zones,
    maxHeartRate,
    dataQuality,
    confidence,
    needsMoreData,
    formatConfidenceLevel,
    getDataQualityInfo,
  } = useZoneInfo();

  const customAnalysis = useCustomZoneAnalysis();
  const { getTargetZoneRecommendation } = useZoneCalculations();

  // Custom zone form state
  const [customMaxHR, setCustomMaxHR] = useState('');
  const [selectedZoneModel, setSelectedZoneModel] = useState<
    '5-zone' | '3-zone' | 'coggan'
  >('5-zone');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const handleCustomAnalysis = () => {
    const maxHR = parseInt(customMaxHR);
    if (maxHR > 100 && maxHR < 250) {
      customAnalysis.mutate({
        maxHeartRate: maxHR,
        zoneModel: selectedZoneModel,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          Failed to analyze training zones: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!analysis) {
    return (
      <Alert>
        <AlertDescription>
          No zone analysis data available. Please sync some activities with
          heart rate data first.
        </AlertDescription>
      </Alert>
    );
  }

  const confidenceInfo = formatConfidenceLevel(confidence || 'low');
  const qualityInfo = getDataQualityInfo(dataQuality || 'none');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Training Zone Analysis
          </h2>
          <p className="text-gray-600">
            Personalized heart rate training zones based on your activity data
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowCustomForm(!showCustomForm)}
        >
          {showCustomForm ? 'Hide Custom Setup' : 'Custom Setup'}
        </Button>
      </div>

      {/* Data Quality Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Data Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{qualityInfo.icon}</span>
              <div>
                <p className={`font-semibold ${qualityInfo.color}`}>
                  {qualityInfo.text}
                </p>
                <p className="text-sm text-gray-500">
                  {qualityInfo.description}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {analysis.overall.activitiesWithHR} of{' '}
              {analysis.overall.totalActivities} activities with HR data
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Zone Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className={`font-semibold ${confidenceInfo.color}`}>
                {confidenceInfo.text}
              </p>
              <p className="text-sm text-gray-500">
                {confidenceInfo.description}
              </p>
            </div>
            {maxHeartRate && (
              <div className="mt-2 text-xs text-gray-500">
                Max HR detected: {maxHeartRate} BPM
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Zone Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="font-semibold">
                {analysis.suggestedZoneModel.name}
              </p>
              <p className="text-sm text-gray-500">
                {analysis.suggestedZoneModel.description}
              </p>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {analysis.suggestedZoneModel.zones.length} zones
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings and Recommendations */}
      {needsMoreData && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertDescription className="text-yellow-800">
            <strong>More data needed:</strong> Your zone recommendations would
            be more accurate with additional heart rate data from your workouts.
          </AlertDescription>
        </Alert>
      )}

      {analysis.recommendations.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <strong>Recommendations:</strong>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="text-sm">
                  {rec}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Custom Zone Setup */}
      {showCustomForm && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Zone Setup</CardTitle>
            <CardDescription>
              Override automatic analysis with your known max heart rate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxHR">Max Heart Rate (BPM)</Label>
                <Input
                  id="maxHR"
                  type="number"
                  placeholder="e.g., 190"
                  value={customMaxHR}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCustomMaxHR(e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoneModel">Zone Model</Label>
                <Select
                  value={selectedZoneModel}
                  onValueChange={(value: string) =>
                    setSelectedZoneModel(
                      value as '5-zone' | '3-zone' | 'coggan'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5-zone">5-Zone Model</SelectItem>
                    <SelectItem value="3-zone">3-Zone Model</SelectItem>
                    <SelectItem value="coggan">Coggan Model</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleCustomAnalysis}
              disabled={!customMaxHR || customAnalysis.isPending}
              className="w-full md:w-auto"
            >
              {customAnalysis.isPending
                ? 'Analyzing...'
                : 'Generate Custom Zones'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Zone Analysis Tabs */}
      <Tabs defaultValue="zones" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="zones">Training Zones</TabsTrigger>
          <TabsTrigger value="sport-specific">Sport Analysis</TabsTrigger>
          <TabsTrigger value="alternative">Alternative Models</TabsTrigger>
        </TabsList>

        {/* Training Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Training Zones</CardTitle>
              <CardDescription>
                Based on {analysis.suggestedZoneModel.name.toLowerCase()} using
                max HR of {maxHeartRate} BPM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones.map(zone => (
                  <div
                    key={zone.number}
                    className="p-4 rounded-lg border-2"
                    style={{
                      backgroundColor: zone.color + '20',
                      borderColor: zone.color,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold">
                        Zone {zone.number}
                      </span>
                      <Badge
                        style={{ backgroundColor: zone.color, color: 'white' }}
                      >
                        {zone.percentRange}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {zone.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {zone.description}
                    </p>
                    <div
                      className="text-lg font-mono font-bold"
                      style={{ color: zone.color }}
                    >
                      {zone.range}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Workout Zone Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Workout Recommendations</CardTitle>
              <CardDescription>
                Suggested zones for different workout types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    type: 'Recovery',
                    key: 'recovery',
                    description: 'Easy recovery sessions',
                  },
                  {
                    type: 'Base Building',
                    key: 'base',
                    description: 'Aerobic base development',
                  },
                  {
                    type: 'Tempo',
                    key: 'tempo',
                    description: 'Comfortably hard efforts',
                  },
                  {
                    type: 'Threshold',
                    key: 'threshold',
                    description: 'Lactate threshold training',
                  },
                  {
                    type: 'VO2 Max',
                    key: 'vo2max',
                    description: 'High-intensity intervals',
                  },
                ].map(workout => {
                  const targetZone = getTargetZoneRecommendation(workout.key);
                  return (
                    <div
                      key={workout.key}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{workout.type}</p>
                        <p className="text-sm text-gray-500">
                          {workout.description}
                        </p>
                      </div>
                      {targetZone && (
                        <Badge
                          style={{
                            backgroundColor: targetZone.color,
                            color: 'white',
                          }}
                        >
                          Zone {targetZone.number}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sport-Specific Analysis Tab */}
        <TabsContent value="sport-specific" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sport-Specific Analysis</CardTitle>
              <CardDescription>
                Heart rate patterns vary by sport - here&apos;s your data by
                activity type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.sportSpecific.length > 0 ? (
                <div className="space-y-4">
                  {analysis.sportSpecific.map((sport, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-lg">{sport.sport}</h4>
                        <Badge variant="secondary">
                          {sport.activityCount} activities
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Max Heart Rate
                          </p>
                          <p className="text-xl font-mono font-bold">
                            {sport.maxHR} BPM
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Average Heart Rate
                          </p>
                          <p className="text-xl font-mono font-bold">
                            {sport.avgHR} BPM
                          </p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {sport.suggestedZones.slice(0, 5).map(zone => (
                          <div
                            key={zone.number}
                            className="text-center p-2 rounded text-xs"
                            style={{
                              backgroundColor: zone.color + '30',
                              borderColor: zone.color,
                            }}
                          >
                            <div className="font-bold">Z{zone.number}</div>
                            <div>
                              {zone.minHR}-{zone.maxHR}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No sport-specific analysis available.</p>
                  <p className="text-sm">
                    Need at least 3 activities per sport for analysis.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alternative Models Tab */}
        <TabsContent value="alternative" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alternative Zone Models</CardTitle>
              <CardDescription>
                Different approaches to heart rate zone calculation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analysis.alternativeModels.map((model, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="mb-4">
                      <h4 className="font-semibold text-lg">{model.name}</h4>
                      <p className="text-gray-600">{model.description}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {model.zones.map(zone => (
                        <div
                          key={zone.number}
                          className="p-3 rounded border text-center"
                          style={{
                            backgroundColor: zone.color + '20',
                            borderColor: zone.color,
                          }}
                        >
                          <div className="font-bold text-sm">
                            Zone {zone.number}
                          </div>
                          <div className="text-xs font-medium">{zone.name}</div>
                          <div className="text-xs font-mono mt-1">
                            {zone.minHR}-{zone.maxHR}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
