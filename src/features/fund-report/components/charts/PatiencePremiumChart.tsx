import { useMemo } from 'react'
import {
  Area,
  Bar,
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
import type { FundReportPerformance } from '../../schemas'
import {
  buildPatienceRows,
  patienceHeadline,
  type PatienceRow,
} from '../../lib/rolling/patiencePremium'

type RollingReturns = FundReportPerformance['rollingReturns']

function PatienceTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: PatienceRow }>
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null

  return (
    <div className="min-w-[200px] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-semibold">{row.periodLabel} holding</p>
      <p className="tabular-nums text-muted-foreground">
        Min {formatPercent(row.min, 1)} · Median {formatPercent(row.median, 1)} · Max{' '}
        {formatPercent(row.max, 1)}
      </p>
      <p className="mt-1 tabular-nums text-red-600 dark:text-red-400">
        Chance of loss: {row.lossProbability.toFixed(1)}%
      </p>
    </div>
  )
}

export function PatiencePremiumChart({
  rollingReturns,
}: {
  rollingReturns: RollingReturns
}) {
  const axis = useResponsiveAxis()
  const rows = useMemo(() => buildPatienceRows(rollingReturns.periods), [rollingReturns.periods])
  const headline = useMemo(() => patienceHeadline(rows), [rows])

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough rolling-return history to show the patience premium.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {headline ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Patience premium — </span>
          {headline} Longer holds shrink both the outcome spread and the odds of finishing underwater.
        </p>
      ) : null}
      <div className={CHART_PANEL_RESPONSIVE_CLASS}>
        <ChartContainer
          config={{}}
          className="aspect-auto h-[300px] w-full sm:h-[360px] lg:h-[400px]"
        >
          <ComposedChart data={rows} margin={chartPlotMargin({ top: 12, bottom: 8, right: 12 })}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis
              dataKey="years"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              tickFormatter={(value) => `${value}Y`}
            >
              {axis.showXLabel ? <Label {...xLabel('Holding period (years)')} /> : null}
            </XAxis>
            <YAxis
              yAxisId="return"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              tickFormatter={axis.formatPercentTick}
              width={axis.yWidth}
            >
              {axis.showYLabel ? <Label {...yLabel('CAGR')} /> : null}
            </YAxis>
            <YAxis
              yAxisId="loss"
              orientation="right"
              tickLine={TICK_LINE}
              axisLine={AXIS_LINE}
              tick={axis.tick}
              tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
              width={axis.isSmall ? 36 : 44}
              domain={[0, 'dataMax']}
            />
            <Tooltip content={<PatienceTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => <span className="text-muted-foreground">{value}</span>}
            />
            <ReferenceLine yAxisId="return" y={0} stroke={GRID_STROKE} />
            <Area
              yAxisId="return"
              type="monotone"
              dataKey="bandBase"
              stackId="band"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
              legendType="none"
            />
            <Area
              yAxisId="return"
              type="monotone"
              dataKey="bandSpan"
              name="Min–max range"
              stackId="band"
              stroke="none"
              fill={CHART_COLORS.blue}
              fillOpacity={0.22}
              isAnimationActive={false}
            />
            <Line
              yAxisId="return"
              type="monotone"
              dataKey="median"
              name="Median CAGR"
              stroke={CHART_COLORS.fund}
              strokeWidth={2.5}
              dot={{ r: axis.isSmall ? 2 : 3, fill: CHART_COLORS.fund }}
              isAnimationActive={false}
            />
            <Bar
              yAxisId="loss"
              dataKey="lossProbability"
              name="Chance of loss"
              fill={CHART_COLORS.red}
              fillOpacity={0.55}
              barSize={axis.isSmall ? 10 : 14}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  )
}
