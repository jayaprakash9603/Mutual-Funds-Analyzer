import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Customized,
  Label,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, CHART_TOOLTIP_CURSOR } from '@/components/ui/chart'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import {
  AXIS_LINE,
  GRID_STROKE,
  MARGIN_X,
  TICK_LINE,
  TICK_MD,
  formatAxisPercentTick,
  xLabel,
  yLabel,
  ZERO_LINE_STROKE,
} from '@/lib/charts/chartAxes'
import { formatPercent } from '@/lib/utils'
import type { FundReport } from '../../schemas'
import {
  buildCycleChartModel,
  buildDeclineRecoveryCycles,
  buildIndexedNavTimelineModel,
  cycleHeadline,
  formatIndexedNavTick,
  type CycleColumnBand,
} from '../../lib/drawdown/declineRecoveryCycles'

type Phases = FundReport['drawdown']['phases']
type IndexedNav = FundReport['drawdown']['indexedNav']

const timelineConfig = {
  indexValue: { label: 'Indexed NAV', color: CHART_COLORS.fund },
  declineNav: { label: 'Decline', color: CHART_COLORS.red },
  recoveryNav: { label: 'Recovery', color: CHART_COLORS.fund },
}

const columnConfig = {
  decline: { label: 'Decline', color: CHART_COLORS.red },
  recovery: { label: 'Recovery', color: CHART_COLORS.fund },
}

type DeclineRecoveryChartProps = {
  phases: Phases
  indexedNav: IndexedNav
  fundName: string
}

type AxisScale = {
  scale?: (value: number) => number
}

type CustomizedChartProps = {
  width?: number
  height?: number
  offset?: { top?: number; left?: number }
  xAxisMap?: Record<string, AxisScale>
  yAxisMap?: Record<string, AxisScale>
  bands: CycleColumnBand[]
  yLimit: number
}

function firstScale(map?: Record<string, AxisScale>): ((value: number) => number) | undefined {
  if (!map) return undefined
  const axis = Object.values(map)[0]
  return axis?.scale
}

function CycleLabel({
  x,
  y,
  value,
  fill,
  fontSize = 10,
}: {
  x: number
  y: number
  value: string
  fill: string
  fontSize?: number
}) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      textAnchor="middle"
      fontSize={fontSize}
      fontWeight={600}
      dominantBaseline="middle"
    >
      {value}
    </text>
  )
}

function CycleAnnotations({ bands, yLimit, xAxisMap, yAxisMap }: CustomizedChartProps) {
  const xScale = firstScale(xAxisMap)
  const yScale = firstScale(yAxisMap)
  if (!xScale || !yScale) return null

  return (
    <g>
      {bands.map((band) => {
        const cx = xScale(band.xCenter)
        const declinePointY = yScale(band.minY)
        const recoveryPointY = yScale(band.maxY)
        const titleY = yScale(yLimit) - 10
        const declineLabelY = declinePointY + 16
        const recoveryLabelY = recoveryPointY - 14

        return (
          <g key={`${band.cycle.id}-labels`}>
            <CycleLabel x={cx} y={titleY} value={band.cycle.label} fill="#475569" fontSize={11} />
            <CycleLabel
              x={cx}
              y={declineLabelY}
              value={`${band.cycle.declineDuration} · -${formatPercent(band.cycle.declinePercent, 0)}`}
              fill={CHART_COLORS.red}
            />
            <CycleLabel
              x={cx}
              y={recoveryLabelY}
              value={`${band.cycle.recoveryDuration} · ${formatPercent(band.cycle.recoveryPercent, 0)}`}
              fill={CHART_COLORS.fund}
            />
          </g>
        )
      })}
    </g>
  )
}

