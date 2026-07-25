import { format } from 'date-fns'
import { downsample, parseNavDate } from '@/lib/utils'
import {
  alignRollingReturns,
  buildNavSeries,
  computeDailyReturns,
  getCommonNavSeries,
  mean,
  stdDev,
} from './navSeries'
import type { AnalysisInput, GoldenTriangleResult, RollingReturnRow } from './types'

function formatDateLabel(dateStr: string) {
  return format(parseNavDate(dateStr), 'MMM yyyy')
}

export function getRollingReturnComparison(input: AnalysisInput) {
  const aligned = alignRollingReturns(input.fund, input.benchmark)
  const sampled = downsample(aligned, 400)
  return sampled.map((p) => ({
    date: format(p.date, 'MMM yyyy'),
    fund: p.fundReturn,
    benchmark: p.benchmarkReturn,
  }))
}

export function getCobGaugeData(result: GoldenTriangleResult) {
  const cob = result.metrics.cob
  const color = cob > 70 ? '#16a34a' : cob > 50 ? '#f59e0b' : '#dc2626'
  return [
    { name: 'COB', value: cob, fill: color },
    { name: 'Remaining', value: Math.max(0, 100 - cob), fill: '#e2e8f0' },
  ]
}

export function getSharpeComparison(result: GoldenTriangleResult) {
  return [
    { name: 'Fund', value: result.metrics.fundSharpe, fill: '#16a34a' },
    { name: 'Benchmark', value: result.metrics.benchmarkSharpe, fill: '#ea580c' },
  ]
}

export function getReturnsAreaChart(input: AnalysisInput) {
  const fundNav = buildNavSeries(input.fund)
  const benchmarkNav = buildNavSeries(input.benchmark)
  const common = getCommonNavSeries(fundNav, benchmarkNav)
  const baseFund = common[0]?.fundNav ?? 1
  const baseBench = common[0]?.benchmarkNav ?? 1
  const sampled = downsample(common, 400)
  return sampled.map((p) => ({
    date: format(p.date, 'MMM yyyy'),
    fund: ((p.fundNav / baseFund) - 1) * 100,
    benchmark: ((p.benchmarkNav / baseBench) - 1) * 100,
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
    name: r.fundName.split(' - ')[0].slice(0, 20),
    return: r.metrics.fundAnnReturn,
    risk: r.metrics.fundVolatility,
    size: r.passCount * 100 + 50,
  }))
}

export function getMaxDrawdownArea(input: AnalysisInput) {
  const fundNav = buildNavSeries(input.fund)
  let peak = fundNav[0]?.nav ?? 0
  const data = fundNav.map((p) => {
    peak = Math.max(peak, p.nav)
    return {
      date: format(p.date, 'MMM yyyy'),
      drawdown: ((p.nav / peak) - 1) * 100,
    }
  })
  return downsample(data, 400)
}

export function getRadarData(result: GoldenTriangleResult) {
  const m = result.metrics
  return [
    { metric: 'Rolling Return', fund: Math.min(100, (m.fundRollingAvg / 30) * 100), benchmark: Math.min(100, (m.benchmarkRollingAvg / 30) * 100) },
    { metric: 'COB', fund: m.cob, benchmark: 70 },
    { metric: 'Sharpe', fund: Math.min(100, m.fundSharpe * 40), benchmark: Math.min(100, m.benchmarkSharpe * 40) },
    { metric: 'Alpha', fund: Math.min(100, Math.max(0, m.alpha * 5 + 50)), benchmark: 50 },
    { metric: 'Risk', fund: Math.max(0, 100 - m.fundVolatility * 3), benchmark: Math.max(0, 100 - m.benchmarkVolatility * 3) },
    { metric: 'Consistency', fund: m.consistencyScore, benchmark: 70 },
  ]
}

