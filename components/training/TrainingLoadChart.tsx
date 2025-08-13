'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Heart,
  Zap,
  HelpCircle,
} from 'lucide-react';
import {
  useTrainingLoad,
  useTrainingLoadTrends,
} from '@/hooks/useTrainingLoad';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ComposedChart,
  Bar,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface TrainingLoadChartProps {
  userId: string;
  className?: string;
}

export function TrainingLoadChart({
  userId,
  className,
}: TrainingLoadChartProps) {
  const { data, isLoading, error, hasData, hasHRData, hasPowerData } =
    useTrainingLoad(userId, { days: 90 });
  const { data: trends } = useTrainingLoadTrends(userId, 90);

  const chartData = useMemo(() => {
    if (!trends) return [];

    return trends.map(trend => ({
      date: trend.date,
      formattedDate: format(parseISO(trend.date), 'MMM dd'),
      dailyLoad: trend.dailyLoad,
      atl: trend.atl,
      ctl: trend.ctl,
      tsb: trend.tsb,
      trimp: trend.trimp,
      tss: trend.tss,
    }));
  }, [trends]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Training Load
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">
              Loading training load data...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !hasData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Training Load
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>No training data available</p>
              <p className="text-sm">
                Sync some activities to see your training load
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    metrics,
    athleteThresholds,
    dataQuality,
    totalActivities,
    activitiesWithHR,
    activitiesWithPower,
  } = data!;

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Training Load Analysis
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <DataQualityBadge quality={dataQuality} />
            <Badge variant="outline" className="text-xs">
              {totalActivities} activities
            </Badge>
            {hasHRData && (
              <Badge
                variant="outline"
                className="text-xs flex items-center gap-1"
              >
                <Heart className="h-3 w-3" />
                {activitiesWithHR} with HR
              </Badge>
            )}
            {hasPowerData && (
              <Badge
                variant="outline"
                className="text-xs flex items-center gap-1"
              >
                <Zap className="h-3 w-3" />
                {activitiesWithPower} with power
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <TrainingLoadMetrics metrics={metrics} />
              {chartData.length > 0 && (
                <div className="space-y-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={chartData.slice(-30)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                          dataKey="formattedDate"
                          tick={{ fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Bar
                          dataKey="dailyLoad"
                          fill="#3b82f6"
                          opacity={0.6}
                          name="Daily Load"
                        />
                        <Line
                          type="monotone"
                          dataKey="ctl"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                          name="Fitness (CTL)"
                        />
                        <Line
                          type="monotone"
                          dataKey="atl"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={false}
                          name="Fatigue (ATL)"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Custom Legend */}
                  <div className="flex flex-col gap-2 text-sm items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-blue-500 opacity-60 rounded-sm"></div>
                      <span>Daily Load</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-green-500 rounded-sm"></div>
                      <span>Fitness (CTL)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-amber-500 rounded-sm"></div>
                      <span>Fatigue (ATL)</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              {chartData.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-64">
                    <h4 className="text-sm font-medium mb-2">
                      Training Load Trends (90 days)
                    </h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                          dataKey="formattedDate"
                          tick={{ fontSize: 12 }}
                          interval={Math.floor(chartData.length / 6)}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="ctl"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Fitness"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="atl"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          name="Fatigue"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="tsb"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          name="Form"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="h-64">
                    <h4 className="text-sm font-medium mb-2">
                      Daily Training Load
                    </h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                          dataKey="formattedDate"
                          tick={{ fontSize: 12 }}
                          interval={Math.floor(chartData.length / 6)}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Area
                          type="monotone"
                          dataKey="dailyLoad"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No trend data available
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <AthleteThresholds thresholds={athleteThresholds} />
              <TrainingLoadExplanation />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function DataQualityBadge({ quality }: { quality: string }) {
  const variants = {
    excellent: {
      variant: 'default' as const,
      color: 'bg-green-500',
      icon: CheckCircle,
    },
    good: {
      variant: 'secondary' as const,
      color: 'bg-blue-500',
      icon: CheckCircle,
    },
    fair: {
      variant: 'outline' as const,
      color: 'bg-yellow-500',
      icon: AlertTriangle,
    },
    poor: {
      variant: 'outline' as const,
      color: 'bg-orange-500',
      icon: AlertTriangle,
    },
    none: {
      variant: 'outline' as const,
      color: 'bg-red-500',
      icon: AlertTriangle,
    },
  };

  const config = variants[quality as keyof typeof variants] || variants.none;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="text-xs flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {quality} data quality
    </Badge>
  );
}

interface TrainingLoadMetricsData {
  acute: number;
  chronic: number;
  balance: number;
  rampRate: number;
  status: string;
  recommendation: string;
}

function TrainingLoadMetrics({
  metrics,
}: {
  metrics: TrainingLoadMetricsData;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'peak':
        return 'bg-red-500';
      case 'build':
        return 'bg-green-500';
      case 'maintain':
        return 'bg-blue-500';
      case 'recover':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'peak':
        return TrendingUp;
      case 'build':
        return TrendingUp;
      case 'maintain':
        return Minus;
      case 'recover':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const StatusIcon = getStatusIcon(metrics.status);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="text-sm font-medium text-muted-foreground cursor-help flex items-center gap-1">
                Fitness (CTL)
                <HelpCircle className="h-3 w-3" />
              </label>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Your chronic training load over 42 days. Higher values indicate
                better fitness.
              </p>
            </TooltipContent>
          </Tooltip>
          <div className="text-2xl font-bold">{metrics.chronic}</div>
          <Progress
            value={Math.min(100, (metrics.chronic / 100) * 100)}
            className="h-2"
          />
        </div>

        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="text-sm font-medium text-muted-foreground cursor-help flex items-center gap-1">
                Fatigue (ATL)
                <HelpCircle className="h-3 w-3" />
              </label>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Your acute training load over 7 days. Represents short-term
                fatigue.
              </p>
            </TooltipContent>
          </Tooltip>
          <div className="text-2xl font-bold">{metrics.acute}</div>
          <Progress
            value={Math.min(100, (metrics.acute / 100) * 100)}
            className="h-2"
          />
        </div>

        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="text-sm font-medium text-muted-foreground cursor-help flex items-center gap-1">
                Form (TSB)
                <HelpCircle className="h-3 w-3" />
              </label>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Training Stress Balance = Fitness - Fatigue. Positive values
                suggest good form for performance.
              </p>
            </TooltipContent>
          </Tooltip>
          <div className="text-2xl font-bold">
            {metrics.balance > 0 ? '+' : ''}
            {metrics.balance}
          </div>
          <div
            className={`h-2 rounded-full ${metrics.balance > 0 ? 'bg-green-200' : 'bg-red-200'}`}
          >
            <div
              className={`h-full rounded-full ${metrics.balance > 0 ? 'bg-green-500' : 'bg-red-500'}`}
              style={{
                width: `${Math.min(100, Math.abs(metrics.balance) * 5)}%`,
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="text-sm font-medium text-muted-foreground cursor-help flex items-center gap-1">
                Ramp Rate
                <HelpCircle className="h-3 w-3" />
              </label>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Weekly training load change. Positive values show increasing
                load, negative values show recovery.
              </p>
            </TooltipContent>
          </Tooltip>
          <div className="text-2xl font-bold">
            {metrics.rampRate > 0 ? '+' : ''}
            {metrics.rampRate}
          </div>
          <Badge
            variant="secondary"
            className={`${getStatusColor(metrics.status)} text-white flex items-center gap-1`}
          >
            <StatusIcon className="h-3 w-3" />
            {metrics.status}
          </Badge>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-muted/50">
        <h4 className="font-medium mb-2">Recommendation</h4>
        <p className="text-sm text-muted-foreground">
          {metrics.recommendation}
        </p>
      </div>
    </div>
  );
}

interface AthleteThresholdsData {
  maxHeartRate: number;
  restingHeartRate: number;
  functionalThresholdPower?: number;
  lactateThreshold?: number;
}

function AthleteThresholds({
  thresholds,
}: {
  thresholds: AthleteThresholdsData;
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Estimated Thresholds</h4>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Max HR
          </label>
          <div className="text-lg font-semibold">
            {thresholds.maxHeartRate} bpm
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Resting HR
          </label>
          <div className="text-lg font-semibold">
            {thresholds.restingHeartRate} bpm
          </div>
        </div>

        {thresholds.functionalThresholdPower && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              FTP
            </label>
            <div className="text-lg font-semibold">
              {Math.round(thresholds.functionalThresholdPower)}W
            </div>
          </div>
        )}

        {thresholds.lactateThreshold && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              LTHR
            </label>
            <div className="text-lg font-semibold">
              {Math.round(thresholds.lactateThreshold)} bpm
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TrainingLoadExplanation() {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Understanding Training Load</h4>
      <div className="space-y-3 text-sm text-muted-foreground">
        <div>
          <span className="font-medium">Fitness (CTL):</span> Your chronic
          training load over 42 days. Higher values indicate better fitness.
        </div>
        <div>
          <span className="font-medium">Fatigue (ATL):</span> Your acute
          training load over 7 days. Represents short-term fatigue.
        </div>
        <div>
          <span className="font-medium">Form (TSB):</span> Training Stress
          Balance = Fitness - Fatigue. Positive values suggest good form for
          performance.
        </div>
        <div>
          <span className="font-medium">TRIMP:</span> Training Impulse
          calculated from heart rate and duration with sport-specific
          adjustments.
        </div>
        <div>
          <span className="font-medium">TSS:</span> Training Stress Score based
          on power (when available) or heart rate intensity.
        </div>
      </div>
    </div>
  );
}
