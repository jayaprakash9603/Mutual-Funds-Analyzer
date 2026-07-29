import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { CHART_PANEL_CLASS } from '@/lib/charts/chartSurface'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { AXIS_LINE, GRID_STROKE, chartPlotMargin, TICK_LINE, xLabel, yLabel } from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { buildStepUpMilestones } from '../../lib/goals/stepUpMilestones'

function formatLakhs(value: number): string {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)}Cr`
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

export function StepUpMilestoneChart({
  monthlySip,
  stepUpPercent,
  cagrPercent,
  horizonYears,
}: {
  monthlySip: number
  stepUpPercent: number
  cagrPercent: number
  horizonYears: number
}) {
  const axis = useResponsiveAxis()
  const milestones = useMemo(
    () => buildStepUpMilestones(monthlySip, stepUpPercent, cagrPercent, horizonYears),
    [cagrPercent, horizonYears, monthlySip, stepUpPercent],
  )

  const chartData = milestones.bands.map((band) => ({
    label: `${formatLakhs(band.corpusEnd)}`,
    investment: Math.max(0, band.investment),
    returns: Math.max(0, band.returns),
    duration: band.duration,
  }))

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground">Not enough data for milestone projection.</p>
  }

  return (
    <div className={CHART_PANEL_CLASS}>
      <p className="mb-3 px-1 text-xs text-muted-foreground">
        ₹{monthlySip.toLocaleString('en-IN')}/month with {stepUpPercent}% annual step-up at {cagrPercent}% CAGR over{' '}
        {horizonYears} years. Final corpus {formatLakhs(milestones.finalCorpus)}.
      </p>
      <ChartContainer
        config={{
          investment: { label: 'Investment', color: CHART_COLORS.benchmark },
          returns: { label: 'Returns', color: CHART_COLORS.fund },
        }}
        className="aspect-auto h-[320px] w-full sm:h-[360px]"
      >
        <BarChart data={chartData} margin={chartPlotMargin({ top: 8, bottom: 8 })}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={axis.tick} minTickGap={8}>
            <Label {...xLabel('Corpus milestone', -2)} />
          </XAxis>
          <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={axis.tick} tickFormatter={formatLakhs} width={axis.yWidth}>
            {axis.showYLabel ? <Label {...yLabel('Value')} /> : null}
          </YAxis>
          <Tooltip
            formatter={(value, name) => [
              formatLakhs(typeof value === 'number' ? value : 0),
              name === 'investment' ? 'Investment' : 'Returns',
            ]}
            labelFormatter={(label, payload) => {
              const duration = payload?.[0]?.payload?.duration
              return duration ? `${label} · ${duration}` : label
            }}
          />
          <Legend />
          <Bar dataKey="investment" stackId="corpus" fill={CHART_COLORS.benchmark} isAnimationActive={false} />
          <Bar dataKey="returns" stackId="corpus" fill={CHART_COLORS.fund} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
