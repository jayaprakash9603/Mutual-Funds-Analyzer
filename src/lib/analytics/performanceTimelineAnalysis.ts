import { format } from 'date-fns'
import type { GoldenTriangleResult, RollingReturnRow, TimelineEvent } from '@/api/schemas'
import { parseNavDate } from '@/lib/utils'
import { mean } from './navSeries'
import type { AnalysisInput } from './types'

export type MilestoneKind = 'inception' | 'best' | 'worst' | 'mid' | 'latest'

export interface PerformanceMilestone {
  kind: MilestoneKind
  title: string
  dateLabel: string
  sortKey: number
  fundReturn: number
  benchmarkReturn: number
  alpha: number
  windowStart: Date
  windowEnd: Date
  windowRange: string
  explanation: string
  vsSeriesAverage: number
  beatBenchmark: boolean
  navAtStart: number
  navAtEnd: number
}

export interface PerformanceTimelineChartPoint {
  shortLabel: string
  tooltipRange: string
  fund: number
  benchmark: number
  milestone?: MilestoneKind
}

export interface PerformanceTimelineSummary {
  period: string
  windowCount: number
  fundAverage: number
  benchmarkAverage: number
  fundBest: number
  fundWorst: number
  spread: number
  beatBenchmarkPct: number
  latestFundReturn: number
  latestBenchmarkReturn: number
  latestAlpha: number
  fundSharpe: number
  benchmarkSharpe: number
  goldenTrianglePasses: number
  goldenTriangleTotal: number
}

export interface PerformanceTimelineAnalysis {
  milestones: PerformanceMilestone[]
  summary: PerformanceTimelineSummary
  chartPoints: PerformanceTimelineChartPoint[]
}

function formatMonth(date: Date) {
  return format(date, 'MMM yyyy')
}

function formatRange(start: Date, end: Date) {
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`
}

function extremeRow(rows: RollingReturnRow[], highest: boolean) {
  let chosen = rows[0]!
  for (const row of rows) {
    const better = highest
      ? row.scheme_rolling_returns > chosen.scheme_rolling_returns
      : row.scheme_rolling_returns < chosen.scheme_rolling_returns
    if (better) chosen = row
  }
  return chosen
}

function benchmarkAt(
  benchmarkMap: Map<string, number>,
  row: RollingReturnRow,
): number | undefined {
  return benchmarkMap.get(parseNavDate(row.nav_date).toISOString().slice(0, 10))
}

function buildMilestone(
  kind: MilestoneKind,
  title: string,
  row: RollingReturnRow,
  benchmarkReturn: number,
  explanation: string,
  seriesAverage: number,
  useForwardDate: boolean,
): PerformanceMilestone {
  const windowStart = parseNavDate(row.nav_date)
  const windowEnd = parseNavDate(useForwardDate ? row.scheme_forward_date : row.nav_date)
  const fundReturn = row.scheme_rolling_returns

  return {
    kind,
    title,
    dateLabel: formatMonth(windowEnd),
    sortKey: windowEnd.getTime(),
    fundReturn,
    benchmarkReturn,
    alpha: fundReturn - benchmarkReturn,
    windowStart,
    windowEnd,
    windowRange: formatRange(windowStart, windowEnd),
    explanation,
    vsSeriesAverage: fundReturn - seriesAverage,
    beatBenchmark: fundReturn >= benchmarkReturn,
    navAtStart: row.scheme_nav,
    navAtEnd: row.scheme_forward_nav,
  }
}

function explanationForKind(
  kind: MilestoneKind,
  period: string,
  result: GoldenTriangleResult | null,
): string {
  switch (kind) {
    case 'inception':
      return `Earliest ${period} rolling window in the dataset — start of trackable history for this fund.`
    case 'best':
      return `Peak ${period} rolling return — the fund's strongest historical performance window.`
    case 'worst':
      return `Trough ${period} rolling return — the weakest period, useful for assessing downside resilience.`
    case 'mid':
      return 'Halfway point in the rolling return series — shows how the fund performed through the middle of its history.'
    case 'latest':
      if (result) {
        return `Most recent ${period} window. Sharpe ${result.metrics.fundSharpe.toFixed(2)} vs benchmark ${result.metrics.benchmarkSharpe.toFixed(2)}. Golden Triangle: ${result.passCount}/${result.rules.length} rules passed.`
      }
      return `Most recent ${period} rolling window ending on the latest available NAV date.`
  }
}

