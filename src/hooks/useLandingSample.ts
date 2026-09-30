import { useEffect, useState } from 'react'

const SAMPLE_PATH = 'demo/analysis/parag-parikh-flexi-cap-5-year.json'
const CHART_POINTS = 61

type RawWindow = {
  nav_date: string
  scheme_nav: number
  scheme_forward_date: string
  scheme_forward_nav: number
}

type RawRule = {
  id: string
  label: string
  passed: boolean
  fundValue: number
  benchmarkValue: number
}

type RawSample = {
  result: {
    rules: RawRule[]
    passCount: number
    fundName: string
    benchmarkName: string
    category: string
    period: string
    metrics: {
      fundAnnReturn: number
      benchmarkAnnReturn: number
      maxDrawdown: number
      benchmarkMaxDrawdown: number
      fundVolatility: number
      benchmarkVolatility: number
    }
  }
  data: { fund: RawWindow[]; benchmark: RawWindow[] }
}

export type LandingSample = {
  fundName: string
  benchmarkName: string
  category: string
  period: string
  passCount: number
  rules: RawRule[]
  metrics: RawSample['result']['metrics']
  windows: number
  startYear: number
  endYear: number
  series: { fund: number[]; benchmark: number[] }
}

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

/** Parses the fixture date format, e.g. "May 21, 2013, 12:00:00 AM". */
function parseDate(value: string) {
  const match = /^(\w{3}) (\d{1,2}), (\d{4})/.exec(value)
  if (!match) return 0
  return Date.UTC(Number(match[3]), MONTHS[match[1]] ?? 0, Number(match[2]))
}

/** Chains each window's start NAV with the forward NAVs beyond the last start date into one path. */
function navPath(windows: RawWindow[], from: number) {
  const points = windows
    .map((w) => ({ t: parseDate(w.nav_date), nav: w.scheme_nav }))
    .filter((p) => p.t >= from)
  const lastStart = points[points.length - 1]?.t ?? 0
  const forward = windows
    .map((w) => ({ t: parseDate(w.scheme_forward_date), nav: w.scheme_forward_nav }))
    .filter((p) => p.t > lastStart)
  return [...points, ...forward]
}

function resample(path: { t: number; nav: number }[], start: number, end: number) {
  const out: number[] = []
  let cursor = 0
  for (let i = 0; i < CHART_POINTS; i += 1) {
    const t = start + ((end - start) * i) / (CHART_POINTS - 1)
    while (cursor < path.length - 1 && path[cursor + 1].t <= t) cursor += 1
    out.push(path[cursor].nav)
  }
  const base = out[0]
  return out.map((nav) => (nav / base) * 100)
}

function toSample(raw: RawSample): LandingSample {
  const fundStart = parseDate(raw.data.fund[0].nav_date)
  const fund = navPath(raw.data.fund, fundStart)
  const benchmark = navPath(raw.data.benchmark, fundStart)
  const end = Math.min(fund[fund.length - 1].t, benchmark[benchmark.length - 1].t)

  return {
    fundName: raw.result.fundName,
    benchmarkName: raw.result.benchmarkName,
    category: raw.result.category,
    period: raw.result.period,
    passCount: raw.result.passCount,
    rules: raw.result.rules,
    metrics: raw.result.metrics,
    windows: raw.data.fund.length,
    startYear: new Date(fundStart).getUTCFullYear(),
    endYear: new Date(end).getUTCFullYear(),
    series: { fund: resample(fund, fundStart, end), benchmark: resample(benchmark, fundStart, end) },
  }
}

let cache: Promise<LandingSample | null> | null = null

function loadSample() {
  cache ??= fetch(`${import.meta.env.BASE_URL}${SAMPLE_PATH}`)
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
    .then((raw: RawSample) => toSample(raw))
    .catch(() => null)
  return cache
}

/**
 * Loads the captured demo analysis used as the landing page's illustrative example.
 * `undefined` while loading, `null` when the fixture is unavailable.
 */
export function useLandingSample(enabled: boolean) {
  const [sample, setSample] = useState<LandingSample | null | undefined>(undefined)

  useEffect(() => {
    if (!enabled) return
    let active = true
    loadSample().then((result) => {
      if (active) setSample(result)
    })
    return () => {
      active = false
    }
  }, [enabled])

  return sample
}
