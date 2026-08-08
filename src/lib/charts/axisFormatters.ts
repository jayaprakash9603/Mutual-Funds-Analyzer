/**
 * Short-form axis tick helpers for phone-width charts.
 * Tooltips keep full labels; only axis ticks compress.
 */

/** "Jan 2020" / "Jan-20" → "Jan '20" on compact screens. */
export function formatAxisMonthYearTick(value: string | number, compact = false): string {
  const raw = String(value).trim()
  if (!compact) return raw

  const spaced = raw.match(/^([A-Za-z]{3})\s+(\d{4})$/)
  if (spaced) return `${spaced[1]} '${spaced[2].slice(-2)}`

  const dashed = raw.match(/^([A-Za-z]{3})-(\d{2}|\d{4})$/)
  if (dashed) {
    const year = dashed[2].length === 4 ? dashed[2].slice(-2) : dashed[2]
    return `${dashed[1]} '${year}`
  }

  const iso = raw.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/)
  if (iso) {
    const month = new Date(Number(iso[1]), Number(iso[2]) - 1, 1).toLocaleString('en-US', {
      month: 'short',
    })
    return `${month} '${iso[1].slice(-2)}`
  }

  return raw
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
