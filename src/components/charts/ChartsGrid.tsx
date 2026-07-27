import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  CHART_TOOLTIP_CURSOR,
  type ChartConfig,
} from '@/components/ui/chart'
import type { AnalysisInput, GoldenTriangleResult } from '@/lib/analytics/types'
import {
  getRollingReturnComparison,
  getSharpeComparison,
  getReturnsAreaChart,
  getAlphaComparison,
  getRiskReturnScatter,
  getMaxDrawdownArea,
  getRadarData,
  getMonthlyHeatmap,
  getAnnualReturns,
  getRollingReturnTimeline,
  getPerformanceWaterfall,
  getFundScoreDoughnut,
  getRiskMeterData,
  getVolatilityChart,
  getRollingReturnHistogram,
  getConsistencyScoreChart,
} from '@/lib/analytics/chartData'
import { CHART_GUIDES } from '@/lib/analytics/chartGuide'
import {
  AXIS_LINE,
  DOMAIN_0_100,
  GRID_STROKE,
  MARGIN_LEFT,
  MARGIN_X,
  TICK_LINE,
  TICK_MD,
  TICK_SM,
  xLabel,
  yLabel,
} from '@/lib/charts/chartAxes'
import { CHART_COLORS, cobColor, signedReturnColor } from '@/lib/charts/chartColors'
import { useResponsiveAxis } from '@/lib/charts/useResponsiveAxis'
import { ChartShell, chartHeightForGuide } from '@/components/charts/ChartShell'

const lineConfig = {
  fund: { label: 'Fund', color: CHART_COLORS.fund },
  benchmark: { label: 'Benchmark', color: CHART_COLORS.benchmark },
} satisfies ChartConfig

const cobConfig = { cob: { label: 'COB', color: CHART_COLORS.fund } } satisfies ChartConfig
const sharpeConfig = { value: { label: 'Sharpe', color: CHART_COLORS.fund } } satisfies ChartConfig
const alphaConfig = { value: { label: 'Alpha %', color: CHART_COLORS.fund } } satisfies ChartConfig
const scatterConfig = { return: { label: 'Return', color: CHART_COLORS.fund } } satisfies ChartConfig
const drawdownConfig = { drawdown: { label: 'Drawdown', color: CHART_COLORS.red } } satisfies ChartConfig
const heatmapConfig = { return: { label: 'Return', color: CHART_COLORS.fund } } satisfies ChartConfig
const timelineConfig = { value: { label: 'Rolling Return', color: CHART_COLORS.fund } } satisfies ChartConfig
const waterfallConfig = { value: { label: 'Contribution', color: CHART_COLORS.fund } } satisfies ChartConfig
const doughnutConfig = { value: { label: 'Score', color: CHART_COLORS.fund } } satisfies ChartConfig
const riskMeterConfig = { value: { label: 'Risk', color: CHART_COLORS.red } } satisfies ChartConfig
const volatilityConfig = { volatility: { label: 'Volatility', color: CHART_COLORS.amber } } satisfies ChartConfig
const histogramConfig = { count: { label: 'Frequency', color: CHART_COLORS.fund } } satisfies ChartConfig
const consistencyConfig = { score: { label: 'Score', color: CHART_COLORS.fund } } satisfies ChartConfig

const SCATTER_BUBBLE_RANGE: [number, number] = [120, 480]
const AREA_FILL_OPACITY = 0.2
const BENCHMARK_FILL_OPACITY = 0.15
const RADAR_FUND_FILL_OPACITY = 0.3
const RADAR_BENCHMARK_FILL_OPACITY = 0.2
const DENSE_TICK_INTERVAL = 2

interface ChartsGridProps {
  input: AnalysisInput
  result: GoldenTriangleResult
  loading?: boolean
}

