import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Label, XAxis, YAxis } from 'recharts'
import {
  CHART_TOOLTIP_CURSOR,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { CHART_PANEL_CLASS } from '@/lib/charts/chartSurface'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { AXIS_LINE, GRID_STROKE, chartPlotMargin, TICK_LINE, xLabel, yLabel } from '@/lib/charts/chartAxes'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { buildDoublingTimeSeries } from '../../lib/goals/doublingTime'

export function DoublingTimeChart() {
  const axis = useResponsiveAxis()
  const data = useMemo(() => buildDoublingTimeSeries(), [])

  return (
    <div className={CHART_PANEL_CLASS}>
      <p className="mb-3 px-1 text-xs text-muted-foreground">
        Years needed to double money at each annual return (1%–25%). At 0% CAGR, money never doubles.
      </p>
      <ChartContainer
        config={{ yearsToDouble: { label: 'Years to double', color: CHART_COLORS.fund } }}
        className="aspect-auto h-[280px] w-full sm:h-[320px]"
      >
        <BarChart data={data} margin={chartPlotMargin({ top: 8, bottom: 8 })}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="cagrPercent" tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={axis.tick} minTickGap={8}>
            <Label {...xLabel('Annual return (%)', -2)} />
          </XAxis>
          <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={axis.tick} width={axis.yWidth}>
            {axis.showYLabel ? <Label {...yLabel('Years')} /> : null}
          </YAxis>
          <ChartTooltip
            cursor={CHART_TOOLTIP_CURSOR}
            content={
              <ChartTooltipContent
                format="number"
                labelFormatter={(_, payload) => {
                  const cagr = payload?.[0]?.payload?.cagrPercent
                  return cagr != null ? `${cagr}% CAGR` : 'Annual return'
                }}
              />
            }
          />
          <Bar dataKey="yearsToDouble" fill={CHART_COLORS.fund} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
