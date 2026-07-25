import { format } from 'date-fns'
import { CHART_COLORS, volatilityColor } from '@/lib/chartColors'
import { MAX_CHART_POINTS, TRADING_DAYS } from '@/lib/constants'
import { downsample, parseNavDate } from '@/lib/utils'
import {
  alignRollingReturns,
  buildNavSeries,
  computeDailyReturns,
  getCommonNavSeries,
  mean,
  stdDev,
} from './navSeries'
import type { AnalysisInput, GoldenTriangleResult } from './types'

const MONTH_FORMAT = 'MMM yyyy'
const PERCENT = 100
const GOLDEN_TRIANGLE_RULES = 3

/** Scales that turn a raw metric into a 0-100 radar axis. */
const RADAR_ROLLING_RETURN_CEILING = 30
const RADAR_SHARPE_SCALE = 40
const RADAR_ALPHA_SCALE = 5
const RADAR_ALPHA_MIDPOINT = 50
const RADAR_VOLATILITY_PENALTY = 3
const RADAR_BENCHMARK_BASELINE = 70

const HEATMAP_MONTHS = 36
const TRADING_DAYS_PER_MONTH = 21
const MAX_NAV_GAP_DAYS = 7
const MILLIS_PER_DAY = 1000 * 60 * 60 * 24
const ANNUAL_RETURN_YEARS = 12
const VOLATILITY_WINDOW_DAYS = 63
const HISTOGRAM_BINS = 20
const RISK_METER_SCALE = 4
const SCATTER_BUBBLE_SCALE = 100
const SCATTER_BUBBLE_BASE = 50
const SCATTER_NAME_MAX_CHARS = 20
const WATERFALL_SHARPE_SCALE = 2
const CONSISTENCY_SHARPE_SCALE = 30
const CONSISTENCY_RETURN_SCALE = 5
const CONSISTENCY_MIDPOINT = 50

function formatDateLabel(dateStr: string) {
  return format(parseNavDate(dateStr), MONTH_FORMAT)
}

export function getRollingReturnComparison(input: AnalysisInput) {
  const aligned = alignRollingReturns(input.fund, input.benchmark)
  return downsample(aligned, MAX_CHART_POINTS).map((p) => ({
    date: format(p.date, MONTH_FORMAT),
    fund: p.fundReturn,
    benchmark: p.benchmarkReturn,
  }))
}

export function getSharpeComparison(result: GoldenTriangleResult) {
  return [
    { name: 'Fund', value: result.metrics.fundSharpe, fill: CHART_COLORS.fund },
    { name: 'Benchmark', value: result.metrics.benchmarkSharpe, fill: CHART_COLORS.benchmark },
  ]
}

export function getReturnsAreaChart(input: AnalysisInput) {
  const fundNav = buildNavSeries(input.fund)
  const benchmarkNav = buildNavSeries(input.benchmark)
  const common = getCommonNavSeries(fundNav, benchmarkNav)
  const baseFund = common[0]?.fundNav ?? 1
  const baseBench = common[0]?.benchmarkNav ?? 1
  return downsample(common, MAX_CHART_POINTS).map((p) => ({
    date: format(p.date, MONTH_FORMAT),
    fund: ((p.fundNav / baseFund) - 1) * PERCENT,
    benchmark: ((p.benchmarkNav / baseBench) - 1) * PERCENT,
  }))
}

export function getAlphaComparison(result: GoldenTriangleResult) {
  return [
    { name: 'Alpha', value: result.metrics.alpha },
    { name: 'Benchmark Excess', value: 0 },
  ]
}

export function getRiskReturnScatter(results: GoldenTriangleResult[]) {
  return results.map((r) => ({
    name: r.fundName.split(' - ')[0].slice(0, SCATTER_NAME_MAX_CHARS),
    return: r.metrics.fundAnnReturn,
    risk: r.metrics.fundVolatility,
    size: r.passCount * SCATTER_BUBBLE_SCALE + SCATTER_BUBBLE_BASE,
  }))
}

export function getMaxDrawdownArea(input: AnalysisInput) {
  const fundNav = buildNavSeries(input.fund)
  let peak = fundNav[0]?.nav ?? 0
  const data = fundNav.map((p) => {
    peak = Math.max(peak, p.nav)
    return {
      date: format(p.date, MONTH_FORMAT),
      drawdown: ((p.nav / peak) - 1) * PERCENT,
    }
  })
  return downsample(data, MAX_CHART_POINTS)
}

