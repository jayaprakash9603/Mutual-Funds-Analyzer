import { RISK_FREE_RATE, TRADING_DAYS, RISK_LEVELS } from '@/lib/constants'
import {
  alignRollingReturns,
  buildNavSeries,
  computeDailyReturns,
  covariance,
  getCommonNavSeries,
  mean,
  stdDev,
  variance,
} from './navSeries'
import type {
  AnalysisInput,
  FundMetrics,
  GoldenTriangleResult,
  OverallRating,
  RuleResult,
} from './types'

function annualisedReturn(dailyReturns: number[]) {
  return mean(dailyReturns) * TRADING_DAYS
}

function annualisedVolatility(dailyReturns: number[]) {
  return stdDev(dailyReturns) * Math.sqrt(TRADING_DAYS)
}

function sharpeRatio(dailyReturns: number[], riskFree = RISK_FREE_RATE) {
  const annReturn = annualisedReturn(dailyReturns)
  const annVol = annualisedVolatility(dailyReturns)
  if (annVol === 0) return 0
  return (annReturn - riskFree) / annVol
}

function sortinoRatio(dailyReturns: number[], riskFree = RISK_FREE_RATE) {
  const annReturn = annualisedReturn(dailyReturns)
  const downside = dailyReturns.filter((r) => r < 0)
  const downsideDev = stdDev(downside) * Math.sqrt(TRADING_DAYS)
  if (downsideDev === 0) return 0
  return (annReturn - riskFree) / downsideDev
}

function maxDrawdown(navSeries: { nav: number }[]) {
  let peak = navSeries[0]?.nav ?? 0
  let maxDd = 0
  for (const point of navSeries) {
    peak = Math.max(peak, point.nav)
    const drawdown = point.nav / peak - 1
    maxDd = Math.min(maxDd, drawdown)
  }
  return maxDd * 100
}

function totalReturn(navSeries: { nav: number }[]) {
  if (navSeries.length < 2) return 0
  const first = navSeries[0].nav
  const last = navSeries[navSeries.length - 1].nav
  return ((last / first) - 1) * 100
}

function getRiskLevel(volatilityPercent: number) {
  for (const level of RISK_LEVELS) {
    if (volatilityPercent <= level.maxVol) return level.label
  }
  return 'Very High'
}

function getOverallRating(passCount: number): OverallRating {
  if (passCount === 3) return 'Passed'
  if (passCount === 2) return 'Average'
  if (passCount === 1) return 'Weak'
  return 'Avoid'
}

export function computeFundMetrics(input: AnalysisInput): FundMetrics {
  const { fund, benchmark } = input
  const fundReturns = fund.map((r) => r.scheme_rolling_returns)
  const benchmarkReturns = benchmark.map((r) => r.scheme_rolling_returns)
  const aligned = alignRollingReturns(fund, benchmark)

  const fundNav = buildNavSeries(fund)
  const benchmarkNav = buildNavSeries(benchmark)
  const commonNav = getCommonNavSeries(fundNav, benchmarkNav)

  const fundDaily = computeDailyReturns(commonNav.map((p) => ({ date: p.date, nav: p.fundNav })))
  const benchmarkDaily = computeDailyReturns(
    commonNav.map((p) => ({ date: p.date, nav: p.benchmarkNav })),
  )

  const minLen = Math.min(fundDaily.length, benchmarkDaily.length)
  const fundDailyTrim = fundDaily.slice(0, minLen)
  const benchmarkDailyTrim = benchmarkDaily.slice(0, minLen)

  const fundAnnReturn = annualisedReturn(fundDailyTrim) * 100
  const benchmarkAnnReturn = annualisedReturn(benchmarkDailyTrim) * 100
  const fundVolatility = annualisedVolatility(fundDailyTrim) * 100
  const benchmarkVolatility = annualisedVolatility(benchmarkDailyTrim) * 100

  const beta = variance(benchmarkDailyTrim) === 0
    ? 0
    : covariance(fundDailyTrim, benchmarkDailyTrim) / variance(benchmarkDailyTrim)

  const alpha = fundAnnReturn - (RISK_FREE_RATE * 100 + beta * (benchmarkAnnReturn - RISK_FREE_RATE * 100))

  const excess = fundDailyTrim.map((r, i) => r - benchmarkDailyTrim[i])
  const infoRatio =
    stdDev(excess) === 0 ? 0 : (mean(excess) * TRADING_DAYS) / (stdDev(excess) * Math.sqrt(TRADING_DAYS))

  const fundSharpe = sharpeRatio(fundDailyTrim)
  const benchmarkSharpe = sharpeRatio(benchmarkDailyTrim)
  const sortino = sortinoRatio(fundDailyTrim)
  const treynor = beta === 0 ? 0 : (annualisedReturn(fundDailyTrim) - RISK_FREE_RATE) / beta

  const cob =
    aligned.length === 0
      ? 0
      : (aligned.filter((p) => p.fundReturn > p.benchmarkReturn).length / aligned.length) * 100

  const firstDate = fundNav[0]?.date ?? new Date()
  const fundAgeYears = (Date.now() - firstDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)

  const consistencyScore = Math.min(100, cob * 0.6 + (fundSharpe > benchmarkSharpe ? 20 : 0) + (mean(fundReturns) > mean(benchmarkReturns) ? 20 : 0))

  return {
    fundRollingAvg: mean(fundReturns),
    benchmarkRollingAvg: mean(benchmarkReturns),
    fundRollingMax: Math.max(...fundReturns),
    fundRollingMin: Math.min(...fundReturns),
    benchmarkRollingMax: Math.max(...benchmarkReturns),
    benchmarkRollingMin: Math.min(...benchmarkReturns),
    cob,
    fundSharpe,
    benchmarkSharpe,
    fundAnnReturn,
    benchmarkAnnReturn,
    fundVolatility,
    benchmarkVolatility,
    alpha,
    beta,
    sortino,
    treynor,
    informationRatio: infoRatio,
    maxDrawdown: maxDrawdown(fundNav.map((p) => ({ nav: p.nav }))),
    benchmarkMaxDrawdown: maxDrawdown(benchmarkNav.map((p) => ({ nav: p.nav }))),
    totalReturn: totalReturn(fundNav.map((p) => ({ nav: p.nav }))),
    benchmarkTotalReturn: totalReturn(benchmarkNav.map((p) => ({ nav: p.nav }))),
    riskLevel: getRiskLevel(fundVolatility),
    fundAgeYears,
    consistencyScore,
  }
}

