import type { FundReportRisk } from '../../schemas'

type AthPoint = FundReportRisk['allTimeHighs']['series'][number]

export type AthChartRow = AthPoint & {
  year: string
  athNav: number | null
  fellNav: number | null
  neverFellNav: number | null
}

/** Keep chart density bounded while preserving every all-time-high marker. */
export function downsampleAthSeries(rows: AthPoint[], maxPoints = 900): AthPoint[] {
  if (rows.length <= maxPoints) return rows

  const stride = Math.ceil(rows.length / maxPoints)
  const sampled: AthPoint[] = []
  const kept = new Set<string>()

  for (let i = 0; i < rows.length; i += stride) {
    const row = rows[i]!
    sampled.push(row)
    kept.add(row.date)
  }

  for (const row of rows) {
    if (row.allTimeHigh && !kept.has(row.date)) {
      sampled.push(row)
      kept.add(row.date)
    }
  }

  return sampled.sort((a, b) => a.date.localeCompare(b.date))
}

export function toAthChartRows(rows: AthPoint[]): AthChartRow[] {
  return downsampleAthSeries(rows).map((point) => ({
    ...point,
    year: point.date.slice(0, 4),
    athNav: point.allTimeHigh ? point.nav : null,
    fellNav: point.allTimeHigh && point.fellBelowThreshold === true ? point.nav : null,
    neverFellNav: point.allTimeHigh && point.fellBelowThreshold === false ? point.nav : null,
  }))
}

/** Unique date ticks (first sample of each year) so the X-axis stays readable. */
export function athYearTicks(rows: AthChartRow[], maxTicks = 12): string[] {
  const firstByYear = new Map<string, string>()
  for (const row of rows) {
    if (!firstByYear.has(row.year)) {
      firstByYear.set(row.year, row.date)
    }
  }

  const ticks = [...firstByYear.values()]
  if (ticks.length <= maxTicks) return ticks

  const step = Math.ceil(ticks.length / maxTicks)
  return ticks.filter((_, index) => index % step === 0 || index === ticks.length - 1)
}

export function formatAthChartDate(date: string, compact = false): string {
  const parsed = Date.parse(date)
  if (!Number.isFinite(parsed)) return date
  return new Intl.DateTimeFormat('en-IN', {
    day: compact ? undefined : 'numeric',
    month: compact ? 'short' : 'short',
    year: 'numeric',
  }).format(parsed)
}
