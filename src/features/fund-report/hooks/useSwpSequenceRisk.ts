import { useCallback, useEffect, useState } from 'react'
import { fetchSwpSimulation } from '../api'
import type { MatrixReport } from '../schemas'

export type SwpSurvivalPoint = {
  yearsElapsed: number
  percentSurviving: number
}

export type SwpSequenceRiskResult = {
  survival: SwpSurvivalPoint[]
  testedStarts: number
  depletedWithinHorizon: number
  horizonYears: number
  caption: string
}

const CONCURRENCY = 4
const MIN_HISTORY_YEARS = 5

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  let done = 0

  async function run(): Promise<void> {
    while (next < items.length) {
      const index = next++
      results[index] = await worker(items[index]!, index)
      done += 1
      onProgress?.(done, items.length)
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => run())
  await Promise.all(runners)
  return results
}

function parseStartYear(label: string): number | null {
  const year = Number(label.slice(0, 4))
  return Number.isFinite(year) ? year : null
}

function depletionYears(
  timeline: Array<{ date: string; corpus: number }>,
  startYear: number,
  depleted: boolean,
): number | null {
  if (!depleted) return null
  const firstEmpty = timeline.find((point) => point.corpus <= 0)
  if (!firstEmpty) return null
  const endYear = Number(firstEmpty.date.slice(0, 4))
  if (!Number.isFinite(endYear)) return null
  return Math.max(0, endYear - startYear)
}

function buildSurvival(depletionByStart: Array<number | null>, horizonYears: number): SwpSurvivalPoint[] {
  const n = depletionByStart.length
  if (n === 0) return []

  const points: SwpSurvivalPoint[] = [{ yearsElapsed: 0, percentSurviving: 100 }]
  for (let year = 1; year <= horizonYears; year++) {
    const surviving = depletionByStart.filter(
      (depletion) => depletion == null || depletion > year,
    ).length
    points.push({
      yearsElapsed: year,
      percentSurviving: (surviving / n) * 100,
    })
  }
  return points
}

export function useSwpSequenceRisk(options: {
  scheme: string | null
  matrix: MatrixReport | null
  initialCorpus: number
  monthlyWithdrawal: number
  scheduleDay: number
  horizonYears?: number
  enabled: boolean
}) {
  const {
    scheme,
    matrix,
    initialCorpus,
    monthlyWithdrawal,
    scheduleDay,
    enabled,
    horizonYears = 10,
  } = options

  const [data, setData] = useState<SwpSequenceRiskResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [runToken, setRunToken] = useState(0)

  const run = useCallback(() => setRunToken((token) => token + 1), [])

  useEffect(() => {
    if (!enabled || runToken === 0 || !scheme || !matrix) {
      return
    }

    const latestYear = new Date().getFullYear()
    const startLabels = matrix.startLabels.filter((label) => {
      const year = parseStartYear(label)
      return year != null && latestYear - year >= MIN_HISTORY_YEARS
    })

    if (startLabels.length === 0) {
      setError('Insufficient history to test.')
      setData(null)
      setLoading(false)
      setProgress(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)
    setProgress({ done: 0, total: startLabels.length })

    mapPool(
      startLabels,
      CONCURRENCY,
      async (label) => {
        const startYear = parseStartYear(label)!
        const startDate = `${startYear}-01-01`
        const result = await fetchSwpSimulation(scheme, {
          initialCorpus,
          monthlyWithdrawal,
          scheduleDay,
          startDate,
          signal: controller.signal,
        })
        return depletionYears(result.timeline, startYear, result.scenario.depleted)
      },
      (done, total) => setProgress({ done, total }),
    )
      .then((depletions) => {
        const survival = buildSurvival(depletions, horizonYears)
        const depletedWithinHorizon = depletions.filter(
          (value) => value != null && value <= horizonYears,
        ).length
        const survivingPct =
          survival.length > 0 ? survival[survival.length - 1]!.percentSurviving : 100
        const depletedPct = 100 - survivingPct
        setData({
          survival,
          testedStarts: startLabels.length,
          depletedWithinHorizon,
          horizonYears,
          caption: `${depletedPct.toFixed(0)}% of historical Jan-1 starts would have run out of money within ${horizonYears} years at this withdrawal rate.`,
        })
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to run sequence test')
        setData(null)
      })
      .finally(() => {
        setLoading(false)
        setProgress(null)
      })

    return () => controller.abort()
  }, [
    enabled,
    runToken,
    scheme,
    matrix,
    initialCorpus,
    monthlyWithdrawal,
    scheduleDay,
    horizonYears,
  ])

  return { data, loading, progress, error, run, hasRun: runToken > 0 }
}