export function getMonthlyHeatmap(input: AnalysisInput) {
  const fundNav = buildNavSeries(input.fund)
  const monthly = new Map<string, number[]>()

  for (let i = 1; i < fundNav.length; i++) {
    const prev = fundNav[i - 1]
    const curr = fundNav[i]
    const days = (curr.date.getTime() - prev.date.getTime()) / (1000 * 60 * 60 * 24)
    if (days > 0 && days <= 7) {
      const key = format(curr.date, 'yyyy-MM')
      const existing = monthly.get(key) ?? []
      existing.push(curr.nav / prev.nav - 1)
      monthly.set(key, existing)
    }
  }

  return Array.from(monthly.entries())
    .slice(-36)
    .map(([month, returns]) => ({
      month,
      return: mean(returns) * 100 * 21,
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
    .filter(([, v]) => v.fundStart && v.fundEnd && v.benchStart && v.benchEnd)
    .map(([year, v]) => ({
      year: String(year),
      fund: ((v.fundEnd! / v.fundStart!) - 1) * 100,
      benchmark: ((v.benchEnd! / v.benchStart!) - 1) * 100,
    }))
    .slice(-12)
}

export function getRollingReturnTimeline(input: AnalysisInput) {
  return downsample(
    input.fund.map((r) => ({
      date: formatDateLabel(r.nav_date),
      value: r.scheme_rolling_returns,
    })),
    400,
  )
}

export function getPerformanceWaterfall(result: GoldenTriangleResult) {
  const m = result.metrics
  return [
    { name: 'Benchmark Return', value: m.benchmarkAnnReturn },
    { name: 'Alpha Contribution', value: m.alpha },
    { name: 'Risk Adjustment', value: (m.fundSharpe - m.benchmarkSharpe) * 2 },
    { name: 'Fund Return', value: m.fundAnnReturn, isTotal: true },
  ]
}

export function getFundScoreDoughnut(result: GoldenTriangleResult) {
  const passed = result.passCount
  const failed = 3 - passed
  return [
    { name: 'Passed', value: passed, fill: '#16a34a' },
    { name: 'Failed', value: failed, fill: '#dc2626' },
  ]
}

export function getExpenseRatioComparison(
  expenseRatio?: number,
  benchmarkExpenseRatio?: number,
) {
  if (expenseRatio === undefined) return []
  return [
    { name: 'Fund', value: expenseRatio },
    { name: 'Benchmark', value: benchmarkExpenseRatio ?? 0 },
  ]
}

export function getRiskMeterData(result: GoldenTriangleResult) {
  const vol = result.metrics.fundVolatility
  return [{ name: 'Risk', value: Math.min(100, vol * 4), fill: vol > 18 ? '#dc2626' : vol > 12 ? '#f59e0b' : '#16a34a' }]
}

export function getVolatilityChart(input: AnalysisInput) {
  const fundNav = buildNavSeries(input.fund)
  const returns = computeDailyReturns(fundNav)
  const window = 63
  const data: { date: string; volatility: number }[] = []

  for (let i = window; i < fundNav.length; i++) {
    const slice = returns.slice(i - window, i)
    data.push({
      date: format(fundNav[i].date, 'MMM yyyy'),
      volatility: stdDev(slice) * Math.sqrt(252) * 100,
    })
  }

  return downsample(data, 400)
}

export function getRollingReturnHistogram(input: AnalysisInput) {
  const returns = input.fund.map((r) => r.scheme_rolling_returns)
  const min = Math.min(...returns)
  const max = Math.max(...returns)
  const bins = 20
  const step = (max - min) / bins || 1
  const histogram = Array.from({ length: bins }, (_, i) => ({
    range: `${(min + i * step).toFixed(1)}-${(min + (i + 1) * step).toFixed(1)}`,
    count: 0,
  }))

  for (const r of returns) {
    const idx = Math.min(bins - 1, Math.floor((r - min) / step))
    histogram[idx].count++
  }

  return histogram
}

export function getConsistencyScoreChart(result: GoldenTriangleResult) {
  return [
    { name: 'COB', score: result.metrics.cob },
    { name: 'Sharpe Edge', score: Math.max(0, (result.metrics.fundSharpe - result.metrics.benchmarkSharpe) * 30 + 50) },
    { name: 'Return Edge', score: Math.max(0, (result.metrics.fundRollingAvg - result.metrics.benchmarkRollingAvg) * 5 + 50) },
    { name: 'Overall', score: result.metrics.consistencyScore },
  ]
}

export function getPerformanceTimeline(result: GoldenTriangleResult, fund: RollingReturnRow[]) {
  const firstDate = fund[0] ? parseNavDate(fund[0].nav_date) : new Date()
  const midIdx = Math.floor(fund.length / 2)
  const latest = fund[fund.length - 1]

  return [
    {
      title: 'Fund Inception Data',
      date: format(firstDate, 'MMM yyyy'),
      description: 'Earliest rolling return window available in dataset',
    },
    {
      title: 'Mid-Period Performance',
      date: midIdx >= 0 && fund[midIdx] ? formatDateLabel(fund[midIdx].nav_date) : 'N/A',
      description: `Rolling return at mid-point: ${fund[midIdx]?.scheme_rolling_returns.toFixed(2)}%`,
    },
    {
      title: 'Sharpe Analysis',
      date: format(new Date(), 'MMM yyyy'),
      description: `Fund Sharpe ${result.metrics.fundSharpe.toFixed(2)} vs Benchmark ${result.metrics.benchmarkSharpe.toFixed(2)}`,
    },
    {
      title: 'Current Golden Triangle Score',
      date: latest ? formatDateLabel(latest.nav_date) : 'Now',
      description: `${result.passCount}/3 rules passed — ${result.overallRating}`,
    },
  ]
}

export function getStatCards(result: GoldenTriangleResult, manual?: { expenseRatio?: number; aum?: number; fundRating?: number }) {
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
    { label: 'Expense Ratio', value: manual?.expenseRatio ?? 0, display: manual?.expenseRatio !== undefined ? `${manual.expenseRatio}%` : 'Not provided', format: 'text' },
    { label: 'Fund Rating', value: manual?.fundRating ?? 0, display: manual?.fundRating !== undefined ? `${manual.fundRating}/5` : 'Not provided', format: 'text' },
  ]
}
