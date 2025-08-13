'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getStravaAuthUrl } from '@/lib/strava';

export function LoginButton() {
  return (
    <Button asChild>
      <Link href={getStravaAuthUrl()}>Login with Strava</Link>
    </Button>
  );
}
