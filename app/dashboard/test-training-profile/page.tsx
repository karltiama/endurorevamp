'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrainingProfileService } from '@/lib/training/profile-service';
import { useRequireAuth } from '@/hooks/auth/useRequireAuth';

interface TestResults {
  profileCreation: {
    success: boolean;
    profile?: unknown;
    completeProfile?: unknown;
    existing?: boolean;
  };
  thresholdCalculation: {
    success: boolean;
    thresholds: unknown;
  };
  tssTargetGeneration: {
    success: boolean;
    tssTarget: number;
  };
  trainingZones: {
    success: boolean;
    zones: unknown;
  };
  profileAnalysis: {
    success: boolean;
    analysis: unknown;
  };
}

export default function TestTrainingProfilePage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const [results, setResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) return <div>Loading...</div>;

  const runProfileTests = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const testResults: TestResults = {} as TestResults;

      // Test 1: Create/Get Profile
      console.log('Testing profile creation...');
      let completeProfile = await TrainingProfileService.getCompleteProfile(user.id);
      
      if (!completeProfile) {
        // Create a test profile
        const sampleProfile = {
          age: 32,
          weight: 70,
          height: 175,
          sex: 'M' as const,
          experience_level: 'intermediate' as const,
          primary_sport: 'Run',
          preferred_units: 'metric' as const,
          training_philosophy: 'balanced' as const
        };
        
        const profile = await TrainingProfileService.updateProfile(user.id, sampleProfile);
        completeProfile = await TrainingProfileService.getCompleteProfile(user.id);
        testResults.profileCreation = { success: true, profile, completeProfile };
      } else {
        testResults.profileCreation = { success: true, existing: true, completeProfile };
      }

      // Test 2: Calculate Thresholds (with sample empty activities array)
      console.log('Testing threshold calculation...');
      const thresholds = await TrainingProfileService.calculateThresholds(user.id, []);
      testResults.thresholdCalculation = { success: true, thresholds };

      // Test 3: Generate Personalized TSS Target
      console.log('Testing TSS target generation...');
      const tssTarget = TrainingProfileService.calculatePersonalizedTSSTarget(completeProfile!.profile);
      testResults.tssTargetGeneration = { success: true, tssTarget };

      // Test 4: Get Training Zones
      console.log('Testing training zones...');
      const zones = TrainingProfileService.generateTrainingZones(completeProfile!.profile);
      testResults.trainingZones = { success: true, zones };

      // Test 5: Profile Analysis
      console.log('Testing profile analysis...');
      const analysis = TrainingProfileService.analyzeProfile(completeProfile!);
      testResults.profileAnalysis = { success: true, analysis };

      setResults(testResults);
      console.log('All tests completed successfully!', testResults);

    } catch (err) {
      console.error('Test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // For now, just clear the results
      setResults(null);
      setError(null);
      console.log('Profile results cleared');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Training Profile Service Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runProfileTests} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Running Tests...' : 'Run Profile Tests'}
            </Button>
            <Button 
              onClick={resetProfile} 
              disabled={isLoading}
              variant="destructive"
            >
              Reset Profile
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>All tests completed successfully! ✅</AlertDescription>
              </Alert>

              {/* Profile Creation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">1. Profile Creation</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                    {JSON.stringify(results.profileCreation, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {/* Threshold Calculation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">2. Threshold Calculation</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                    {JSON.stringify(results.thresholdCalculation, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {/* TSS Target */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">3. Personalized TSS Target</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-green-600">
                    Weekly TSS Target: {results.tssTargetGeneration?.tssTarget}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    This replaces the hardcoded value of 400!
                  </div>
                </CardContent>
              </Card>

              {/* Training Zones */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">4. Training Zones</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                    {JSON.stringify(results.trainingZones, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {/* Profile Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">5. Profile Completeness Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <strong>Analysis Results:</strong>
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto mt-2">
                        {JSON.stringify(results.profileAnalysis?.analysis, null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 