import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  CHART_TOOLTIP_CURSOR,
  type ChartConfig,
} from '@/components/ui/chart'
import { getReturnsAreaChart } from '@/lib/analytics/chartData'
import { CHART_GUIDES } from '@/lib/analytics/chartGuide'
import type { AnalysisInput } from '@/lib/analytics/types'
import {
  AXIS_LINE,
  GRID_STROKE,
  MARGIN_X,
  TICK_LINE,
  TICK_MD,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { CHART_COLORS } from '@/lib/charts/chartColors'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { ChartShell, chartHeightForGuide } from '@/components/charts/ChartShell'

const lineConfig = {
  fund: { label: 'Fund', color: CHART_COLORS.fund },
  benchmark: { label: 'Benchmark', color: CHART_COLORS.benchmark },
} satisfies ChartConfig

const AREA_FILL_OPACITY = 0.2
const BENCHMARK_FILL_OPACITY = 0.15

type BenchmarkComparisonChartsProps = {
  input: AnalysisInput | null
  loading?: boolean
}

export function BenchmarkComparisonCharts({ input, loading = false }: BenchmarkComparisonChartsProps) {
  const axis = useResponsiveAxis()

  const returnsAreaData = useMemo(() => {
    if (!input) {
      return []
    }
    return getReturnsAreaChart(input)
  }, [input])

  const chartsLoading = loading && !input
  const returnsEmpty = !chartsLoading && returnsAreaData.length === 0

  return (
    <ChartShell guide={CHART_GUIDES.returnsArea} loading={chartsLoading} empty={returnsEmpty}>
      <ChartContainer config={lineConfig} className={chartHeightForGuide(CHART_GUIDES.returnsArea)}>
        <AreaChart data={returnsAreaData} margin={MARGIN_X}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis
            dataKey="date"
            tickLine={TICK_LINE}
            axisLine={AXIS_LINE}
            minTickGap={40}
            tick={TICK_MD}
            height={50}
          >
            <Label {...xLabel('Date', -4)} />
          </XAxis>
          <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} unit="%" tick={axis.tick} width={axis.yWidth}>
            <Label {...yLabel('Return (%)')} />
          </YAxis>
          <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
          <ChartLegend content={ChartLegendContent} />
          <Area
            type="monotone"
            dataKey="fund"
            stroke="var(--color-fund)"
            fill="var(--color-fund)"
            fillOpacity={AREA_FILL_OPACITY}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="benchmark"
            stroke="var(--color-benchmark)"
            fill="var(--color-benchmark)"
            fillOpacity={BENCHMARK_FILL_OPACITY}
            strokeDasharray="6 4"
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </ChartShell>
  )
}
