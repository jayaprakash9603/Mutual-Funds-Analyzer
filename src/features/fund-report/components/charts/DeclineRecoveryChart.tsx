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
import { useIsSmallScreen } from '@/hooks/useMediaQuery'
import { CHART_CYCLE_BAND_EVEN, CHART_CYCLE_BAND_ODD, CHART_PANEL_CLASS } from '@/lib/charts/chartSurface'
import { ChartContainer, ChartTooltip, ChartTooltipContent, CHART_TOOLTIP_CURSOR } from '@/components/ui/chart'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import {
  AXIS_LINE,
  GRID_STROKE,
  chartPlotMargin,
  TICK_LINE,
  formatAxisPercentTick,
  xLabel,
  yLabel,
  ZERO_LINE_STROKE,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { cn, formatPercent } from '@/lib/utils'
import type { FundReport } from '../../schemas'
import {
  buildContinuousPhaseTimelineModel,
  buildDeclineRecoveryCycles,
  buildIndexedNavTimelineModel,
  cycleHeadline,
  formatIndexedNavTick,
  type PhaseAnnotation,
  type PhaseMarker,
  type PhaseTimelineBand,
  type ContinuousPhasePoint,
} from '../../lib/drawdown/declineRecoveryCycles'
import { largestMarkerPerCycle } from '../../lib/drawdown/filterMarkersForMobile'

type Phases = FundReport['drawdown']['phases']
type IndexedNav = FundReport['drawdown']['indexedNav']

const timelineConfig = {
  indexValue: { label: 'Indexed NAV', color: CHART_COLORS.fund },
  declineNav: { label: 'Decline', color: CHART_COLORS.red },
  recoveryNav: { label: 'Recovery', color: CHART_COLORS.fund },
}

const phaseConfig = {
  decline: { label: 'Decline', color: CHART_COLORS.red },
  upside: { label: 'Upside', color: CHART_COLORS.fund },
}

type DeclineRecoveryChartProps = {
  phases: Phases
  indexedNav: IndexedNav
  fundName: string
}

type AxisScale = {
  scale?: (value: number) => number
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

function PhaseMoveTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ payload: ContinuousPhasePoint }>
  label?: string
}) {
  if (!active || !payload?.length || !label) return null
  const row = payload[0]?.payload
  if (!row) return null

  return (
    <div className="rounded-lg border border-border/80 bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      <p className="font-semibold text-foreground">{label}</p>
      {row.decline != null ? (
        <p className="mt-1 tabular-nums" style={{ color: CHART_COLORS.red }}>
          Fall from peak: {formatPercent(row.decline, 1)}
        </p>
      ) : null}
      {row.upside != null ? (
        <p className="mt-1 tabular-nums" style={{ color: CHART_COLORS.fund }}>
          Bounce from trough: +{formatPercent(row.upside, 1)}
        </p>
      ) : null}
      {row.decline == null && row.upside == null ? (
        <p className="mt-1 text-muted-foreground">No active phase on this date</p>
      ) : null}
    </div>
  )
}

function MarkerPill({
  x,
  y,
  marker,
}: {
  x: number
  y: number
  marker: PhaseMarker
}) {
  const fill = marker.tone === 'decline' ? CHART_COLORS.red : CHART_COLORS.fund
  const labelOffset = marker.tone === 'decline' ? 24 : -18
  const detailOffset = marker.tone === 'decline' ? 38 : -32
  const pillWidth = Math.max(44, marker.headline.length * 7 + 14)

  return (
    <g>
      <circle cx={x} cy={y} r={4.5} fill={fill} stroke="#ffffff" strokeWidth={1.5} />
      <rect
        x={x - pillWidth / 2}
        y={y + labelOffset - 11}
        width={pillWidth}
        height={20}
        rx={5}
        fill={fill}
        opacity={0.95}
      />
      <text
        x={x}
        y={y + labelOffset + 2}
        fill="#ffffff"
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        dominantBaseline="middle"
      >
        {marker.headline}
      </text>
      <text
        x={x}
        y={y + detailOffset}
        fill="var(--chart-marker-detail)"
        textAnchor="middle"
        fontSize={9}
        fontWeight={500}
        dominantBaseline="middle"
      >
        {marker.detail}
      </text>
    </g>
  )
}

