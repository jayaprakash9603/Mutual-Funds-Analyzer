/**
 * Compact holding-period labels for narrow sticky table columns.
 * Full label stays available via `title` when compact.
 */
export function shortPeriodLabel(label: string, compact = false): string {
  const trimmed = label.trim()
  if (!compact || !trimmed) return trimmed

  const month = trimmed.match(/^(\d+)\s*Months?$/i)
  if (month) return `${month[1]}M`

  const year = trimmed.match(/^(\d+)\s*Years?$/i)
  if (year) return `${year[1]}Y`

  if (/^since\s+launch$/i.test(trimmed)) return 'Launch'
  if (/^inception$/i.test(trimmed)) return 'Incep.'
  if (/^ytd$/i.test(trimmed)) return 'YTD'

  return trimmed
}
