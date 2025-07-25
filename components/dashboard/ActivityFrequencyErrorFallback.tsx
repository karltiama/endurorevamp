'use client';

export default function ActivityFrequencyErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-red-500">Failed to load activity frequency: {error.message}</div>
      <button onClick={retry} className="mt-2 text-blue-600 underline">Retry</button>
    </div>
  );
} 