export function ChartsGrid({ input, result, loading }: ChartsGridProps) {
  const seriesData = useMemo(
    () => ({
      rolling: getRollingReturnComparison(input),
      returnsArea: getReturnsAreaChart(input),
      drawdown: getMaxDrawdownArea(input),
      heatmap: getMonthlyHeatmap(input),
      annual: getAnnualReturns(input),
      timeline: getRollingReturnTimeline(input),
      volatility: getVolatilityChart(input),
      histogram: getRollingReturnHistogram(input),
    }),
    [input],
  )

  const metricData = useMemo(
    () => ({
      sharpe: getSharpeComparison(result),
      alpha: getAlphaComparison(result),
      scatter: getRiskReturnScatter([result]),
      radar: getRadarData(result),
      waterfall: getPerformanceWaterfall(result),
      doughnut: getFundScoreDoughnut(result),
      riskMeter: getRiskMeterData(result),
      consistency: getConsistencyScoreChart(result),
    }),
    [result],
  )

  const cob = result.metrics.cob
  const cobGauge = useMemo(
    () => [{ name: 'COB', value: cob, fill: cobColor(cob) }],
    [cob],
  )

  const {
    rolling: rollingData,
    returnsArea,
    drawdown: drawdownData,
    heatmap: heatmapData,
    annual: annualData,
    timeline: timelineData,
    volatility: volatilityData,
    histogram: histogramData,
  } = seriesData
  const {
    sharpe: sharpeData,
    alpha: alphaData,
    scatter: scatterData,
    radar: radarData,
    waterfall: waterfallData,
    doughnut: doughnutData,
    riskMeter: riskMeterData,
    consistency: consistencyData,
  } = metricData

  const axis = useResponsiveAxis()
  const denseAxis = useResponsiveAxis({ dense: true })

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ChartShell guide={CHART_GUIDES.rollingComparison} loading={loading}>
        <ChartContainer config={lineConfig} className={chartHeightForGuide(CHART_GUIDES.rollingComparison)}>
          <LineChart data={rollingData} margin={MARGIN_X}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="date" tickLine={TICK_LINE} axisLine={AXIS_LINE} minTickGap={40} tick={TICK_MD} height={50}>
              <Label {...xLabel('Rolling window', -4)} />
            </XAxis>
            <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} unit="%" tick={axis.tick} width={axis.yWidth}>
              <Label {...yLabel('Return (%)')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <ChartLegend content={ChartLegendContent} />
            <Line type="monotone" dataKey="fund" stroke={CHART_COLORS.fund} dot={false} strokeWidth={2.5} isAnimationActive={false} />
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke={CHART_COLORS.benchmark}
              strokeDasharray="6 4"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell
        guide={CHART_GUIDES.cobGauge}
        loading={loading}
        footer={<p className="text-center font-mono text-3xl font-semibold tracking-tight">{cob.toFixed(1)}%</p>}
      >
        <ChartContainer config={cobConfig} className={chartHeightForGuide(CHART_GUIDES.cobGauge)}>
          <RadialBarChart data={cobGauge} innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0}>
            <RadialBar dataKey="value" cornerRadius={8} background />
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
          </RadialBarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell guide={CHART_GUIDES.sharpeComparison} loading={loading}>
        <ChartContainer config={sharpeConfig} className={chartHeightForGuide(CHART_GUIDES.sharpeComparison)}>
          <BarChart data={sharpeData} layout="vertical" margin={MARGIN_LEFT}>
            <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
            <XAxis type="number" tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={TICK_MD}>
              <Label {...xLabel('Sharpe ratio', -4)} />
            </XAxis>
            <YAxis type="category" dataKey="name" tickLine={TICK_LINE} axisLine={AXIS_LINE} width={88} tick={TICK_MD} />
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={6} isAnimationActive={false}>
              {sharpeData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell guide={CHART_GUIDES.returnsArea} loading={loading}>
        <ChartContainer config={lineConfig} className={chartHeightForGuide(CHART_GUIDES.returnsArea)}>
          <AreaChart data={returnsArea} margin={MARGIN_X}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="date" tickLine={TICK_LINE} axisLine={AXIS_LINE} minTickGap={40} tick={TICK_MD} height={50}>
              <Label {...xLabel('Date', -4)} />
            </XAxis>
            <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} unit="%" tick={axis.tick} width={axis.yWidth}>
              <Label {...yLabel('Return (%)')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <ChartLegend content={ChartLegendContent} />
            <Area type="monotone" dataKey="fund" stroke="var(--color-fund)" fill="var(--color-fund)" fillOpacity={AREA_FILL_OPACITY} isAnimationActive={false} />
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

      <ChartShell guide={CHART_GUIDES.alphaComparison} loading={loading}>
        <ChartContainer config={alphaConfig} className={chartHeightForGuide(CHART_GUIDES.alphaComparison)}>
          <BarChart data={alphaData} margin={MARGIN_X}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="name" tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={TICK_MD} height={50}>
              <Label {...xLabel('Entity', -4)} />
            </XAxis>
            <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} unit="%" tick={axis.tick} width={axis.yWidth}>
              <Label {...yLabel('Alpha (%)')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill={CHART_COLORS.fund} radius={6} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell guide={CHART_GUIDES.riskReturn} loading={loading}>
        <ChartContainer config={scatterConfig} className={chartHeightForGuide(CHART_GUIDES.riskReturn)}>
          <ScatterChart margin={MARGIN_X}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis type="number" dataKey="risk" name="Risk" unit="%" tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={TICK_MD} height={50}>
              <Label {...xLabel('Risk (%)', -4)} />
            </XAxis>
            <YAxis type="number" dataKey="return" name="Return" unit="%" tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={axis.tick} width={axis.yWidth}>
              <Label {...yLabel('Return (%)')} />
            </YAxis>
            <ZAxis type="number" dataKey="size" range={SCATTER_BUBBLE_RANGE} />
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <Scatter data={scatterData} fill={CHART_COLORS.fund} isAnimationActive={false} />
          </ScatterChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell guide={CHART_GUIDES.maxDrawdown} loading={loading}>
        <ChartContainer config={drawdownConfig} className={chartHeightForGuide(CHART_GUIDES.maxDrawdown)}>
          <AreaChart data={drawdownData} margin={MARGIN_X}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="date" tickLine={TICK_LINE} axisLine={AXIS_LINE} minTickGap={40} tick={TICK_MD} height={50}>
              <Label {...xLabel('Date', -4)} />
            </XAxis>
            <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} unit="%" tick={axis.tick} width={axis.yWidth}>
              <Label {...yLabel('Drawdown (%)')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="drawdown" stroke={CHART_COLORS.red} fill={CHART_COLORS.red} fillOpacity={AREA_FILL_OPACITY} isAnimationActive={false} />
          </AreaChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell guide={CHART_GUIDES.radar} loading={loading}>
        <ChartContainer config={lineConfig} className={chartHeightForGuide(CHART_GUIDES.radar)}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" tick={TICK_MD} />
            <PolarRadiusAxis angle={30} domain={DOMAIN_0_100} tick={TICK_SM} />
            <Radar name="Fund" dataKey="fund" stroke="var(--color-fund)" fill="var(--color-fund)" fillOpacity={RADAR_FUND_FILL_OPACITY} isAnimationActive={false} />
            <Radar
              name="Benchmark"
              dataKey="benchmark"
              stroke="var(--color-benchmark)"
              fill="var(--color-benchmark)"
              fillOpacity={RADAR_BENCHMARK_FILL_OPACITY}
              strokeDasharray="4 3"
              isAnimationActive={false}
            />
            <ChartLegend content={ChartLegendContent} />
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
          </RadarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell guide={CHART_GUIDES.scoreDoughnut} loading={loading}>
        <ChartContainer config={doughnutConfig} className={chartHeightForGuide(CHART_GUIDES.scoreDoughnut)}>
          <PieChart>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <Pie data={doughnutData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4} isAnimationActive={false}>
              {doughnutData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell guide={CHART_GUIDES.monthlyHeatmap} loading={loading}>
        <ChartContainer config={heatmapConfig} className={chartHeightForGuide(CHART_GUIDES.monthlyHeatmap)}>
          <BarChart data={heatmapData} margin={MARGIN_X}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="month" tickLine={TICK_LINE} axisLine={AXIS_LINE} angle={denseAxis.xAngle} textAnchor={denseAxis.xAnchor} height={denseAxis.xHeight} interval={DENSE_TICK_INTERVAL} tick={denseAxis.tick}>
              <Label {...xLabel('Month', denseAxis.xAngle === 0 ? -4 : -8)} />
            </XAxis>
            <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} unit="%" tick={axis.tick} width={axis.yWidth}>
              <Label {...yLabel('Return (%)')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent format="percent" />} />
            <Bar dataKey="return" radius={2} maxBarSize={36} isAnimationActive={false}>
              {heatmapData.map((entry) => (
                <Cell key={entry.month} fill={signedReturnColor(entry.return)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell guide={CHART_GUIDES.annualReturns} loading={loading}>
        <ChartContainer config={lineConfig} className={chartHeightForGuide(CHART_GUIDES.annualReturns)}>
          <BarChart data={annualData} margin={MARGIN_X}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="year" tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={TICK_MD} height={50}>
              <Label {...xLabel('Year', -4)} />
            </XAxis>
            <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} unit="%" tick={axis.tick} width={axis.yWidth}>
              <Label {...yLabel('Return (%)')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <ChartLegend content={ChartLegendContent} />
            <Bar dataKey="fund" fill="var(--color-fund)" radius={4} isAnimationActive={false} />
            <Bar dataKey="benchmark" fill="var(--color-benchmark)" radius={4} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell guide={CHART_GUIDES.rollingTimeline} loading={loading}>
        <ChartContainer config={timelineConfig} className={chartHeightForGuide(CHART_GUIDES.rollingTimeline)}>
          <LineChart data={timelineData} margin={MARGIN_X}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="date" tickLine={TICK_LINE} axisLine={AXIS_LINE} minTickGap={40} tick={TICK_MD} height={50}>
              <Label {...xLabel('Rolling window', -4)} />
            </XAxis>
            <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} unit="%" tick={axis.tick} width={axis.yWidth}>
              <Label {...yLabel('Return (%)')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="value" stroke={CHART_COLORS.fund} dot={false} strokeWidth={2.5} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell guide={CHART_GUIDES.waterfall} loading={loading}>
        <ChartContainer config={waterfallConfig} className={chartHeightForGuide(CHART_GUIDES.waterfall)}>
          <BarChart data={waterfallData} margin={MARGIN_X}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="name" tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={TICK_MD} height={50}>
              <Label {...xLabel('Metric', -4)} />
            </XAxis>
            <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} unit="%" tick={axis.tick} width={axis.yWidth}>
              <Label {...yLabel('Contribution (%)')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill={CHART_COLORS.fund} radius={6} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell guide={CHART_GUIDES.consistency} loading={loading}>
        <ChartContainer config={consistencyConfig} className={chartHeightForGuide(CHART_GUIDES.consistency)}>
          <BarChart data={consistencyData} margin={MARGIN_X}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="name" tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={TICK_MD} height={50}>
              <Label {...xLabel('Metric', -4)} />
            </XAxis>
            <YAxis domain={DOMAIN_0_100} tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={axis.tick} width={axis.yWidth}>
              <Label {...yLabel('Score')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <Bar dataKey="score" fill={CHART_COLORS.fund} radius={6} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell guide={CHART_GUIDES.riskMeter} loading={loading}>
        <ChartContainer config={riskMeterConfig} className={chartHeightForGuide(CHART_GUIDES.riskMeter)}>
          <BarChart data={riskMeterData} margin={MARGIN_X}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="name" tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={TICK_MD} height={50}>
              <Label {...xLabel('Risk level', -4)} />
            </XAxis>
            <YAxis domain={DOMAIN_0_100} tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={axis.tick} width={axis.yWidth}>
              <Label {...yLabel('Score')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={6} isAnimationActive={false}>
              {riskMeterData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell guide={CHART_GUIDES.volatility} loading={loading}>
        <ChartContainer config={volatilityConfig} className={chartHeightForGuide(CHART_GUIDES.volatility)}>
          <LineChart data={volatilityData} margin={MARGIN_X}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="date" tickLine={TICK_LINE} axisLine={AXIS_LINE} minTickGap={40} tick={TICK_MD} height={50}>
              <Label {...xLabel('Date', -4)} />
            </XAxis>
            <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} unit="%" tick={axis.tick} width={axis.yWidth}>
              <Label {...yLabel('Volatility (%)')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="volatility" stroke={CHART_COLORS.amber} dot={false} strokeWidth={2.5} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell guide={CHART_GUIDES.distribution} loading={loading}>
        <ChartContainer config={histogramConfig} className={chartHeightForGuide(CHART_GUIDES.distribution)}>
          <BarChart data={histogramData} margin={MARGIN_X}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="range" tickLine={TICK_LINE} axisLine={AXIS_LINE} angle={denseAxis.xAngle} textAnchor={denseAxis.xAnchor} height={denseAxis.xHeight} interval={DENSE_TICK_INTERVAL} tick={denseAxis.tick}>
              <Label {...xLabel('Return range (%)', denseAxis.xAngle === 0 ? -4 : -8)} />
            </XAxis>
            <YAxis tickLine={TICK_LINE} axisLine={AXIS_LINE} tick={axis.tick} width={axis.yWidth}>
              <Label {...yLabel('Frequency')} />
            </YAxis>
            <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill={CHART_COLORS.fund} radius={2} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </ChartShell>
    </div>
  )
}
