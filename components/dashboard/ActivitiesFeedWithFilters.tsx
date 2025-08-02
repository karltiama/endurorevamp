'use client';

import { useState } from 'react';
import { ActivityFeedClient } from '@/components/analytics/ActivityFeedClient';
import { Suspense } from 'react';

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Runs', value: 'run' },
  { label: 'Rides', value: 'ride' },
  { label: 'Walks', value: 'walk' },
  { label: 'Workouts', value: 'workout' },
  { label: 'Favorites', value: 'favorite' },
];

const SORT_OPTIONS = [
  { label: 'Date (Newest)', value: 'date-desc' },
  { label: 'Date (Oldest)', value: 'date-asc' },
  { label: 'Distance (Longest)', value: 'distance-desc' },
  { label: 'Distance (Shortest)', value: 'distance-asc' },
  { label: 'Duration (Longest)', value: 'duration-desc' },
  { label: 'Duration (Shortest)', value: 'duration-asc' },
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' },
];

export default function ActivitiesFeedWithFilters({ userId }: { userId: string }) {
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('date-desc');

  return (
    <>
      {/* Top Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-4">
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

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2 mb-6">
        <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
          Sort by:
        </label>
        <select
          id="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <Suspense fallback={<div className='text-muted-foreground'>Loading activities...</div>}>
        <ActivityFeedClient userId={userId} filter={filter} sort={sort} />
      </Suspense>
    </>
  );
} 