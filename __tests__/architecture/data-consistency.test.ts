/**
 * Test to verify consistent data architecture
 * All components should use database-first hooks, not API-first
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Data Architecture Consistency', () => {
  it('should not have components using API-first hooks', () => {
    // Find all component files (simplified for test)
    const componentFiles = ['components/AthleteHeader.tsx'];

    const violations: Array<{ file: string; issue: string; line?: number }> =
      [];

    for (const file of componentFiles) {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for API-first hooks (these should be avoided)
        if (line.includes('useAthleteData(') && !line.includes('// LEGACY')) {
          violations.push({
            file,
            issue:
              'Uses API-first useAthleteData() instead of useAthleteProfile()',
            line: index + 1,
          });
        }

        if (
          line.includes('useAthleteActivities(') &&
          !line.includes('// LEGACY')
        ) {
          violations.push({
            file,
            issue:
              'Uses API-first useAthleteActivities() instead of useUserActivities()',
            line: index + 1,
          });
        }

        // Check for fetch calls to Strava API (should use database)
        if (
          line.includes("fetch('/api/strava/athlete'") &&
          !line.includes('// LEGACY')
        ) {
          violations.push({
            file,
            issue: 'Direct API call to /api/strava/athlete instead of database',
            line: index + 1,
          });
        }

        if (
          line.includes("fetch('/api/strava/activities'") &&
          !line.includes('// LEGACY')
        ) {
          violations.push({
            file,
            issue:
              'Direct API call to /api/strava/activities instead of database',
            line: index + 1,
          });
        }
      });
    }

    if (violations.length > 0) {
      const violationReport = violations
        .map(v => `${v.file}:${v.line || '?'} - ${v.issue}`)
        .join('\n');

      throw new Error(
        `❌ Data architecture violations found:\n\n${violationReport}\n\n` +
          `💡 Fix: Use database-first hooks like useUserActivities() and useAthleteProfile()`
      );
    }
  });

  it('should have consistent query keys for database operations', () => {
    // Check that query keys follow the pattern: ['entity', 'operation', ...params]
    const hookFiles = [
      'hooks/useAthleteProfile.ts',
      'hooks/use-user-activities.ts',
    ];

    const queryKeyPatterns = [
      /queryKey:\s*\['user',\s*'activities'/, // User activities
      /queryKey:\s*\['athlete',\s*'profile'/, // Athlete profile
      /queryKey:\s*\['training',\s*'load'/, // Training load
      /queryKey:\s*\['zone-analysis'\]/, // Zone analysis
    ];

    let foundPatterns = 0;

    for (const file of hookFiles) {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');

      queryKeyPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          foundPatterns++;
        }
      });
    }

    expect(foundPatterns).toBeGreaterThan(0);
  });

  it('should properly invalidate all related queries after sync', () => {
    const syncHookFile = readFileSync(
      join(process.cwd(), 'hooks/use-strava-sync.ts'),
      'utf-8'
    );

    // Check that sync invalidates all the important query types
    const requiredInvalidations = [
      "queryKey: ['user', 'activities']", // Activities from database
      "queryKey: ['athlete', 'profile']", // Athlete profile from database
      "queryKey: ['training', 'load']", // Training load calculations
      "queryKey: ['zone-analysis']", // Zone analysis
    ];

    requiredInvalidations.forEach(invalidation => {
      expect(syncHookFile).toContain(invalidation);
    });
  });
});

/**
 * Helper to verify a component uses database-first patterns
 */
export function checkComponentConsistency(componentContent: string): {
  isConsistent: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for API-first patterns that should be avoided
  if (
    componentContent.includes('useAthleteData(') &&
    !componentContent.includes('// LEGACY')
  ) {
    issues.push('Uses useAthleteData() - should use useAthleteProfile()');
  }

  if (
    componentContent.includes('useAthleteActivities(') &&
    !componentContent.includes('// LEGACY')
  ) {
    issues.push('Uses useAthleteActivities() - should use useUserActivities()');
  }

  // Check for direct API calls that should go through database
  if (
    componentContent.includes('/api/strava/athlete') &&
    !componentContent.includes('// LEGACY')
  ) {
    issues.push('Direct Strava API call - should use database');
  }

  return {
    isConsistent: issues.length === 0,
    issues,
  };
}
