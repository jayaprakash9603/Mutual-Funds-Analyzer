import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Customized,
  Label,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent, CHART_TOOLTIP_CURSOR } from '@/components/ui/chart'
import { useIsSmallScreen } from '@/hooks/useMediaQuery'
import { CHART_PANEL_RESPONSIVE_CLASS } from '@/lib/charts/chartSurface'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import {
  AXIS_LINE,
  drawdownYDomain,
  GRID_STROKE,
  chartPlotMargin,
  TICK_LINE,
  xLabel,
  yLabel,
  ZERO_LINE_STROKE,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { formatPercent } from '@/lib/utils'
import type { FundReportRisk } from '../../schemas'
import { snapToNearestSeriesDate } from '../../lib/drawdown/snapSeriesDate'
import { ChartMarkers, type ChartMarker } from '../../lib/charts/chartAnnotations'
import { ThresholdRecoveryTable } from '../tables/ThresholdRecoveryTable'

type Drawdown = FundReportRisk['drawdown']
type ThresholdRecovery = Drawdown['thresholdRecoveries'][number]

const THRESHOLD_OPTIONS = [-30, -40, -50] as const

const drawdownChartConfig = {
  drawdownPercent: { label: 'Drawdown', color: CHART_COLORS.red },
}

function formatCrossDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  })
}

function buildRecoveryHeadline(
  fundName: string,
  threshold: number,
  events: ThresholdRecovery[],
): string | null {
  const recovered = events.filter((event) => event.recovered)
  if (recovered.length === 0) return null

  const minYears = Math.min(...recovered.map((event) => event.recoveryYears))
  const maxYears = Math.max(...recovered.map((event) => event.recoveryYears))
  const minLabel = recovered.find((event) => event.recoveryYears === minYears)?.recoveryDurationLabel
  const maxLabel = recovered.find((event) => event.recoveryYears === maxYears)?.recoveryDurationLabel

  if (minYears === maxYears) {
    return `Historically ${fundName} took about ${minLabel} to recover from a ${Math.abs(threshold)}% decline.`
  }

  return `Historically ${fundName} took ${minLabel} to ${maxLabel} to recover from a ${Math.abs(threshold)}% decline.`
}

export function AnnotatedDrawdownChart({
  drawdown,
  fundName,
}: {
  drawdown: Drawdown
  fundName: string
}) {
  const axis = useResponsiveAxis()
  const isSmallScreen = useIsSmallScreen()
  const [threshold, setThreshold] = useState<(typeof THRESHOLD_OPTIONS)[number]>(-30)

  const seriesDates = useMemo(
    () => drawdown.series.map((point) => point.date),
    [drawdown.series],
  )

  const thresholdEvents = useMemo(
    () => drawdown.thresholdRecoveries.filter((event) => event.thresholdPercent === threshold),
    [drawdown.thresholdRecoveries, threshold],
  )

  const markers = useMemo<ChartMarker[]>(() => {
    return thresholdEvents.map((event) => {
      const snappedDate = snapToNearestSeriesDate(seriesDates, event.crossDate)
      const point = drawdown.series.find((row) => row.date === snappedDate)
      const returnLabel = event.usesCagr
        ? `${formatPercent(event.returnPercent, 0)} CAGR`
        : `${formatPercent(event.returnPercent, 0)} Absolute`

      return {
        id: `${event.thresholdPercent}-${event.sequence}`,
        date: snappedDate,
        value: point?.drawdownPercent ?? threshold,
        headline: `${event.sequence}`,
        detail: `${event.recoveryDurationLabel} · ${returnLabel}`,
        tone: 'decline',
      }
    })
  }, [drawdown.series, seriesDates, threshold, thresholdEvents])

  const headline = buildRecoveryHeadline(fundName, threshold, thresholdEvents)

  const visibleMarkers = useMemo(() => {
    if (!isSmallScreen || markers.length <= 3) return markers
    const first = markers[0]
    const last = markers[markers.length - 1]
    const middle = markers[Math.floor(markers.length / 2)]
    return [first, middle, last].filter(Boolean) as ChartMarker[]
  }, [isSmallScreen, markers])

  const markerLayer = useMemo(() => {
    return function ThresholdRecoveryMarkers(props: Record<string, unknown>) {
      return (
        <ChartMarkers
          {...(props as { xAxisMap?: Record<string, { scale?: (value: number) => number }>; yAxisMap?: Record<string, { scale?: (value: number) => number }> })}
          markers={visibleMarkers}
        />
      )
    }
  }, [visibleMarkers])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {THRESHOLD_OPTIONS.map((value) => (
          <Badge
            key={value}
            variant={threshold === value ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setThreshold(value)}
          >
            {Math.abs(value)}% decline
          </Badge>
        ))}
      </div>

      {headline ? <p className="text-sm font-medium text-foreground">{headline}</p> : null}

      <div className={CHART_PANEL_RESPONSIVE_CLASS}>
        <ChartContainer
          config={drawdownChartConfig}
          className="aspect-auto h-[320px] w-full sm:h-[380px] lg:h-[420px]"
        >
          <AreaChart data={drawdown.series} margin={chartPlotMargin({ top: 36, bottom: 8 })}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis
              dataKey="date"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              minTickGap={axis.xGap}
              height={axis.xHeight}
              tickFormatter={axis.formatMonthYearTick}
            >
              {axis.showXLabel ? <Label {...xLabel('Date', -2)} /> : null}
            </XAxis>
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              tickFormatter={axis.formatPercentTick}
              width={axis.yWidth}
              domain={drawdownYDomain(drawdown.series)}
              type="number"
            >
              {axis.showYLabel ? <Label {...yLabel('Drawdown (%)')} /> : null}
            </YAxis>
            <ReferenceLine y={0} stroke={ZERO_LINE_STROKE} strokeOpacity={0.35} strokeWidth={1.5} />
            <ReferenceLine
              y={threshold}
              stroke={CHART_COLORS.red}
              strokeDasharray="4 3"
              strokeOpacity={0.7}
            />
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent format="percent" />} />
            <Area
              type="monotone"
              dataKey="drawdownPercent"
              stroke={CHART_COLORS.red}
              fill={CHART_COLORS.red}
              fillOpacity={0.22}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Customized component={markerLayer} />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {thresholdEvents.map((event) => (
          <div
            key={`${event.crossDate}-${event.sequence}`}
            className="rounded-lg border border-border/70 bg-card/40 px-3 py-2 text-xs"
          >
            <p className="font-semibold text-foreground">
              {event.sequence}. {formatCrossDate(event.crossDate)}
            </p>
            <p>Recovery: {event.recoveryDurationLabel}</p>
            <p>
              Returns: {formatPercent(event.returnPercent, 0)}
              {event.usesCagr ? ' (CAGR)' : ' (Absolute)'}
            </p>
          </div>
        ))}
      </div>

      <ThresholdRecoveryTable recoveries={drawdown.thresholdRecoveries} />
    </div>
  )
}
