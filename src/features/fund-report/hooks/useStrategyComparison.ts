import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchLumpsumSimulation,
  fetchSipSimulation,
  fetchStpSimulation,
} from '../api'
import type { LumpsumScenario, SipScenario, StpScenario } from '../schemas'

export type StrategyComparisonPoint = {
  date: string
  sipCorpus: number | null
  lumpsumCorpus: number | null
  stpCorpus: number | null
  investedSoFar: number | null
}

export type StrategyComparisonSummary = {
  sip: SipScenario | null
  lumpsum: LumpsumScenario | null
  stp: StpScenario | null
  winner: 'SIP' | 'Lumpsum' | 'STP' | null
}

export type StrategyComparisonResult = {
  series: StrategyComparisonPoint[]
  summary: StrategyComparisonSummary
  sipMonthlyAmount: number
  transferMonths: number
}

const PRINCIPAL_DEFAULT = 100_000
const SCHEDULE_DAY = 1

function monthsBetween(startIso: string | undefined): number {
  if (!startIso) return 120
  const start = new Date(startIso.slice(0, 10))
  if (Number.isNaN(start.getTime())) return 120
  const now = new Date()
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  return Math.max(12, months)
}

function forwardFill(
  dates: string[],
  byDate: Map<string, number>,
): Array<number | null> {
  let last: number | null = null
  return dates.map((date) => {
    const value = byDate.get(date)
    if (value != null && Number.isFinite(value)) {
      last = value
      return value
    }
    return last
  })
}

function alignSeries(args: {
  sipTimeline: Array<{ date: string; corpus: number; invested: number }>
  lumpsumTimeline: Array<{ date: string; corpus: number; invested: number }>
  stpTimeline: Array<{ date: string; totalValue: number }> | null
}): StrategyComparisonPoint[] {
  const dateSet = new Set<string>()
  for (const point of args.sipTimeline) dateSet.add(point.date.slice(0, 10))
  for (const point of args.lumpsumTimeline) dateSet.add(point.date.slice(0, 10))
  for (const point of args.stpTimeline ?? []) dateSet.add(point.date.slice(0, 10))

  const dates = [...dateSet].sort()
  const sipMap = new Map(args.sipTimeline.map((p) => [p.date.slice(0, 10), p.corpus]))
  const investedMap = new Map(args.sipTimeline.map((p) => [p.date.slice(0, 10), p.invested]))
  const lumpMap = new Map(args.lumpsumTimeline.map((p) => [p.date.slice(0, 10), p.corpus]))
  const stpMap = new Map((args.stpTimeline ?? []).map((p) => [p.date.slice(0, 10), p.totalValue]))

  const sipValues = forwardFill(dates, sipMap)
  const lumpValues = forwardFill(dates, lumpMap)
  const stpValues = args.stpTimeline ? forwardFill(dates, stpMap) : dates.map(() => null)
  const investedValues = forwardFill(dates, investedMap)

  return dates.map((date, index) => ({
    date,
    sipCorpus: sipValues[index] ?? null,
    lumpsumCorpus: lumpValues[index] ?? null,
    stpCorpus: stpValues[index] ?? null,
    investedSoFar: investedValues[index] ?? null,
  }))
}

function pickWinner(summary: Omit<StrategyComparisonSummary, 'winner'>): StrategyComparisonSummary['winner'] {
  const candidates: Array<{ key: 'SIP' | 'Lumpsum' | 'STP'; value: number }> = []
  if (summary.sip) candidates.push({ key: 'SIP', value: summary.sip.currentValue })
  if (summary.lumpsum) candidates.push({ key: 'Lumpsum', value: summary.lumpsum.currentValue })
  if (summary.stp) candidates.push({ key: 'STP', value: summary.stp.totalValue })
  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.value - a.value)
  return candidates[0]!.key
}

export function useStrategyComparison(options: {
  scheme: string | null
  sourceScheme: string | null
  startDate?: string
  principal?: number
  enabled: boolean
}) {
  const { scheme, sourceScheme, startDate, enabled } = options
  const principal = options.principal ?? PRINCIPAL_DEFAULT
  const [data, setData] = useState<StrategyComparisonResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  const months = useMemo(() => monthsBetween(startDate), [startDate])
  const sipMonthlyAmount = Math.max(1, Math.round(principal / months))
  const transferMonths = Math.min(12, Math.max(6, Math.round(months / 10)))

  const retry = useCallback(() => setRetryToken((token) => token + 1), [])

  useEffect(() => {
    if (!enabled || !scheme) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    const lumpsumPromise = fetchLumpsumSimulation(scheme, {
      principal,
      startDate,
      signal: controller.signal,
    })
    const sipPromise = fetchSipSimulation(scheme, {
      amount: sipMonthlyAmount,
      scheduleDay: SCHEDULE_DAY,
      startDate,
      signal: controller.signal,
    })
    const stpPromise =
      sourceScheme && sourceScheme !== scheme
        ? fetchStpSimulation(scheme, {
            sourceScheme,
            lumpSum: principal,
            transferMonths,
            scheduleDay: SCHEDULE_DAY,
            startDate,
            signal: controller.signal,
          })
        : Promise.resolve(null)

    Promise.all([lumpsumPromise, sipPromise, stpPromise])
      .then(([lumpsum, sip, stp]) => {
        const summaryBase = {
          sip: sip.scenario,
          lumpsum: lumpsum.scenario,
          stp: stp?.scenario ?? null,
        }
        setData({
          series: alignSeries({
            sipTimeline: sip.timeline,
            lumpsumTimeline: lumpsum.timeline,
            stpTimeline: stp?.timeline ?? null,
          }),
          summary: {
            ...summaryBase,
            winner: pickWinner(summaryBase),
          },
          sipMonthlyAmount,
          transferMonths,
        })
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to compare strategies')
        setData(null)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [
    enabled,
    scheme,
    sourceScheme,
    startDate,
    principal,
    sipMonthlyAmount,
    transferMonths,
    retryToken,
  ])

  return { data, loading, error, retry, sipMonthlyAmount, transferMonths, principal }
}
