'use client';

import { PlanningHero } from '@/components/dashboard/PlanningHero';

interface PlanningHeroWrapperProps {
  userId: string;
}

export function PlanningHeroWrapper({ userId }: PlanningHeroWrapperProps) {
  // The hero component doesn't need the edit functionality since the main dashboard below has the edit modal
  return <PlanningHero userId={userId} />;
}
