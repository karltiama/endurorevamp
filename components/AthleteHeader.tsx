'use client';

import { useAthleteProfile } from '@/hooks/useAthleteProfile';
import { useAuth } from '@/providers/AuthProvider';
import { UserCircle } from 'lucide-react';
import Image from 'next/image';

interface AthleteHeaderProps {
  userId?: string; // Optional prop, falls back to auth user
}

export function AthleteHeader({ userId }: AthleteHeaderProps = {}) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const {
    data: athlete,
    isLoading,
    error,
  } = useAthleteProfile(targetUserId || '');

  if (isLoading) {
    return (
      <header className="flex items-center justify-end p-4 bg-white shadow-sm">
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-8 w-32 bg-gray-200 rounded" />
          <div className="h-8 w-8 rounded-full bg-gray-200" />
        </div>
      </header>
    );
  }

  if (error) {
    return (
      <header className="flex items-center justify-end p-4 bg-white shadow-sm">
        <div className="text-red-600">Unable to load athlete data</div>
      </header>
    );
  }

  if (!athlete) {
    return (
      <header className="flex items-center justify-end p-4 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-gray-700">Welcome!</span>
          <UserCircle className="h-8 w-8 text-gray-400" />
          <div className="text-xs text-blue-600">
            💡 Sync your Strava profile to see athlete info
          </div>
        </div>
      </header>
    );
  }

  // Use profile_large or profile_medium from database
  const profileImage = athlete.profile_large || athlete.profile_medium;

  return (
    <header className="flex items-center justify-end p-4 bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-gray-700">
          Welcome back,{' '}
          <span className="font-semibold">{athlete.firstname}</span>!
        </span>
        {profileImage ? (
          <Image
            src={profileImage}
            alt={`${athlete.firstname}'s profile`}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <UserCircle className="h-8 w-8 text-gray-400" />
        )}
        <div className="text-xs text-green-600">📊 Database</div>
      </div>
    </header>
  );
}