function IndexedNavTimeline({
  phases,
  indexedNav,
  fundName,
  headline,
}: {
  phases: Phases
  indexedNav: IndexedNav
  fundName: string
  headline: string | null
}) {
  const model = useMemo(
    () => buildIndexedNavTimelineModel(indexedNav, phases),
    [indexedNav, phases],
  )

  if (model.points.length === 0) return null

  return (
    <div className="space-y-3">
      {headline ? <p className="text-base font-semibold text-foreground">{headline}</p> : null}
      <p className="text-sm text-muted-foreground">
        Full indexed NAV path for {fundName} (100 = first available NAV). Red traces major
        decline legs; green traces the recovery back toward the prior peak.
      </p>
      <div className="w-full rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
        <ChartContainer
          config={timelineConfig}
          className="aspect-auto h-[320px] w-full sm:h-[380px] lg:h-[420px]"
        >
          <AreaChart data={model.points} margin={{ ...MARGIN_X, left: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />

            {model.bands.map((band, index) => (
              <ReferenceArea
                key={`${band.cycle.id}-shade`}
                x1={band.dateStart}
                x2={band.dateEnd}
                fill={index % 2 === 0 ? '#eff6ff' : '#ffffff'}
                fillOpacity={0.85}
                strokeOpacity={0}
                ifOverflow="extendDomain"
              />
            ))}

            <XAxis
              dataKey="date"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={TICK_MD}
              minTickGap={48}
              height={44}
            >
              <Label {...xLabel('Date', -2)} />
            </XAxis>
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={TICK_MD}
              tickFormatter={formatIndexedNavTick}
              width={48}
              domain={model.yDomain}
              type="number"
            >
              <Label {...yLabel('Indexed NAV')} />
            </YAxis>

            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />

            <Area
              type="monotone"
              dataKey="indexValue"
              stroke={CHART_COLORS.fund}
              fill={CHART_COLORS.fund}
              fillOpacity={0.08}
              strokeWidth={1.5}
              isAnimationActive={false}
              dot={false}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="declineNav"
              stroke={CHART_COLORS.red}
              fill={CHART_COLORS.red}
              fillOpacity={0.28}
              strokeWidth={2}
              isAnimationActive={false}
              dot={false}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="recoveryNav"
              stroke={CHART_COLORS.fund}
              fill={CHART_COLORS.fund}
              fillOpacity={0.35}
              strokeWidth={2}
              isAnimationActive={false}
              dot={false}
              connectNulls={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  )
}

function CycleColumns({
  cycles,
  indexedNav,
  fundName,
  headline,
}: {
  cycles: ReturnType<typeof buildDeclineRecoveryCycles>
  indexedNav: IndexedNav
  fundName: string
  headline: string | null
}) {
  const model = useMemo(
    () => buildCycleChartModel(cycles, indexedNav),
    [cycles, indexedNav],
  )

  const chartHeight = Math.max(300, 96 + cycles.length * 6)

  const annotationLayer = useMemo(() => {
    const bands = model.bands
    const yLimit = model.yLimit
    return function DeclineRecoveryAnnotations(props: Record<string, unknown>) {
      return (
        <CycleAnnotations
          {...(props as Omit<CustomizedChartProps, 'bands' | 'yLimit'>)}
          bands={bands}
          yLimit={yLimit}
        />
      )
    }
  }, [model.bands, model.yLimit])

  return (
    <div className="space-y-3">
      {!headline ? null : (
        <p className="text-base font-semibold text-foreground sr-only">{headline}</p>
      )}
      <p className="text-sm text-muted-foreground">
        Each column is one major cycle for {fundName}: red shows the actual NAV fall from peak to
        trough, green shows the bounce back toward the prior peak (% move from that peak).
        {model.usesRealNav ? ' Paths use daily indexed NAV.' : ''}
      </p>

      <div className="w-full overflow-x-auto rounded-xl border border-border bg-white p-3 sm:p-4 dark:bg-card">
        <ChartContainer
          config={columnConfig}
          className="aspect-auto w-full min-w-[680px]"
          style={{ height: chartHeight }}
        >
          <AreaChart data={model.points} margin={{ top: 28, right: 12, left: 48, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />

            {model.bands.map((band, index) => (
              <ReferenceArea
                key={`${band.cycle.id}-band`}
                x1={band.xStart - 0.04}
                x2={band.xEnd + 0.04}
                y1={-model.yLimit}
                y2={model.yLimit}
                fill={index % 2 === 0 ? '#eff6ff' : '#ffffff'}
                fillOpacity={1}
                strokeOpacity={0}
                ifOverflow="extendDomain"
              />
            ))}

            <XAxis
              dataKey="x"
              type="number"
              domain={[0, model.xMax]}
              tickLine={false}
              axisLine={AXIS_LINE}
              tick={false}
              height={1}
            />
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={TICK_MD}
              tickFormatter={formatAxisPercentTick}
              width={48}
              domain={[-model.yLimit, model.yLimit]}
              type="number"
            >
              <Label {...yLabel('% from peak', -90)} />
            </YAxis>

            <ReferenceLine y={0} stroke={ZERO_LINE_STROKE} strokeWidth={1.5} strokeOpacity={0.65} />

            <Area
              type="monotone"
              dataKey="decline"
              stroke={CHART_COLORS.red}
              fill={CHART_COLORS.red}
              fillOpacity={0.9}
              strokeWidth={1.5}
              isAnimationActive={false}
              dot={false}
              activeDot={false}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="recovery"
              stroke={CHART_COLORS.fund}
              fill={CHART_COLORS.fund}
              fillOpacity={0.9}
              strokeWidth={1.5}
              isAnimationActive={false}
              dot={false}
              activeDot={false}
              connectNulls={false}
            />

            <Customized component={annotationLayer} />
          </AreaChart>
        </ChartContainer>

        <p className="mt-2 text-xs text-muted-foreground">
          Only cycles with at least a 10% peak-to-trough fall are shown. Ongoing recoveries use the
          latest NAV.
        </p>
      </div>
    </div>
  )
}

export function DeclineRecoveryChart({ phases, indexedNav, fundName }: DeclineRecoveryChartProps) {
  const cycles = useMemo(() => buildDeclineRecoveryCycles(phases), [phases])
  const headline = useMemo(() => cycleHeadline(cycles), [cycles])

  if (cycles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No major decline-and-recovery cycles (≥10% drawdown) found in the available history.
      </p>
    )
  }

  const hasIndexedNav = indexedNav.length > 0

  return (
    <div className="space-y-10">
      {hasIndexedNav ? (
        <IndexedNavTimeline
          phases={phases}
          indexedNav={indexedNav}
          fundName={fundName}
          headline={headline}
        />
      ) : null}
      <CycleColumns
        cycles={cycles}
        indexedNav={indexedNav}
        fundName={fundName}
        headline={hasIndexedNav ? null : headline}
      />
    </div>
  )
}