function mergeExplanation(apiEvents: TimelineEvent[], kind: MilestoneKind, fallback: string) {
  const titleByKind: Record<MilestoneKind, string> = {
    inception: 'Inception Window',
    best: 'Best Rolling Window',
    worst: 'Worst Rolling Window',
    mid: 'Mid-Period Checkpoint',
    latest: 'Latest Window',
  }
  const match = apiEvents.find((event) => event.title === titleByKind[kind])
  return match?.explanation ?? fallback
}

export function buildPerformanceTimelineAnalysis(
  input: AnalysisInput,
  result: GoldenTriangleResult | null,
  apiTimeline: TimelineEvent[] = [],
): PerformanceTimelineAnalysis | null {
  const { fund, benchmark, period } = input
  if (fund.length === 0) return null

  const benchmarkMap = new Map(
    benchmark.map((row) => [
      parseNavDate(row.nav_date).toISOString().slice(0, 10),
      row.scheme_rolling_returns,
    ]),
  )

  const aligned = fund
    .map((row) => {
      const bench = benchmarkAt(benchmarkMap, row)
      if (bench === undefined) return null
      return { row, benchmarkReturn: bench }
    })
    .filter((point): point is NonNullable<typeof point> => point !== null)

  if (aligned.length === 0) return null

  const fundReturns = aligned.map((point) => point.row.scheme_rolling_returns)
  const benchmarkReturns = aligned.map((point) => point.benchmarkReturn)
  const seriesAverage = mean(fundReturns)
  const beatCount = aligned.filter((point) => point.row.scheme_rolling_returns >= point.benchmarkReturn).length

  const first = aligned[0]!.row
  const latest = aligned[aligned.length - 1]!.row
  const mid = aligned[Math.floor(aligned.length / 2)]!.row
  const best = extremeRow(fund, true)
  const worst = extremeRow(fund, false)

  const milestoneRows: Array<{ kind: MilestoneKind; row: RollingReturnRow; useForwardDate: boolean }> = [
    { kind: 'inception', row: first, useForwardDate: false },
    { kind: 'worst', row: worst, useForwardDate: false },
    { kind: 'mid', row: mid, useForwardDate: false },
    { kind: 'best', row: best, useForwardDate: false },
    { kind: 'latest', row: latest, useForwardDate: true },
  ]

  const milestones = milestoneRows
    .map(({ kind, row, useForwardDate }) => {
      const bench = benchmarkAt(benchmarkMap, row)
      if (bench === undefined) return null
      const fallback = explanationForKind(kind, period, result)
      return buildMilestone(
        kind,
        {
          inception: 'Inception Window',
          best: 'Best Rolling Window',
          worst: 'Worst Rolling Window',
          mid: 'Mid-Period Checkpoint',
          latest: 'Latest Window',
        }[kind],
        row,
        bench,
        mergeExplanation(apiTimeline, kind, fallback),
        seriesAverage,
        useForwardDate,
      )
    })
    .filter((milestone): milestone is PerformanceMilestone => milestone !== null)
    .sort((a, b) => a.sortKey - b.sortKey)

  const milestoneByStart = new Map(
    milestones.map((milestone) => [milestone.windowStart.toISOString().slice(0, 10), milestone.kind]),
  )

  const chartPoints: PerformanceTimelineChartPoint[] = aligned.map(({ row, benchmarkReturn }) => {
    const start = parseNavDate(row.nav_date)
    const end = parseNavDate(row.scheme_forward_date)
    const startKey = start.toISOString().slice(0, 10)
    return {
      shortLabel: formatMonth(end),
      tooltipRange: formatRange(start, end),
      fund: row.scheme_rolling_returns,
      benchmark: benchmarkReturn,
      milestone: milestoneByStart.get(startKey),
    }
  })

  const latestBench = benchmarkAt(benchmarkMap, latest) ?? 0

  return {
    milestones,
    summary: {
      period,
      windowCount: aligned.length,
      fundAverage: mean(fundReturns),
      benchmarkAverage: mean(benchmarkReturns),
      fundBest: Math.max(...fundReturns),
      fundWorst: Math.min(...fundReturns),
      spread: Math.max(...fundReturns) - Math.min(...fundReturns),
      beatBenchmarkPct: (beatCount / aligned.length) * 100,
      latestFundReturn: latest.scheme_rolling_returns,
      latestBenchmarkReturn: latestBench,
      latestAlpha: latest.scheme_rolling_returns - latestBench,
      fundSharpe: result?.metrics.fundSharpe ?? 0,
      benchmarkSharpe: result?.metrics.benchmarkSharpe ?? 0,
      goldenTrianglePasses: result?.passCount ?? 0,
      goldenTriangleTotal: result?.rules.length ?? 3,
    },
    chartPoints,
  }
}
