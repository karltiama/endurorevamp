'use client';

import { useState } from 'react';
import { ActivityFeedClient } from '@/components/analytics/ActivityFeedClient';
import { Suspense } from 'react';

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Runs', value: 'run' },
  { label: 'Rides', value: 'ride' },
  { label: 'Favorites', value: 'favorite' },
  { label: 'Flagged', value: 'flagged' },
];

export default function ActivitiesFeedWithFilters({ userId }: { userId: string }) {
  const [filter, setFilter] = useState('all');

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        {/* Subheading/Description removed as redundant */}
        {/* Top Filter Bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={
                "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors " +
                (filter === f.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-100 border-gray-200")
              }
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>
        <Suspense fallback={<div className='text-muted-foreground'>Loading activities...</div>}>
          {/* TODO: Pass filter to ActivityFeedClient when supported */}
          <ActivityFeedClient userId={userId} />
        </Suspense>
      </div>
    </>
  );
} 