import { useEffect, useState } from 'react'
import type { LandingSample } from './useLandingSample'

export type FundRule = LandingSample['rules'][number]

export type FundPick = {
  amc: string
  fundName: string
  category: string
  benchmark: string
  passCount: number
  annReturn: number
  benchAnnReturn: number
  maxDrawdown: number
  benchMaxDrawdown: number
  rollingAvg: number
  benchRollingAvg: number
  cob: number
  startYear: number
  endYear: number
  fund: number[]
  bench: number[]
  period: string
  windows: number
  rules: FundRule[]
  metrics: LandingSample['metrics'] & {
    fundRollingAvg: number
    benchmarkRollingAvg: number
    fundRollingMin: number
    fundRollingMax: number
    benchmarkRollingMin: number
    benchmarkRollingMax: number
    fundSharpe: number
    benchmarkSharpe: number
    alpha: number
    beta: number
    sortino: number
  }
}

export function toShowcaseSample(pick: FundPick): LandingSample {
  return {
    fundName: pick.fundName,
    benchmarkName: pick.benchmark,
    category: pick.category,
    period: pick.period,
    passCount: pick.passCount,
    rules: pick.rules,
    metrics: pick.metrics,
    windows: pick.windows,
    startYear: pick.startYear,
    endYear: pick.endYear,
    series: { fund: pick.fund, benchmark: pick.bench },
  }
}

let cache: Promise<FundPick[]> | null = null

function loadPicks() {
  cache ??= fetch(`${import.meta.env.BASE_URL}landing/fund-picks.json`)
    .then((response) => (response.ok ? response.json() : { funds: [] }))
    .then((data: { funds?: FundPick[] }) => data.funds ?? [])
    .catch(() => [])
  return cache
}

export function useFundPicks() {
  const [picks, setPicks] = useState<FundPick[]>([])

  useEffect(() => {
    let active = true
    loadPicks().then((funds) => {
      if (active) setPicks(funds)
    })
    return () => {
      active = false
    }
  }, [])

  return picks
}
