/**
 * Short-form axis tick helpers for phone-width charts.
 * Tooltips keep full labels; only axis ticks compress.
 */

type AxisDateParts = {
  month: string
  year: number
  day?: string
}

/** Parse common axis date strings into month/year parts. */
export function parseAxisDateParts(value: string): AxisDateParts | null {
  const raw = value.trim()

  const iso = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/)
  if (iso) {
    const year = Number(iso[1])
    const month = new Date(year, Number(iso[2]) - 1, 1).toLocaleString('en-US', { month: 'short' })
    return { month, year, day: iso[3] ? String(Number(iso[3])) : undefined }
  }

  const spaced = raw.match(/^([A-Za-z]{3})\s+(\d{4})$/)
  if (spaced) return { month: spaced[1], year: Number(spaced[2]) }

  const dayMonth = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})(?:\s+(\d{4}))?$/)
  if (dayMonth) {
    return {
      day: dayMonth[1],
      month: dayMonth[2],
      year: dayMonth[3] ? Number(dayMonth[3]) : new Date().getFullYear(),
    }
  }

  const dashed = raw.match(/^([A-Za-z]{3})-(\d{2}|\d{4})$/)
  if (dashed) {
    const year =
      dashed[2].length === 2 ? 2000 + Number(dashed[2]) : Number(dashed[2])
    return { month: dashed[1], year }
  }

  const compactTick = raw.match(/^([A-Za-z]{3})\s+'(\d{2})$/)
  if (compactTick) return { month: compactTick[1], year: 2000 + Number(compactTick[2]) }

  return null
}

/** "Jan 2020" / "Jan-20" → "Jan '20" on compact screens. */
export function formatAxisMonthYearTick(value: string | number, compact = false): string {
  const raw = String(value).trim()
  if (!compact) return raw

  const parts = parseAxisDateParts(raw)
  if (!parts) return raw
  if (parts.day) return `${parts.day} ${parts.month}`
  return `${parts.month} '${String(parts.year).slice(-2)}`
}

/**
 * Phone-friendly time ticks: show the year only when it changes
 * (Jul → Oct → Dec → Feb '26) so labels stay short and avoid chart overflow.
 */
export function createYearChangeTickFormatter(): (value: string | number) => string {
  let lastYear: number | null = null

  return (value) => {
    const parts = parseAxisDateParts(String(value))
    if (!parts) return formatAxisMonthYearTick(value, true)

    // Recharts may re-walk ticks; restart when time goes backwards.
    if (lastYear != null && parts.year < lastYear) lastYear = null

    const yearSuffix = `'${String(parts.year).slice(-2)}`
    if (parts.day) {
      if (lastYear === parts.year) return `${parts.day} ${parts.month}`
      lastYear = parts.year
      return `${parts.day} ${parts.month} ${yearSuffix}`
    }

    if (lastYear === parts.year) return parts.month
    lastYear = parts.year
    return `${parts.month} ${yearSuffix}`
  }
}

/** Percent ticks without noisy decimals on phone axes. */
export function formatAxisPercentCompact(value: number, compact = false): string {
  if (!Number.isFinite(value)) return ''
  if (compact) return `${Math.round(value)}%`
  return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}%`
}

/** Indian portfolio value: ₹80L / ₹1.2Cr on compact, fuller words otherwise. */
export function formatAxisIndianMoneyTick(value: number, compact = false): string {
  if (!Number.isFinite(value)) return ''

  if (value >= 1_00_00_000) {
    const crore = value / 1_00_00_000
    if (compact) {
      const text = crore >= 10 ? crore.toFixed(0) : crore.toFixed(1).replace(/\.0$/, '')
      return `₹${text}Cr`
    }
    return `₹${crore >= 10 ? crore.toFixed(0) : crore.toFixed(2)} crore`
  }

  if (value >= 1_00_000) {
    const lakh = value / 1_00_000
    if (compact) {
      const text = lakh >= 10 ? lakh.toFixed(0) : lakh.toFixed(1).replace(/\.0$/, '')
      return `₹${text}L`
    }
    return `₹${lakh.toFixed(0)} lakh`
  }

  if (compact && value >= 1_000) {
    return `₹${(value / 1_000).toFixed(0)}k`
  }

  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

/**
 * "Miss top 5 days" / "Miss top 5 best days" → "Top 5" when compact.
 * Keeps readable mid-length labels on larger screens.
 */
export function formatMissDaysScenarioTick(label: string, compact = false): string {
  const trimmed = label.trim()
  const miss = trimmed.match(/Miss\s+top\s+(\d+)/i)
  if (miss) return compact ? `Top ${miss[1]}` : `Miss top ${miss[1]}`

  if (/entire period|full period/i.test(trimmed)) return compact ? 'Full' : 'Full period'

  if (compact) {
    return trimmed
      .replace(/\s+best days$/i, '')
      .replace(/\s+days$/i, '')
      .replace(/^Miss\s+/i, '')
  }

  return trimmed.replace(/\s+best days$/i, '').replace(/Entire period/i, 'Full period')
}

/** Axis title text — omit or shorten on phones where ticks already carry units. */
export function axisTitle(
  full: string,
  short: string,
  options: { compact: boolean; show?: boolean },
): string | null {
  if (options.show === false) return null
  if (!options.compact) return full
  return short
}

/**
 * Evenly spaced category/index ticks spanning [0, length-1].
 * Prefer this over Recharts `interval="preserveStartEnd"` + minTickGap,
 * which often bunches labels toward the left on narrow charts.
 */
export function evenlySpacedTickIndices(length: number, tickCount: number): number[] {
  if (length <= 0) return []
  if (length === 1) return [0]

  const count = Math.max(2, Math.min(Math.floor(tickCount), length))
  if (count === length) return Array.from({ length }, (_, i) => i)

  const ticks: number[] = []
  for (let i = 0; i < count; i++) {
    ticks.push(Math.round((i * (length - 1)) / (count - 1)))
  }
  return [...new Set(ticks)]
}
