import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { CHART_PANEL_RESPONSIVE_CLASS } from '@/lib/charts/chartSurface'
import {
  AXIS_LINE,
  GRID_STROKE,
  chartPlotMargin,
  TICK_LINE,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import type { FundReportRisk } from '../../schemas'
import {
  buildUnderwaterDuration,
  type UnderwaterBucket,
} from '../../lib/drawdown/underwaterDuration'

type Drawdown = FundReportRisk['drawdown']

const BUCKET_COLORS = ['#86efac', '#4ade80', '#fbbf24', '#f97316', '#ef4444'] as const

function DurationTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: UnderwaterBucket }>
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null

  return (
    <div className="min-w-[180px] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-semibold">{row.bucketLabel} to recover</p>
      <p className="tabular-nums text-muted-foreground">
        {row.count} episode{row.count === 1 ? '' : 's'} ({row.percentOfEpisodes.toFixed(0)}%)
      </p>
    </div>
  )
}

export function UnderwaterDurationChart({ drawdown }: { drawdown: Drawdown }) {
  const axis = useResponsiveAxis()
  const { buckets, totalEpisodes, ongoing } = useMemo(
    () => buildUnderwaterDuration(drawdown),
    [drawdown],
  )

  if (totalEpisodes === 0 && !ongoing) {
    return (
      <p className="text-sm text-muted-foreground">
        No recovered drawdown episodes yet to build an underwater-duration distribution.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        How long past ≥10% drawdowns took to get back to the prior peak. Longer bars mean more time
        spent underwater.
      </p>
      {ongoing ? (
        <div
          role="status"
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
        >
          Currently {ongoing.ongoingYears.toFixed(1)} years into an unresolved decline (since{' '}
          {ongoing.ongoingSince.slice(0, 10)}).
        </div>
      ) : null}
      {totalEpisodes === 0 ? null : (
        <div className={CHART_PANEL_RESPONSIVE_CLASS}>
          <ChartContainer
            config={{}}
            className="aspect-auto h-[260px] w-full sm:h-[300px] lg:h-[340px]"
          >
            <BarChart data={buckets} margin={chartPlotMargin({ top: 20, bottom: 8 })}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="bucketLabel" tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={axis.tick}>
                {axis.showXLabel ? <Label {...xLabel('Time to recover')} /> : null}
              </XAxis>
              <YAxis
                tickLine={TICK_LINE}
                axisLine={AXIS_LINE}
                tick={axis.tick}
                allowDecimals={false}
                width={axis.yWidth}
              >
                {axis.showYLabel ? <Label {...yLabel('Episodes')} /> : null}
              </YAxis>
              <Tooltip content={<DurationTooltip />} />
              <Bar dataKey="count" name="Episodes" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {buckets.map((bucket, index) => (
                  <Cell
                    key={bucket.bucketLabel}
                    fill={BUCKET_COLORS[index] ?? BUCKET_COLORS[BUCKET_COLORS.length - 1]}
                  />
                ))}
                <LabelList
                  dataKey="count"
                  position="top"
                  className="fill-foreground text-[11px] font-semibold"
                  formatter={(value) => (Number(value) > 0 ? String(value) : '')}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      )}
      {totalEpisodes > 0 ? (
        <p className="text-xs text-muted-foreground">
          Based on {totalEpisodes} recovered episode{totalEpisodes === 1 ? '' : 's'}. Bar colour
          intensifies with longer recovery bands (green → amber → red).
        </p>
      ) : null}
    </div>
  )
}