export function buildRules(metrics: FundMetrics): RuleResult[] {
  return [
    {
      id: 'rollingReturn',
      label: 'Rolling Return',
      passed: metrics.fundRollingAvg > metrics.benchmarkRollingAvg,
      fundValue: metrics.fundRollingAvg,
      benchmarkValue: metrics.benchmarkRollingAvg,
      description: 'Fund 5-Year Rolling Return Average must exceed Benchmark Average',
    },
    {
      id: 'cob',
      label: 'Chance of Beating Benchmark',
      passed: metrics.cob > 70,
      fundValue: metrics.cob,
      benchmarkValue: 70,
      description: 'COB must be greater than 70%',
    },
    {
      id: 'sharpe',
      label: 'Sharpe Ratio',
      passed: metrics.fundSharpe > metrics.benchmarkSharpe,
      fundValue: metrics.fundSharpe,
      benchmarkValue: metrics.benchmarkSharpe,
      description: 'Fund Sharpe Ratio must exceed Benchmark Sharpe Ratio',
    },
  ]
}

/** Re-derives the rules and score so they never disagree with the metrics. */
export function withMetrics(
  result: GoldenTriangleResult,
  metrics: FundMetrics,
): GoldenTriangleResult {
  const rules = buildRules(metrics)
  const passCount = rules.filter((r) => r.passed).length

  return {
    ...result,
    metrics,
    rules,
    passCount,
    overallRating: getOverallRating(passCount),
    passed: passCount === 3,
  }
}

export function evaluateGoldenTriangle(input: AnalysisInput): GoldenTriangleResult {
  const metrics = computeFundMetrics(input)
  const fund = input.fund
  const benchmark = input.benchmark
  const rules = buildRules(metrics)
  const passCount = rules.filter((r) => r.passed).length

  return {
    rules,
    passCount,
    overallRating: getOverallRating(passCount),
    passed: passCount === 3,
    metrics,
    fundName: fund[0]?.scheme_name ?? 'Unknown Fund',
    benchmarkName: benchmark[0]?.scheme_name ?? 'Unknown Benchmark',
    category: fund[0]?.scheme_category ?? '',
    period: input.period,
  }
}

export function generateInsights(result: GoldenTriangleResult): string[] {
  const { metrics, rules, overallRating } = result
  const insights: string[] = []

  const rrDiff = metrics.fundRollingAvg - metrics.benchmarkRollingAvg
  insights.push(
    rrDiff >= 0
      ? `Rolling returns outperform benchmark by ${rrDiff.toFixed(2)}%.`
      : `Rolling returns underperform benchmark by ${Math.abs(rrDiff).toFixed(2)}%.`,
  )

  insights.push(`Chance of beating benchmark is ${metrics.cob.toFixed(1)}%.`)

  if (metrics.fundSharpe > metrics.benchmarkSharpe) {
    insights.push('Sharpe Ratio is significantly higher than the benchmark.')
  } else {
    insights.push('Sharpe Ratio is below the benchmark, indicating weaker risk-adjusted returns.')
  }

  if (result.passed) {
    insights.push('This fund satisfies all Golden Triangle conditions.')
  } else {
    const failed = rules.filter((r) => !r.passed).map((r) => r.label)
    insights.push(`Failed criteria: ${failed.join(', ')}.`)
  }

  insights.push(`Overall Rating: ${overallRating === 'Passed' ? 'Excellent' : overallRating === 'Average' ? 'Good' : overallRating === 'Weak' ? 'Caution' : 'Avoid'}.`)

  return insights
}