export function getRadarData(result: GoldenTriangleResult) {
  const m = result.metrics
  const scaled = (value: number, ceiling: number) => Math.min(PERCENT, (value / ceiling) * PERCENT)
  const capped = (value: number) => Math.min(PERCENT, value)
  const floored = (value: number) => Math.max(0, value)

  return [
    {
      metric: 'Rolling Return',
      fund: scaled(m.fundRollingAvg, RADAR_ROLLING_RETURN_CEILING),
      benchmark: scaled(m.benchmarkRollingAvg, RADAR_ROLLING_RETURN_CEILING),
    },
    { metric: 'COB', fund: m.cob, benchmark: RADAR_BENCHMARK_BASELINE },
    {
      metric: 'Sharpe',
      fund: capped(m.fundSharpe * RADAR_SHARPE_SCALE),
      benchmark: capped(m.benchmarkSharpe * RADAR_SHARPE_SCALE),
    },
    {
      metric: 'Alpha',
      fund: capped(floored(m.alpha * RADAR_ALPHA_SCALE + RADAR_ALPHA_MIDPOINT)),
      benchmark: RADAR_ALPHA_MIDPOINT,
    },
    {
      metric: 'Risk',
      fund: floored(PERCENT - m.fundVolatility * RADAR_VOLATILITY_PENALTY),
      benchmark: floored(PERCENT - m.benchmarkVolatility * RADAR_VOLATILITY_PENALTY),
    },
    { metric: 'Consistency', fund: m.consistencyScore, benchmark: RADAR_BENCHMARK_BASELINE },
  ]
}

export function getMonthlyHeatmap(input: AnalysisInput) {
  const fundNav = buildNavSeries(input.fund)
  const monthly = new Map<string, number[]>()

  for (let i = 1; i < fundNav.length; i++) {
    const prev = fundNav[i - 1]
    const curr = fundNav[i]
    const days = (curr.date.getTime() - prev.date.getTime()) / MILLIS_PER_DAY
    if (days > 0 && days <= MAX_NAV_GAP_DAYS) {
      const key = format(curr.date, 'yyyy-MM')
      const existing = monthly.get(key) ?? []
      existing.push(curr.nav / prev.nav - 1)
      monthly.set(key, existing)
    }
  }

  return Array.from(monthly.entries())
    .slice(-HEATMAP_MONTHS)
    .map(([month, returns]) => ({
      month,
      return: mean(returns) * PERCENT * TRADING_DAYS_PER_MONTH,
    }))
}

export function getAnnualReturns(input: AnalysisInput) {
  const fundNav = buildNavSeries(input.fund)
  const benchmarkNav = buildNavSeries(input.benchmark)
  const years = new Map<number, { fundStart?: number; fundEnd?: number; benchStart?: number; benchEnd?: number }>()

  for (const p of fundNav) {
    const year = p.date.getFullYear()
    const entry = years.get(year) ?? {}
    entry.fundStart ??= p.nav
    entry.fundEnd = p.nav
    years.set(year, entry)
  }

  for (const p of benchmarkNav) {
    const year = p.date.getFullYear()
    const entry = years.get(year) ?? {}
    entry.benchStart ??= p.nav
    entry.benchEnd = p.nav
    years.set(year, entry)
  }

  return Array.from(years.entries())
    .flatMap(([year, v]) => {
      if (!v.fundStart || !v.fundEnd || !v.benchStart || !v.benchEnd) return []
      return [{
        year: String(year),
        fund: ((v.fundEnd / v.fundStart) - 1) * PERCENT,
        benchmark: ((v.benchEnd / v.benchStart) - 1) * PERCENT,
      }]
    })
    .slice(-ANNUAL_RETURN_YEARS)
}

export function getRollingReturnTimeline(input: AnalysisInput) {
  return downsample(
    input.fund.map((r) => ({
      date: formatDateLabel(r.nav_date),
      value: r.scheme_rolling_returns,
    })),
    MAX_CHART_POINTS,
  )
}