function PhaseMarkers({
  markers,
  xAxisMap,
  yAxisMap,
  mobile = false,
  bands = [],
}: {
  markers: PhaseMarker[]
  xAxisMap?: Record<string, AxisScale>
  yAxisMap?: Record<string, AxisScale>
  mobile?: boolean
  bands?: PhaseTimelineBand[]
}) {
  const xScale = firstScale(xAxisMap)
  const yScale = firstScale(yAxisMap)
  if (!xScale || !yScale) return null

  const scaleX = xScale as (value: string | number) => number
  const visibleMarkers = mobile ? largestMarkerPerCycle(markers, bands) : markers

  return (
    <g>
      {visibleMarkers.map((marker) => (
        <MarkerPill
          key={marker.id}
          x={scaleX(marker.date)}
          y={yScale(marker.value)}
          marker={marker}
        />
      ))}
    </g>
  )
}

type PhaseAnnotationChartProps = {
  width?: number
  height?: number
  offset?: { top?: number; left?: number }
  xAxisMap?: Record<string, AxisScale>
  yAxisMap?: Record<string, AxisScale>
  annotations: PhaseAnnotation[]
  markers: PhaseMarker[]
  yLimit: number
  mobile?: boolean
  bands?: PhaseTimelineBand[]
}

function PhaseAnnotations({
  annotations,
  markers,
  yLimit,
  xAxisMap,
  yAxisMap,
  mobile = false,
  bands = [],
}: PhaseAnnotationChartProps) {
  const xScale = firstScale(xAxisMap)
  const yScale = firstScale(yAxisMap)
  if (!xScale || !yScale) return null

  return (
    <g>
      {annotations.map((annotation) => {
        const scaleX = xScale as (value: string | number) => number
        const cx = (scaleX(annotation.dateStart) + scaleX(annotation.dateEnd)) / 2
        const titleY = yScale(yLimit) - 6

        return (
          <g key={annotation.id}>
            <rect
              x={cx - 28}
              y={titleY - 10}
              width={56}
              height={16}
              rx={4}
              fill="var(--chart-annotation-fill)"
              stroke="var(--chart-annotation-stroke)"
              strokeWidth={0.75}
            />
            <CycleLabel x={cx} y={titleY - 1} value={annotation.label} fill="var(--chart-annotation-text)" fontSize={10} />
          </g>
        )
      })}
      <PhaseMarkers
        markers={markers}
        xAxisMap={xAxisMap}
        yAxisMap={yAxisMap}
        mobile={mobile}
        bands={bands}
      />
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
  const axis = useResponsiveAxis()
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
      <div className={cn('w-full', CHART_PANEL_CLASS)}>
        <ChartContainer
          config={timelineConfig}
          className="aspect-auto h-[320px] w-full sm:h-[380px] lg:h-[420px]"
        >
          <AreaChart data={model.points} margin={chartPlotMargin({ top: 12, bottom: 8 })}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />

            {model.bands.map((band, index) => (
              <ReferenceArea
                key={`${band.cycle.id}-shade`}
                x1={band.dateStart}
                x2={band.dateEnd}
                fill={index % 2 === 0 ? CHART_CYCLE_BAND_EVEN : CHART_CYCLE_BAND_ODD}
                fillOpacity={1}
                strokeOpacity={0}
                ifOverflow="extendDomain"
              />
            ))}

            <XAxis
              dataKey="date"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              minTickGap={axis.xGap}
              height={axis.xHeight}
            >
              <Label {...xLabel('Date', -2)} />
            </XAxis>
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              tickFormatter={formatIndexedNavTick}
              width={axis.yWidth}
              domain={model.yDomain}
              type="number"
            >
              {axis.showYLabel ? <Label {...yLabel('Indexed NAV')} /> : null}
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

function ContinuousPhaseTimeline({
  phases,
  indexedNav,
  cycles,
  fundName,
  headline,
}: {
  phases: Phases
  indexedNav: IndexedNav
  cycles: ReturnType<typeof buildDeclineRecoveryCycles>
  fundName: string
  headline: string | null
}) {
  const isSmall = useIsSmallScreen()
  const axis = useResponsiveAxis()
  const model = useMemo(
    () => buildContinuousPhaseTimelineModel(phases, indexedNav, cycles),
    [phases, indexedNav, cycles],
  )

  const annotationLayer = useMemo(() => {
    const annotations = model.annotations
    const markers = model.markers
    const yLimit = model.yLimit
    const bands = model.bands
    const mobile = isSmall
    return function ContinuousPhaseAnnotations(props: Record<string, unknown>) {
      return (
        <PhaseAnnotations
          {...(props as Omit<PhaseAnnotationChartProps, 'annotations' | 'markers' | 'yLimit' | 'mobile' | 'bands'>)}
          annotations={annotations}
          markers={markers}
          yLimit={yLimit}
          mobile={mobile}
          bands={bands}
        />
      )
    }
  }, [isSmall, model.annotations, model.bands, model.markers, model.yLimit])

  return (
    <div className="space-y-3">
      {headline ? <p className="text-base font-semibold text-foreground">{headline}</p> : null}
      <p className="text-sm text-muted-foreground">
        Market decline and recovery for {fundName} in chronological order: red shows the fall from
        each peak, green shows the bounce from each trough. Labels mark the peak move in each phase;
        hover any point for the exact % on that date.
        {model.usesRealNav ? ' Paths use daily indexed NAV.' : ''}
      </p>

      <div className="mb-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ background: CHART_COLORS.red }} />
          Decline from peak
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ background: CHART_COLORS.fund }} />
          Upside from trough
        </span>
        <span>Pills show total phase move · duration</span>
      </div>

      <div className={cn('w-full', CHART_PANEL_CLASS)}>
        <ChartContainer
          config={phaseConfig}
          className="aspect-auto h-[320px] w-full sm:h-[380px] lg:h-[420px]"
        >
          <AreaChart data={model.points} margin={chartPlotMargin({ top: 36, bottom: 8 })}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />

            {model.bands.map((band: PhaseTimelineBand, index: number) => (
              <ReferenceArea
                key={`${band.cycle.id}-band`}
                x1={band.dateStart}
                x2={band.dateEnd}
                y1={-model.yLimit}
                y2={model.yLimit}
                fill={index % 2 === 0 ? CHART_CYCLE_BAND_EVEN : CHART_CYCLE_BAND_ODD}
                fillOpacity={1}
                strokeOpacity={0}
                ifOverflow="extendDomain"
              />
            ))}

            <XAxis
              dataKey="date"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              minTickGap={axis.xGap}
              height={axis.xHeight}
            >
              <Label {...xLabel('Date', -2)} />
            </XAxis>
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              tickFormatter={formatAxisPercentTick}
              width={axis.yWidth}
              domain={[-model.yLimit, model.yLimit]}
              type="number"
            >
              {axis.showYLabel ? <Label {...yLabel('% move', -90)} /> : null}
            </YAxis>

            <ReferenceLine y={0} stroke={ZERO_LINE_STROKE} strokeWidth={1.5} strokeOpacity={0.65} />

            <ChartTooltip
              cursor={CHART_TOOLTIP_CURSOR}
              content={<PhaseMoveTooltip />}
            />

            <Area
              type="monotone"
              dataKey="decline"
              baseValue={0}
              stroke={CHART_COLORS.red}
              fill={CHART_COLORS.red}
              fillOpacity={0.9}
              strokeWidth={1.5}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 1.5, fill: CHART_COLORS.red, stroke: '#fff' }}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="upside"
              baseValue={0}
              stroke={CHART_COLORS.fund}
              fill={CHART_COLORS.fund}
              fillOpacity={0.9}
              strokeWidth={1.5}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 1.5, fill: CHART_COLORS.fund, stroke: '#fff' }}
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
      <ContinuousPhaseTimeline
        phases={phases}
        indexedNav={indexedNav}
        cycles={cycles}
        fundName={fundName}
        headline={headline}
      />
      {hasIndexedNav ? (
        <IndexedNavTimeline
          phases={phases}
          indexedNav={indexedNav}
          fundName={fundName}
          headline={null}
        />
      ) : null}
    </div>
  )
}
