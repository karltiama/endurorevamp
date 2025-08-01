'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useUnitPreferences } from '@/hooks/useUnitPreferences'
import { formatDistance, getActivityIcon, formatStravaTime, formatPace, parseHevyWorkout, formatHevyWorkout } from '@/lib/utils'
import type { StravaActivity } from '@/lib/strava/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Heart, Save, Edit, Zap, Gauge, TrendingUp } from 'lucide-react'
import { Label } from '@/components/ui/label'

// Type for activities with RPE data
interface ActivityWithRPE {
  perceived_exertion?: number
}

interface ActivityDetailModalProps {
  activity: StravaActivity
  onClose: () => void
}

// RPE Emoji Scale with descriptions
const RPE_EMOJI_SCALE = [
  { value: 1, emoji: '😴', label: 'Very Easy', description: 'Walking, very light effort' },
  { value: 2, emoji: '😌', label: 'Easy', description: 'Light jog, comfortable pace' },
  { value: 3, emoji: '🙂', label: 'Moderate', description: 'Steady pace, can talk easily' },
  { value: 4, emoji: '😐', label: 'Somewhat Hard', description: 'Moderate effort, breathing harder' },
  { value: 5, emoji: '😤', label: 'Hard', description: 'Challenging pace, limited talking' },
  { value: 6, emoji: '😰', label: 'Very Hard', description: 'High effort, difficult to talk' },
  { value: 7, emoji: '😫', label: 'Very Hard+', description: 'Very challenging, minimal talking' },
  { value: 8, emoji: '😵', label: 'Extremely Hard', description: 'Maximum effort, no talking' },
  { value: 9, emoji: '🤯', label: 'Maximum', description: 'Near maximum effort' },
  { value: 10, emoji: '💀', label: 'All Out', description: 'Maximum effort, sprint finish' }
]

