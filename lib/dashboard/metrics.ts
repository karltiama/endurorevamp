import type { Activity } from '@/lib/strava/types'

export function calculateWeeklyDistance(activities: Activity[]): { current: number; previous: number; change: number } {
  const now = new Date()
  const currentWeekStart = new Date(now)
  currentWeekStart.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
  currentWeekStart.setHours(0, 0, 0, 0)

  const previousWeekStart = new Date(currentWeekStart)
  previousWeekStart.setDate(currentWeekStart.getDate() - 7)

  const previousWeekEnd = new Date(currentWeekStart)

  // Calculate current week distance
  const currentWeekActivities = activities.filter(activity => {
    const activityDate = new Date(activity.start_date)
    return activityDate >= currentWeekStart
  })

  // Calculate previous week distance
  const previousWeekActivities = activities.filter(activity => {
    const activityDate = new Date(activity.start_date)
    return activityDate >= previousWeekStart && activityDate < previousWeekEnd
  })

  const currentDistance = currentWeekActivities.reduce((sum, activity) => sum + (activity.distance || 0), 0)
  const previousDistance = previousWeekActivities.reduce((sum, activity) => sum + (activity.distance || 0), 0)

  // Calculate percentage change
  let change = 0
  if (previousDistance > 0) {
    change = ((currentDistance - previousDistance) / previousDistance) * 100
    change = Math.round(change * 10) / 10 // Round to 1 decimal place
  } else if (currentDistance > 0) {
    change = 100 // If no previous week data but current week has data
  }

  return {
    current: currentDistance,
    previous: previousDistance,
    change
  }
}

export function calculateActivityStreak(activities: Activity[]): { current: number; longest: number; consistency: number } {
  if (activities.length === 0) {
    return { current: 0, longest: 0, consistency: 0 }
  }

  // Sort activities by start date (most recent first)
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  )

  // Get unique activity dates (ignore multiple activities on same day)
  const activityDates = Array.from(new Set(
    sortedActivities.map(activity => 
      new Date(activity.start_date).toDateString()
    )
  )).map(dateString => new Date(dateString))

  // Calculate current streak
  let currentStreak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < activityDates.length; i++) {
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)
    
    const activityDate = new Date(activityDates[i])
    activityDate.setHours(0, 0, 0, 0)

    if (activityDate.getTime() === expectedDate.getTime()) {
      currentStreak++
    } else if (i === 0 && activityDate.getTime() === new Date(today.getTime() - 24 * 60 * 60 * 1000).getTime()) {
      // Allow for yesterday if no activity today
      currentStreak++
    } else {
      break
    }
  }

  // Calculate longest streak
  let longestStreak = 0
  let tempStreak = 0
  let lastDate: Date | null = null

  for (const currentDate of activityDates) {
    if (lastDate === null) {
      tempStreak = 1
    } else {
      const daysDiff = Math.floor((lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    lastDate = currentDate
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  // Calculate consistency (percentage of days with activities in last 30 days)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const recentActivityDates = activityDates.filter(date => date >= thirtyDaysAgo)
  const consistency = Math.round((recentActivityDates.length / 30) * 100)

  return {
    current: currentStreak,
    longest: longestStreak,
    consistency: Math.min(consistency, 100) // Cap at 100%
  }
}



export function getLastActivity(activities: Activity[]): Activity | null {
  if (activities.length === 0) {
    return null
  }

  // Return the most recent activity (activities should already be sorted by start_date desc)
  return activities[0] || null
}

export function calculateMonthlyProgress(activities: Activity[]): { 
  current: number; 
  target: number; 
  progress: number; 
  daysLeft: number;
  onTrack: boolean;
  projectedTotal: number;
} {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  // Calculate current month's distance
  const monthActivities = activities.filter(activity => {
    const activityDate = new Date(activity.start_date)
    return activityDate >= monthStart && activityDate <= now
  })
  
  const currentDistance = monthActivities.reduce((sum, activity) => sum + (activity.distance || 0), 0)
  
  // Set a reasonable monthly target based on user's average
  // If user has less than 30 days of data, use a default target
  const hasEnoughData = activities.length >= 10
  let monthlyTarget: number
  
  if (hasEnoughData) {
    // Calculate average monthly distance from historical data
    const totalDistance = activities.reduce((sum, activity) => sum + (activity.distance || 0), 0)
    const oldestActivity = activities[activities.length - 1]
    const daysSinceStart = Math.max(1, Math.floor((now.getTime() - new Date(oldestActivity.start_date).getTime()) / (1000 * 60 * 60 * 24)))
    const avgDailyDistance = totalDistance / daysSinceStart
    monthlyTarget = avgDailyDistance * 30 // 30-day target
  } else {
    // Default target for new users (100km/month for mixed activities)
    monthlyTarget = 100000 // 100km in meters
  }
  
  // Calculate progress percentage
  const progress = Math.min(100, (currentDistance / monthlyTarget) * 100)
  
  // Calculate days left in month
  const daysLeft = monthEnd.getDate() - now.getDate()
  
  // Calculate if user is on track
  const daysInMonth = monthEnd.getDate()
  const daysPassed = now.getDate()
  const expectedProgress = (daysPassed / daysInMonth) * 100
  const onTrack = progress >= expectedProgress * 0.8 // Allow 20% buffer
  
  // Project total for the month based on current pace
  const dailyAverage = currentDistance / Math.max(1, daysPassed)
  const projectedTotal = dailyAverage * daysInMonth
  
  return {
    current: currentDistance,
    target: monthlyTarget,
    progress: Math.round(progress * 10) / 10, // Round to 1 decimal
    daysLeft,
    onTrack,
    projectedTotal
  }
} 