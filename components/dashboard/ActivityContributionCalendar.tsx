import { useMemo } from 'react';
import { Activity } from '@/lib/strava/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActivityContributionCalendarProps {
  activities: Activity[];
}

const CONTRIBUTION_COLORS = {
  active: 'bg-blue-400',
  inactive: 'bg-gray-100',
};

export function ActivityContributionCalendar({
  activities,
}: ActivityContributionCalendarProps) {
  const contributionData = useMemo(() => {
    // Use end of today to ensure we include today's activities
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today

    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0); // Set to start of day

    // Helper function to generate consistent date keys
    const getDateKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Debug logging
    console.log('ActivityContributionCalendar Debug:', {
      totalActivities: activities.length,
      dateRange: {
        start: getDateKey(startDate),
        end: getDateKey(today),
      },
      recentActivities: activities.slice(0, 5).map(a => ({
        name: a.name,
        start_date: a.start_date,
        start_date_local: a.start_date_local,
      })),
    });

    // Create a set of dates with activities (binary approach)
    const activeDates = new Set<string>();
    activities.forEach((activity, index) => {
      // Use start_date_local if available for better timezone handling
      const activityDateStr = activity.start_date_local || activity.start_date;
      const date = new Date(activityDateStr);

      // Debug logging for first few activities to see date parsing
      if (index < 3) {
        console.log(`Activity ${index + 1} date parsing:`, {
          name: activity.name,
          original_start_date: activity.start_date,
          original_start_date_local: activity.start_date_local,
          using_date_string: activityDateStr,
          parsed_date: date.toISOString(),
          parsed_local_date: date.toLocaleDateString(),
          generated_key: getDateKey(date),
          date_components: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
          },
        });
      }

      if (date >= startDate && date <= today) {
        // Use consistent date key generation
        const dateKey = getDateKey(date);
        activeDates.add(dateKey);
      }
    });

    console.log('Active dates:', Array.from(activeDates));

    // Generate calendar data as a flat array of weeks
    const weeks: { date: string; hasActivity: boolean }[][] = [];
    let currentDate = new Date(startDate);

    // Start from the beginning of the week that contains startDate
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    currentDate = startOfWeek;

    // Debug: Log some calendar dates for comparison
    const calendarDebugDates: string[] = [];
    const tempDate = new Date(currentDate);
    for (let i = 0; i < 14; i++) {
      // Show first 2 weeks
      if (tempDate >= startDate && tempDate <= today) {
        calendarDebugDates.push(getDateKey(tempDate));
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    console.log(
      'Calendar generating date keys (first 2 weeks):',
      calendarDebugDates
    );

    while (currentDate <= today) {
      const week: { date: string; hasActivity: boolean }[] = [];

      for (let i = 0; i < 7; i++) {
        // Use the same date key generation method
        const dateKey = getDateKey(currentDate);
        const hasActivity =
          currentDate >= startDate && currentDate <= today
            ? activeDates.has(dateKey)
            : false;

        week.push({
          date: currentDate >= startDate && currentDate <= today ? dateKey : '',
          hasActivity,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeks.push(week);
    }

    return weeks;
  }, [activities]);

  const monthLabels = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 11);
    startDate.setDate(1);

    const months: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    contributionData.forEach((week, index) => {
      const firstValidDay = week.find(day => day.date !== '');
      if (firstValidDay) {
        const date = new Date(firstValidDay.date);
        const month = date.getMonth();

        if (month !== lastMonth && date.getDate() <= 7) {
          months.push({
            month: date.toLocaleString('default', { month: 'short' }),
            weekIndex: index,
          });
          lastMonth = month;
        }
      }
    });

    return months;
  }, [contributionData]);

  const getContributionColor = (hasActivity: boolean) => {
    return hasActivity
      ? CONTRIBUTION_COLORS.active
      : CONTRIBUTION_COLORS.inactive;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const totalWeeks = contributionData.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Calendar</CardTitle>
        <CardDescription>
          Your workout consistency over the past year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-3">
          {/* Legend */}
          <div className="flex justify-end items-center space-x-2">
            <span className="text-xs text-muted-foreground">No activity</span>
            <div
              className={`w-2.5 h-2.5 ${CONTRIBUTION_COLORS.inactive} rounded-sm`}
            />
            <div
              className={`w-2.5 h-2.5 ${CONTRIBUTION_COLORS.active} rounded-sm`}
            />
            <span className="text-xs text-muted-foreground">Workout day</span>
          </div>

          {/* Calendar */}
          <div className="w-full max-w-full">
            {/* Month labels - hidden on mobile, abbreviated on medium screens */}
            <div
              className="hidden sm:grid mb-1"
              style={{
                gridTemplateColumns: `repeat(${totalWeeks}, 1fr)`,
                gap: '2px',
              }}
            >
              {Array.from({ length: totalWeeks }, (_, index) => {
                const monthLabel = monthLabels.find(m => m.weekIndex === index);
                return (
                  <div
                    key={index}
                    className="text-xs text-muted-foreground text-left"
                  >
                    <span className="hidden md:inline">
                      {monthLabel?.month || ''}
                    </span>
                    <span className="md:hidden">
                      {monthLabel?.month?.charAt(0) || ''}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Day labels */}
            <div className="flex">
              <div className="flex flex-col mr-2 sm:mr-3 text-xs text-muted-foreground justify-between py-1">
                <div style={{ height: '12px' }}>
                  <span className="hidden sm:inline">Mon</span>
                  <span className="sm:hidden">M</span>
                </div>
                <div style={{ height: '12px' }}></div>
                <div style={{ height: '12px' }}>
                  <span className="hidden sm:inline">Wed</span>
                  <span className="sm:hidden">W</span>
                </div>
                <div style={{ height: '12px' }}></div>
                <div style={{ height: '12px' }}>
                  <span className="hidden sm:inline">Fri</span>
                  <span className="sm:hidden">F</span>
                </div>
                <div style={{ height: '12px' }}></div>
                <div style={{ height: '12px' }}>
                  <span className="hidden sm:inline">Sun</span>
                  <span className="sm:hidden">S</span>
                </div>
              </div>

              {/* Calendar grid */}
              <div
                className="grid gap-[1px] sm:gap-[2px] flex-1"
                style={{
                  gridTemplateColumns: `repeat(${totalWeeks}, 1fr)`,
                  gridTemplateRows: 'repeat(7, 12px)',
                  rowGap: '1px',
                  columnGap: '1px',
                }}
                data-mobile-gaps="true"
              >
                {contributionData.map((week, weekIndex) =>
                  week.map((day, dayIndex) => (
                    <TooltipProvider key={`${weekIndex}-${dayIndex}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`${getContributionColor(day.hasActivity)} rounded-sm cursor-pointer hover:ring-1 hover:ring-gray-400 transition-all`}
                            style={{
                              gridColumn: weekIndex + 1,
                              gridRow: dayIndex + 1,
                              width: '100%',
                              height: '100%',
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            {day.date ? (
                              <>
                                <span className="font-medium">
                                  {day.hasActivity
                                    ? 'Workout day'
                                    : 'No activity'}
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
  );
}