export function ActivityDetailModal({ activity, onClose }: ActivityDetailModalProps) {
  const { preferences } = useUnitPreferences()
  const [selectedRPE, setSelectedRPE] = useState<number | null>(null)
  const [isEditingRPE, setIsEditingRPE] = useState(false)
  const [isSavingRPE, setIsSavingRPE] = useState(false)
  const [rpeError, setRpeError] = useState<string>('')
  
  // Check if activity has RPE data (assuming it's in the activity object)
  const currentRPE = (activity as ActivityWithRPE)?.perceived_exertion
  
  const formatDistanceWithUnits = (meters: number) => {
    return formatDistance(meters, preferences.distance)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return formatStravaTime(dateString)
  }

  // Calculate pace for running activities
  const calculatePace = () => {
    if (activity.sport_type === 'Run' && activity.distance > 0) {
      // Use pre-computed average_pace if available (more accurate)
      if (activity.average_pace) {
        return formatPace(activity.average_pace, preferences.pace)
      }
      
      // Fallback to calculation if average_pace not available
      if (activity.moving_time > 0) {
        const secondsPerKm = activity.moving_time / (activity.distance / 1000)
        return formatPace(secondsPerKm, preferences.pace)
      }
    }
    return null
  }

  // Format speed with proper unit conversion
  const formatSpeed = (speedMs: number) => {
    const speedKmh = speedMs * 3.6
    if (preferences.distance === 'miles') {
      const speedMph = speedKmh * 0.621371
      return `${speedMph % 1 === 0 ? speedMph.toFixed(0) : speedMph.toFixed(1)} mph`
    }
    return `${speedKmh % 1 === 0 ? speedKmh.toFixed(0) : speedKmh.toFixed(1)} km/h`
  }

  // Format power with proper units
  const formatPower = (watts: number) => {
    return `${Math.round(watts)}w`
  }

  // Format cadence
  const formatCadence = (cadence: number) => {
    return `${Math.round(cadence)} spm`
  }

  const handleSaveRPE = async () => {
    if (!selectedRPE) {
      setRpeError('Please select how the workout felt')
      return
    }

    setIsSavingRPE(true)
    setRpeError('')

    try {
      // Handle both API and database activity types
      const activityId = 'strava_activity_id' in activity ? activity.strava_activity_id : activity.id
      const response = await fetch(`/api/activities/${activityId}/rpe`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ perceived_exertion: selectedRPE }),
      })

      if (!response.ok) {
        throw new Error('Failed to save RPE')
      }

      // Update the activity object locally
      ;(activity as ActivityWithRPE).perceived_exertion = selectedRPE
      setIsEditingRPE(false)
      setSelectedRPE(null)
    } catch {
      setRpeError('Failed to save RPE. Please try again.')
    } finally {
      setIsSavingRPE(false)
    }
  }

  const handleEditRPE = () => {
    setIsEditingRPE(true)
    setSelectedRPE(currentRPE || null)
    setRpeError('')
  }

  const handleCancelRPE = () => {
    setIsEditingRPE(false)
    setSelectedRPE(null)
    setRpeError('')
  }

  const getCurrentRPEInfo = () => {
    if (!currentRPE) return null
    return RPE_EMOJI_SCALE.find(rpe => rpe.value === currentRPE)
  }

  const currentRPEInfo = getCurrentRPEInfo()
  const pace = calculatePace()

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">{getActivityIcon(activity.type || activity.sport_type, activity.trainer)}</div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                        {activity.name}
                      </Dialog.Title>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(activity.start_date_local)} at {formatTime(activity.start_date_local)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {activity.type || activity.sport_type}
                        </span>
                        {activity.private && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* RPE Section */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">How did this workout feel?</h4>
                    </div>
                    {!isEditingRPE && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditRPE}
                        className="text-blue-600 border-blue-200 hover:bg-blue-100"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {currentRPE ? 'Edit' : 'Add'} Effort
                      </Button>
                    )}
                  </div>

                  {isEditingRPE ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-blue-800 mb-3 block">
                          Select the face that best represents how hard this workout felt:
                        </Label>
                        
                        {/* Emoji Grid */}
                        <div className="grid grid-cols-5 gap-2 mb-4">
                          {RPE_EMOJI_SCALE.map((rpe) => (
                            <button
                              key={rpe.value}
                              onClick={() => setSelectedRPE(rpe.value)}
                              className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                                selectedRPE === rpe.value
                                  ? 'border-blue-500 bg-blue-100 scale-105'
                                  : 'border-gray-200 bg-white hover:border-blue-300'
                              }`}
                            >
                              <div className="text-2xl mb-1">{rpe.emoji}</div>
                              <div className="text-xs font-medium text-gray-700">{rpe.label}</div>
                            </button>
                          ))}
                        </div>

                        {/* Selected RPE Description */}
                        {selectedRPE && (
                          <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">{RPE_EMOJI_SCALE.find(r => r.value === selectedRPE)?.emoji}</span>
                              <span className="font-medium text-blue-900">
                                {RPE_EMOJI_SCALE.find(r => r.value === selectedRPE)?.label}
                              </span>
                            </div>
                            <p className="text-sm text-blue-800">
                              {RPE_EMOJI_SCALE.find(r => r.value === selectedRPE)?.description}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={handleSaveRPE}
                            disabled={isSavingRPE || !selectedRPE}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {isSavingRPE ? 'Saving...' : 'Save Effort'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelRPE}
                            disabled={isSavingRPE}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                      
                      {rpeError && (
                        <Alert className="bg-red-50 border-red-200">
                          <AlertDescription className="text-red-800 text-sm">
                            {rpeError}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {currentRPEInfo ? (
                        <>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <span className="text-lg mr-2">{currentRPEInfo.emoji}</span>
                            {currentRPEInfo.label}
                          </Badge>
                          <span className="text-sm text-blue-700">
                            {currentRPEInfo.description}
                          </span>
                        </>
                      ) : (
                        <div className="text-sm text-blue-600">
                          No effort rating yet. Click &quot;Add Effort&quot; to rate this workout.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Primary Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* For weight training, show only duration */}
                  {(activity.sport_type === 'WeightTraining' || activity.sport_type === 'Workout') ? (
                    <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Duration</h4>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatDuration(activity.moving_time)}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-600 mb-1">Distance</h4>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatDistanceWithUnits(activity.distance)}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-600 mb-1">Duration</h4>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatDuration(activity.moving_time)}
                        </p>
                      </div>
                      {pace && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                            <Gauge className="h-4 w-4" />
                            Average Pace
                          </h4>
                          <p className="text-2xl font-bold text-gray-900">
                            {pace}
                          </p>
                        </div>
                      )}
                      {activity.average_speed && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Average Speed
                          </h4>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatSpeed(activity.average_speed)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                 {/* Weight Training Info - Show for weight training activities */}
                 {(activity.sport_type === 'WeightTraining' || activity.sport_type === 'Workout') && (
                   <div className="mb-6">
                     <h4 className="text-sm font-medium text-gray-600 mb-2">Workout Info</h4>
                     <div className="bg-gray-50 p-4 rounded-lg">
                       <div className="text-sm text-gray-700">
                         <p className="mb-2">
                           <span className="font-medium">Activity:</span> {activity.name}
                         </p>
                         <p className="mb-2">
                           <span className="font-medium">Duration:</span> {formatDuration(activity.moving_time)}
                         </p>
                         {activity.manual && (
                           <p className="text-blue-600 text-xs">
                             📝 Manually logged workout
                           </p>
                         )}
                         {!activity.description && (
                           <p className="text-gray-500 text-xs mt-2">
                             💡 Tip: Detailed workout data (sets, reps) not available from Strava.
                             <br />
                             Consider logging workouts directly in this app for better tracking.
                           </p>
                         )}
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Hevy Workout Data - Show when description exists */}
                 {activity.description && (() => {
                   const parsedWorkout = parseHevyWorkout(activity.description);
                   return (
                     <div className="mb-6">
                       <h4 className="text-sm font-medium text-gray-600 mb-2">Workout Details</h4>
                       <div className="bg-gray-50 p-4 rounded-lg">
                         {parsedWorkout ? (
                           <div>
                             <div className="mb-3 text-sm text-gray-600">
                               <span className="font-medium">Total Volume:</span> {parsedWorkout.totalVolume.toLocaleString()} lbs
                               <span className="mx-2">•</span>
                               <span className="font-medium">Total Sets:</span> {parsedWorkout.totalSets}
                             </div>
                             <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                               {formatHevyWorkout(parsedWorkout)}
                             </pre>
                           </div>
                         ) : (
                           <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                             {activity.description}
                           </pre>
                         )}
                       </div>
                     </div>
                   );
                 })()}

                {/* Secondary Metrics Grid - Hide for weight training */}
                {!(activity.sport_type === 'WeightTraining' || activity.sport_type === 'Workout') && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {activity.total_elevation_gain > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-600 mb-1">Elevation Gain</h4>
                        <p className="text-2xl font-bold text-gray-900">
                          {activity.total_elevation_gain}m
                        </p>
                      </div>
                    )}
                    {activity.average_heartrate && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-600 mb-1">Average Heart Rate</h4>
                        <p className="text-2xl font-bold text-gray-900">
                          {activity.average_heartrate} bpm
                        </p>
                      </div>
                    )}
                    {activity.max_heartrate && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-600 mb-1">Max Heart Rate</h4>
                        <p className="text-2xl font-bold text-gray-900">
                          {activity.max_heartrate} bpm
                        </p>
                      </div>
                    )}
                    {activity.max_speed && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-600 mb-1">Max Speed</h4>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatSpeed(activity.max_speed)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Power and Cadence Grid - Hide for weight training */}
                {!(activity.sport_type === 'WeightTraining' || activity.sport_type === 'Workout') && (activity.average_watts || activity.average_cadence) && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {activity.average_watts && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                          <Zap className="h-4 w-4" />
                          Average Power
                        </h4>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatPower(activity.average_watts)}
                        </p>
                      </div>
                    )}
                    {activity.average_cadence && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-600 mb-1">Average Cadence</h4>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCadence(activity.average_cadence)}
                        </p>
                      </div>
                    )}
                    {activity.max_watts && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                          <Zap className="h-4 w-4" />
                          Max Power
                        </h4>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatPower(activity.max_watts)}
                        </p>
                      </div>
                    )}
                    {activity.kilojoules && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-600 mb-1">Work (kJ)</h4>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.round(activity.kilojoules)} kJ
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Details */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Additional Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Activity ID:</span>
                      <span className="ml-2 font-mono">{activity.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-2">{activity.type || activity.sport_type}</span>
                    </div>
                    {activity.trainer && (
                      <div>
                        <span className="text-gray-500">Trainer:</span>
                        <span className="ml-2">Indoor</span>
                      </div>
                    )}
                    {activity.commute && (
                      <div>
                        <span className="text-gray-500">Commute:</span>
                        <span className="ml-2">Yes</span>
                      </div>
                    )}
                    {activity.kudos_count !== undefined && (
                      <div>
                        <span className="text-gray-500">Kudos:</span>
                        <span className="ml-2">{activity.kudos_count}</span>
                      </div>
                    )}
                    {activity.achievement_count !== undefined && (
                      <div>
                        <span className="text-gray-500">Achievements:</span>
                        <span className="ml-2">{activity.achievement_count}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 