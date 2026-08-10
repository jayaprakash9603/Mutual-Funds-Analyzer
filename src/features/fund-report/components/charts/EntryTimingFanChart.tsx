import { useMemo, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Label,
  Legend,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { CHART_PANEL_RESPONSIVE_CLASS } from '@/lib/charts/chartSurface'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import {
  AXIS_LINE,
  GRID_STROKE,
  chartPlotMargin,
  TICK_LINE,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { formatPercent } from '@/lib/utils'
import type { MatrixReport } from '../../schemas'
import {
  availableEntryTimingHorizons,
  buildEntryTimingFan,
  type EntryTimingPoint,
} from '../../lib/matrix/entryTimingFan'
import { ChartRangeToggle } from './ChartRangeToggle'

type FanRow = EntryTimingPoint & {
  median: number
  bandBase: number
  bandSpan: number
}

function FanTooltip({
  active,
  payload,
  holdingYears,
}: {
  active?: boolean
  payload?: Array<{ payload: FanRow }>
  holdingYears: number
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null

  return (
    <div className="min-w-[180px] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-semibold">Started {row.startLabel}</p>
      <p className="tabular-nums text-muted-foreground">
        {holdingYears}Y CAGR: {formatPercent(row.value, 1)}
      </p>
      <p className="tabular-nums text-muted-foreground">
        Median across starts: {formatPercent(row.median, 1)}
      </p>
    </div>
  )
}

function formatInr(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

export function EntryTimingFanChart({ matrix }: { matrix: MatrixReport }) {
  const axis = useResponsiveAxis({ dense: true })
  const horizons = useMemo(() => availableEntryTimingHorizons(matrix), [matrix])
  const [holdingYears, setHoldingYears] = useState<number>(() => horizons[horizons.length - 1] ?? 5)

  const activeHorizon = horizons.includes(holdingYears)
    ? holdingYears
    : (horizons[horizons.length - 1] ?? holdingYears)

  const fan = useMemo(
    () => buildEntryTimingFan(matrix, activeHorizon),
    [matrix, activeHorizon],
  )

  const chartData = useMemo<FanRow[]>(() => {
    if (!fan) return []
    return fan.points.map((point) => ({
      ...point,
      median: fan.median,
      bandBase: fan.min,
      bandSpan: Math.max(0, fan.max - fan.min),
    }))
  }, [fan])

  if (horizons.length === 0 || !fan || chartData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough Jan-1 start years to show entry-timing risk for this fund.
      </p>
    )
  }

  const options = horizons.map((years) => ({
    id: String(years) as `${number}`,
    label: `${years}Y`,
  }))

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Each point is a Jan-1 lumpsum start. The spread shows how much{' '}
        <span className="font-medium text-foreground">entry year</span> mattered for a fixed{' '}
        {activeHorizon}-year hold.
      </p>
      <ChartRangeToggle
        ariaLabel="Holding period for entry-timing fan"
        options={options}
        value={String(activeHorizon) as `${number}`}
        onChange={(value) => setHoldingYears(Number(value))}
      />
      <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-sm">
        <p className="font-medium text-foreground">
          Worst Jan-1 start: {formatPercent(fan.min, 1)} CAGR. Median: {formatPercent(fan.median, 1)}.
          Best: {formatPercent(fan.max, 1)}.
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          ₹10,000 becomes {formatInr(fan.worstCorpusOf10k)} (worst) · {formatInr(fan.medianCorpusOf10k)}{' '}
          (median) · {formatInr(fan.bestCorpusOf10k)} (best) over {activeHorizon} years.
        </p>
      </div>
      <div className={CHART_PANEL_RESPONSIVE_CLASS}>
        <ChartContainer
          config={{}}
          className="aspect-auto h-[280px] w-full sm:h-[340px] lg:h-[380px]"
        >
          <ComposedChart data={chartData} margin={chartPlotMargin({ top: 12, bottom: 8 })}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis
              dataKey="startLabel"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              minTickGap={axis.xGap}
              height={axis.xHeight}
              angle={axis.xAngle}
              textAnchor={axis.xAnchor}
              interval="preserveStartEnd"
            >
              {axis.showXLabel ? <Label {...xLabel('Jan-1 entry year')} /> : null}
            </XAxis>
            <YAxis
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              tickFormatter={axis.formatPercentTick}
              width={axis.yWidth}
            >
              {axis.showYLabel ? <Label {...yLabel(`${activeHorizon}Y CAGR`)} /> : null}
            </YAxis>
            <Tooltip content={<FanTooltip holdingYears={activeHorizon} />} />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => <span className="text-muted-foreground">{value}</span>}
            />
            <ReferenceLine y={0} stroke={GRID_STROKE} />
            <ReferenceLine
              y={fan.median}
              stroke={CHART_COLORS.violet}
              strokeDasharray="4 4"
              label={{
                value: 'Median',
                position: 'insideTopRight',
                fill: CHART_COLORS.violet,
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="bandBase"
              stackId="band"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="bandSpan"
              name="Outcome spread"
              stackId="band"
              stroke="none"
              fill={CHART_COLORS.blue}
              fillOpacity={0.18}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              name="Jan-1 CAGR"
              stroke={CHART_COLORS.fund}
              strokeWidth={2}
              dot={{ r: axis.isSmall ? 2 : 3, fill: CHART_COLORS.fund }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  )
}