export function getPerformanceWaterfall(result: GoldenTriangleResult) {
  const m = result.metrics
  return [
    { name: 'Benchmark Return', value: m.benchmarkAnnReturn },
    { name: 'Alpha Contribution', value: m.alpha },
    { name: 'Risk Adjustment', value: (m.fundSharpe - m.benchmarkSharpe) * WATERFALL_SHARPE_SCALE },
    { name: 'Fund Return', value: m.fundAnnReturn, isTotal: true },
  ]
}

export function getFundScoreDoughnut(result: GoldenTriangleResult) {
  return [
    { name: 'Passed', value: result.passCount, fill: CHART_COLORS.fund },
    { name: 'Failed', value: GOLDEN_TRIANGLE_RULES - result.passCount, fill: CHART_COLORS.red },
  ]
}

export function getStatCards(result: GoldenTriangleResult) {
  const m = result.metrics
  return [
    { label: 'Total Returns', value: m.totalReturn, suffix: '%', format: 'percent' },
    { label: 'Rolling Return', value: m.fundRollingAvg, suffix: '%', format: 'percent' },
    { label: 'COB', value: m.cob, suffix: '%', format: 'percent' },
    { label: 'Sharpe', value: m.fundSharpe, suffix: '', format: 'decimal' },
    { label: 'Alpha', value: m.alpha, suffix: '%', format: 'percent' },
    { label: 'Beta', value: m.beta, suffix: '', format: 'decimal' },
    { label: 'Std Dev', value: m.fundVolatility, suffix: '%', format: 'percent' },
    { label: 'Sortino', value: m.sortino, suffix: '', format: 'decimal' },
    { label: 'Info Ratio', value: m.informationRatio, suffix: '', format: 'decimal' },
    { label: 'Treynor', value: m.treynor, suffix: '', format: 'decimal' },
    { label: 'Max Drawdown', value: m.maxDrawdown, suffix: '%', format: 'percent' },
    { label: 'Risk Level', value: 0, display: m.riskLevel, format: 'text' },
  ]
}

export function getRiskMeterData(result: GoldenTriangleResult) {
  const vol = result.metrics.fundVolatility
  return [{
    name: 'Risk',
    value: Math.min(PERCENT, vol * RISK_METER_SCALE),
    fill: volatilityColor(vol),
  }]
}

export function getVolatilityChart(input: AnalysisInput) {
  const fundNav = buildNavSeries(input.fund)
  const returns = computeDailyReturns(fundNav)
  const data: { date: string; volatility: number }[] = []

  for (let i = VOLATILITY_WINDOW_DAYS; i < fundNav.length; i++) {
    const slice = returns.slice(i - VOLATILITY_WINDOW_DAYS, i)
    data.push({
      date: format(fundNav[i].date, MONTH_FORMAT),
      volatility: stdDev(slice) * Math.sqrt(TRADING_DAYS) * PERCENT,
    })
  }

  return downsample(data, MAX_CHART_POINTS)
}

export function getRollingReturnHistogram(input: AnalysisInput) {
  const returns = input.fund.map((r) => r.scheme_rolling_returns)
  const min = Math.min(...returns)
  const max = Math.max(...returns)
  const step = (max - min) / HISTOGRAM_BINS || 1
  const histogram = Array.from({ length: HISTOGRAM_BINS }, (_, i) => ({
    range: `${(min + i * step).toFixed(1)}-${(min + (i + 1) * step).toFixed(1)}`,
    count: 0,
  }))

  for (const r of returns) {
    const idx = Math.min(HISTOGRAM_BINS - 1, Math.floor((r - min) / step))
    histogram[idx].count++
  }

  return histogram
}

export function getConsistencyScoreChart(result: GoldenTriangleResult) {
  const m = result.metrics
  const edge = (diff: number, scale: number) => Math.max(0, diff * scale + CONSISTENCY_MIDPOINT)
  return [
    { name: 'COB', score: m.cob },
    { name: 'Sharpe Edge', score: edge(m.fundSharpe - m.benchmarkSharpe, CONSISTENCY_SHARPE_SCALE) },
    { name: 'Return Edge', score: edge(m.fundRollingAvg - m.benchmarkRollingAvg, CONSISTENCY_RETURN_SCALE) },
    { name: 'Overall', score: m.consistencyScore },
  ]
}
