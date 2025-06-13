import { useMemo } from 'react'
import { Activity } from '@/lib/strava/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ActivityContributionCalendarProps {
  activities: Activity[]
}

const CONTRIBUTION_COLORS = {
  0: 'bg-gray-100',
  1: 'bg-green-100',
  2: 'bg-green-200',
  3: 'bg-green-300',
  4: 'bg-green-400',
  5: 'bg-green-500',
}

export function ActivityContributionCalendar({ activities }: ActivityContributionCalendarProps) {
  const contributionData = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setMonth(today.getMonth() - 11)
    startDate.setDate(1)

    // Create a map of dates to activity counts
    const activityCounts = new Map<string, number>()
    activities.forEach(activity => {
      const date = new Date(activity.start_date)
      if (date >= startDate && date <= today) {
        const dateKey = date.toISOString().split('T')[0]
        activityCounts.set(dateKey, (activityCounts.get(dateKey) || 0) + 1)
      }
    })

    // Generate calendar data as a flat array of weeks
    const weeks: { date: string; count: number }[][] = []
    let currentDate = new Date(startDate)
    
    // Start from the beginning of the week that contains startDate
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    currentDate = startOfWeek
    
    while (currentDate <= today) {
      const week: { date: string; count: number }[] = []
      
      for (let i = 0; i < 7; i++) {
        const dateKey = currentDate.toISOString().split('T')[0]
        const count = currentDate >= startDate && currentDate <= today 
          ? (activityCounts.get(dateKey) || 0)
          : 0
        
        week.push({
          date: currentDate >= startDate && currentDate <= today ? dateKey : '',
          count
        })
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      weeks.push(week)
    }

    return weeks
  }, [activities])

  const monthLabels = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setMonth(today.getMonth() - 11)
    startDate.setDate(1)

    const months: { month: string; weekIndex: number }[] = []
    let currentDate = new Date(startDate)
    let weekIndex = 0
    let lastMonth = -1

    contributionData.forEach((week, index) => {
      const firstValidDay = week.find(day => day.date !== '')
      if (firstValidDay) {
        const date = new Date(firstValidDay.date)
        const month = date.getMonth()
        
        if (month !== lastMonth && date.getDate() <= 7) {
          months.push({
            month: date.toLocaleString('default', { month: 'short' }),
            weekIndex: index
          })
          lastMonth = month
        }
      }
    })

    return months
  }, [contributionData])

  const getContributionColor = (count: number) => {
    if (count >= 5) return CONTRIBUTION_COLORS[5]
    return CONTRIBUTION_COLORS[count as keyof typeof CONTRIBUTION_COLORS] || CONTRIBUTION_COLORS[0]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const totalWeeks = contributionData.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Calendar</CardTitle>
        <CardDescription>Your activity contributions over the past year</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-3">
          {/* Legend */}
          <div className="flex justify-end items-center space-x-2">
            <span className="text-xs text-muted-foreground">Less</span>
            {Object.values(CONTRIBUTION_COLORS).map((color, index) => (
              <div key={index} className={`w-2.5 h-2.5 ${color} rounded-sm`} />
            ))}
            <span className="text-xs text-muted-foreground">More</span>
          </div>
          
          {/* Calendar */}
          <div className="w-full max-w-full">
            {/* Month labels */}
            <div 
              className="grid mb-1"
              style={{ 
                gridTemplateColumns: `repeat(${totalWeeks}, 1fr)`,
                gap: '2px'
              }}
            >
              {Array.from({ length: totalWeeks }, (_, index) => {
                const monthLabel = monthLabels.find(m => m.weekIndex === index)
                return (
                  <div key={index} className="text-xs text-muted-foreground text-left">
                    {monthLabel?.month || ''}
                  </div>
                )
              })}
            </div>
            
            {/* Day labels */}
            <div className="flex">
              <div className="flex flex-col mr-3 text-xs text-muted-foreground justify-between py-1">
                <div style={{ height: '12px' }}>Mon</div>
                <div style={{ height: '12px' }}></div>
                <div style={{ height: '12px' }}>Wed</div>
                <div style={{ height: '12px' }}></div>
                <div style={{ height: '12px' }}>Fri</div>
                <div style={{ height: '12px' }}></div>
                <div style={{ height: '12px' }}>Sun</div>
              </div>
              
              {/* Calendar grid */}
              <div 
                className="grid gap-[2px] flex-1"
                style={{ 
                  gridTemplateColumns: `repeat(${totalWeeks}, 1fr)`,
                  gridTemplateRows: 'repeat(7, 12px)',
                  rowGap: '2px',
                  columnGap: '2px'
                }}
              >
                {contributionData.map((week, weekIndex) =>
                  week.map((day, dayIndex) => (
                    <TooltipProvider key={`${weekIndex}-${dayIndex}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`${getContributionColor(day.count)} rounded-sm cursor-pointer hover:ring-1 hover:ring-gray-400 transition-all`}
                            style={{ 
                              gridColumn: weekIndex + 1,
                              gridRow: dayIndex + 1,
                              width: '100%',
                              height: '100%'
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            {day.date ? (
                              <>
                                <span className="font-medium">
                                  {day.count === 0 ? 'No activities' : `${day.count} ${day.count === 1 ? 'activity' : 'activities'}`}
                                </span>
                                <br />
                                {formatDate(day.date)}
                              </>
                            ) : (
                              'Outside date range'
                            )}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 