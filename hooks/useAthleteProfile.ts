import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { AthleteProfile } from '@/lib/strava/types';

export function useAthleteProfile(userId: string) {
  return useQuery({
    queryKey: ['athlete', 'profile', userId],
    queryFn: async (): Promise<AthleteProfile | null> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no profile found, return null instead of throwing
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch athlete profile: ${error.message}`);
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
