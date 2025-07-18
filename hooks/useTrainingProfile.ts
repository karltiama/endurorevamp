import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrainingProfileService } from '@/lib/training/profile-service-simplified'
import { 
  CompleteUserProfile, 
  ProfileAnalysis,
  UserProfileFormData,
  TrainingPreferencesFormData 
} from '@/types/training-profile-simplified'


// Query keys for React Query
export const TRAINING_PROFILE_KEYS = {
  profile: (userId: string) => ['training-profile', userId],
  analysis: (userId: string) => ['training-profile-analysis', userId],
  thresholds: (userId: string) => ['threshold-calculation', userId],
} as const

/**
 * Hook to get complete training profile
 */
export function useTrainingProfile(userId: string) {
  return useQuery({
    queryKey: TRAINING_PROFILE_KEYS.profile(userId),
    queryFn: () => TrainingProfileService.getCompleteProfile(userId, false),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

/**
 * Hook to analyze training profile completeness
 */
export function useProfileAnalysis(userId: string) {
  return useQuery({
    queryKey: TRAINING_PROFILE_KEYS.analysis(userId),
    queryFn: async (): Promise<ProfileAnalysis | null> => {
      const profile = await TrainingProfileService.getCompleteProfile(userId, false)
      if (!profile) return null
      return TrainingProfileService.analyzeProfile(profile)
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })
}

/**
 * Hook to update training profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserProfileFormData }) =>
      TrainingProfileService.updateProfile(userId, data),
    onSuccess: (_, { userId }) => {
      // Invalidate profile and analysis queries
      queryClient.invalidateQueries({ queryKey: TRAINING_PROFILE_KEYS.profile(userId) })
      queryClient.invalidateQueries({ queryKey: TRAINING_PROFILE_KEYS.analysis(userId) })
      // Also invalidate any training load calculations that depend on thresholds
      queryClient.invalidateQueries({ queryKey: ['training', 'load', userId] })
    },
  })
}

/**
 * Hook to update training preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: TrainingPreferencesFormData }) =>
      TrainingProfileService.updatePreferences(userId, data),
    onSuccess: (_, { userId }) => {
      // Invalidate profile queries
      queryClient.invalidateQueries({ queryKey: TRAINING_PROFILE_KEYS.profile(userId) })
      queryClient.invalidateQueries({ queryKey: TRAINING_PROFILE_KEYS.analysis(userId) })
    },
  })
}

/**
 * Hook to calculate thresholds from activities (uses existing zone analysis)
 */
export function useCalculateThresholds() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      TrainingProfileService.calculateThresholds(userId),
    onSuccess: (_, { userId }) => {
      // Invalidate threshold calculation and profile queries
      queryClient.invalidateQueries({ queryKey: TRAINING_PROFILE_KEYS.thresholds(userId) })
      queryClient.invalidateQueries({ queryKey: TRAINING_PROFILE_KEYS.profile(userId) })
      queryClient.invalidateQueries({ queryKey: TRAINING_PROFILE_KEYS.analysis(userId) })
    },
  })
}

/**
 * Hook to get personalized TSS target
 */
export function usePersonalizedTSSTarget(userId: string) {
  const { data: profile } = useTrainingProfile(userId)
  
  return useQuery({
    queryKey: ['personalized-tss-target', userId, profile?.profile?.updated_at],
    queryFn: () => {
      if (!profile?.profile) return 400 // Default fallback
      return TrainingProfileService.calculatePersonalizedTSSTarget(profile.profile, profile.preferences)
    },
    enabled: !!profile?.profile,
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Hook to get training zones using existing zone analysis system
 */
export function useTrainingZones(userId: string) {
  return useQuery({
    queryKey: ['training-zones', userId],
    queryFn: () => TrainingProfileService.getTrainingZones(userId),
    enabled: !!userId,
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Composite hook that provides all profile-related data and mutations
 */
export function useCompleteTrainingProfile(userId: string) {
  const profileQuery = useTrainingProfile(userId)
  const analysisQuery = useProfileAnalysis(userId)
  const tssTargetQuery = usePersonalizedTSSTarget(userId)
  const zonesQuery = useTrainingZones(userId)
  
  const updateProfileMutation = useUpdateProfile()
  const updatePreferencesMutation = useUpdatePreferences()
  const calculateThresholdsMutation = useCalculateThresholds()
  
  return {
    // Data
    profile: profileQuery.data,
    analysis: analysisQuery.data,
    personalizedTSSTarget: tssTargetQuery.data,
    trainingZones: zonesQuery.data,
    
    // Loading states
    isLoading: profileQuery.isLoading || analysisQuery.isLoading,
    isError: profileQuery.isError || analysisQuery.isError,
    error: profileQuery.error || analysisQuery.error,
    
    // Mutations
    updateProfile: updateProfileMutation.mutate,
    updatePreferences: updatePreferencesMutation.mutate,
    calculateThresholds: calculateThresholdsMutation.mutate,
    
    // Mutation states
    isUpdatingProfile: updateProfileMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    isCalculatingThresholds: calculateThresholdsMutation.isPending,
    
    // Refetch functions
    refetchProfile: profileQuery.refetch,
    refetchAnalysis: analysisQuery.refetch,
  }
} 