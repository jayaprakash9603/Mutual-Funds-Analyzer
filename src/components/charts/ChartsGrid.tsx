import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { AnalysisInput, GoldenTriangleResult } from '@/lib/analytics/types'
import type { ManualInputsForm } from '@/api/schemas'
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
  getExpenseRatioComparison,
  getRiskMeterData,
  getVolatilityChart,
  getRollingReturnHistogram,
  getConsistencyScoreChart,
} from '@/lib/analytics/chartData'

const MARGIN_X = { left: 8, right: 8 }
const MARGIN_LEFT = { left: 8 }
const DOMAIN_0_100: [number, number] = [0, 100]

const lineConfig = {
  fund: { label: 'Fund', color: '#16a34a' },
  benchmark: { label: 'Benchmark', color: '#ea580c' },
} satisfies ChartConfig

interface ChartsGridProps {
  input: AnalysisInput
  result: GoldenTriangleResult
  manual?: ManualInputsForm
  loading?: boolean
}

function ChartShell({
  title,
  children,
  loading,
  empty,
}: {
  title: string
  children: React.ReactNode
  loading?: boolean
  empty?: boolean
}) {
  return (
    <Card className="glass glass-hover overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="aspect-video w-full" />
        ) : empty ? (
          <p className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
            No data available
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

export function ChartsGrid({ input, result, manual, loading }: ChartsGridProps) {
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

  const expenseData = useMemo(
    () => getExpenseRatioComparison(manual?.expenseRatio, manual?.benchmarkExpenseRatio),
    [manual?.expenseRatio, manual?.benchmarkExpenseRatio],
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

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ChartShell title="Rolling Return Comparison" loading={loading}>
        <ChartContainer config={lineConfig} className="aspect-video">
          <LineChart data={rollingData} margin={MARGIN_X}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={40} />
            <YAxis tickLine={false} axisLine={false} unit="%" />
            <ChartTooltip content={ChartTooltipContent} />
            <ChartLegend content={ChartLegendContent} />
            <Line type="monotone" dataKey="fund" stroke="#16a34a" dot={false} strokeWidth={2} isAnimationActive />
            <Line type="monotone" dataKey="benchmark" stroke="#ea580c" dot={false} strokeWidth={2} isAnimationActive />
          </LineChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="COB Gauge" loading={loading}>
        <ChartContainer config={{ cob: { label: 'COB', color: '#16a34a' } }} className="mx-auto aspect-square max-h-[280px]">
          <RadialBarChart data={[{ name: 'COB', value: result.metrics.cob, fill: result.metrics.cob > 70 ? '#16a34a' : result.metrics.cob > 50 ? '#f59e0b' : '#dc2626' }]} innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0}>
            <RadialBar dataKey="value" cornerRadius={8} background />
            <ChartTooltip content={ChartTooltipContent} />
          </RadialBarChart>
        </ChartContainer>
        <p className="text-center text-2xl font-semibold">{result.metrics.cob.toFixed(1)}%</p>
      </ChartShell>

      <ChartShell title="Sharpe Comparison" loading={loading}>
        <ChartContainer config={{ value: { label: 'Sharpe', color: '#16a34a' } }} className="aspect-video">
          <BarChart data={sharpeData} layout="vertical" margin={MARGIN_LEFT}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={80} />
            <ChartTooltip content={ChartTooltipContent} />
            <Bar dataKey="value" radius={6} isAnimationActive>
              {sharpeData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Fund vs Benchmark Returns" loading={loading}>
        <ChartContainer config={lineConfig} className="aspect-video">
          <AreaChart data={returnsArea}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={40} />
            <YAxis tickLine={false} axisLine={false} unit="%" />
            <ChartTooltip content={ChartTooltipContent} />
            <ChartLegend content={ChartLegendContent} />
            <Area type="monotone" dataKey="fund" stroke="var(--color-fund)" fill="var(--color-fund)" fillOpacity={0.2} isAnimationActive />
            <Area type="monotone" dataKey="benchmark" stroke="var(--color-benchmark)" fill="var(--color-benchmark)" fillOpacity={0.15} isAnimationActive />
          </AreaChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Alpha Comparison" loading={loading}>
        <ChartContainer config={{ value: { label: 'Alpha %', color: '#16a34a' } }} className="aspect-video">
          <BarChart data={alphaData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} unit="%" />
            <ChartTooltip content={ChartTooltipContent} />
            <Bar dataKey="value" fill="#16a34a" radius={6} isAnimationActive />
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Risk vs Return" loading={loading}>
        <ChartContainer config={{ return: { label: 'Return', color: '#16a34a' } }} className="aspect-video">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="risk" name="Risk" unit="%" tickLine={false} axisLine={false} />
            <YAxis type="number" dataKey="return" name="Return" unit="%" tickLine={false} axisLine={false} />
            <ZAxis type="number" dataKey="size" range={[100, 400]} />
            <ChartTooltip content={ChartTooltipContent} />
            <Scatter data={scatterData} fill="#16a34a" isAnimationActive />
          </ScatterChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Maximum Drawdown" loading={loading}>
        <ChartContainer config={{ drawdown: { label: 'Drawdown', color: '#dc2626' } }} className="aspect-video">
          <AreaChart data={drawdownData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={40} />
            <YAxis tickLine={false} axisLine={false} unit="%" />
            <ChartTooltip content={ChartTooltipContent} />
            <Area type="monotone" dataKey="drawdown" stroke="#dc2626" fill="#dc2626" fillOpacity={0.2} isAnimationActive />
          </AreaChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Radar Chart" loading={loading}>
        <ChartContainer config={lineConfig} className="mx-auto aspect-square max-h-[280px]">
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={30} domain={DOMAIN_0_100} />
            <Radar name="Fund" dataKey="fund" stroke="var(--color-fund)" fill="var(--color-fund)" fillOpacity={0.3} isAnimationActive />
            <Radar name="Benchmark" dataKey="benchmark" stroke="var(--color-benchmark)" fill="var(--color-benchmark)" fillOpacity={0.2} isAnimationActive />
            <ChartLegend content={ChartLegendContent} />
            <ChartTooltip content={ChartTooltipContent} />
          </RadarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Monthly Performance Heatmap" loading={loading}>
        <ChartContainer config={{ return: { label: 'Return', color: '#16a34a' } }} className="aspect-video">
          <BarChart data={heatmapData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} interval={2} />
            <YAxis tickLine={false} axisLine={false} unit="%" />
            <ChartTooltip content={ChartTooltipContent} />
            <Bar dataKey="return" fill="#16a34a" radius={2} isAnimationActive />
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Annual Returns" loading={loading}>
        <ChartContainer config={lineConfig} className="aspect-video">
          <BarChart data={annualData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} unit="%" />
            <ChartTooltip content={ChartTooltipContent} />
            <ChartLegend content={ChartLegendContent} />
            <Bar dataKey="fund" fill="var(--color-fund)" radius={4} isAnimationActive />
            <Bar dataKey="benchmark" fill="var(--color-benchmark)" radius={4} isAnimationActive />
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Rolling Return Timeline" loading={loading}>
        <ChartContainer config={{ value: { label: 'Rolling Return', color: '#16a34a' } }} className="aspect-video">
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={40} />
            <YAxis tickLine={false} axisLine={false} unit="%" />
            <ChartTooltip content={ChartTooltipContent} />
            <Line type="monotone" dataKey="value" stroke="#16a34a" dot={false} strokeWidth={2} isAnimationActive />
          </LineChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Performance Waterfall" loading={loading}>
        <ChartContainer config={{ value: { label: 'Contribution', color: '#16a34a' } }} className="aspect-video">
          <BarChart data={waterfallData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} unit="%" />
            <ChartTooltip content={ChartTooltipContent} />
            <Bar dataKey="value" fill="#16a34a" radius={6} isAnimationActive />
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Fund Score Doughnut" loading={loading}>
        <ChartContainer config={{ value: { label: 'Score', color: '#16a34a' } }} className="mx-auto aspect-square max-h-[280px]">
          <PieChart>
            <ChartTooltip content={ChartTooltipContent} />
            <Pie data={doughnutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4} isAnimationActive>
              {doughnutData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Expense Ratio Comparison" loading={loading} empty={expenseData.length === 0}>
        <ChartContainer config={{ value: { label: 'Expense Ratio', color: '#ea580c' } }} className="aspect-video">
          <BarChart data={expenseData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} unit="%" />
            <ChartTooltip content={ChartTooltipContent} />
            <Bar dataKey="value" fill="#ea580c" radius={6} isAnimationActive />
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Risk Meter" loading={loading}>
        <ChartContainer config={{ value: { label: 'Risk', color: '#dc2626' } }} className="aspect-video">
          <BarChart data={riskMeterData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis domain={DOMAIN_0_100} tickLine={false} axisLine={false} />
            <ChartTooltip content={ChartTooltipContent} />
            <Bar dataKey="value" radius={6} isAnimationActive>
              {riskMeterData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Volatility Chart" loading={loading}>
        <ChartContainer config={{ volatility: { label: 'Volatility', color: '#f59e0b' } }} className="aspect-video">
          <LineChart data={volatilityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={40} />
            <YAxis tickLine={false} axisLine={false} unit="%" />
            <ChartTooltip content={ChartTooltipContent} />
            <Line type="monotone" dataKey="volatility" stroke="#f59e0b" dot={false} strokeWidth={2} isAnimationActive />
          </LineChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Rolling Return Distribution" loading={loading}>
        <ChartContainer config={{ count: { label: 'Frequency', color: '#16a34a' } }} className="aspect-video">
          <BarChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} interval={2} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={ChartTooltipContent} />
            <Bar dataKey="count" fill="#16a34a" radius={2} isAnimationActive />
          </BarChart>
        </ChartContainer>
      </ChartShell>

      <ChartShell title="Consistency Score" loading={loading}>
        <ChartContainer config={{ score: { label: 'Score', color: '#16a34a' } }} className="aspect-video">
          <BarChart data={consistencyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis domain={DOMAIN_0_100} tickLine={false} axisLine={false} />
            <ChartTooltip content={ChartTooltipContent} />
            <Bar dataKey="score" fill="#16a34a" radius={6} isAnimationActive />
          </BarChart>
        </ChartContainer>
      </ChartShell>
    </div>
  )
}
